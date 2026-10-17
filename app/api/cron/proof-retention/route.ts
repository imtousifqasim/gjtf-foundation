import { NextRequest, NextResponse } from "next/server";
import { executePaymentProofRetention } from "@/lib/storage/retention";

export const dynamic = "force-dynamic";

/**
 * Daily Payment Proof Retention & Storage Maintenance Cron.
 * - Enforces authentication via Bearer ${CRON_SECRET}.
 * - Purges expired payment proof files from Google Drive permanently.
 * - Idempotently marks database records deleted while keeping audit metadata.
 * - Pre-creates Google Drive folders for current & next calendar months.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && cronSecret.trim() !== "") {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
    }
  }

  try {
    const result = await executePaymentProofRetention();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (err: any) {
    console.error("[Proof Retention Cron] Unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to execute payment proof retention",
      },
      { status: 500 }
    );
  }
}
