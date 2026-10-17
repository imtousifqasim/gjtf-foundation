import { sendEmail as sendViaNodemailer } from "./smtp";
import { saveEmailLogDb, getEmailLogByIdDb } from "@/lib/db/mysql";

export interface SendTransactionalEmailOptions {
  to: string;
  recipientName?: string | null;
  emailType: string;
  subject: string;
  html: string;
  text?: string;
  metadata?: any;
}

export interface SendResult {
  success: boolean;
  logId: string;
  error?: string;
}

/**
 * Sends a transactional email asynchronously.
 * Logs to `email_logs` table.
 * Never throws an uncaught error to ensure form submissions are not blocked.
 */
export async function sendTransactionalEmail(options: SendTransactionalEmailOptions): Promise<SendResult> {
  const { to, recipientName, emailType, subject, html, text, metadata } = options;

  let sendSuccess = false;
  let errorMessage: string | null = null;

  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey && resendApiKey.trim() !== "") {
      // 1. Send via Resend API
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey.trim()}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || "Ghais Jhuggi Taleem Foundation <admin@gjtfoundation.com>",
            to: [to],
            reply_to: "admin@gjtfoundation.com",
            subject,
            html,
            text,
          }),
        });

        if (resendRes.ok) {
          sendSuccess = true;
        } else {
          const resendErr = await resendRes.text();
          errorMessage = `Resend API error (${resendRes.status}): ${resendErr}`;
          console.warn(errorMessage, "- Falling back to SMTP...");
          // Fallback to SMTP
          await sendViaNodemailer({ to, subject, html, text });
          sendSuccess = true;
          errorMessage = null;
        }
      } catch (rErr: any) {
        console.warn("Resend attempt failed, falling back to SMTP:", rErr.message);
        await sendViaNodemailer({ to, subject, html, text });
        sendSuccess = true;
      }
    } else {
      // 2. Send via configured SMTP (Hostinger / Gmail / Custom SMTP)
      await sendViaNodemailer({ to, subject, html, text });
      sendSuccess = true;
    }
  } catch (err: any) {
    console.error(`[Email Dispatcher] Failed to send email of type "${emailType}" to ${to}:`, err.message);
    sendSuccess = false;
    errorMessage = err.message || "Failed to deliver email via configured providers";
  }

  // Log to database
  let logId = "";
  try {
    logId = await saveEmailLogDb({
      recipient_name: recipientName,
      recipient_email: to,
      email_type: emailType,
      subject,
      body_html: html,
      body_text: text,
      status: sendSuccess ? "sent" : "failed",
      error_message: errorMessage,
      metadata,
    });
  } catch (dbErr: any) {
    console.error("[Email Dispatcher] Could not log email to database:", dbErr.message);
    logId = "eml_fallback_" + Date.now().toString(36);
  }

  return {
    success: sendSuccess,
    logId,
    error: errorMessage || undefined,
  };
}

/**
 * Retries sending an existing failed email log
 */
export async function retryEmailLog(logId: string): Promise<{ success: boolean; message: string }> {
  try {
    const log = await getEmailLogByIdDb(logId);
    if (!log) {
      return { success: false, message: "Email record not found." };
    }

    const res = await sendTransactionalEmail({
      to: log.recipient_email,
      recipientName: log.recipient_name,
      emailType: log.email_type,
      subject: log.subject,
      html: log.body_html,
      text: log.body_text,
      metadata: { ...log.metadata, retriedFrom: logId, retriedAt: new Date().toISOString() },
    });

    if (res.success) {
      // Update the original log status to 'sent'
      await saveEmailLogDb({
        id: log.id,
        recipient_name: log.recipient_name,
        recipient_email: log.recipient_email,
        email_type: log.email_type,
        subject: log.subject,
        body_html: log.body_html,
        body_text: log.body_text,
        status: "sent",
        error_message: null,
      });

      return { success: true, message: "Email re-sent successfully!" };
    } else {
      await saveEmailLogDb({
        id: log.id,
        recipient_name: log.recipient_name,
        recipient_email: log.recipient_email,
        email_type: log.email_type,
        subject: log.subject,
        body_html: log.body_html,
        body_text: log.body_text,
        status: "failed",
        error_message: res.error || "Retry failed to send email.",
      });
      return { success: false, message: res.error || "Retry failed to send email." };
    }
  } catch (err: any) {
    console.error("Retry email error:", err);
    return { success: false, message: err.message || "An unexpected error occurred while retrying." };
  }
}
