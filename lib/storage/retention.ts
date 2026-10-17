import { getPool, query } from "@/lib/db/mysql";
import { getPaymentProofsSettingsDb } from "@/lib/db/paymentProofsSchema";
import { getProofStorage } from "./index";
import { GoogleDriveStorage } from "./googleDrive";
import { RowDataPacket } from "mysql2";

export interface RetentionResult {
  success: boolean;
  retentionDays: number;
  expiredFound: number;
  deletedCount: number;
  failedCount: number;
  currentFolder?: string;
  nextFolder?: string;
  storageHealth?: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

/**
 * Executes payment proof retention cleanup and monthly folder maintenance.
 * - Idempotently queries proofs approved or rejected longer than retention_days ago.
 * - Permanently deletes files from Google Drive storage.
 * - Marks database rows as deleted while preserving audit metadata (dates, SHA-256, status).
 * - Pre-creates Google Drive folders for current and upcoming month.
 */
export async function executePaymentProofRetention(batchSize = 50): Promise<RetentionResult> {
  const storage = getProofStorage();
  const settings = await getPaymentProofsSettingsDb();

  const result: RetentionResult = {
    success: true,
    retentionDays: settings.retention_days,
    expiredFound: 0,
    deletedCount: 0,
    failedCount: 0,
  };

  // 1. Check if retention is disabled (0 means keep indefinitely)
  if (!settings.retention_days || settings.retention_days <= 0) {
    result.skipped = true;
    result.reason = "Retention disabled (retention_days <= 0 / never)";
  } else {
    try {
      const expiredProofs = await query<RowDataPacket[]>(
        `SELECT id, drive_file_id, folder_path, filename, status, reviewed_at
         FROM payment_proofs
         WHERE status IN ('approved', 'rejected')
           AND reviewed_at IS NOT NULL
           AND reviewed_at < DATE_SUB(NOW(), INTERVAL ? DAY)
           AND deleted_at IS NULL
         LIMIT ?`,
        [settings.retention_days, batchSize]
      );

      result.expiredFound = expiredProofs.length;

      for (const proof of expiredProofs) {
        try {
          // Permanently delete file from storage driver
          if (proof.drive_file_id && proof.drive_file_id !== "DELETED") {
            await storage.delete(proof.drive_file_id);
          }

          // Update record in database, stripping secret encryption parameters but retaining audit hash & timeline
          await query(
            `UPDATE payment_proofs
             SET status = 'deleted',
                 deleted_at = NOW(),
                 drive_file_id = 'DELETED',
                 wrapped_data_key = NULL,
                 encryption_iv = NULL,
                 encryption_tag = NULL
             WHERE id = ?`,
            [proof.id]
          );

          result.deletedCount++;
        } catch (delErr: any) {
          console.error(`[Retention Cron] Failed to delete proof ${proof.id}:`, delErr.message);
          result.failedCount++;
        }
      }
    } catch (dbErr: any) {
      console.error("[Retention Cron] Database error fetching expired proofs:", dbErr.message);
      result.success = false;
      result.error = dbErr.message;
    }
  }

  // 2. Pre-create current and upcoming month's folders in Google Drive
  try {
    if (storage instanceof GoogleDriveStorage) {
      const now = new Date();
      const currentFolder = await storage.getOrCreateMonthFolder(now);
      result.currentFolder = currentFolder.folderPath;

      // 32 days in future to guarantee landing in the next calendar month
      const nextMonthDate = new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000);
      const nextFolder = await storage.getOrCreateMonthFolder(nextMonthDate);
      result.nextFolder = nextFolder.folderPath;
    }
  } catch (folderErr: any) {
    console.warn("[Retention Cron] Pre-creating monthly folders note:", folderErr.message);
  }

  // 3. Health check
  try {
    const health = await storage.health();
    result.storageHealth = health.status;
  } catch (healthErr: any) {
    result.storageHealth = "error: " + healthErr.message;
  }

  return result;
}
