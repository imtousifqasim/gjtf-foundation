"use server";

import { revalidatePath } from "next/cache";
import {
  updateDonationStatusDb,
  deleteDonationDb,
  updateContactStatusDb,
  getContactMessagesDb,
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
  createPaymentProofRejectedEmail,
} from "@/lib/email/templates/donationTemplates";
import {
  createVolunteerAcceptedEmail,
  createVolunteerRejectedEmail,
} from "@/lib/email/templates/volunteerTemplates";
import { getOrCreateReceiptDb } from "@/lib/db/donorDb";
import { getProofStorage } from "@/lib/storage";
import { getProofFolderPath } from "@/lib/storage/folderPath";
import {
  getPaymentProofsSettingsDb,
  updatePaymentProofsSettingsDb,
} from "@/lib/db/paymentProofsSchema";
import { createPledgeAccessToken } from "@/lib/db/pledgeTokens";
import { getActiveBankAccountsDb } from "@/lib/db/bankAccounts";

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

export async function getContactMessagesAction(limit = 100) {
  try {
    await requireAdmin();
    const data = await getContactMessagesDb(limit);
    return { success: true, data };
  } catch (err: any) {
    console.error("getContactMessagesAction error:", err);
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

export async function getActiveBankAccountsAction() {
  try {
    const { getActiveBankAccountsDb } = await import("@/lib/db/bankAccounts");
    const accounts = await getActiveBankAccountsDb();
    return { success: true, accounts };
  } catch (err: any) {
    return { success: false, accounts: [], error: err.message };
  }
}

// -------------------------------------------------------------
// Payment Proofs Verification & Storage Admin Actions
// -------------------------------------------------------------

export async function getDonationProofsAdminAction(donationId: string) {
  try {
    await requireAdmin();

    const proofs: any = await query<any[]>(
      `SELECT id, donation_id, donor_id, storage_driver, drive_file_id, drive_folder_id,
              folder_path, filename, mime, size_bytes, sha256, is_encrypted,
              transaction_ref, sender_bank, paid_at, paid_amount_minor, note,
              status, reject_reason, uploaded_at, reviewed_by, reviewed_at
       FROM payment_proofs
       WHERE donation_id = ? AND status != 'deleted'
       ORDER BY uploaded_at DESC`,
      [donationId]
    );

    // Check duplicate SHA-256 hashes across other donations
    const duplicateWarnings: Array<{ proofId: string; otherDonationId: string; otherRefNo?: string }> = [];
    if (proofs && proofs.length > 0) {
      const hashes = proofs.map((p: any) => p.sha256).filter(Boolean);
      if (hashes.length > 0) {
        const placeholders = hashes.map(() => "?").join(",");
        const dupRows: any = await query(
          `SELECT p.id as proof_id, p.sha256, p.donation_id, d.reference_no
           FROM payment_proofs p
           JOIN donations d ON d.id = p.donation_id
           WHERE p.sha256 IN (${placeholders})
             AND p.donation_id != ?
             AND p.status != 'deleted'`,
          [...hashes, donationId]
        );

        if (dupRows && dupRows.length > 0) {
          for (const row of dupRows) {
            duplicateWarnings.push({
              proofId: row.proof_id,
              otherDonationId: row.donation_id,
              otherRefNo: row.reference_no || row.donation_id,
            });
          }
        }
      }
    }

    return {
      success: true,
      proofs: proofs || [],
      duplicates: duplicateWarnings,
    };
  } catch (err: any) {
    console.error("[getDonationProofsAdminAction] Error:", err);
    return { success: false, error: err.message, proofs: [], duplicates: [] };
  }
}

export async function confirmDonationWithProofAction(data: {
  donationId: string;
  receivedAmount: number;
  bankAccountId?: string;
  bankTransactionRef?: string;
  confirmationDate?: string;
  adminNote?: string;
}): Promise<{ success: boolean; error?: string; receiptUrl?: string; receiptNo?: string }> {
  try {
    const admin = await requireAdmin();

    // 1. Fetch the target donation first
    const donRows: any = await query("SELECT * FROM donations WHERE id = ? LIMIT 1", [data.donationId]);
    if (!donRows || donRows.length === 0) {
      return { success: false, error: "Donation record not found." };
    }
    const donation = donRows[0];

    // Clean or auto-generate fallback invoice/transaction reference if admin omitted it
    const cleanRef = data.bankTransactionRef?.trim() || `SYS-INV-${donation.reference_no || donation.id.slice(0, 8).toUpperCase()}`;

    // Target bank account: default to primary active bank if not selected
    let targetBankAccountId = data.bankAccountId?.trim();
    if (!targetBankAccountId) {
      try {
        const activeBanks = await getActiveBankAccountsDb();
        targetBankAccountId = activeBanks[0]?.id || "bank-islami-primary";
      } catch {
        targetBankAccountId = "bank-islami-primary";
      }
    }

    if (!data.receivedAmount || data.receivedAmount <= 0) {
      return { success: false, error: "Please provide a valid received amount." };
    }

    // 2. Check uniqueness of bank_transaction_ref across donations only if explicitly provided (not SYS-INV prefix)
    if (data.bankTransactionRef && data.bankTransactionRef.trim() && !cleanRef.startsWith("SYS-")) {
      const existingRefRows: any = await query(
        "SELECT id, reference_no FROM donations WHERE bank_transaction_ref = ? AND id != ? LIMIT 1",
        [cleanRef, data.donationId]
      );
      if (existingRefRows && existingRefRows.length > 0) {
        const match = existingRefRows[0];
        return {
          success: false,
          error: `Duplicate Bank Transaction Reference! This reference was already verified for donation #${match.reference_no || match.id}.`,
        };
      }
    }

    const recAmtMinor = BigInt(Math.round(data.receivedAmount * 100));
    const paidAtSql = data.confirmationDate ? new Date(data.confirmationDate) : new Date();

    // 3. Update donations table
    await query(`
      UPDATE donations
      SET status = 'completed',
          proof_status = 'approved',
          bank_account_id = ?,
          bank_transaction_ref = ?,
          received_amount_minor = ?,
          received_currency = 'PKR',
          received_pkr_minor = ?,
          confirmed_by = ?,
          confirmed_at = NOW(),
          paid_at = ?,
          admin_note = CASE 
            WHEN ? IS NOT NULL AND ? != '' THEN CONCAT(COALESCE(admin_note, ''), '\n', ?) 
            ELSE admin_note 
          END
      WHERE id = ?
    `, [
      targetBankAccountId,
      cleanRef,
      recAmtMinor.toString(),
      recAmtMinor.toString(),
      admin.email,
      paidAtSql,
      data.adminNote || null,
      data.adminNote || null,
      data.adminNote || null,
      data.donationId,
    ]);

    // 4. Update payment_proofs table: approve any submitted proofs for this donation
    await query(`
      UPDATE payment_proofs
      SET status = 'approved',
          reviewed_by = ?,
          reviewed_at = NOW()
      WHERE donation_id = ? AND status = 'submitted'
    `, [admin.email, data.donationId]);

    // 5. Advance recurring monthly plan if this donation belongs to one
    if (donation.plan_id) {
      try {
        await query(`
          UPDATE donation_plans
          SET cycles_completed = cycles_completed + 1,
              next_due_date = DATE_ADD(next_due_date, INTERVAL 1 MONTH),
              updated_at = NOW()
          WHERE id = ?
        `, [donation.plan_id]);
      } catch (planErr: any) {
        console.warn("[Plan Advance] Could not advance donation plan:", planErr.message);
      }
    }

    // 6. Generate official digital receipt
    let receiptNo = "";
    try {
      const receiptInfo = await getOrCreateReceiptDb(data.donationId);
      receiptNo = receiptInfo.receiptNo;
    } catch (recErr: any) {
      console.warn("[Receipt] Could not generate digital receipt:", recErr.message);
    }

    // 7. Auto-cancel any active pending reminders
    try {
      await cancelDonationReminderDb(data.donationId);
    } catch {}

    // 8. Record audit log
    try {
      await createAuditLogDb({
        actor_type: "admin",
        actor_id: admin.email,
        action: "confirm_donation_with_proof",
        target_type: "donation",
        target_id: data.donationId,
        metadata: {
          receivedAmount: data.receivedAmount,
          bankAccountId: data.bankAccountId,
          bankTransactionRef: cleanRef,
          receiptNo,
          previousProofStatus: donation.proof_status,
        },
      });
    } catch {}

    // 9. Dispatch completion & receipt email to donor
    if (donation.donor_email && donation.donor_email.trim() !== "") {
      try {
        const { subject, html, text } = createDonationCompletedEmail({
          pledgeId: donation.reference_no || donation.id,
          donorName: donation.donor_name,
          donorEmail: donation.donor_email,
          amount: data.receivedAmount,
          currency: "PKR",
          cause: donation.cause,
          frequency: donation.frequency,
          donationType: donation.donation_type,
        });

        await sendTransactionalEmail({
          to: donation.donor_email,
          recipientName: donation.donor_name,
          emailType: "donation_completed",
          subject,
          html,
          text,
          metadata: { pledgeId: donation.id, receiptNo, bankRef: cleanRef },
        });
      } catch (emErr: any) {
        console.warn("[Confirm Email] Failed to send confirmation email:", emErr.message);
      }
    }

    try {
      revalidatePath("/admin/donations");
      revalidatePath("/admin");
      revalidatePath(`/donor/donations/${data.donationId}`);
      if (donation.reference_no) {
        revalidatePath(`/donor/donations/${donation.reference_no}`);
      }
      revalidatePath("/donor/dashboard");
      revalidatePath("/donor/receipts");
    } catch {}

    const receiptUrl = `/receipt/${encodeURIComponent(donation.reference_no || data.donationId)}`;

    return {
      success: true,
      receiptNo,
      receiptUrl,
    };
  } catch (err: any) {
    console.error("[confirmDonationWithProofAction] Error:", err);
    return { success: false, error: err.message || "Failed to confirm donation" };
  }
}

export async function rejectPaymentProofAdminAction(data: {
  donationId: string;
  proofId?: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();

    const cleanReason = data.reason?.trim();
    if (!cleanReason) {
      return { success: false, error: "Rejection reason is required." };
    }

    // 1. Fetch donation
    const donRows: any = await query("SELECT * FROM donations WHERE id = ? LIMIT 1", [data.donationId]);
    if (!donRows || donRows.length === 0) {
      return { success: false, error: "Donation record not found." };
    }
    const donation = donRows[0];

    // 2. Update donations table proof_status
    await query("UPDATE donations SET proof_status = 'rejected' WHERE id = ?", [data.donationId]);

    // 3. Update payment_proofs table
    if (data.proofId) {
      await query(`
        UPDATE payment_proofs
        SET status = 'rejected',
            reject_reason = ?,
            reviewed_by = ?,
            reviewed_at = NOW()
        WHERE id = ? AND donation_id = ?
      `, [cleanReason, admin.email, data.proofId, data.donationId]);
    } else {
      await query(`
        UPDATE payment_proofs
        SET status = 'rejected',
            reject_reason = ?,
            reviewed_by = ?,
            reviewed_at = NOW()
        WHERE donation_id = ? AND status = 'submitted'
      `, [cleanReason, admin.email, data.donationId]);
    }

    // 4. Audit log
    try {
      await createAuditLogDb({
        actor_type: "admin",
        actor_id: admin.email,
        action: "reject_payment_proof",
        target_type: "donation",
        target_id: data.donationId,
        metadata: {
          proofId: data.proofId || null,
          reason: cleanReason,
        },
      });
    } catch {}

    // 5. Build re-upload link & dispatch email
    if (donation.donor_email && donation.donor_email.trim() !== "") {
      try {
        let uploadUrl: string;
        if (donation.donor_id) {
          uploadUrl = `https://gjtf-foundation.vercel.app/donor/donations/${donation.id}`;
        } else {
          const rawToken = await createPledgeAccessToken(donation.id, donation.reference_no || donation.id);
          uploadUrl = `https://gjtf-foundation.vercel.app/donate-now/pay/${donation.reference_no || donation.id}?token=${rawToken}`;
        }

        const { subject, html, text } = createPaymentProofRejectedEmail({
          pledgeId: donation.reference_no || donation.id,
          donorName: donation.donor_name,
          donorEmail: donation.donor_email,
          amount: Number(donation.amount) || 0,
          currency: donation.currency || "PKR",
          cause: donation.cause || "General Education",
          rejectionReason: cleanReason,
          uploadUrl,
        });

        await sendTransactionalEmail({
          to: donation.donor_email,
          recipientName: donation.donor_name,
          emailType: "proof_rejected",
          subject,
          html,
          text,
          metadata: { pledgeId: donation.id, reason: cleanReason },
        });
      } catch (emErr: any) {
        console.warn("[Reject Email] Failed to send rejection email:", emErr.message);
      }
    }

    try {
      revalidatePath("/admin/donations");
      revalidatePath("/admin");
      revalidatePath(`/donor/donations/${data.donationId}`);
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error("[rejectPaymentProofAdminAction] Error:", err);
    return { success: false, error: err.message || "Failed to reject payment proof" };
  }
}

export async function deletePaymentProofAdminAction(proofId: string) {
  try {
    const admin = await requireAdmin();

    const rows: any = await query("SELECT * FROM payment_proofs WHERE id = ? LIMIT 1", [proofId]);
    if (!rows || rows.length === 0) {
      return { success: false, error: "Proof not found" };
    }
    const proof = rows[0];

    // Permanently delete file from Google Drive
    try {
      const storage = getProofStorage();
      await storage.delete(proof.drive_file_id);
    } catch (delErr: any) {
      console.warn("[Storage Delete] Could not delete file from storage:", delErr.message);
    }

    // Soft delete row in DB
    await query("UPDATE payment_proofs SET status = 'deleted', deleted_at = NOW() WHERE id = ?", [proofId]);

    // Check remaining active proofs for this donation
    const remaining: any = await query(
      "SELECT COUNT(*) as count FROM payment_proofs WHERE donation_id = ? AND status != 'deleted'",
      [proof.donation_id]
    );
    const count = Number(remaining?.[0]?.count) || 0;
    if (count === 0) {
      await query("UPDATE donations SET proof_status = 'none' WHERE id = ?", [proof.donation_id]);
    }

    // Audit log
    try {
      await createAuditLogDb({
        actor_type: "admin",
        actor_id: admin.email,
        action: "delete_payment_proof",
        target_type: "payment_proof",
        target_id: proofId,
        metadata: {
          donationId: proof.donation_id,
          driveFileId: proof.drive_file_id,
          filename: proof.filename,
        },
      });
    } catch {}

    try {
      revalidatePath("/admin/donations");
      revalidatePath(`/donor/donations/${proof.donation_id}`);
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error("[deletePaymentProofAdminAction] Error:", err);
    return { success: false, error: err.message };
  }
}

export async function testStorageHealthAction() {
  try {
    await requireAdmin();
    const storage = getProofStorage();
    const health = await storage.health();

    await updatePaymentProofsSettingsDb({
      last_health_check_at: new Date().toISOString(),
      last_health_status: health.healthy ? "healthy" : "degraded",
      last_health_error: health.error || null,
    });

    return { success: true, health };
  } catch (err: any) {
    console.error("[testStorageHealthAction] Error:", err);
    return {
      success: false,
      health: {
        healthy: false,
        driver: "google-drive",
        error: err.message || "Failed to test storage",
        hasPublicPermissions: false,
      },
    };
  }
}

export async function getProofStorageSettingsAction() {
  try {
    await requireAdmin();
    const [settings, storage] = await Promise.all([
      getPaymentProofsSettingsDb(),
      Promise.resolve(getProofStorage()),
    ]);

    const health = await storage.health();
    const folderPreview = getProofFolderPath(new Date());

    // Get last upload timestamp
    const lastUploadRows: any = await query(
      "SELECT uploaded_at, folder_path, filename FROM payment_proofs WHERE status != 'deleted' ORDER BY uploaded_at DESC LIMIT 1"
    );
    const lastUpload = lastUploadRows?.[0] || null;

    // Count proofs
    const countsRows: any = await query(
      `SELECT
         COUNT(*) as total_proofs,
         SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_proofs,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_proofs,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_proofs,
         COALESCE(SUM(size_bytes), 0) as total_size_bytes
       FROM payment_proofs WHERE status != 'deleted'`
    );
    const stats = countsRows?.[0] || {};

    return {
      success: true,
      settings,
      health,
      folderPreview,
      lastUpload,
      stats: {
        totalProofs: Number(stats.total_proofs) || 0,
        submittedProofs: Number(stats.submitted_proofs) || 0,
        approvedProofs: Number(stats.approved_proofs) || 0,
        rejectedProofs: Number(stats.rejected_proofs) || 0,
        totalSizeBytes: Number(stats.total_size_bytes) || 0,
      },
    };
  } catch (err: any) {
    console.error("[getProofStorageSettingsAction] Error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateProofStorageSettingsAction(updates: any) {
  try {
    const admin = await requireAdmin();
    await updatePaymentProofsSettingsDb(updates);

    try {
      await createAuditLogDb({
        actor_type: "admin",
        actor_id: admin.email,
        action: "update_payment_proofs_settings",
        target_type: "payment_proofs_settings",
        target_id: "default",
        metadata: updates,
      });
    } catch {}

    try {
      revalidatePath("/admin/payment-settings");
      revalidatePath("/admin/payment-settings/proof-storage");
    } catch {}
    return { success: true };
  } catch (err: any) {
    console.error("[updateProofStorageSettingsAction] Error:", err);
    return { success: false, error: err.message };
  }
}

