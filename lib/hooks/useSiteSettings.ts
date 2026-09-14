"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_SITE_SETTINGS, SiteSettingsData } from "@/lib/siteSettingsConstants";

export function useSiteSettings() {
  const [settings, setSettings] = React.useState<SiteSettingsData>(DEFAULT_SITE_SETTINGS);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const applyData = (data: any) => {
      if (!data) return;
      setSettings({
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
      });
    };

    async function load() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("*")
          .eq("id", "default")
          .single();

        if (!error && data && isMounted) {
          applyData(data);
        }
      } catch (e) {
        console.warn("Could not fetch site settings, using default:", e);
      } finally {
        if (isMounted) setLoaded(true);
      }
    }

    load();

    // Supabase Real-time listener for live updates across browser tabs & pages
    const channelId = `site_settings_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        (payload) => {
          if (payload.new && isMounted) {
            applyData(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, loaded };
}
