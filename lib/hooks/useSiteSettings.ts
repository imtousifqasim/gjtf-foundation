"use client";

import * as React from "react";
import { DEFAULT_SITE_SETTINGS, SiteSettingsData } from "@/lib/siteSettingsConstants";

let cachedSiteSettings: SiteSettingsData | null = null;
let siteSettingsPromise: Promise<SiteSettingsData | null> | null = null;

async function getCachedSiteSettings(): Promise<SiteSettingsData | null> {
  if (cachedSiteSettings) return cachedSiteSettings;
  if (siteSettingsPromise) return siteSettingsPromise;

  siteSettingsPromise = (async () => {
    try {
      const res = await fetch("/api/data/site-settings");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const data = json.data;
          cachedSiteSettings = {
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
          return cachedSiteSettings;
        }
      }
    } catch (e) {
      console.warn("Could not fetch site settings from Hostinger MySQL API:", e);
    }
    return DEFAULT_SITE_SETTINGS;
  })();

  return siteSettingsPromise;
}

export function useSiteSettings() {
  const [settings, setSettings] = React.useState<SiteSettingsData>(cachedSiteSettings || DEFAULT_SITE_SETTINGS);
  const [loaded, setLoaded] = React.useState(Boolean(cachedSiteSettings));

  React.useEffect(() => {
    let isMounted = true;

    getCachedSiteSettings().then((result) => {
      if (isMounted && result) {
        setSettings(result);
        setLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return { settings, loaded };
}
