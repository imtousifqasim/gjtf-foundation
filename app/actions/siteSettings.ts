"use server";

import { revalidatePath } from "next/cache";
import { getSiteSettingsDb, saveSiteSettingsDb } from "@/lib/db/mysql";
import { SiteSettingsData, DEFAULT_SITE_SETTINGS } from "@/lib/siteSettingsConstants";
export type { SiteSettingsData };

export async function getSiteSettingsAction(): Promise<SiteSettingsData> {
  try {
    const data = await getSiteSettingsDb();
    if (data) {
      return {
        head_office_address: data.head_office_address || DEFAULT_SITE_SETTINGS.head_office_address,
        contact_person: data.contact_person || DEFAULT_SITE_SETTINGS.contact_person,
        telephone: data.telephone || DEFAULT_SITE_SETTINGS.telephone,
        mobile: data.mobile || DEFAULT_SITE_SETTINGS.mobile,
        whatsapp: data.whatsapp || DEFAULT_SITE_SETTINGS.whatsapp,
        email: data.email || DEFAULT_SITE_SETTINGS.email,
        secondary_email: data.secondary_email || DEFAULT_SITE_SETTINGS.secondary_email,
        toll_free: data.toll_free || DEFAULT_SITE_SETTINGS.toll_free,
        facebook_url: data.facebook_url || DEFAULT_SITE_SETTINGS.facebook_url,
        instagram_url: data.instagram_url || DEFAULT_SITE_SETTINGS.instagram_url,
        youtube_url: data.youtube_url || DEFAULT_SITE_SETTINGS.youtube_url,
        tiktok_url: data.tiktok_url || DEFAULT_SITE_SETTINGS.tiktok_url,
        twitter_url: data.twitter_url || DEFAULT_SITE_SETTINGS.twitter_url,
        linkedin_url: data.linkedin_url || DEFAULT_SITE_SETTINGS.linkedin_url,
      };
    }
  } catch (err) {
    console.warn("Could not load site_settings from Hostinger MySQL:", err);
  }

  return DEFAULT_SITE_SETTINGS;
}

export async function saveSiteSettingsAction(settings: Partial<SiteSettingsData>) {
  try {
    await saveSiteSettingsDb(settings);

    revalidatePath("/");
    revalidatePath("/contact-us");
    revalidatePath("/admin/settings");

    return {
      success: true,
      message: "Global site contact and social media information updated successfully in Hostinger MySQL (with Supabase backup)!",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "An unexpected error occurred while saving site settings.",
    };
  }
}
