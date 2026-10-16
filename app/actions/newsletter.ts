"use server";

import { z } from "zod";
import { addSubscriberDb, getSubscribersDb, query, syncBackupToSupabase } from "@/lib/db/mysql";
import { sendEmail, sendWelcomeNewsletterEmail } from "@/lib/email/smtp";
import { renderBaseEmailHtml } from "@/lib/email/templates/baseLayout";
import { validateEmail } from "@/lib/validation";

export async function subscribeNewsletter(emailInput: string) {
  const emailRes = validateEmail(emailInput);
  if (!emailRes.valid) {
    return {
      success: false,
      message: emailRes.error || "Please enter a valid email address.",
    };
  }

  const email = emailRes.cleaned;

  try {
    await addSubscriberDb(email);

    // Try to dispatch branded welcome email via configured SMTP
    let emailSent = false;
    try {
      await sendWelcomeNewsletterEmail(email);
      emailSent = true;
    } catch (smtpErr: any) {
      console.warn("SMTP dispatch notice (Email subscribed in database, welcome email skipped if SMTP not configured):", smtpErr.message);
    }

    return {
      success: true,
      emailSent,
      message: emailSent
        ? "Thank you for subscribing! A welcome confirmation email has been sent to your inbox."
        : "Thank you for subscribing! You will receive our latest educational updates and impact reports.",
    };
  } catch (err: any) {
    console.error("Newsletter subscription error:", err);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function deleteSubscriber(id: string) {
  try {
    await query("DELETE FROM newsletter_subscribers WHERE id = ?", [id]);
    syncBackupToSupabase("deleteSubscriber", (sb) =>
      sb.from("newsletter_subscribers").delete().eq("id", id)
    );
    return { success: true };
  } catch (err: any) {
    console.error("Delete subscriber error:", err);
    return { success: false, message: err.message };
  }
}

export async function sendBroadcastNewsletter({
  subject,
  title,
  content,
  testOnly = false,
  testEmail,
}: {
  subject: string;
  title: string;
  content: string;
  testOnly?: boolean;
  testEmail?: string;
}) {
  try {
    let recipients: string[] = [];

    if (testOnly && testEmail) {
      recipients = [testEmail];
    } else {
      const subscribers = await getSubscribersDb();
      recipients = subscribers.filter((s: any) => s.status === "active").map((r: any) => r.email);
    }

    if (recipients.length === 0) {
      return { success: false, message: "No active subscribers found to send message to." };
    }

    const contentHtml = `
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-top: 0;">${title}</h2>
      <div style="color: #334155; line-height: 1.7; font-size: 15px; white-space: pre-wrap; margin: 20px 0;">${content}</div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://gjtfoundation.com" class="btn-primary" style="color: #ffffff; text-decoration: none;">Visit GJTF Website &rarr;</a>
      </div>
    `;

    const html = renderBaseEmailHtml({
      title: subject,
      preheader: title,
      contentHtml,
      isTransactional: false,
      unsubscribeUrl: "https://gjtfoundation.com/unsubscribe",
    });

    // Send in batches or single call
    await sendEmail({
      to: recipients,
      subject,
      html,
    });

    return {
      success: true,
      count: recipients.length,
      message: testOnly
        ? `Test newsletter sent to ${testEmail}!`
        : `Broadcast email successfully delivered to ${recipients.length} subscriber(s)!`,
    };
  } catch (err: any) {
    console.error("Broadcast newsletter error:", err);
    return {
      success: false,
      message: err.message || "Failed to send broadcast newsletter.",
    };
  }
}
