"use server";

import { revalidatePath } from "next/cache";
import {
  updateDonationStatusDb,
  deleteDonationDb,
  updateContactStatusDb,
  deleteContactMessageDb,
  updateVolunteerStatusDb,
  deleteVolunteerSignupDb,
  saveSchoolDb,
  deleteSchoolDb,
  saveStoryDb,
  deleteStoryDb,
  cancelDonationReminderDb,
  query,
} from "@/lib/db/mysql";
import { sendTransactionalEmail } from "@/lib/email/sender";
import {
  createDonationCompletedEmail,
  createDonationPendingEmail,
  createDonationFailedEmail,
} from "@/lib/email/templates/donationTemplates";
import {
  createVolunteerAcceptedEmail,
  createVolunteerRejectedEmail,
} from "@/lib/email/templates/volunteerTemplates";

export async function updateDonationStatus(
  donationId: string,
  status: "pending" | "completed" | "failed"
) {
  try {
    // 1. Fetch donation details before/during update
    const [donations]: any = await query("SELECT * FROM donations WHERE id = ? LIMIT 1", [donationId]);
    const donation = donations && donations.length > 0 ? donations[0] : null;

    // 2. Update DB
    await updateDonationStatusDb(donationId, status);

    // 3. Auto-stop reminders if completed or failed
    if (status === "completed" || status === "failed") {
      await cancelDonationReminderDb(donationId);
    }

    // 4. Asynchronously send status-specific email to donor
    if (donation && donation.donor_email && donation.donor_email.trim() !== "") {
      (async () => {
        try {
          const emailData = {
            pledgeId: donation.id,
            donorName: donation.donor_name,
            donorEmail: donation.donor_email,
            donorPhone: donation.donor_phone,
            amount: donation.amount,
            currency: donation.currency || "PKR",
            cause: donation.cause,
            frequency: donation.frequency,
            donationType: donation.donation_type,
          };

          if (status === "completed") {
            const { subject, html, text } = createDonationCompletedEmail(emailData);
            await sendTransactionalEmail({
              to: donation.donor_email,
              recipientName: donation.donor_name,
              emailType: "donation_completed",
              subject,
              html,
              text,
              metadata: { pledgeId: donation.id, newStatus: status },
            });
          } else if (status === "pending") {
            const { subject, html, text } = createDonationPendingEmail(emailData);
            await sendTransactionalEmail({
              to: donation.donor_email,
              recipientName: donation.donor_name,
              emailType: "donation_pending",
              subject,
              html,
              text,
              metadata: { pledgeId: donation.id, newStatus: status },
            });
          } else if (status === "failed") {
            const { subject, html, text } = createDonationFailedEmail(emailData);
            await sendTransactionalEmail({
              to: donation.donor_email,
              recipientName: donation.donor_name,
              emailType: "donation_failed",
              subject,
              html,
              text,
              metadata: { pledgeId: donation.id, newStatus: status },
            });
          }
        } catch (emErr: any) {
          console.warn("Could not dispatch donation status email:", emErr.message);
        }
      })();
    }

    revalidatePath("/admin/donations");
    revalidatePath("/admin/email-logs");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("updateDonationStatus error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteDonation(donationId: string) {
  try {
    await cancelDonationReminderDb(donationId);
    await deleteDonationDb(donationId);
    revalidatePath("/admin/donations");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("deleteDonation error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateContactStatus(messageId: string, status: "new" | "read" | "archived") {
  try {
    await updateContactStatusDb(messageId, status);
    revalidatePath("/admin/contact-messages");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("updateContactStatus error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteContactMessage(messageId: string) {
  try {
    await deleteContactMessageDb(messageId);
    revalidatePath("/admin/contact-messages");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("deleteContactMessage error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateVolunteerStatus(
  signupId: string,
  status: "new" | "contacted" | "archived",
  customNotes?: string
) {
  try {
    // 1. Fetch volunteer info before updating
    const [volunteers]: any = await query("SELECT * FROM volunteer_signups WHERE id = ? LIMIT 1", [signupId]);
    const volunteer = volunteers && volunteers.length > 0 ? volunteers[0] : null;

    // 2. Update status in DB
    await updateVolunteerStatusDb(signupId, status);

    // 3. Asynchronously dispatch status email
    if (volunteer && volunteer.email && volunteer.email.trim() !== "") {
      (async () => {
        try {
          const volData = {
            full_name: volunteer.full_name,
            email: volunteer.email,
            phone: volunteer.phone,
            type: volunteer.type,
            city: volunteer.city,
            university: volunteer.university,
            message: volunteer.message,
          };

          if (status === "contacted") {
            // Acceptance email
            const { subject, html, text } = createVolunteerAcceptedEmail(volData, customNotes);
            await sendTransactionalEmail({
              to: volunteer.email,
              recipientName: volunteer.full_name,
              emailType: "volunteer_accepted",
              subject,
              html,
              text,
              metadata: { signupId: volunteer.id, newStatus: status },
            });
          } else if (status === "archived") {
            // Rejection / Archived email
            const { subject, html, text } = createVolunteerRejectedEmail(volData, customNotes);
            await sendTransactionalEmail({
              to: volunteer.email,
              recipientName: volunteer.full_name,
              emailType: "volunteer_rejected",
              subject,
              html,
              text,
              metadata: { signupId: volunteer.id, newStatus: status },
            });
          }
        } catch (emErr: any) {
          console.warn("Could not dispatch volunteer status update email:", emErr.message);
        }
      })();
    }

    revalidatePath("/admin/volunteer-signups");
    revalidatePath("/admin/email-logs");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("updateVolunteerStatus error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteVolunteerSignup(signupId: string, notify: boolean = true) {
  try {
    // 1. Fetch volunteer info before deletion
    const [volunteers]: any = await query("SELECT * FROM volunteer_signups WHERE id = ? LIMIT 1", [signupId]);
    const volunteer = volunteers && volunteers.length > 0 ? volunteers[0] : null;

    // 2. Delete record
    await deleteVolunteerSignupDb(signupId);

    // 3. Asynchronously send polite rejection notification if requested
    if (notify && volunteer && volunteer.email && volunteer.email.trim() !== "") {
      (async () => {
        try {
          const volData = {
            full_name: volunteer.full_name,
            email: volunteer.email,
            phone: volunteer.phone,
            type: volunteer.type,
            city: volunteer.city,
            university: volunteer.university,
          };
          const { subject, html, text } = createVolunteerRejectedEmail(volData);
          await sendTransactionalEmail({
            to: volunteer.email,
            recipientName: volunteer.full_name,
            emailType: "volunteer_rejected",
            subject,
            html,
            text,
            metadata: { signupId, deleted: true },
          });
        } catch (emErr: any) {
          console.warn("Could not dispatch volunteer deletion email:", emErr.message);
        }
      })();
    }

    revalidatePath("/admin/volunteer-signups");
    revalidatePath("/admin/email-logs");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("deleteVolunteerSignup error:", err);
    return { success: false, error: err.message };
  }
}

export async function saveSchool(schoolData: any) {
  try {
    await saveSchoolDb(schoolData);
    revalidatePath("/admin/schools");
    revalidatePath("/admin");
    revalidatePath("/our-school");
    revalidatePath("/");
    revalidatePath("/(public)", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("saveSchool error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteSchool(schoolId: string) {
  try {
    await deleteSchoolDb(schoolId);
    revalidatePath("/admin/schools");
    revalidatePath("/admin");
    revalidatePath("/our-school");
    revalidatePath("/");
    revalidatePath("/(public)", "layout");
    return { success: true };
  } catch (err: any) {
    console.error("deleteSchool error:", err);
    return { success: false, error: err.message };
  }
}

export async function saveStory(storyData: any) {
  try {
    await saveStoryDb(storyData);
    revalidatePath("/admin/stories");
    revalidatePath("/news-stories");
    return { success: true };
  } catch (err: any) {
    console.error("saveStory error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteStory(storyId: string) {
  try {
    await deleteStoryDb(storyId);
    revalidatePath("/admin/stories");
    revalidatePath("/news-stories");
    return { success: true };
  } catch (err: any) {
    console.error("deleteStory error:", err);
    return { success: false, error: err.message };
  }
}
