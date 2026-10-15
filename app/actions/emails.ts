"use server";

import { revalidatePath } from "next/cache";
import {
  getEmailLogsDb,
  getEmailLogByIdDb,
  deleteEmailLogDb,
  bulkDeleteEmailLogsDb,
  clearAllEmailLogsDb,
  getEmailSettingsDb,
  saveEmailSettingsDb,
  saveDonationReminderDb,
  getDonationReminderByPledgeDb,
  cancelDonationReminderDb,
  markReminderSentDb,
  query,
} from "@/lib/db/mysql";
import { sendTransactionalEmail, retryEmailLog } from "@/lib/email/sender";
import { createVolunteerReplyEmail } from "@/lib/email/templates/volunteerTemplates";
import { createDonationReminderEmail } from "@/lib/email/templates/donationTemplates";

// -------------------------------------------------------------
// Email Logs & Cleanup Actions
// -------------------------------------------------------------

export async function getEmailLogsAction(filters?: {
  search?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    return await getEmailLogsDb(filters);
  } catch (err: any) {
    console.error("getEmailLogsAction error:", err);
    return { logs: [], total: 0 };
  }
}

export async function getEmailLogDetailAction(id: string) {
  try {
    return await getEmailLogByIdDb(id);
  } catch (err: any) {
    console.error("getEmailLogDetailAction error:", err);
    return null;
  }
}

export async function retryEmailAction(logId: string) {
  try {
    const res = await retryEmailLog(logId);
    revalidatePath("/admin/email-logs");
    return res;
  } catch (err: any) {
    console.error("retryEmailAction error:", err);
    return { success: false, message: err.message || "Failed to retry email." };
  }
}

export async function deleteEmailLogAction(id: string) {
  try {
    await deleteEmailLogDb(id);
    revalidatePath("/admin/email-logs");
    return { success: true };
  } catch (err: any) {
    console.error("deleteEmailLogAction error:", err);
    return { success: false, message: err.message };
  }
}

export async function bulkDeleteEmailLogsAction(ids: string[]) {
  try {
    const deletedCount = await bulkDeleteEmailLogsDb(ids);
    revalidatePath("/admin/email-logs");
    return { success: true, count: deletedCount };
  } catch (err: any) {
    console.error("bulkDeleteEmailLogsAction error:", err);
    return { success: false, message: err.message };
  }
}

export async function clearAllEmailLogsAction() {
  try {
    await clearAllEmailLogsDb();
    revalidatePath("/admin/email-logs");
    return { success: true };
  } catch (err: any) {
    console.error("clearAllEmailLogsAction error:", err);
    return { success: false, message: err.message };
  }
}

export async function getEmailSettingsAction() {
  try {
    return await getEmailSettingsDb();
  } catch (err: any) {
    console.error("getEmailSettingsAction error:", err);
    return { auto_delete_enabled: false, retention_days: 30 };
  }
}

export async function saveEmailSettingsAction(settings: {
  auto_delete_enabled: boolean;
  retention_days: number;
}) {
  try {
    await saveEmailSettingsDb(settings);
    revalidatePath("/admin/email-logs");
    return { success: true, message: "Email cleanup settings saved successfully." };
  } catch (err: any) {
    console.error("saveEmailSettingsAction error:", err);
    return { success: false, message: err.message };
  }
}

// -------------------------------------------------------------
// Admin Reply to Volunteer Action
// -------------------------------------------------------------

export async function sendVolunteerReplyAction({
  recipientName,
  recipientEmail,
  subject,
  message,
}: {
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
}) {
  try {
    if (!recipientEmail || !message.trim()) {
      return { success: false, message: "Email and message are required." };
    }

    const { subject: emailSubject, html, text } = createVolunteerReplyEmail({
      recipientName,
      recipientEmail,
      subject: subject.trim() || `Reply from GJTF Foundation regarding your application`,
      message: message.trim(),
    });

    const res = await sendTransactionalEmail({
      to: recipientEmail,
      recipientName,
      emailType: "volunteer_reply",
      subject: emailSubject,
      html,
      text,
      metadata: { sentByAdmin: true, replyContext: "volunteer_signup" },
    });

    revalidatePath("/admin/email-logs");
    revalidatePath("/admin/volunteer-signups");

    return {
      success: true,
      message: res.success
        ? `Reply email dispatched successfully to ${recipientEmail}!`
        : `Reply recorded in email logs (Status: ${res.error || "delivery queued"}).`,
    };
  } catch (err: any) {
    console.error("sendVolunteerReplyAction error:", err);
    return { success: false, message: err.message || "Failed to send reply." };
  }
}

// -------------------------------------------------------------
// Donation Reminder Actions
// -------------------------------------------------------------

export async function setDonationReminderAction({
  pledgeId,
  scheduledAt,
  repeatIntervalDays = 0,
  maxReminders = 1,
  customMessage,
}: {
  pledgeId: string;
  scheduledAt: string;
  repeatIntervalDays?: number;
  maxReminders?: number;
  customMessage?: string | null;
}) {
  try {
    const reminderId = await saveDonationReminderDb({
      pledge_id: pledgeId,
      scheduled_at: scheduledAt,
      repeat_interval_days: repeatIntervalDays,
      max_reminders: maxReminders,
      custom_message: customMessage,
    });

    revalidatePath("/admin/donations");
    return { success: true, reminderId, message: "Reminder schedule saved successfully." };
  } catch (err: any) {
    console.error("setDonationReminderAction error:", err);
    return { success: false, message: err.message };
  }
}

export async function getDonationReminderStatusAction(pledgeId: string) {
  try {
    return await getDonationReminderByPledgeDb(pledgeId);
  } catch (err: any) {
    console.error("getDonationReminderStatusAction error:", err);
    return null;
  }
}

export async function cancelDonationReminderAction(pledgeId: string) {
  try {
    await cancelDonationReminderDb(pledgeId);
    revalidatePath("/admin/donations");
    return { success: true, message: "Reminder cancelled." };
  } catch (err: any) {
    console.error("cancelDonationReminderAction error:", err);
    return { success: false, message: err.message };
  }
}

export async function sendDonationReminderNowAction(pledgeId: string) {
  try {
    // 1. Fetch donation details
    const rows: any = await query("SELECT * FROM donations WHERE id = ? LIMIT 1", [pledgeId]);
    if (!rows || rows.length === 0) {
      return { success: false, message: "Donation record not found." };
    }

    const donation = rows[0];
    if (donation.status !== "pending") {
      return { success: false, message: `Cannot send reminder: pledge status is "${donation.status}".` };
    }

    if (!donation.donor_email || donation.donor_email.trim() === "") {
      return { success: false, message: "No email address found for this donor." };
    }

    // 2. Fetch or create reminder record
    let reminder = await getDonationReminderByPledgeDb(pledgeId);
    if (!reminder) {
      const scheduledNow = new Date().toISOString().slice(0, 19).replace("T", " ");
      await saveDonationReminderDb({
        pledge_id: pledgeId,
        scheduled_at: scheduledNow,
        repeat_interval_days: 0,
        max_reminders: 1,
      });
      reminder = await getDonationReminderByPledgeDb(pledgeId);
    }

    // 3. Render and send email
    const { subject, html, text } = createDonationReminderEmail({
      pledgeId: donation.id,
      donorName: donation.donor_name,
      donorEmail: donation.donor_email,
      donorPhone: donation.donor_phone,
      amount: donation.amount,
      currency: donation.currency,
      cause: donation.cause,
      customMessage: reminder?.custom_message,
      unsubscribeToken: reminder?.unsubscribe_token,
    });

    const sendRes = await sendTransactionalEmail({
      to: donation.donor_email,
      recipientName: donation.donor_name,
      emailType: "donation_reminder",
      subject,
      html,
      text,
      metadata: { pledgeId: donation.id, sentManually: true },
    });

    // 4. Update reminder sent counts
    if (reminder) {
      await markReminderSentDb(reminder.id, null);
    }

    revalidatePath("/admin/donations");
    revalidatePath("/admin/email-logs");

    return {
      success: true,
      message: sendRes.success
        ? `Reminder email delivered successfully to ${donation.donor_email}!`
        : `Reminder dispatch logged (Status: ${sendRes.error || "delivery queued"}).`,
    };
  } catch (err: any) {
    console.error("sendDonationReminderNowAction error:", err);
    return { success: false, message: err.message || "Failed to dispatch reminder." };
  }
}
