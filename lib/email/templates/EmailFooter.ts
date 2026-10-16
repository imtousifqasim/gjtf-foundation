import siteConfig, { getSiteBaseUrl } from "@/lib/siteConfig";
import { escapeHtml } from "./EmailHeader";

export interface EmailFooterOptions {
  recipientEmail?: string;
  unsubscribeUrl?: string;
  isTransactional?: boolean;
  customBaseUrl?: string;
}

/**
 * Modern, clean, and professional email footer.
 * Fully table-based, inline-styled, responsive, and cross-client compatible.
 * Shows social icon images (Instagram, TikTok, YouTube, Facebook), new contact info,
 * support hours, and strictly limits unsubscribe messaging to marketing/newsletter emails.
 */
export function renderEmailFooter(options: EmailFooterOptions = {}): string {
  const {
    recipientEmail,
    unsubscribeUrl,
    isTransactional = true,
    customBaseUrl,
  } = options;

  const currentYear = new Date().getFullYear();
  const assets = siteConfig.getEmailAssets(customBaseUrl);
  const siteUrl = getSiteBaseUrl();

  return `
    <!-- START EMAIL FOOTER -->
    <tr>
      <td class="footer-cell" style="background-color: #070e24; padding: 36px 32px 30px; text-align: center; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.6; border-top: 1px solid #1e293b;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
          
          <!-- SOCIAL ICONS ROW (Instagram, TikTok, YouTube, Facebook) -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto; border-collapse: collapse;">
                <tr>
                  <!-- Instagram -->
                  <td style="padding: 0 8px;" align="center">
                    <a href="${escapeHtml(siteConfig.socials.instagram)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                      <img src="${escapeHtml(assets.instagram)}" alt="Instagram" width="32" height="32" style="display: block; width: 32px; height: 32px; border: 0; outline: none; border-radius: 50%;" />
                    </a>
                  </td>
                  <!-- TikTok -->
                  <td style="padding: 0 8px;" align="center">
                    <a href="${escapeHtml(siteConfig.socials.tiktok)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                      <img src="${escapeHtml(assets.tiktok)}" alt="TikTok" width="32" height="32" style="display: block; width: 32px; height: 32px; border: 0; outline: none; border-radius: 50%;" />
                    </a>
                  </td>
                  <!-- YouTube -->
                  <td style="padding: 0 8px;" align="center">
                    <a href="${escapeHtml(siteConfig.socials.youtube)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                      <img src="${escapeHtml(assets.youtube)}" alt="YouTube" width="32" height="32" style="display: block; width: 32px; height: 32px; border: 0; outline: none; border-radius: 50%;" />
                    </a>
                  </td>
                  <!-- Facebook -->
                  <td style="padding: 0 8px;" align="center">
                    <a href="${escapeHtml(siteConfig.socials.facebook)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                      <img src="${escapeHtml(assets.facebook)}" alt="Facebook" width="32" height="32" style="display: block; width: 32px; height: 32px; border: 0; outline: none; border-radius: 50%;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SUBTLE DIVIDER -->
          <tr>
            <td style="padding-bottom: 20px;">
              <div style="height: 1px; background-color: #1e293b; width: 100%; max-width: 520px; margin: 0 auto;"></div>
            </td>
          </tr>

          <!-- ORGANISATION NAME & TAGLINE -->
          <tr>
            <td align="center" style="padding-bottom: 8px;">
              <a href="${escapeHtml(siteUrl)}" target="_blank" rel="noopener noreferrer" style="color: #f1f5f9; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: -0.2px;">
                ${escapeHtml(siteConfig.organisation)}
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 16px; color: #94a3b8; font-size: 12px; line-height: 1.5; max-width: 480px;">
              ${escapeHtml(siteConfig.tagline)}
            </td>
          </tr>

          <!-- ADDRESS -->
          <tr>
            <td align="center" style="padding-bottom: 12px; color: #cbd5e1; font-size: 12px; line-height: 1.5;">
              <strong style="color: #e2e8f0;">Head Office:</strong> ${escapeHtml(siteConfig.address)}
            </td>
          </tr>

          <!-- CONTACT DETAILS (Phones, Email & Support Hours) -->
          <tr>
            <td align="center" style="padding-bottom: 20px; font-size: 12px; line-height: 1.8; color: #94a3b8;">
              <span style="white-space: nowrap;">
                <strong style="color: #e2e8f0;">Phone:</strong>
                <a href="${escapeHtml(siteConfig.phone1.telLink)}" style="color: #38bdf8; text-decoration: none; font-weight: 600;"> ${escapeHtml(siteConfig.phone1.display)}</a>
              </span>
              <span style="color: #475569; padding: 0 6px;">&bull;</span>
              <span style="white-space: nowrap;">
                <strong style="color: #e2e8f0;">WhatsApp:</strong>
                <a href="${escapeHtml(siteConfig.phone2.telLink)}" style="color: #38bdf8; text-decoration: none; font-weight: 600;"> ${escapeHtml(siteConfig.phone2.display)}</a>
              </span>
              <br/>
              <span style="white-space: nowrap;">
                <strong style="color: #e2e8f0;">Email:</strong>
                <a href="${escapeHtml(siteConfig.email.mailtoLink)}" style="color: #38bdf8; text-decoration: none; font-weight: 600;"> ${escapeHtml(siteConfig.email.address)}</a>
              </span>
              <span style="color: #475569; padding: 0 6px;">&bull;</span>
              <span style="white-space: nowrap; color: #94a3b8;">
                <strong style="color: #e2e8f0;">Hours:</strong> ${escapeHtml(siteConfig.supportHours)}
              </span>
            </td>
          </tr>

          <!-- COPYRIGHT -->
          <tr>
            <td align="center" style="padding-bottom: 12px; font-size: 11px; color: #64748b; letter-spacing: 0.2px;">
              &copy; ${currentYear} ${escapeHtml(siteConfig.legalName)}. ${escapeHtml(siteConfig.status)}.
            </td>
          </tr>

          <!-- CONDITIONAL MARKETING / NEWSLETTER UNSUBSCRIBE LINE (Excluded on transactional) -->
          ${
            !isTransactional && unsubscribeUrl
              ? `<tr>
            <td align="center" style="font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 12px;">
              You received this newsletter because you subscribed to updates on gjtfoundation.com.<br/>
              <a href="${escapeHtml(unsubscribeUrl)}" target="_blank" rel="noopener noreferrer" style="color: #93c5fd; text-decoration: underline; margin-top: 4px; display: inline-block;">
                Unsubscribe or Update Email Preferences
              </a>
            </td>
          </tr>`
              : recipientEmail
              ? `<tr>
            <td align="center" style="font-size: 10px; color: #475569;">
              Delivered securely to ${escapeHtml(recipientEmail)}. Confidential &amp; official foundation notification.
            </td>
          </tr>`
              : ""
          }

        </table>
      </td>
    </tr>
    <!-- END EMAIL FOOTER -->
  `;
}
