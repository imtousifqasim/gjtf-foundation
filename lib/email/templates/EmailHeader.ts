import siteConfig, { getSiteBaseUrl } from "@/lib/siteConfig";

export interface EmailHeaderOptions {
  title?: string;
  preheader?: string;
  badgeText?: string;
  customBaseUrl?: string;
}

export function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Modern, clean, brand-aligned email header.
 * Uses fixed-width 180px PNG logo, absolute HTTPS URL, table-based layout,
 * and robust fallbacks so it renders beautifully across Outlook, Gmail, Apple Mail, and mobile clients.
 */
export function renderEmailHeader(options: EmailHeaderOptions = {}): string {
  const { badgeText = "Jhuggi Taleemi Project • Established 2014", customBaseUrl } = options;
  const assets = siteConfig.getEmailAssets(customBaseUrl);
  const siteUrl = getSiteBaseUrl();

  return `
    <!-- START EMAIL HEADER -->
    <tr>
      <td class="header-cell" style="background-color: #0b1536; background: linear-gradient(135deg, #070e24 0%, #0b1536 50%, #102a5c 100%); padding: 36px 32px 30px; text-align: center; border-bottom: 3px solid #0d5c3a;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
          <tr>
            <td align="center" style="padding-bottom: 14px;">
              <a href="${escapeHtml(siteUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                <!-- High-contrast crisp white card so logo colors & typography never merge with header background -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; margin: 0 auto; box-shadow: 0 4px 14px rgba(0,0,0,0.25); border-collapse: collapse;">
                  <tr>
                    <td align="center" style="padding: 10px 22px; background-color: #ffffff; border-radius: 12px;">
                      <img src="${escapeHtml(assets.logo)}"
                           alt="Ghais Jhuggi Taleem Foundation"
                           width="180"
                           style="display: block; width: 180px; max-width: 180px; height: auto; border: 0; outline: none; text-decoration: none; margin: 0 auto;" />
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
          ${
            badgeText
              ? `<tr>
            <td align="center">
              <span style="display: inline-block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; color: #a7f3d0; background-color: rgba(13, 92, 58, 0.45); border: 1px solid rgba(52, 211, 153, 0.3); padding: 5px 16px; border-radius: 999px;">
                ${escapeHtml(badgeText)}
              </span>
            </td>
          </tr>`
              : ""
          }
        </table>
      </td>
    </tr>
    <!-- END EMAIL HEADER -->
  `;
}
