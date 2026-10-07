"use server";

import { z } from "zod";
import { addSubscriberDb, getSubscribersDb, query, syncBackupToSupabase } from "@/lib/db/mysql";
import { sendEmail, sendWelcomeNewsletterEmail } from "@/lib/email/smtp";

const emailSchema = z.string().email("Please provide a valid email address");

export async function subscribeNewsletter(emailInput: string) {
  const parsed = emailSchema.safeParse(emailInput);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please enter a valid email address.",
    };
  }

  const email = parsed.data.trim().toLowerCase();

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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
            .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
            .content { padding: 32px; color: #334155; line-height: 1.6; }
            .content h2 { color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; }
            .body-text { white-space: pre-wrap; margin: 20px 0; }
            .cta-box { text-align: center; margin: 30px 0; }
            .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; }
            .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>Ghais Jhuggi Taleem Foundation</h1>
            </div>
            <div class="content">
              <h2>${title}</h2>
              <div class="body-text">${content}</div>
              <div class="cta-box">
                <a href="https://gjtfoundation.com" class="button">Visit GJTF Website</a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Ghais Jhuggi Taleem Foundation. All rights reserved.</p>
              <p>20-E, Maulana Shaukat Ali Road, Lahore • Toll-Free: 0800-00823</p>
            </div>
          </div>
        </body>
      </html>
    `;

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
