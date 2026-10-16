import { renderBaseEmailHtml, escapeHtml } from "./baseLayout";
import siteConfig from "@/lib/siteConfig";

export interface DonorAuthEmailData {
  donorName?: string | null;
  donorEmail: string;
  actionUrl: string;
  expiresInText: string;
  otpCode?: string;
}

export interface PlanEmailData {
  donorName?: string | null;
  donorEmail: string;
  cause: string;
  amount: number | string;
  currency: string;
  nextDueDate: string;
  billingDay: number;
  pauseUntil?: string | null;
}

const SITE_URL = process.env.APP_URL || "https://gjtfoundation.com";

// -------------------------------------------------------------
// 1. Welcome & Set Password Email (for new donors from /donate-now)
// -------------------------------------------------------------
export function createWelcomeSetPasswordEmail(data: DonorAuthEmailData) {
  const name = data.donorName && data.donorName.trim() ? data.donorName : "Generous Donor";
  const subject = "Welcome to GJTF Foundation — Set Your Password to View Your Dashboard";
  const preheader = "Activate your private donor account and view all your pledges, receipts, and impact.";

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Account Ready
      </span>
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Welcome, ${escapeHtml(name)}!
      </h1>
      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
        Thank you for supporting the <strong>Jhuggi Taleemi Project</strong>. We have set up a private, secure donor profile for you so you can track your donations, download tax-deductible receipts, and see how your contribution educates children across nomadic settlements in Pakistan.
      </p>
    </div>

    <!-- Call to Action Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 24px 0; text-align: center; padding: 28px 20px;">
      <tr>
        <td>
          <p style="margin: 0 0 18px; font-size: 14px; color: #475569;">
            Click below to choose your password and activate your dashboard:
          </p>
          <a href="${data.actionUrl}" target="_blank" style="display: inline-block; background: #0a5c36; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(10, 92, 54, 0.25);">
            Set Your Password &amp; Login &rarr;
          </a>
          <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">
            This single-use link will expire in <strong>${escapeHtml(data.expiresInText)}</strong>.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
      If the button above does not work, copy and paste this secure link into your browser:<br/>
      <a href="${data.actionUrl}" style="color: #0a5c36; word-break: break-all; font-size: 12px;">${data.actionUrl}</a>
    </p>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: data.donorEmail,
  });

  const text = `
Welcome, ${name}!

Thank you for supporting the Jhuggi Taleemi Project. We have created a private, secure donor profile for you.

Please set your password by visiting this link (valid for ${data.expiresInText}):
${data.actionUrl}

Once set, you will be able to view all your pledges, download receipts, and view your impact.

Ghais Jhuggi Taleem Foundation
Phone: ${siteConfig.phone1.display} | WhatsApp: ${siteConfig.phone2.display}
  `.trim();

  return { subject, html, text };
}

// -------------------------------------------------------------
// 2. Forgot / Reset Password Email
// -------------------------------------------------------------
export function createPasswordResetEmail(data: DonorAuthEmailData) {
  const name = data.donorName && data.donorName.trim() ? data.donorName : "Donor";
  const subject = "Reset Your Password — GJTF Foundation Donor Portal";
  const preheader = "Use this secure link to reset your GJTF Donor Portal password.";

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Security Notice
      </span>
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Password Reset Request
      </h1>
      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
        Hello ${escapeHtml(name)}, we received a request to reset the password for your GJTF Donor account associated with <strong>${escapeHtml(data.donorEmail)}</strong>.
      </p>
    </div>

    <!-- Call to Action Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 24px 0; text-align: center; padding: 28px 20px;">
      <tr>
        <td>
          <p style="margin: 0 0 18px; font-size: 14px; color: #475569;">
            Click below to choose a new password:
          </p>
          <a href="${data.actionUrl}" target="_blank" style="display: inline-block; background: #0b1536; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(11, 21, 54, 0.25);">
            Reset Password &rarr;
          </a>
          <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">
            This single-use link is valid for <strong>${escapeHtml(data.expiresInText)}</strong>.
          </p>
        </td>
      </tr>
    </table>

    <div style="padding: 16px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
        <strong>Didn't request this?</strong> If you did not make this request, you can safely ignore this email. Your password will remain unchanged and your account is secure.
      </p>
    </div>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: data.donorEmail,
  });

  const text = `
Hello ${name},

We received a request to reset your password for your GJTF Donor Portal account.

Reset your password using this link (valid for ${data.expiresInText}):
${data.actionUrl}

If you did not request this, please ignore this email.

Ghais Jhuggi Taleem Foundation
Helpline: ${siteConfig.phone1.display}
  `.trim();

  return { subject, html, text };
}

// -------------------------------------------------------------
// 3. Password Changed Confirmation Alert
// -------------------------------------------------------------
export function createPasswordChangedEmail(donorEmail: string, donorName?: string | null) {
  const name = donorName && donorName.trim() ? donorName : "Donor";
  const subject = "Security Alert: Your GJTF Password Was Changed";
  const preheader = "Your GJTF Donor Portal account password has been updated.";

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Account Security
      </span>
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Password Updated Successfully
      </h1>
      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
        Hello ${escapeHtml(name)}, this email confirms that your password for <strong>${escapeHtml(donorEmail)}</strong> was changed on <strong>${new Date().toUTCString()}</strong>.
      </p>
    </div>

    <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
      All other active sessions on other devices have been automatically signed out for your protection.
    </p>

    <div style="padding: 16px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px;">
      <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
        <strong>Wasn't you?</strong> If you did not make this change, please call our security helpline at <strong>${siteConfig.phone1.display}</strong> or WhatsApp us at <strong>${siteConfig.phone2.display}</strong> immediately.
      </p>
    </div>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: donorEmail,
  });

  const text = `
Hello ${name},

Your password for your GJTF Donor Portal account was updated on ${new Date().toUTCString()}.

If you did NOT perform this action, please contact us immediately:
Phone: ${siteConfig.phone1.display}
WhatsApp: ${siteConfig.phone2.display}

Ghais Jhuggi Taleem Foundation
  `.trim();

  return { subject, html, text };
}

// -------------------------------------------------------------
// 4. Magic Link / Email OTP Login
// -------------------------------------------------------------
export function createMagicLinkEmail(data: DonorAuthEmailData) {
  const name = data.donorName && data.donorName.trim() ? data.donorName : "Donor";
  const subject = `Your Login Link & OTP Code (${data.otpCode || "Secure Link"}) — GJTF Foundation`;
  const preheader = "Log in to your GJTF Donor Dashboard securely without a password.";

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Instant Login
      </span>
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Hello, ${escapeHtml(name)}!
      </h1>
      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
        You requested a fast, passwordless login to your GJTF Donor Portal.
      </p>
    </div>

    ${
      data.otpCode
        ? `
      <!-- OTP Box -->
      <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 1px; display: block; margin-bottom: 8px;">Your 6-Digit Login Code</span>
        <span style="font-size: 32px; font-family: monospace; font-weight: 800; letter-spacing: 6px; color: #0a5c36;">${data.otpCode}</span>
        <span style="font-size: 12px; color: #94a3b8; display: block; margin-top: 8px;">Valid for 15 minutes</span>
      </div>
    `
        : ""
    }

    <!-- Direct 1-Click Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center; margin: 24px 0;">
      <tr>
        <td>
          <a href="${data.actionUrl}" target="_blank" style="display: inline-block; background: #0a5c36; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px;">
            1-Click Sign In to Dashboard &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: data.donorEmail,
  });

  const text = `
Hello ${name},

Your OTP code is: ${data.otpCode}

Or sign in directly using this link (valid for 15 minutes):
${data.actionUrl}

Ghais Jhuggi Taleem Foundation
  `.trim();

  return { subject, html, text };
}

// -------------------------------------------------------------
// 5. Monthly Plan Due Reminder (3 Days Before Billing Date)
// -------------------------------------------------------------
export function createPlanDueReminderEmail(data: PlanEmailData) {
  const name = data.donorName && data.donorName.trim() ? data.donorName : "Generous Donor";
  const formattedAmt = `${data.currency.toUpperCase()} ${Number(data.amount).toLocaleString()}`;
  const subject = `Upcoming Commitment Reminder: ${formattedAmt} for ${data.cause}`;
  const preheader = `Your monthly educational sponsorship of ${formattedAmt} is scheduled for ${data.nextDueDate}.`;

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Monthly Education Sponsorship
      </span>
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Thank You for Your Continuous Support, ${escapeHtml(name)}!
      </h1>
      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
        This is a gentle reminder that your monthly commitment of <strong>${formattedAmt}</strong> for <strong>${escapeHtml(data.cause)}</strong> is due on <strong>${escapeHtml(data.nextDueDate)}</strong>.
      </p>
    </div>

    <!-- Plan Summary -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="width: 40%; padding: 6px 0; color: #64748b; font-size: 13px;">Cause:</td>
              <td style="width: 60%; padding: 6px 0; font-weight: 700; color: #0b1536; font-size: 13px;">${escapeHtml(data.cause)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Monthly Amount:</td>
              <td style="padding: 6px 0; font-weight: 800; color: #0a5c36; font-size: 15px;">${formattedAmt}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Due Date:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0b1536; font-size: 13px;">${escapeHtml(data.nextDueDate)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center; margin: 24px 0;">
      <tr>
        <td>
          <a href="${SITE_URL}/donor/plans" target="_blank" style="display: inline-block; background: #0a5c36; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px;">
            View or Manage Your Monthly Plan &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: data.donorEmail,
  });

  const text = `
Dear ${name},

This is a reminder that your monthly commitment of ${formattedAmt} for ${data.cause} is scheduled for ${data.nextDueDate}.

You can view and manage your monthly commitment at:
${SITE_URL}/donor/plans

Ghais Jhuggi Taleem Foundation
  `.trim();

  return { subject, html, text };
}
