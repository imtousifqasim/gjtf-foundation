import siteConfig from "./siteConfig";

export interface SiteSettingsData {
  head_office_address: string;
  contact_person: string;
  telephone: string;
  mobile: string;
  whatsapp: string;
  email: string;
  secondary_email: string;
  toll_free?: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  tiktok_url: string;
  twitter_url: string;
  linkedin_url?: string;
  chairman_name?: string;
  chairman_title?: string;
  show_phone_in_receipts?: boolean;
  show_whatsapp_in_receipts?: boolean;
  show_email_in_receipts?: boolean;
  show_address_in_receipts?: boolean;
  show_socials_in_receipts?: boolean;
  show_chairman_in_receipts?: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  head_office_address: siteConfig.address,
  contact_person: "GJTF Support Desk",
  telephone: siteConfig.phone1.number,
  mobile: siteConfig.phone2.number,
  whatsapp: siteConfig.phone2.number,
  email: siteConfig.email.address,
  secondary_email: "gjtfoundation1@gmail.com",
  toll_free: "",
  facebook_url: siteConfig.socials.facebook,
  instagram_url: siteConfig.socials.instagram,
  youtube_url: siteConfig.socials.youtube,
  tiktok_url: siteConfig.socials.tiktok,
  twitter_url: "",
  linkedin_url: "",
  chairman_name: "Mubashir Hussain Chand",
  chairman_title: "Chairman, Ghais Jhuggi Taleem Foundation",
  show_phone_in_receipts: true,
  show_whatsapp_in_receipts: true,
  show_email_in_receipts: true,
  show_address_in_receipts: true,
  show_socials_in_receipts: true,
  show_chairman_in_receipts: true,
};
