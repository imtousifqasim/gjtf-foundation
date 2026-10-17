import { NextRequest, NextResponse } from "next/server";
import {
  getEmailSettingsDb,
  cleanupOldEmailLogsDb,
  getContactMessagesSettingsDb,
  cleanupOldContactMessagesDb,
} from "@/lib/db/mysql";
import { executePaymentProofRetention } from "@/lib/storage/retention";

export const dynamic = "force-dynamic";

/**
 * Unified Nightly Cron Runner for GJTF Foundation.
 * Fully compatible with Vercel Hobby (1 Cron Job limit) and expandable for Pro.
 * 
 * Executes:
 * 1. Email log auto-cleanup per retention settings.
 * 2. Automated monthly plan reminders (3-day notice) & next-cycle generation.
 * 3. Pending donation pledge follow-up reminders.
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

  // 1. Email Log Auto-Cleanup
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
        message: "Auto-cleanup disabled in email settings.",
        deleted: 0,
      };
    }
  } catch (err: any) {
    console.error("Cleanup email logs cron error:", err);
    results.logCleanup = { success: false, error: err.message };
  }

  // 2. Monthly Education Commitments & 3-Day Reminders
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gjtfoundation.com";
    const planCronUrl = new URL("/api/cron/monthly-plans", siteUrl).toString();

    const headers: Record<string, string> = {};
    if (cronSecret) {
      headers["Authorization"] = `Bearer ${cronSecret}`;
    }

    const planRes = await fetch(planCronUrl, { headers });
    if (planRes.ok) {
      results.monthlyPlans = await planRes.json();
    } else {
      results.monthlyPlans = { status: planRes.status, statusText: planRes.statusText };
    }
  } catch (planErr: any) {
    results.monthlyPlans = { error: planErr.message };
  }

  // 3. Pending Donation Pledge Follow-up Reminders
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gjtfoundation.com";
    const reminderCronUrl = new URL("/api/cron/donation-reminders", siteUrl).toString();

    const headers: Record<string, string> = {};
    if (cronSecret) {
      headers["Authorization"] = `Bearer ${cronSecret}`;
    }

    const reminderRes = await fetch(reminderCronUrl, { headers });
    if (reminderRes.ok) {
      results.donationReminders = await reminderRes.json();
    } else {
      results.donationReminders = { status: reminderRes.status, statusText: reminderRes.statusText };
    }
  } catch (remErr: any) {
    results.donationReminders = { error: remErr.message };
  }

  // 4. Contact Messages Retention Auto-Cleanup
  try {
    const contactSettings = await getContactMessagesSettingsDb();
    if (contactSettings.auto_delete_enabled) {
      const deletedContactCount = await cleanupOldContactMessagesDb(
        contactSettings.retention_days,
        contactSettings.delete_only_replied
      );
      results.contactCleanup = {
        success: true,
        retentionDays: contactSettings.retention_days,
        onlyReplied: contactSettings.delete_only_replied,
        deletedMessagesCount: deletedContactCount,
      };
    } else {
      results.contactCleanup = {
        success: true,
        message: "Auto-cleanup disabled in contact messages settings.",
        deleted: 0,
      };
    }
  } catch (contactErr: any) {
    console.error("Cleanup contact messages cron error:", contactErr);
    results.contactCleanup = { success: false, error: contactErr.message };
  }

  // 5. Payment Proof Retention Auto-Cleanup & Drive Maintenance
  try {
    const proofRetentionResult = await executePaymentProofRetention();
    results.proofRetention = proofRetentionResult;
  } catch (proofErr: any) {
    console.error("Proof retention cron error:", proofErr);
    results.proofRetention = { success: false, error: proofErr.message };
  }

  return NextResponse.json({
    success: true,
    summary: results,
  });
}
