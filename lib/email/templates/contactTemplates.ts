import { renderBaseEmailHtml, escapeHtml } from "./baseLayout";

export interface ContactReplyEmailOptions {
  recipientName: string;
  recipientEmail: string;
  subject: string;
  replyBody: string;
  originalMessage: {
    senderName: string;
    subject: string;
    message: string;
    createdAt: string;
  };
}

export function createContactReplyEmail({
  recipientName,
  recipientEmail,
  subject,
  replyBody,
  originalMessage,
}: ContactReplyEmailOptions): { subject: string; html: string; text: string } {
  const safeBody = escapeHtml(replyBody).replace(/\n/g, "<br/>");
  const safeOriginal = escapeHtml(originalMessage.message).replace(/\n/g, "<br/>");
  const safeDate = new Date(originalMessage.createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const contentHtml = `
    <div style="font-size: 15px; color: #1e293b; line-height: 1.6; margin-bottom: 24px;">
      <p style="margin-top: 0;">Dear <strong>${escapeHtml(recipientName)}</strong>,</p>
      <div style="margin: 16px 0; color: #0f172a; line-height: 1.6;">${safeBody}</div>
      <p style="margin-bottom: 0;">With warm regards,<br/><strong>GJTF Support & Engagement Team</strong><br/>Ghais Jhuggi Taleem Foundation</p>
    </div>

    <!-- QUOTED ORIGINAL INQUIRY -->
    <div style="margin-top: 32px; padding: 16px 20px; background-color: #f8fafc; border-left: 4px solid #0d5c3a; border-radius: 8px; font-size: 13px; color: #475569; line-height: 1.5;">
      <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">--- Original Inquiry ---</div>
      <div><strong>From:</strong> ${escapeHtml(originalMessage.senderName)} (${escapeHtml(recipientEmail)})</div>
      <div><strong>Date:</strong> ${escapeHtml(safeDate)}</div>
      <div><strong>Subject:</strong> ${escapeHtml(originalMessage.subject)}</div>
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; color: #334155;">
        ${safeOriginal}
      </div>
    </div>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader: `Reply regarding: ${originalMessage.subject}`,
    contentHtml,
    recipientEmail,
    isTransactional: true,
    showAssistanceBox: true,
  });

  const text = `Dear ${recipientName},\n\n${replyBody}\n\nWith warm regards,\nGJTF Support & Engagement Team\nGhais Jhuggi Taleem Foundation\n\n--- Original Inquiry ---\nFrom: ${originalMessage.senderName} (${recipientEmail})\nDate: ${safeDate}\nSubject: ${originalMessage.subject}\n\n${originalMessage.message}`;

  return { subject, html, text };
}
