/**
 * Single source of truth for GJTF Foundation contact details, social links, and email assets.
 * All website components, email templates, and database synchronizers MUST import from this file.
 */

// Helper to determine the public base URL
export function getSiteBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl && envUrl !== "" && !envUrl.includes("localhost")) {
    return envUrl.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "");
  }
  return "https://gjtf-foundation.vercel.app";
}

export const siteConfig = {
  organisation: "Ghais Jhuggi Taleem Foundation (GJTF)",
  shortName: "GJTF",
  legalName: "Ghais Jhuggi Taleem Foundation",
  status: "Registered Non-Profit NGO",
  tagline: "Pakistan's largest educational and skill development movement for over 20 million nomadic communities.",
  address: "Office # 46-47, First Floor, New Liberty Tower, Model Town Link Road, Lahore",
  city: "Lahore",
  country: "Pakistan",
  chairman: "Mubashir Hussain Chand",
  chairmanTitle: "Chairman, Ghais Jhuggi Taleem Foundation",

  // Contact Phones
  phone1: {
    number: "04235236622",
    display: "04235236622",
    formatted: "042-35236622",
    telLink: "tel:+924235236622",
  },
  phone2: {
    number: "03033934771",
    display: "03033934771",
    formatted: "0303-3934771",
    telLink: "tel:+923033934771",
    whatsappLink: "https://wa.me/923033934771",
  },

  // Primary Email
  email: {
    address: "jhuggitaleemiproject@gmail.com",
    mailtoLink: "mailto:jhuggitaleemiproject@gmail.com",
  },

  // Operational Hours
  supportHours: "Mon-Sat, 9 AM - 6 PM PKT",

  // Social Channels (Single Source of Truth)
  socials: {
    instagram: "https://www.instagram.com/jhuggitaleemiproject",
    tiktok: "https://www.tiktok.com/@jhuggitaleemiproject",
    youtube: "https://www.youtube.com/@jhuggitaleemiproject",
    facebook: "https://www.facebook.com/jhuggitaleemiproject",
  },

  // Official Bank Account (Single Account - Bank Islami)
  bankAccount: {
    bankName: "Bank Islami",
    branch: "Allama Iqbal Town, Lahore",
    accountTitle: "Ghais Jhuggi Taleem Foundation",
    accountNumber: "203756213050001",
    iban: "PK19BKIP0203756213050001",
    swift: "", // Leave empty until confirmed with branch, show only when filled
    currency: "PKR",
    instructions: "Please include your Reference Number (GJTF-YYYY-NNNNNN) in the transfer description/remarks so your pledge can be verified immediately.",
  },

  // Dynamic Asset URL Generator
  getEmailAssets(customBaseUrl?: string) {
    const base = (customBaseUrl || getSiteBaseUrl()).replace(/\/+$/, "");
    return {
      logo: `${base}/images/email/logo-email.png`,
      instagram: `${base}/images/email/instagram.png`,
      tiktok: `${base}/images/email/tiktok.png`,
      youtube: `${base}/images/email/youtube.png`,
      facebook: `${base}/images/email/facebook.png`,
    };
  },
};

export default siteConfig;
