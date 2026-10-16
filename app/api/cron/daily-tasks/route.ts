import { NextRequest, NextResponse } from "next/server";
import { getEmailSettingsDb, cleanupOldEmailLogsDb } from "@/lib/db/mysql";

export const dynamic = "force-dynamic";

/**
 * Unified daily cron tasks for Vercel Hobby plan compatibility (max 2 crons allowed).
 * Performs:
 * 1. Email log cleanup based on admin retention policy.
 * 2. Automated monthly plan reminders and renewal cycle generation.
 */
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

  // 1. Log Cleanup
  try {
    const emailSettings = await getEmailSettingsDb();
    if (emailSettings.auto_delete_enabled) {
      const deletedLogs = await cleanupOldEmailLogsDb(emailSettings.retention_days);
      results.logCleanup = { success: true, deletedLogs, retentionDays: emailSettings.retention_days };
    } else {
      results.logCleanup = { success: true, message: "Auto-delete disabled" };
    }
  } catch (err: any) {
    results.logCleanup = { success: false, error: err.message };
  }

  // 2. Trigger Monthly Plans processing internally
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gjtfoundation.com";
    const cronUrl = new URL("/api/cron/monthly-plans", siteUrl).toString();
    
    const headers: Record<string, string> = {};
    if (cronSecret) {
      headers["Authorization"] = `Bearer ${cronSecret}`;
    }

    const planRes = await fetch(cronUrl, { headers });
    if (planRes.ok) {
      const planData = await planRes.json();
      results.monthlyPlans = planData;
    } else {
      results.monthlyPlans = { status: planRes.status, statusText: planRes.statusText };
    }
  } catch (err: any) {
    results.monthlyPlans = { success: false, error: err.message };
  }

  return NextResponse.json({
    success: true,
    summary: results,
  });
}
