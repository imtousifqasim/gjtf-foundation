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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await context.params;

    switch (table) {
      case "schools": {
        const data = await getSchoolsDb();
        return NextResponse.json({ success: true, data });
      }
      case "stories": {
        const data = await getStoriesDb();
        return NextResponse.json({ success: true, data });
      }
      case "donations": {
        const data = await getDonationsDb(100);
        return NextResponse.json({ success: true, data });
      }
      case "contact-messages":
      case "contact_submissions": {
        const data = await getContactMessagesDb(100);
        return NextResponse.json({ success: true, data });
      }
      case "volunteer-signups":
      case "volunteer_signups": {
        const data = await getVolunteerSignupsDb(100);
        return NextResponse.json({ success: true, data });
      }
      case "subscribers":
      case "newsletter_subscribers": {
        const data = await getSubscribersDb();
        return NextResponse.json({ success: true, data });
      }
      case "site-settings":
      case "site_settings": {
        const data = await getSiteSettingsDb();
        return NextResponse.json({ success: true, data });
      }
      default:
        return NextResponse.json(
          { success: false, error: "Invalid table requested" },
          { status: 400 }
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
