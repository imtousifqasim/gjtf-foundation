import { NextRequest, NextResponse } from "next/server";
import { unsubscribeDonationReminderDb } from "@/lib/db/mysql";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribe-reminder?error=missing_token", req.url));
  }

  try {
    const success = await unsubscribeDonationReminderDb(token);
    return NextResponse.redirect(
      new URL(`/unsubscribe-reminder?success=${success ? "true" : "false"}`, req.url)
    );
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.redirect(new URL("/unsubscribe-reminder?error=server_error", req.url));
  }
}
