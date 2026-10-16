"use server";

import { revalidatePath } from "next/cache";
import {
  updateDonationStatusDb,
  deleteDonationDb,
  updateContactStatusDb,
  deleteContactMessageDb,
  deleteContactMessagesBulkDb,
  getContactMessageRepliesDb,
  createContactMessageReplyDb,
  getContactMessagesSettingsDb,
  saveContactMessagesSettingsDb,
  clearAllContactMessagesDb,
  createAuditLogDb,
  updateVolunteerStatusDb,
  deleteVolunteerSignupDb,
  saveSchoolDb,
  deleteSchoolDb,
  saveStoryDb,
  deleteStoryDb,
  cancelDonationReminderDb,
  query,
} from "@/lib/db/mysql";
import { requireAdmin } from "@/lib/auth/admin";
import { createContactReplyEmail } from "@/lib/email/templates/contactTemplates";
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
  status: "pending" | "completed" | "failed",
  receivedDetails?: {
    bank_account_id?: string;
    received_amount?: number;
    received_currency?: string;
    received_pkr?: number;
    admin_note?: string;
  }
) {
  try {
    // 1. Fetch donation details before/during update
    const rows: any = await query("SELECT * FROM donations WHERE id = ? LIMIT 1", [donationId]);
    const donation = rows && rows.length > 0 ? rows[0] : null;

    // 2. Update DB with Section 15.6 received details when completed
    if (status === "completed" && receivedDetails) {
      const recAmtMinor = receivedDetails.received_amount != null ? BigInt(Math.round(receivedDetails.received_amount * 100)) : null;
      const recPkrMinor = receivedDetails.received_pkr != null
        ? BigInt(Math.round(receivedDetails.received_pkr * 100))
        : (receivedDetails.received_currency === "PKR" && receivedDetails.received_amount != null
            ? BigInt(Math.round(receivedDetails.received_amount * 100))
            : null);

      await query(`
        UPDATE donations
        SET status = ?,
            bank_account_id = COALESCE(?, bank_account_id),
            received_amount_minor = COALESCE(?, received_amount_minor, amount_pkr_minor),
            received_currency = COALESCE(?, received_currency, currency),
            received_pkr_minor = COALESCE(?, received_pkr_minor, amount_pkr_minor),
            admin_note = CASE 
              WHEN ? IS NOT NULL AND ? != '' THEN CONCAT(COALESCE(admin_note, ''), '\n', ?) 
              ELSE admin_note 
            END,
            paid_at = COALESCE(paid_at, NOW())
        WHERE id = ?
      `, [
        status,
        receivedDetails.bank_account_id || null,
        recAmtMinor ? recAmtMinor.toString() : null,
        receivedDetails.received_currency || null,
        recPkrMinor ? recPkrMinor.toString() : null,
        receivedDetails.admin_note || null,
        receivedDetails.admin_note || null,
        receivedDetails.admin_note || null,
        donationId,
      ]);
    } else {
      await updateDonationStatusDb(donationId, status);
    }

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

export async function updateContactStatus(messageId: string, status: "new" | "read" | "archived" | "replied") {
  try {
    await requireAdmin();
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
    const admin = await requireAdmin();
    const ok = await deleteContactMessageDb(messageId);
    if (!ok) {
      return { success: false, error: "Contact submission not found or already deleted." };
    }

    try {
      await createAuditLogDb({
        actor_type: "admin",
        actor_id: admin.email,
        action: "contact_messages.deleted",
        target_type: "contact_submissions",
        target_id: messageId,
      });
    } catch {}

    revalidatePath("/admin/contact-messages");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("deleteContactMessage error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteContactMessagesBulk(messageIds: string[]) {
  try {
    const admin = await requireAdmin();
    const count = await deleteContactMessagesBulkDb(messageIds);
    if (count === 0) {
      return { success: false, error: "No contact submissions were deleted. They may have already been removed." };
    }

    try {
      await createAuditLogDb({
        actor_type: "admin",
        actor_id: admin.email,
        action: "contact_messages.bulk_deleted",
        target_type: "contact_submissions",
        metadata: { count, messageIds },
      });
    } catch {}

    revalidatePath("/admin/contact-messages");
    revalidatePath("/admin");
    return { success: true, count };
  } catch (err: any) {
    console.error("deleteContactMessagesBulk error:", err);
    return { success: false, error: err.message };
  }
}

export async function sendContactMessageReplyAction(formData: {
  messageId: string;
  subject: string;
  message: string;
}) {
  try {
    const admin = await requireAdmin();

    const subject = (formData.subject || "").trim();
    const replyBody = (formData.message || "").trim();

    if (!formData.messageId) {
      return { success: false, error: "Target contact message ID is required." };
    }
    if (!subject || subject.length < 3) {
      return { success: false, error: "Please provide a valid email subject line (min 3 characters)." };
    }
    if (!replyBody || replyBody.length < 5) {
      return { success: false, error: "Please enter your reply message content (min 5 characters)." };
    }

    // 1. Fetch original contact inquiry
    const msgRows: any = await query(
      "SELECT * FROM contact_submissions WHERE id = ? AND deleted_at IS NULL LIMIT 1",
      [formData.messageId]
    );

    if (!msgRows || msgRows.length === 0) {
      return { success: false, error: "The inquiry you are replying to no longer exists or was deleted." };
    }

    const originalMsg = msgRows[0];

    // 2. Build branded transactional email payload
    const emailPayload = createContactReplyEmail({
      recipientName: originalMsg.name || "Inquirer",
      recipientEmail: originalMsg.email,
      subject,
      replyBody,
      originalMessage: {
        senderName: originalMsg.name,
        subject: originalMsg.subject,
        message: originalMsg.message,
        createdAt: originalMsg.created_at,
      },
    });

    // 3. Dispatch via transactional email system
    const sendResult = await sendTransactionalEmail({
      to: originalMsg.email,
      recipientName: originalMsg.name,
      emailType: "contact_reply",
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text,
      metadata: {
        messageId: originalMsg.id,
        repliedBy: admin.email,
        originalSubject: originalMsg.subject,
      },
    });

    // 4. Record reply in database
    await createContactMessageReplyDb({
      messageId: originalMsg.id,
      adminId: admin.email,
      subject,
      body: replyBody,
      status: sendResult.success ? "sent" : "failed",
      error: sendResult.error || null,
      providerMessageId: sendResult.logId || null,
    });

    if (!sendResult.success) {
      return {
        success: false,
        error: `Email provider error: ${sendResult.error || "Failed to dispatch reply."}`,
      };
    }

    // 5. Audit log & revalidation
    try {
      await createAuditLogDb({
        actor_type: "admin",
        actor_id: admin.email,
        action: "contact_messages.replied",
        target_type: "contact_submissions",
        target_id: originalMsg.id,
        metadata: {
          recipientEmail: originalMsg.email,
          subject,
          logId: sendResult.logId,
        },
      });
    } catch {}

    revalidatePath("/admin/contact-messages");
    revalidatePath("/admin");
    revalidatePath("/admin/email-logs");

    return {
      success: true,
      message: `Reply officially sent to ${originalMsg.email} and recorded in thread.`,
    };
  } catch (err: any) {
    console.error("sendContactMessageReplyAction error:", err);
    return { success: false, error: err.message || "An unexpected error occurred while dispatching reply." };
  }
}

export async function getContactMessageThreadAction(messageId: string) {
  try {
    await requireAdmin();
    const [msgRows, replies]: any = await Promise.all([
      query("SELECT * FROM contact_submissions WHERE id = ? LIMIT 1", [messageId]),
      getContactMessageRepliesDb(messageId),
    ]);

    if (!msgRows || msgRows.length === 0) {
      return { success: false, error: "Message not found" };
    }

    return {
      success: true,
      message: msgRows[0],
      replies: replies || [],
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getContactMessagesSettingsAction() {
  try {
    await requireAdmin();
    const settings = await getContactMessagesSettingsDb();
    return { success: true, settings };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveContactMessagesSettingsAction(settings: {
  auto_delete_enabled?: boolean;
  retention_days?: number;
  delete_only_replied?: boolean;
}) {
  try {
    const admin = await requireAdmin();
    await saveContactMessagesSettingsDb(settings);
    await createAuditLogDb({
      actor_type: "admin",
      actor_id: admin.email,
      action: "contact_messages.settings_updated",
      target_type: "contact_messages_settings",
      metadata: settings,
    });
    revalidatePath("/admin/contact-messages");
    return { success: true, message: "Contact message retention settings updated." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function clearAllContactMessagesAction(confirmation: string) {
  try {
    const admin = await requireAdmin();
    const count = await clearAllContactMessagesDb(confirmation);
    await createAuditLogDb({
      actor_type: "admin",
      actor_id: admin.email,
      action: "contact_messages.clear_all",
      target_type: "contact_submissions",
      metadata: { clearedCount: count },
    });
    revalidatePath("/admin/contact-messages");
    revalidatePath("/admin");
    return { success: true, count, message: `Successfully cleared ${count} contact messages.` };
  } catch (err: any) {
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
    const rows: any = await query("SELECT * FROM volunteer_signups WHERE id = ? LIMIT 1", [signupId]);
    const volunteer = rows && rows.length > 0 ? rows[0] : null;

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
    const rows: any = await query("SELECT * FROM volunteer_signups WHERE id = ? LIMIT 1", [signupId]);
    const volunteer = rows && rows.length > 0 ? rows[0] : null;

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
