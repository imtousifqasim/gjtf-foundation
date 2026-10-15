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

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
  };

  try {
    const settings = await getEmailSettingsDb();

    if (settings.auto_delete_enabled) {
      const deletedCount = await cleanupOldEmailLogsDb(settings.retention_days);
      results.logCleanup = {
        success: true,
        retentionDays: settings.retention_days,
        deletedLogsCount: deletedCount,
      };
    } else {
      results.logCleanup = {
        success: true,
        message: "Auto-cleanup is disabled in email settings.",
        deleted: 0,
      };
    }
  } catch (err: any) {
    console.error("Cleanup email logs cron error:", err);
    results.logCleanup = { success: false, error: err.message };
  }

  // Also process monthly plans as part of nightly maintenance
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gjtfoundation.com";
    const cronUrl = new URL("/api/cron/monthly-plans", siteUrl).toString();

    const headers: Record<string, string> = {};
    if (cronSecret) {
      headers["Authorization"] = `Bearer ${cronSecret}`;
    }

    const planRes = await fetch(cronUrl, { headers });
    if (planRes.ok) {
      results.monthlyPlans = await planRes.json();
    }
  } catch (planErr: any) {
    results.monthlyPlans = { error: planErr.message };
  }

  return NextResponse.json({
    success: true,
    summary: results,
  });
}
