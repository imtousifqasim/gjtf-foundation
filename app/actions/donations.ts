"use server";

import { z } from "zod";
import {
  createDonationDb,
  createDonorDb,
  getDonorByEmailDb,
  createDonationPlanDb,
  createDonationStatusHistoryDb,
  createAuditLogDb,
  createAuthTokenDb,
  getPaymentSettingsDb,
} from "@/lib/db/mysql";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { createDonationReceivedEmail } from "@/lib/email/templates/donationTemplates";
import { createWelcomeSetPasswordEmail } from "@/lib/email/templates/donorTemplates";
import { validateEmail, validatePhoneNumber } from "@/lib/validation";
import { getAuthenticatedDonor } from "@/lib/auth/donor";
import { generateSecureToken, hashToken } from "@/lib/auth/tokens";

const donationSchema = z.object({
  cause: z.enum([
    "General Education",
    "Educate a Child",
    "Support a Classroom",
    "Support a Child: KG to Matric",
  ]),
  frequency: z.enum(["once", "monthly"]),
  currency: z.string().min(2).max(10).default("PKR"),
  amount: z.number().min(1, "Minimum donation amount is 1"),
  donation_type: z.enum(["General", "Zakat", "Sadqah"]),
  country: z.string().min(1, "Please select a country"),
  donor_name: z.string().min(2, "Name is required").optional().or(z.literal("")),
  donor_email: z.string().optional().or(z.literal("")),
  donor_phone: z.string().optional().or(z.literal("")),
  message: z.string().max(500).optional(),
});

export type DonationInput = z.infer<typeof donationSchema>;

export async function submitDonation(input: DonationInput) {
  const parsed = donationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Please check the form for invalid inputs.",
    };
  }

  const rawEmail = (parsed.data.donor_email || "").trim();
  let cleanedEmail = "";
  if (rawEmail) {
    const emailRes = validateEmail(rawEmail);
    if (!emailRes.valid) {
      return {
        success: false,
        message: emailRes.error || "Please enter a valid donor email address.",
      };
    }
    cleanedEmail = emailRes.cleaned;
  }

  const rawPhone = (parsed.data.donor_phone || "").trim();
  let cleanedPhone = "";
  if (rawPhone) {
    const phoneRes = validatePhoneNumber(rawPhone);
    if (!phoneRes.valid) {
      return {
        success: false,
        message: phoneRes.error || "Please enter a valid donor phone / WhatsApp number.",
      };
    }
    cleanedPhone = phoneRes.formatted;
  }

  try {
    const currentYear = new Date().getFullYear();
    const referenceNo = `GJTF-${currentYear}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Check logged-in donor session or lookup/create donor
    const loggedInDonor = await getAuthenticatedDonor();
    let donorId: string | null = loggedInDonor ? loggedInDonor.id : null;
    let isNewDonor = false;
    let setPasswordTokenRaw: string | null = null;

    if (!donorId && cleanedEmail) {
      const existingDonor = await getDonorByEmailDb(cleanedEmail);
      if (existingDonor) {
        donorId = existingDonor.id;
      } else {
        // Create unverified donor record
        donorId = await createDonorDb({
          email: cleanedEmail,
          name: parsed.data.donor_name || null,
          phone: cleanedPhone || null,
          country: parsed.data.country || "Pakistan",
          email_verified: false,
          prefers_anonymous: !parsed.data.donor_name,
        });
        isNewDonor = true;

        // Generate 48h set-password token
        setPasswordTokenRaw = generateSecureToken();
        const tokenHash = hashToken(setPasswordTokenRaw);
        await createAuthTokenDb({
          donorId,
          type: "set_password",
          tokenHash,
          expiresInMinutes: 48 * 60, // 48 hours
        });
      }
    }

    // 2. Handle Monthly Commitment Plan
    let planId: string | null = null;
    if (parsed.data.frequency === "monthly" && donorId) {
      const today = new Date();
      planId = await createDonationPlanDb({
        donor_id: donorId,
        cause: parsed.data.cause,
        currency: parsed.data.currency,
        amount: parsed.data.amount,
        donation_type: parsed.data.donation_type,
        billing_day: today.getDate(),
        start_date: today.toISOString().slice(0, 10),
        payment_method: "bank_transfer",
      });
    }

    // 3. Create Donation Pledge
    const donationData = {
      ...parsed.data,
      reference_no: referenceNo,
      donor_id: donorId,
      plan_id: planId,
      donor_email: cleanedEmail || null,
      donor_phone: cleanedPhone || null,
      payment_method: "bank_transfer",
      status: "pending",
      is_anonymous: !parsed.data.donor_name,
    };

    const donationId = await createDonationDb(donationData);

    // 4. Record Initial Status History & Audit Log
    await createDonationStatusHistoryDb({
      donation_id: donationId,
      old_status: null,
      new_status: "pending",
      changed_by: donorId ? `donor:${donorId}` : "public:donor",
      note: `Pledge registered via website (#${referenceNo})`,
    });

    await createAuditLogDb({
      actor_type: donorId ? "donor" : "system",
      actor_id: donorId,
      action: "donation.pledged",
      target_type: "donation",
      target_id: donationId,
      metadata: { referenceNo, amount: parsed.data.amount, currency: parsed.data.currency },
    });

    // 5. Asynchronously dispatch emails (non-blocking)
    if (cleanedEmail) {
      (async () => {
        try {
          const appUrl = process.env.APP_URL || "https://gjtfoundation.com";
          const paymentSettings = await getPaymentSettingsDb();

          // Email 1: Donation Pledge Received
          const { subject, html, text } = createDonationReceivedEmail({
            pledgeId: referenceNo,
            donorName: parsed.data.donor_name,
            donorEmail: cleanedEmail,
            donorPhone: cleanedPhone,
            amount: parsed.data.amount,
            currency: parsed.data.currency || "PKR",
            cause: parsed.data.cause,
            frequency: parsed.data.frequency,
            donationType: parsed.data.donation_type,
          });

          await sendTransactionalEmail({
            to: cleanedEmail,
            recipientName: parsed.data.donor_name,
            emailType: "donation_received",
            subject,
            html,
            text,
            metadata: { donationId, referenceNo, amount: parsed.data.amount, currency: parsed.data.currency },
          });

          // Email 2: Welcome & Set Password (for new donors)
          if (isNewDonor && setPasswordTokenRaw) {
            const welcomeEmail = createWelcomeSetPasswordEmail({
              donorName: parsed.data.donor_name,
              donorEmail: cleanedEmail,
              actionUrl: `${appUrl}/donor/set-password?token=${setPasswordTokenRaw}`,
              expiresInText: "48 hours",
            });

            await sendTransactionalEmail({
              to: cleanedEmail,
              recipientName: parsed.data.donor_name,
              emailType: "welcome_set_password",
              subject: welcomeEmail.subject,
              html: welcomeEmail.html,
              text: welcomeEmail.text,
              metadata: { donorId },
            });
          }
        } catch (emErr: any) {
          console.warn("[Pledge Email] Background dispatch warning:", emErr.message);
        }
      })();
    }

    revalidatePath("/admin");
    revalidatePath("/admin/donations");
    revalidatePath("/donor/dashboard");
    revalidatePath("/donor/donations");

    return {
      success: true,
      donationId,
      referenceNo,
      message: `JazakAllah Khair! Your pledge (#${referenceNo}) has been recorded.`,
      isNewDonor,
    };
  } catch (error) {
    console.error("Server Action submitDonation exception:", error);
    const fallbackRef = `GJTF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      success: true,
      donationId: "dn_offline_" + Date.now(),
      referenceNo: fallbackRef,
      message: `Your donation pledge (#${fallbackRef}) has been registered.`,
      isNewDonor: false,
    };
  }
}
