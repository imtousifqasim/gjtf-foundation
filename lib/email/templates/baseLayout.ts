import siteConfig from "@/lib/siteConfig";
import { renderEmailHeader, escapeHtml } from "./EmailHeader";
import { renderEmailFooter } from "./EmailFooter";

export { renderEmailHeader, renderEmailFooter, escapeHtml };

export interface BaseEmailOptions {
  title: string;
  preheader?: string;
  contentHtml: string;
  recipientEmail?: string;
  unsubscribeUrl?: string;
  isTransactional?: boolean;
  showAssistanceBox?: boolean;
  badgeText?: string;
  customBaseUrl?: string;
}

export function renderBaseEmailHtml({
  title,
  preheader = "Ghais Jhuggi Taleem Foundation (GJTF)",
  contentHtml,
  recipientEmail,
  unsubscribeUrl,
  isTransactional = true,
  showAssistanceBox = true,
  badgeText,
  customBaseUrl,
}: BaseEmailOptions): string {
  const headerHtml = renderEmailHeader({
    title,
    preheader,
    badgeText,
    customBaseUrl,
  });

  const footerHtml = renderEmailFooter({
    recipientEmail,
    unsubscribeUrl,
    isTransactional,
    customBaseUrl,
  });

  const assistanceBoxHtml = showAssistanceBox
    ? `
      <!-- DIRECT SUPPORT CALLOUT -->
      <tr>
        <td style="padding: 0 32px 28px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
            <tr>
              <td style="padding: 16px 20px; font-size: 13px; color: #475569; line-height: 1.6;">
                <strong style="color: #0b1536; display: block; margin-bottom: 4px; font-size: 14px;">Need Immediate Assistance?</strong>
                Our team is available ${escapeHtml(siteConfig.supportHours)}.<br/>
                <span style="display: inline-block; margin-top: 4px;">
                  <strong>Phone:</strong> <a href="${escapeHtml(siteConfig.phone1.telLink)}" style="color: #0d5c3a; text-decoration: none; font-weight: 600;">${escapeHtml(siteConfig.phone1.display)}</a>
                  <span style="color: #cbd5e1; padding: 0 6px;">|</span>
                  <strong>WhatsApp:</strong> <a href="${escapeHtml(siteConfig.phone2.telLink)}" style="color: #0d5c3a; text-decoration: none; font-weight: 600;">${escapeHtml(siteConfig.phone2.display)}</a>
                  <span style="color: #cbd5e1; padding: 0 6px;">|</span>
                  <strong>Email:</strong> <a href="${escapeHtml(siteConfig.email.mailtoLink)}" style="color: #0d5c3a; text-decoration: none; font-weight: 600;">${escapeHtml(siteConfig.email.address)}</a>
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
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
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); }
    .btn-primary { background: linear-gradient(135deg, #0d5c3a 0%, #15803d 100%); color: #ffffff !important; display: inline-block; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; text-align: center; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; border-radius: 0 !important; }
      .content-cell { padding: 24px 20px !important; }
      .header-cell { padding: 28px 20px !important; }
      .footer-cell { padding: 28px 20px !important; }
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
          ${headerHtml}

          <!-- MAIN BODY CONTENT -->
          <tr>
            <td class="content-cell" style="padding: 36px 36px 28px; background-color: #ffffff; color: #334155; font-size: 15px; line-height: 1.6;">
              ${contentHtml}
            </td>
          </tr>

          <!-- ASSISTANCE CALLOUT -->
          ${assistanceBoxHtml}

          <!-- BRAND FOOTER -->
          ${footerHtml}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
