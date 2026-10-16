import { renderBaseEmailHtml, escapeHtml } from "./baseLayout";

export interface DonationEmailData {
  pledgeId: string;
  donorName?: string | null;
  donorEmail: string;
  donorPhone?: string | null;
  amount: number | string;
  currency: string;
  cause: string;
  frequency?: string;
  donationType?: string;
  createdAt?: string;
  customMessage?: string | null;
  unsubscribeToken?: string;
}

export function formatCurrencyAmount(amount: number | string, currency: string = "PKR"): string {
  const num = Number(amount) || 0;
  return `${currency.toUpperCase()} ${num.toLocaleString()}`;
}

export function getBankDetailsHtml(settings?: {
  bank_title?: string;
  bank_name?: string;
  account_number?: string;
  iban?: string;
  branch_name?: string;
  swift_code?: string;
  doorstep_phone?: string;
  jazzcash_number?: string;
  easypaisa_number?: string;
}): string {
  const title = settings?.bank_title || "Ghais Jhuggi Taleem Foundation";
  const bank = settings?.bank_name || "Meezan Bank Limited";
  const acc = settings?.account_number || "02010103847291";
  const iban = settings?.iban || "PK72MEZN0002010103847291";
  const branch = settings?.branch_name || "Model Town Link Road Branch Lahore";
  const swift = settings?.swift_code || "MEZNPKKA";
  const doorstep = settings?.doorstep_phone || "0800-00823";
  const jazz = settings?.jazzcash_number || "0303-3934771";
  const easy = settings?.easypaisa_number || "0328-6477314";

  return `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; margin: 18px 0; overflow: hidden;">
    <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
      <td colspan="2" style="padding: 12px 18px; font-weight: 700; color: #0b1536; font-size: 13px;">
        Official Bank &amp; Payment Accounts (Pakistan)
      </td>
    </tr>
    <tr>
      <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">
        <strong style="color: #0b1536; display: block; margin-bottom: 2px;">Bank Transfer (${bank}):</strong>
        Account Title: <strong>${title}</strong><br/>
        Account Number: <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${acc}</code><br/>
        IBAN: <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${iban}</code><br/>
        Branch: ${branch} (Swift: ${swift})
      </td>
    </tr>
    <tr>
      <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">
        <strong style="color: #0b1536; display: block; margin-bottom: 2px;">Doorstep Cash Collection:</strong>
        Call our nationwide toll-free helpline: <strong style="color: #0a5c36;">${doorstep}</strong> (Toll-Free, 9 AM – 6 PM PKT)
      </td>
    </tr>
    <tr>
      <td style="padding: 14px 18px; font-size: 13px; color: #334155;">
        <strong style="color: #0b1536; display: block; margin-bottom: 2px;">Mobile Wallets (JazzCash &amp; EasyPaisa):</strong>
        Account Title: <strong>Tousif Qasim (Chairman GJTF)</strong><br/>
        JazzCash: <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${jazz}</code> | 
        EasyPaisa: <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${easy}</code>
      </td>
    </tr>
  </table>
  `;
}

const BANK_DETAILS_HTML = getBankDetailsHtml();

const BANK_DETAILS_TEXT = `
Official Bank Details:
Meezan Bank Limited
Account Title: Ghais Jhuggi Taleem Foundation
Account No: 02010103847291
IBAN: PK72MEZN0002010103847291
Branch: Model Town Link Road Branch Lahore (Swift: MEZNPKKA)

Doorstep Cash / Cheque Collection Helpline: 0800-00823 (Toll-Free)
Mobile Wallets: 0303-3934771 / 0328-6477314
`;

// -------------------------------------------------------------
// 1. Donation Received (Pledge Acknowledgment)
// -------------------------------------------------------------
export function createDonationReceivedEmail(data: DonationEmailData) {
  const donorDisplayName = data.donorName && data.donorName.trim() ? data.donorName : "Generous Donor";
  const formattedAmt = formatCurrencyAmount(data.amount, data.currency);
  const subject = `Pledge Acknowledged: ${formattedAmt} to GJTF Foundation (#${data.pledgeId})`;
  const preheader = `Thank you for your generous pledge of ${formattedAmt} for ${data.cause}.`;

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Pledge Recorded
      </span>
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Thank You, ${escapeHtml(donorDisplayName)}!
      </h1>
      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
        Your noble intention to support <strong>${escapeHtml(data.cause)}</strong> has been recorded. 
        Your generosity directly funds education, books, uniforms, and warm meals for children living in nomad settlements.
      </p>
    </div>

    <!-- Details Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
          <strong style="color: #0b1536; font-size: 14px;">Donation Pledge Details</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td class="detail-label" style="width: 40%; padding: 6px 0; color: #64748b; font-size: 13px;">Reference ID:</td>
              <td class="detail-val" style="width: 60%; padding: 6px 0; font-weight: 700; color: #0b1536; font-size: 13px;">#${escapeHtml(data.pledgeId)}</td>
            </tr>
            <tr>
              <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">Amount:</td>
              <td class="detail-val" style="padding: 6px 0; font-weight: 800; color: #166534; font-size: 16px;">${escapeHtml(formattedAmt)}</td>
            </tr>
            <tr>
              <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">Cause / Project:</td>
              <td class="detail-val" style="padding: 6px 0; font-weight: 600; color: #0f172a; font-size: 13px;">${escapeHtml(data.cause)}</td>
            </tr>
            ${
              data.donationType
                ? `<tr>
                    <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">Type:</td>
                    <td class="detail-val" style="padding: 6px 0; color: #0f172a; font-size: 13px;">${escapeHtml(data.donationType)}</td>
                  </tr>`
                : ""
            }
            ${
              data.frequency
                ? `<tr>
                    <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">Frequency:</td>
                    <td class="detail-val" style="padding: 6px 0; color: #0f172a; font-size: 13px; text-transform: capitalize;">${escapeHtml(data.frequency)}</td>
                  </tr>`
                : ""
            }
            <tr>
              <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">Date:</td>
              <td class="detail-val" style="padding: 6px 0; color: #0f172a; font-size: 13px;">${new Date().toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px; color: #334155; font-size: 14px; line-height: 1.6;">
      If you chose manual bank transfer or mobile wallet, please send your transfer reference or screenshot to 
      <a href="https://wa.me/923033934771" style="color: #2563eb; text-decoration: none; font-weight: bold;">WhatsApp (+92 303 3934771)</a> 
      along with reference <strong>#${escapeHtml(data.pledgeId)}</strong> so we can issue your official tax-exempt receipt.
    </p>

    ${BANK_DETAILS_HTML}

    <p style="margin: 20px 0 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      May Almighty reward your noble contribution in abundance.<br/>
      <strong>Finance & Accounts Directorate</strong><br/>
      Ghais Jhuggi Taleem Foundation
    </p>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: data.donorEmail,
  });

  const text = `
Dear ${donorDisplayName},

Thank you for your generous pledge to Ghais Jhuggi Taleem Foundation (GJTF).

Pledge Details:
- Reference ID: #${data.pledgeId}
- Amount: ${formattedAmt}
- Cause: ${data.cause}
${data.donationType ? `- Type: ${data.donationType}\n` : ""}${data.frequency ? `- Frequency: ${data.frequency}\n` : ""}- Date: ${new Date().toLocaleDateString()}

If you are completing via bank transfer, please find account details below:
${BANK_DETAILS_TEXT}

Please WhatsApp your payment confirmation to +92 303 3934771 or reply directly to this email with reference #${data.pledgeId}.

With heartfelt gratitude,
Finance & Accounts Directorate
Ghais Jhuggi Taleem Foundation
https://gjtfoundation.com
  `.trim();

  return { subject, html, text };
}

// -------------------------------------------------------------
// 2. Donation Completed (Official Receipt)
// -------------------------------------------------------------
export function createDonationCompletedEmail(data: DonationEmailData) {
  const donorDisplayName = data.donorName && data.donorName.trim() ? data.donorName : "Generous Donor";
  const formattedAmt = formatCurrencyAmount(data.amount, data.currency);
  const receiptUrl = `https://gjtf-foundation.vercel.app/receipt/${encodeURIComponent(data.pledgeId)}`;
  const subject = `Official Donation Receipt: ${formattedAmt} received - Thank You, ${donorDisplayName}!`;
  const preheader = `Your payment of ${formattedAmt} has been verified and completed. View your official receipt.`;

  const contentHtml = `
    <div style="margin-bottom: 24px; text-align: left;">
      <span style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Payment Verified • Official Receipt
      </span>
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        JazakAllah Khair, ${escapeHtml(donorDisplayName)}!
      </h1>
      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
        We gratefully acknowledge receipt of your donation of <strong>${escapeHtml(formattedAmt)}</strong> towards 
        <strong>${escapeHtml(data.cause)}</strong>. Your support provides clean education, dignity, and a future to nomadic children.
      </p>
    </div>

    <!-- Official Receipt Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 2px solid #22c55e; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
      <tr style="background-color: #f0fdf4; border-bottom: 1px solid #bbf7d0;">
        <td style="padding: 16px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #166534; font-weight: 700;">Official Tax-Exempt Receipt</span>
                <div style="font-size: 16px; font-weight: 800; color: #0b1536;">GJTF-REC-${escapeHtml(data.pledgeId.slice(-8).toUpperCase())}</div>
              </td>
              <td align="right">
                <span style="display: inline-block; background: #22c55e; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">PAID</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td class="detail-label" style="width: 40%; padding: 6px 0; color: #64748b; font-size: 13px;">Donor Name:</td>
              <td class="detail-val" style="width: 60%; padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 13px;">${escapeHtml(donorDisplayName)}</td>
            </tr>
            <tr>
              <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">Amount Received:</td>
              <td class="detail-val" style="padding: 6px 0; font-weight: 800; color: #15803d; font-size: 18px;">${escapeHtml(formattedAmt)}</td>
            </tr>
            <tr>
              <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">Allocated Cause:</td>
              <td class="detail-val" style="padding: 6px 0; font-weight: 600; color: #0f172a; font-size: 13px;">${escapeHtml(data.cause)}</td>
            </tr>
            <tr>
              <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">Pledge Reference:</td>
              <td class="detail-val" style="padding: 6px 0; color: #0f172a; font-size: 13px;">#${escapeHtml(data.pledgeId)}</td>
            </tr>
            <tr>
              <td class="detail-label" style="padding: 6px 0; color: #64748b; font-size: 13px;">Date Cleared:</td>
              <td class="detail-val" style="padding: 6px 0; color: #0f172a; font-size: 13px;">${new Date().toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- View / Download Receipt Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${receiptUrl}" class="btn-primary" target="_blank" style="color: #ffffff; text-decoration: none;">
        View &amp; Print Official Receipt &rarr;
      </a>
    </div>

    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      Thank you for being the beacon of hope for our students.<br/>
      <strong>Finance & Accounts Directorate</strong><br/>
      Ghais Jhuggi Taleem Foundation
    </p>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: data.donorEmail,
  });

  const text = `
Dear ${donorDisplayName},

JazakAllah Khair! We gratefully acknowledge receipt of your donation.

Receipt Summary:
- Receipt Number: GJTF-REC-${data.pledgeId.slice(-8).toUpperCase()}
- Reference ID: #${data.pledgeId}
- Donor Name: ${donorDisplayName}
- Amount Received: ${formattedAmt}
- Cause: ${data.cause}
- Date: ${new Date().toLocaleDateString()}
- Status: COMPLETED / VERIFIED

You can view and print your official online receipt at:
${receiptUrl}

Thank you for making a permanent difference in the lives of nomadic children across Pakistan.

Warm regards,
Finance & Accounts Directorate
Ghais Jhuggi Taleem Foundation
https://gjtfoundation.com
  `.trim();

  return { subject, html, text };
}

// -------------------------------------------------------------
// 3. Donation Pending (Instructions for Completion)
// -------------------------------------------------------------
export function createDonationPendingEmail(data: DonationEmailData) {
  const donorDisplayName = data.donorName && data.donorName.trim() ? data.donorName : "Generous Donor";
  const formattedAmt = formatCurrencyAmount(data.amount, data.currency);
  const subject = `Action Needed: Complete Your Donation Pledge of ${formattedAmt} (#${data.pledgeId})`;
  const preheader = `Payment instructions and account details to complete your pledge for ${data.cause}.`;

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Payment Pending Verification
      </span>
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Hello, ${escapeHtml(donorDisplayName)}
      </h1>
      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
        We noticed your pledged donation of <strong>${escapeHtml(formattedAmt)}</strong> for 
        <strong>${escapeHtml(data.cause)}</strong> is currently awaiting transfer verification. 
        Below are our official accounts and instructions to complete your contribution smoothly.
      </p>
    </div>

    ${BANK_DETAILS_HTML}

    <!-- How to Complete -->
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #1e3a8a;">How to Confirm Payment:</h3>
      <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e293b; line-height: 1.6;">
        <li>Transfer <strong>${escapeHtml(formattedAmt)}</strong> to any of the accounts above.</li>
        <li>Send a screenshot or transaction ID to <a href="https://wa.me/923033934771" style="color: #2563eb; font-weight: bold;">WhatsApp (+92 303 3934771)</a> or reply to this email.</li>
        <li>Mention your pledge reference: <strong>#${escapeHtml(data.pledgeId)}</strong>.</li>
      </ol>
    </div>

    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      Thank you for your generous support of slum education.<br/>
      <strong>Finance & Accounts Team</strong><br/>
      Ghais Jhuggi Taleem Foundation
    </p>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: data.donorEmail,
  });

  const text = `
Dear ${donorDisplayName},

We are following up regarding your pledged donation of ${formattedAmt} for "${data.cause}" (Reference #${data.pledgeId}).

To complete your donation, please transfer the pledged amount to our official accounts:
${BANK_DETAILS_TEXT}

After making the transfer, please reply to this email or send the transaction receipt on WhatsApp (+92 303 3934771) with reference #${data.pledgeId}.

With sincere appreciation,
Finance & Accounts Directorate
Ghais Jhuggi Taleem Foundation
https://gjtfoundation.com
  `.trim();

  return { subject, html, text };
}

// -------------------------------------------------------------
// 4. Donation Failed / Incomplete
// -------------------------------------------------------------
export function createDonationFailedEmail(data: DonationEmailData) {
  const donorDisplayName = data.donorName && data.donorName.trim() ? data.donorName : "Generous Donor";
  const formattedAmt = formatCurrencyAmount(data.amount, data.currency);
  const donateUrl = "https://gjtf-foundation.vercel.app/donate-now";
  const subject = `Notice: Unable to Process Donation Pledge (${formattedAmt}) - GJTF`;
  const preheader = `We could not complete your donation pledge #${data.pledgeId}. You can try again.`;

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Donation Unsuccessful
      </span>
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Hello, ${escapeHtml(donorDisplayName)}
      </h1>
      <p style="margin: 0 0 16px; color: #334155; font-size: 15px; line-height: 1.6;">
        We were unable to complete or verify your pledge of <strong>${escapeHtml(formattedAmt)}</strong> 
        (Reference <strong>#${escapeHtml(data.pledgeId)}</strong>) for <em>${escapeHtml(data.cause)}</em>.
      </p>
      <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
        This can happen due to a network timeout, cancellation, or unverified bank receipt. 
        Your intention to support our nomadic students is deeply valued, and we invite you to re-submit or contact us if you need help.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="${donateUrl}" class="btn-primary" target="_blank" style="color: #ffffff; text-decoration: none;">
        Try Donating Again &rarr;
      </a>
    </div>

    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      Need assistance? Reply directly to this email or call us toll-free at <strong>0800-00823</strong>.<br/>
      Ghais Jhuggi Taleem Foundation
    </p>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: data.donorEmail,
  });

  const text = `
Dear ${donorDisplayName},

We were unable to verify or complete your recent donation pledge of ${formattedAmt} (Reference #${data.pledgeId}) for "${data.cause}".

If this was unexpected, you can easily retry your donation at:
${donateUrl}

If you have already transferred the amount or need assistance, please reply to this email or reach us on WhatsApp at +92 303 3934771.

Warm regards,
Donor Support Team
Ghais Jhuggi Taleem Foundation
https://gjtfoundation.com
  `.trim();

  return { subject, html, text };
}

// -------------------------------------------------------------
// 5. Donation Reminder (Automated / Admin Triggered)
// -------------------------------------------------------------
export function createDonationReminderEmail(data: DonationEmailData) {
  const donorDisplayName = data.donorName && data.donorName.trim() ? data.donorName : "Generous Donor";
  const formattedAmt = formatCurrencyAmount(data.amount, data.currency);
  const unsubscribeUrl = data.unsubscribeToken
    ? `https://gjtf-foundation.vercel.app/api/donations/unsubscribe-reminder?token=${encodeURIComponent(data.unsubscribeToken)}`
    : undefined;

  const subject = `Friendly Reminder: Your Donation Pledge to GJTF Foundation (${formattedAmt})`;
  const preheader = `A gentle reminder regarding your pledge #${data.pledgeId} to support ${data.cause}.`;

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #eff6ff; color: #1e40af; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Pledge Reminder
      </span>
      <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #0b1536; line-height: 1.3;">
        Hello, ${escapeHtml(donorDisplayName)}
      </h1>
      <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
        This is a friendly, non-pushy follow-up regarding your pledge of <strong>${escapeHtml(formattedAmt)}</strong> 
        to support <strong>${escapeHtml(data.cause)}</strong> (Reference <strong>#${escapeHtml(data.pledgeId)}</strong>).
      </p>
    </div>

    ${
      data.customMessage
        ? `<div style="background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 24px;">
            <strong style="color: #0b1536; font-size: 13px; display: block; margin-bottom: 4px;">Message from GJTF Team:</strong>
            <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">${escapeHtml(data.customMessage)}</p>
          </div>`
        : ""
    }

    <p style="margin: 0 0 12px; color: #334155; font-size: 14px; line-height: 1.6;">
      Every rupee helps us provide shelter classrooms, textbooks, and nourishing meals to nomadic children. 
      You can complete your pledge using our official accounts below:
    </p>

    ${BANK_DETAILS_HTML}

    <p style="margin: 16px 0 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      Already sent your payment? Please reply to this email or message us on WhatsApp (+92 303 3934771) with your transfer slip so we can verify and issue your receipt.<br/><br/>
      With sincere appreciation,<br/>
      <strong>Finance &amp; Community Care Team</strong><br/>
      Ghais Jhuggi Taleem Foundation
    </p>
  `;

  const html = renderBaseEmailHtml({
    title: subject,
    preheader,
    contentHtml,
    recipientEmail: data.donorEmail,
    unsubscribeUrl,
  });

  const text = `
Dear ${donorDisplayName},

This is a gentle reminder regarding your pledge of ${formattedAmt} for "${data.cause}" (Reference #${data.pledgeId}) at Ghais Jhuggi Taleem Foundation.

${data.customMessage ? `Message from GJTF Team:\n${data.customMessage}\n\n` : ""}Official Payment Details:
${BANK_DETAILS_TEXT}

Once transferred, please WhatsApp your slip to +92 303 3934771 or reply directly to this email.

If you wish to stop reminders for this pledge, please visit:
${unsubscribeUrl || "https://gjtf-foundation.vercel.app"}

With warm regards,
Finance & Accounts Directorate
Ghais Jhuggi Taleem Foundation
https://gjtfoundation.com
  `.trim();

  return { subject, html, text };
}
