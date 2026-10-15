import { NextRequest, NextResponse } from "next/server";
import {
  getSchoolsDb,
  getStoriesDb,
  getDonationsDb,
  getContactMessagesDb,
  getVolunteerSignupsDb,
  getSubscribersDb,
  getSiteSettingsDb,
} from "@/lib/db/mysql";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await context.params;

    const noCacheHeaders = {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    };

    switch (table) {
      case "schools": {
        const data = await getSchoolsDb();
        return NextResponse.json({ success: true, data }, { headers: noCacheHeaders });
      }
      case "stories": {
        const data = await getStoriesDb();
        return NextResponse.json({ success: true, data }, { headers: noCacheHeaders });
      }
      case "donations": {
        const data = await getDonationsDb(100);
        return NextResponse.json({ success: true, data }, { headers: noCacheHeaders });
      }
      case "contact-messages":
      case "contact_submissions": {
        const data = await getContactMessagesDb(100);
        return NextResponse.json({ success: true, data }, { headers: noCacheHeaders });
      }
      case "volunteer-signups":
      case "volunteer_signups": {
        const data = await getVolunteerSignupsDb(100);
        return NextResponse.json({ success: true, data }, { headers: noCacheHeaders });
      }
      case "subscribers":
      case "newsletter_subscribers": {
        const data = await getSubscribersDb();
        return NextResponse.json({ success: true, data }, { headers: noCacheHeaders });
      }
      case "site-settings":
      case "site_settings": {
        const data = await getSiteSettingsDb();
        return NextResponse.json({ success: true, data }, { headers: noCacheHeaders });
      }
      default:
        return NextResponse.json(
          { success: false, error: "Invalid table requested" },
          { status: 400, headers: noCacheHeaders }
        );
    }
  } catch (err: any) {
    console.error("API error querying Hostinger MySQL:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Database error" },
      { status: 500 }
    );
  }
}
