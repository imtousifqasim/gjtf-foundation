export interface BaseEmailOptions {
  title: string;
  preheader?: string;
  contentHtml: string;
  recipientEmail?: string;
  unsubscribeUrl?: string;
}

export function renderBaseEmailHtml({
  title,
  preheader = "Ghais Jhuggi Taleem Foundation (GJTF)",
  contentHtml,
  recipientEmail,
  unsubscribeUrl,
}: BaseEmailOptions): string {
  const logoUrl = "https://gjtf-foundation.vercel.app/images/Ghais-Jhuggi-Taleeem-Foundation-Logo.png";
  const siteUrl = "https://gjtfoundation.com";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); }
    .btn-primary { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); color: #ffffff !important; display: inline-block; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; text-align: center; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; border-radius: 0 !important; }
      .content-cell { padding: 24px 18px !important; }
      .header-cell { padding: 24px 18px !important; }
      .footer-cell { padding: 24px 18px !important; }
      .detail-label { width: 100% !important; display: block !important; padding-bottom: 2px !important; }
      .detail-val { width: 100% !important; display: block !important; padding-bottom: 12px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 20px 0; background-color: #f1f5f9;">
  <!-- Preview Text Spacers -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    ${escapeHtml(preheader)} &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 10px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td class="header-cell" style="background: linear-gradient(135deg, #0b1536 0%, #1e3a8a 100%); padding: 32px 36px 28px; text-align: center; border-bottom: 3px solid #2563eb;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}" target="_blank" style="text-decoration: none;">
                      <img src="${logoUrl}" alt="Ghais Jhuggi Taleem Foundation" width="220" style="max-width: 220px; height: auto; display: block; margin: 0 auto 12px;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span style="display: inline-block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #93c5fd; background: rgba(255, 255, 255, 0.12); padding: 4px 14px; border-radius: 999px;">
                      Jhuggi Taleemi Project • Established 2014
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN BODY CONTENT -->
          <tr>
            <td class="content-cell" style="padding: 36px 36px 28px; background-color: #ffffff; color: #334155; font-size: 15px; line-height: 1.6;">
              ${contentHtml}
            </td>
          </tr>

          <!-- HELP / DIRECT ASSISTANCE CALLOUT -->
          <tr>
            <td style="padding: 0 36px 28px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 22px;">
                <tr>
                  <td style="font-size: 13px; color: #475569; line-height: 1.5;">
                    <strong style="color: #0b1536; display: block; margin-bottom: 4px;">Need Immediate Assistance?</strong>
                    Our donor & volunteer support team is available Mon–Sat (9 AM – 6 PM PKT).<br/>
                    <strong>Phone / WhatsApp:</strong> <a href="tel:+923033934771" style="color: #2563eb; text-decoration: none;">+92 303 3934771</a> | <strong>Toll-Free:</strong> 0800-00823<br/>
                    <strong>Email:</strong> <a href="mailto:jhuggitaleemiproject@gmail.com" style="color: #2563eb; text-decoration: none;">jhuggitaleemiproject@gmail.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BRAND FOOTER -->
          <tr>
            <td class="footer-cell" style="background-color: #0b1536; padding: 32px 36px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6; border-top: 1px solid #1e293b;">
              <!-- Social Links -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin-bottom: 16px;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="https://facebook.com/gjtfoundation" target="_blank" style="color: #cbd5e1; text-decoration: none; font-weight: 600; font-size: 12px;">Facebook</a>
                  </td>
                  <td style="color: #475569;">•</td>
                  <td style="padding: 0 8px;">
                    <a href="https://instagram.com/gjtfoundation" target="_blank" style="color: #cbd5e1; text-decoration: none; font-weight: 600; font-size: 12px;">Instagram</a>
                  </td>
                  <td style="color: #475569;">•</td>
                  <td style="padding: 0 8px;">
                    <a href="https://youtube.com/@gjtfoundation" target="_blank" style="color: #cbd5e1; text-decoration: none; font-weight: 600; font-size: 12px;">YouTube</a>
                  </td>
                  <td style="color: #475569;">•</td>
                  <td style="padding: 0 8px;">
                    <a href="https://linkedin.com/company/gjtfoundation" target="_blank" style="color: #cbd5e1; text-decoration: none; font-weight: 600; font-size: 12px;">LinkedIn</a>
                  </td>
                </tr>
              </table>

              <!-- Organization Info -->
              <p style="margin: 0 0 8px; color: #e2e8f0; font-weight: 600; font-size: 13px;">
                Ghais Jhuggi Taleem Foundation (GJTF)
              </p>
              <p style="margin: 0 0 12px; color: #94a3b8; font-size: 11px;">
                Pakistan's largest educational and skill development movement for over 20 million nomadic communities.<br/>
                Head Office: 23-Civic Centre, Johar Town, Lahore, Pakistan • Registered Non-Profit NGO.
              </p>

              <!-- Anti-Spam / Opt-Out Disclaimer -->
              <p style="margin: 0; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 12px;">
                You received this email because you registered as a volunteer, pledged a donation, or contacted GJTF Foundation${recipientEmail ? ` at ${escapeHtml(recipientEmail)}` : ""}.
                ${
                  unsubscribeUrl
                    ? `<br/><a href="${unsubscribeUrl}" target="_blank" style="color: #93c5fd; text-decoration: underline; margin-top: 6px; display: inline-block;">Unsubscribe / Stop Reminders</a>`
                    : ""
                }
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
