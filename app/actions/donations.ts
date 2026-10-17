"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createDonationDb,
  getDonationByIdempotencyKeyDb,
  createDonorDb,
  getDonorByEmailDb,
  createDonationPlanDb,
  createDonationStatusHistoryDb,
  createAuditLogDb,
  createAuthTokenDb,
  linkDonationsToDonorDb,
} from "@/lib/db/mysql";
import { getActivePricingSettingsDb, getLatestFxRateDb } from "@/lib/db/pricingDb";
import { getActiveBankAccountsDb } from "@/lib/db/bankAccounts";
import { calculateImpact } from "@/lib/pricing/impact";
import { convertPkrToAed, convertAedToPkr, lockFxRate } from "@/lib/pricing/fx";
import { toMinorUnits } from "@/lib/pricing/money";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { createDonationReceivedEmail } from "@/lib/email/templates/donationTemplates";
import { createWelcomeSetPasswordEmail } from "@/lib/email/templates/donorTemplates";
import { validateEmail, validatePhoneNumber } from "@/lib/validation";
import { getAuthenticatedDonor } from "@/lib/auth/donor";
import { generateSecureToken, hashToken } from "@/lib/auth/tokens";
import { getEnabledCurrenciesDb } from "@/lib/db/paymentProofsSchema";
import { createPledgeAccessToken } from "@/lib/db/pledgeTokens";
import siteConfig from "@/lib/siteConfig";

const donationSchema = z.object({
  cause: z.enum([
    "General Education",
    "Educate a Child",
    "Support a Classroom",
    "Support a Child: KG to Matric",
  ]),
  frequency: z.enum(["once", "monthly"]),
  currency: z.enum(["PKR", "AED"]).default("PKR"),
  amount: z.number().min(1, "Amount must be greater than zero"),
  children_count: z.number().min(0.1).optional(),
  pledge_basis: z.enum(["pkr_fixed", "aed_fixed"]).optional(),
  payment_method: z.enum(["bank_transfer", "doorstep"]).default("bank_transfer"),
  donation_type: z.enum(["General", "Zakat", "Sadqah"]).default("General"),
  country: z.string().min(1, "Please select a country"),
  donor_name: z.string().optional().or(z.literal("")),
  donor_email: z.string().optional().or(z.literal("")),
  donor_phone: z.string().optional().or(z.literal("")),
  message: z.string().max(500).optional(),
  idempotency_key: z.string().max(128).optional(),
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

  // 1. Idempotency Check (Prevent duplicate pledges on double clicks)
  if (parsed.data.idempotency_key) {
    const existingPledge = await getDonationByIdempotencyKeyDb(parsed.data.idempotency_key);
    if (existingPledge) {
      return {
        success: true,
        donationId: existingPledge.id,
        referenceNo: existingPledge.reference_no,
        message: "Your donation pledge has already been recorded.",
      };
    }
  }

  // 2. Validate Donor Contact Info
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
    // 3. Enforce Enabled Currencies (PKR Only by default; reject non-enabled currencies)
    const enabledCurrencies = await getEnabledCurrenciesDb();
    if (!enabledCurrencies.includes(parsed.data.currency)) {
      return {
        success: false,
        message: `Donations in ${parsed.data.currency} are currently disabled. Only ${enabledCurrencies.join(", ")} donations are accepted at this time.`,
      };
    }

    // 4. Load Active Pricing & Live FX Rate (Never trust client-calculated numbers)
    const pricing = await getActivePricingSettingsDb();
    const fx = await getLatestFxRateDb();

    let amountPkr = 0;
    let amountAed = 0;
    let pledgeBasis: "pkr_fixed" | "aed_fixed" = parsed.data.pledge_basis || (parsed.data.currency === "AED" ? "aed_fixed" : "pkr_fixed");

    if (parsed.data.currency === "AED") {
      amountAed = Math.round(parsed.data.amount);
      if (pledgeBasis === "pkr_fixed" && parsed.data.children_count) {
        // Based on children count: PKR is fixed to children_count * 5,000
        amountPkr = Math.round(parsed.data.children_count * pricing.costPerChildMonthPkr);
        amountAed = convertPkrToAed(amountPkr, fx.rate, fx.bufferPct).aedAmount;
      } else {
        // AED is fixed: compute PKR equivalent
        amountPkr = convertAedToPkr(amountAed, fx.rate, fx.bufferPct).pkrAmount;
      }
    } else {
      // Currency === "PKR"
      amountPkr = Math.round(parsed.data.amount);
      amountAed = convertPkrToAed(amountPkr, fx.rate, fx.bufferPct).aedAmount;
      pledgeBasis = "pkr_fixed";
    }

    // Server-side enforcement of minimum custom amount
    if (amountPkr < pricing.minCustomAmountPkr) {
      return {
        success: false,
        message: `Minimum donation amount is PKR ${pricing.minCustomAmountPkr} (or equivalent in AED).`,
      };
    }

    // Specific Cause minimum validations
    if (parsed.data.cause === "Support a Classroom") {
      const classroomCost = pricing.classroomSize * pricing.costPerChildMonthPkr;
      if (amountPkr < classroomCost) {
        return {
          success: false,
          message: `Sponsoring a full 30-student classroom unit is PKR ${classroomCost.toLocaleString()}/month.`,
        };
      }
    }

    if (parsed.data.cause === "Support a Child: KG to Matric") {
      if (amountPkr < pricing.costPerChildMonthPkr) {
        return {
          success: false,
          message: `Long-term child sponsorship is PKR ${pricing.costPerChildMonthPkr.toLocaleString()}/month.`,
        };
      }
    }

    // 4. Calculate Truthful Impact
    const impact = calculateImpact(amountPkr, parsed.data.frequency, pricing);
    const lockedFx = lockFxRate(amountPkr, fx.rate, fx.bufferPct);

    const amountPkrMinor = toMinorUnits(amountPkr, "PKR");
    const displayAmountMinor = toMinorUnits(
      parsed.data.currency === "AED" ? amountAed : amountPkr,
      parsed.data.currency
    );

    const currentYear = new Date().getFullYear();
    const referenceNo = `GJTF-${currentYear}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 5. Check or Create Donor Record (Session-First Ownership & Zero-Trust)
    const loggedInDonor = await getAuthenticatedDonor();
    let donorId: string | null = loggedInDonor ? loggedInDonor.id : null;
    let isNewDonor = false;
    let setPasswordTokenRaw: string | null = null;

    if (loggedInDonor) {
      // Session-first: Donation strictly belongs to the logged-in donor
      donorId = loggedInDonor.id;
      // Auto-link any previous unlinked pledges matching donor's email
      await linkDonationsToDonorDb(donorId, loggedInDonor.email);
    } else if (cleanedEmail) {
      // Guest Donor: Find or create donor row with normalized lowercase email
      const existingDonor = await getDonorByEmailDb(cleanedEmail);
      if (existingDonor) {
        donorId = existingDonor.id;
      } else {
        donorId = await createDonorDb({
          email: cleanedEmail,
          name: parsed.data.donor_name || null,
          phone: cleanedPhone || null,
          country: parsed.data.country || "Pakistan",
          email_verified: false,
          prefers_anonymous: !parsed.data.donor_name,
        });
        isNewDonor = true;

        setPasswordTokenRaw = generateSecureToken();
        const tokenHash = hashToken(setPasswordTokenRaw);
        await createAuthTokenDb({
          donorId,
          type: "set_password",
          tokenHash,
          expiresInMinutes: 48 * 60,
        });
      }
      // Link any prior orphan donations for this guest email
      await linkDonationsToDonorDb(donorId, cleanedEmail);
    }

    // 6. Handle Monthly Recurring Plan (if frequency === 'monthly')
    let planId: string | null = null;
    if (parsed.data.frequency === "monthly" && donorId) {
      const today = new Date();
      const isKgToMatric = parsed.data.cause === "Support a Child: KG to Matric";

      planId = await createDonationPlanDb({
        donor_id: donorId,
        cause: parsed.data.cause,
        currency: parsed.data.currency,
        amount: parsed.data.currency === "AED" ? amountAed : amountPkr,
        children_count: impact.childrenCount,
        pledge_basis: pledgeBasis,
        donation_type: parsed.data.donation_type,
        billing_day: today.getDate(),
        start_date: today.toISOString().slice(0, 10),
        total_cycles: isKgToMatric ? pricing.sponsorshipMonths : null,
        payment_method: parsed.data.payment_method,
      });
    }

    // 7. Get Official Primary Bank Account
    const bankAccounts = await getActiveBankAccountsDb();
    const primaryBank = bankAccounts[0] || {
      id: "bank-islami-primary",
      bank_name: "Bank Islami",
      account_number: "203756213050001",
      iban: "PK19BKIP0203756213050001",
    };

    // 8. Create Donation Record in Database
    const donationData = {
      reference_no: referenceNo,
      donor_id: donorId,
      plan_id: planId,
      cause: parsed.data.cause,
      frequency: parsed.data.frequency,
      currency: parsed.data.currency,
      amount: parsed.data.currency === "AED" ? amountAed : amountPkr,
      amount_minor: Number(displayAmountMinor),
      children_equivalent: impact.childrenCount,
      pricing_version: pricing.version,
      amount_pkr_minor: Number(amountPkrMinor),
      display_currency: parsed.data.currency,
      display_amount_minor: Number(displayAmountMinor),
      fx_rate: fx.rate,
      fx_buffer_pct: fx.bufferPct,
      fx_locked_at: lockedFx.fxLockedAt,
      fx_valid_until: lockedFx.fxValidUntil,
      bank_account_id: primaryBank.id,
      idempotency_key: parsed.data.idempotency_key || null,
      donation_type: parsed.data.donation_type,
      country: parsed.data.country,
      donor_name: parsed.data.donor_name || null,
      donor_email: cleanedEmail || null,
      donor_phone: cleanedPhone || null,
      status: "pending",
      proof_status: "none",
      payment_method: parsed.data.payment_method,
      payment_reference: referenceNo,
      is_anonymous: !parsed.data.donor_name,
    };

    const donationId = await createDonationDb(donationData);

    // 9. Generate Single-Pledge Access Token for Guest Donors (Valid 7 days, scoped to pledge)
    let guestAccessToken: string | null = null;
    let redirectUrl = `/donor/donations/${donationId}`;
    if (!loggedInDonor) {
      guestAccessToken = await createPledgeAccessToken(donationId, referenceNo);
      redirectUrl = `/donate-now/pay/${referenceNo}`;
    }

    // 10. Status History & Audit Log
    await createDonationStatusHistoryDb({
      donation_id: donationId,
      old_status: null,
      new_status: "pending",
      changed_by: donorId ? `donor:${donorId}` : "public:donor",
      note: `Pledge registered via website (#${referenceNo}) with Bank Islami instructions.`,
    });

    await createAuditLogDb({
      actor_type: donorId ? "donor" : "public",
      actor_id: donorId,
      action: "donation.pledged",
      target_type: "donation",
      target_id: donationId,
      metadata: {
        referenceNo,
        amountPkr,
        displayAmount: parsed.data.currency === "AED" ? amountAed : amountPkr,
        displayCurrency: parsed.data.currency,
        childrenCount: impact.childrenCount,
        lockedFx: parsed.data.currency === "AED" ? lockedFx.lockNotice : null,
      },
    });

    // 11. Asynchronously Dispatch Emails
    if (cleanedEmail) {
      (async () => {
        try {
          const appUrl = siteConfig.baseUrl || "https://gjtf-foundation.vercel.app";
          const uploadUrl = loggedInDonor
            ? `${appUrl}/donor/donations/${donationId}`
            : `${appUrl}/donate-now/pay/${referenceNo}?token=${guestAccessToken}`;

          const { subject, html, text } = createDonationReceivedEmail({
            pledgeId: referenceNo,
            donorName: parsed.data.donor_name,
            donorEmail: cleanedEmail,
            donorPhone: cleanedPhone,
            amount: parsed.data.currency === "AED" ? amountAed : amountPkr,
            currency: parsed.data.currency,
            cause: parsed.data.cause,
            frequency: parsed.data.frequency,
            donationType: parsed.data.donation_type,
            childrenSupported: impact.childrenCount,
            childMonths: impact.childMonths,
            impactHeadline: impact.headline,
            uploadUrl,
            fxLockNotice: parsed.data.currency === "AED" ? lockedFx.lockNotice : undefined,
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

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/donations");
      revalidatePath("/donor/dashboard");
      revalidatePath("/donor/donations");
      revalidatePath("/donor/plans");
      revalidatePath(`/donor/donations/${donationId}`);
      revalidatePath(`/donate-now/pay/${referenceNo}`);
    } catch {}

    return {
      success: true,
      donationId,
      referenceNo,
      amountPkr,
      amountAed,
      displayCurrency: parsed.data.currency,
      displayAmount: parsed.data.currency === "AED" ? amountAed : amountPkr,
      impact,
      fxLockNotice: parsed.data.currency === "AED" ? lockedFx.lockNotice : null,
      bankAccount: primaryBank,
      donorLoggedIn: Boolean(loggedInDonor),
      isGuest: !Boolean(loggedInDonor),
      redirectUrl,
      proofStatus: "none",
      guestAccessToken,
      message: `Pledge #${referenceNo} registered successfully!`,
    };
  } catch (err: any) {
    console.error("Donation submission error:", err);
    return {
      success: false,
      message: err.message || "An unexpected error occurred while registering your pledge.",
    };
  }
}
