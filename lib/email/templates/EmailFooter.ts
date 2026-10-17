import siteConfig, { getSiteBaseUrl } from "@/lib/siteConfig";
import { escapeHtml } from "./EmailHeader";
import { SiteSettingsData } from "@/lib/siteSettingsConstants";

export interface EmailFooterOptions {
  recipientEmail?: string;
  unsubscribeUrl?: string;
  isTransactional?: boolean;
  customBaseUrl?: string;
  settings?: SiteSettingsData | null;
}

/**
 * Modern, clean, and professional email footer.
 * Fully table-based, inline-styled, responsive, and cross-client compatible.
 * Features crisp white circular badges for social icons (Instagram, TikTok, YouTube, Facebook),
 * dynamic contact info & leadership signature from Admin Settings, and strict marketing privacy controls.
 */
export function renderEmailFooter(options: EmailFooterOptions = {}): string {
  const {
    recipientEmail,
    unsubscribeUrl,
    isTransactional = true,
    customBaseUrl,
    settings,
  } = options;

  const currentYear = new Date().getFullYear();
  const assets = siteConfig.getEmailAssets(customBaseUrl);
  const siteUrl = getSiteBaseUrl();

  const showSocials = settings ? settings.show_socials_in_receipts !== false && settings.show_socials_in_receipts !== (0 as any) : true;
  const showChairman = settings ? settings.show_chairman_in_receipts !== false && settings.show_chairman_in_receipts !== (0 as any) : true;
  const showPhone = settings ? settings.show_phone_in_receipts !== false && settings.show_phone_in_receipts !== (0 as any) : true;
  const showWhatsapp = settings ? settings.show_whatsapp_in_receipts !== false && settings.show_whatsapp_in_receipts !== (0 as any) : true;
  const showEmail = settings ? settings.show_email_in_receipts !== false && settings.show_email_in_receipts !== (0 as any) : true;
  const showAddress = settings ? settings.show_address_in_receipts !== false && settings.show_address_in_receipts !== (0 as any) : true;

  const chairmanName = settings?.chairman_name || "Mubashir Hussain Chand";
  const chairmanTitle = settings?.chairman_title || "Chairman, Ghais Jhuggi Taleem Foundation";

  const phoneDisplay = settings?.telephone || settings?.mobile || siteConfig.phone1.display;
  const phoneTel = (phoneDisplay || "").replace(/[^\d+]/g, "");
  const whatsappDisplay = settings?.whatsapp || siteConfig.phone2.display;
  const whatsappTel = (whatsappDisplay || "").replace(/[^\d+]/g, "");
  const emailDisplay = settings?.email || siteConfig.email.address;
  const addressDisplay = settings?.head_office_address || siteConfig.address;

  const instagramUrl = settings?.instagram_url || siteConfig.socials.instagram;
  const tiktokUrl = settings?.tiktok_url || siteConfig.socials.tiktok;
  const youtubeUrl = settings?.youtube_url || siteConfig.socials.youtube;
  const facebookUrl = settings?.facebook_url || siteConfig.socials.facebook;

  return `
    <!-- START EMAIL FOOTER -->
    <tr>
      <td class="footer-cell" style="background-color: #070e24; padding: 36px 32px 30px; text-align: center; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.6; border-top: 1px solid #1e293b;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
          
          ${
            showSocials
              ? `<!-- SOCIAL ICONS ROW (Crisp White Circular Badges to prevent color merging) -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto; border-collapse: collapse;">
                <tr>
                  <!-- Instagram -->
                  <td style="padding: 0 6px;" align="center">
                    <a href="${escapeHtml(instagramUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="38" height="38" style="background-color: #ffffff; border-radius: 50%; width: 38px; height: 38px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border-collapse: collapse; margin: 0 auto;">
                        <tr>
                          <td align="center" valign="middle" style="width: 38px; height: 38px; padding: 0; background-color: #ffffff; border-radius: 50%; text-align: center;">
                            <img src="${escapeHtml(assets.instagram)}" alt="Instagram" width="22" height="22" style="display: block; width: 22px; height: 22px; border: 0; outline: none; margin: 0 auto;" />
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                  <!-- TikTok -->
                  <td style="padding: 0 6px;" align="center">
                    <a href="${escapeHtml(tiktokUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="38" height="38" style="background-color: #ffffff; border-radius: 50%; width: 38px; height: 38px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border-collapse: collapse; margin: 0 auto;">
                        <tr>
                          <td align="center" valign="middle" style="width: 38px; height: 38px; padding: 0; background-color: #ffffff; border-radius: 50%; text-align: center;">
                            <img src="${escapeHtml(assets.tiktok)}" alt="TikTok" width="22" height="22" style="display: block; width: 22px; height: 22px; border: 0; outline: none; margin: 0 auto;" />
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                  <!-- YouTube -->
                  <td style="padding: 0 6px;" align="center">
                    <a href="${escapeHtml(youtubeUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="38" height="38" style="background-color: #ffffff; border-radius: 50%; width: 38px; height: 38px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border-collapse: collapse; margin: 0 auto;">
                        <tr>
                          <td align="center" valign="middle" style="width: 38px; height: 38px; padding: 0; background-color: #ffffff; border-radius: 50%; text-align: center;">
                            <img src="${escapeHtml(assets.youtube)}" alt="YouTube" width="22" height="22" style="display: block; width: 22px; height: 22px; border: 0; outline: none; margin: 0 auto;" />
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                  <!-- Facebook -->
                  <td style="padding: 0 6px;" align="center">
                    <a href="${escapeHtml(facebookUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="38" height="38" style="background-color: #ffffff; border-radius: 50%; width: 38px; height: 38px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border-collapse: collapse; margin: 0 auto;">
                        <tr>
                          <td align="center" valign="middle" style="width: 38px; height: 38px; padding: 0; background-color: #ffffff; border-radius: 50%; text-align: center;">
                            <img src="${escapeHtml(assets.facebook)}" alt="Facebook" width="22" height="22" style="display: block; width: 22px; height: 22px; border: 0; outline: none; margin: 0 auto;" />
                          </td>
                        </tr>
                      </table>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          <!-- SUBTLE DIVIDER -->
          <tr>
            <td style="padding-bottom: 20px;">
              <div style="height: 1px; background-color: #1e293b; width: 100%; max-width: 520px; margin: 0 auto;"></div>
            </td>
          </tr>

          <!-- LEADERSHIP & CHAIRMAN SIGNATURE (Admin Managed) -->
          ${
            showChairman
              ? `<tr>
            <td align="center" style="padding-bottom: 14px;">
              <span style="display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #38bdf8; margin-bottom: 4px;">
                Official Leadership &amp; Governance
              </span>
              <div style="font-size: 14px; font-weight: 700; color: #f8fafc; font-family: Georgia, serif; letter-spacing: 0.2px;">
                ${escapeHtml(chairmanName)}
              </div>
              <div style="font-size: 11px; color: #94a3b8; font-weight: 500;">
                ${escapeHtml(chairmanTitle)}
              </div>
            </td>
          </tr>`
              : ""
          }

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
          ${
            showAddress
              ? `<tr>
            <td align="center" style="padding-bottom: 12px; color: #cbd5e1; font-size: 12px; line-height: 1.5;">
              <strong style="color: #e2e8f0;">Head Office:</strong> ${escapeHtml(addressDisplay)}
            </td>
          </tr>`
              : ""
          }

          <!-- CONTACT DETAILS (Phones, Email & Support Hours) -->
          <tr>
            <td align="center" style="padding-bottom: 20px; font-size: 12px; line-height: 1.8; color: #94a3b8;">
              ${
                showPhone
                  ? `<span style="white-space: nowrap;">
                <strong style="color: #e2e8f0;">Phone:</strong>
                <a href="tel:${escapeHtml(phoneTel)}" style="color: #38bdf8; text-decoration: none; font-weight: 600;"> ${escapeHtml(phoneDisplay)}</a>
              </span>`
                  : ""
              }
              ${
                showPhone && showWhatsapp
                  ? `<span style="color: #475569; padding: 0 6px;">&bull;</span>`
                  : ""
              }
              ${
                showWhatsapp
                  ? `<span style="white-space: nowrap;">
                <strong style="color: #e2e8f0;">WhatsApp:</strong>
                <a href="https://wa.me/${escapeHtml(whatsappTel)}" style="color: #38bdf8; text-decoration: none; font-weight: 600;"> ${escapeHtml(whatsappDisplay)}</a>
              </span>`
                  : ""
              }
              ${(showPhone || showWhatsapp) && showEmail ? `<br/>` : ""}
              ${
                showEmail
                  ? `<span style="white-space: nowrap;">
                <strong style="color: #e2e8f0;">Email:</strong>
                <a href="mailto:${escapeHtml(emailDisplay)}" style="color: #38bdf8; text-decoration: none; font-weight: 600;"> ${escapeHtml(emailDisplay)}</a>
              </span>`
                  : ""
              }
              ${
                showEmail
                  ? `<span style="color: #475569; padding: 0 6px;">&bull;</span>`
                  : ""
              }
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
