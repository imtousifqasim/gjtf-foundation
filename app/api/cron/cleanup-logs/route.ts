import { NextRequest, NextResponse } from "next/server";
import { getEmailSettingsDb, cleanupOldEmailLogsDb } from "@/lib/db/mysql";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && cronSecret.trim() !== "") {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
    }
  }

  try {
    const settings = await getEmailSettingsDb();

    if (!settings.auto_delete_enabled) {
      return NextResponse.json({
        success: true,
        message: "Auto-cleanup is disabled in email settings.",
        deleted: 0,
      });
    }

    const deletedCount = await cleanupOldEmailLogsDb(settings.retention_days);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      retentionDays: settings.retention_days,
      deletedLogsCount: deletedCount,
    });
  } catch (err: any) {
    console.error("Cleanup email logs cron error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
