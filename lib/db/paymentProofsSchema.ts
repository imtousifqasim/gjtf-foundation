import { query, getPool, RowDataPacket } from "./mysql";

declare global {
  // eslint-disable-next-line no-var
  var __paymentProofTablesInitialized: boolean | undefined;
}

let paymentProofTablesInitialized = false;
let paymentProofInitPromise: Promise<void> | null = null;

export interface PaymentProofRecord {
  id: string;
  donation_id: string;
  donor_id?: string | null;
  storage_driver: string;
  drive_file_id: string;
  drive_folder_id: string;
  folder_path: string;
  filename: string;
  mime: string;
  size_bytes: number;
  sha256: string;
  is_encrypted: boolean;
  encryption_version?: number;
  wrapped_data_key?: string | null;
  encryption_iv?: string | null;
  encryption_tag?: string | null;
  transaction_ref?: string | null;
  sender_bank?: string | null;
  paid_at?: string | null;
  paid_amount_minor?: number | null;
  note?: string | null;
  status: "submitted" | "approved" | "rejected" | "deleted";
  reject_reason?: string | null;
  uploaded_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  deleted_at?: string | null;
}

export interface DriveFolderRecord {
  id: string;
  path_key: string; // e.g. "2026/10"
  folder_name: string; // e.g. "10-October"
  drive_folder_id: string;
  parent_folder_id: string;
  created_at: string;
}

export interface PledgeAccessTokenRecord {
  id: string;
  donation_id: string;
  token_hash: string;
  expires_at: string;
  used_at?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface PaymentProofsSettings {
  id: string;
  storage_driver: string;
  client_id?: string | null;
  client_secret?: string | null;
  refresh_token?: string | null;
  root_folder_id?: string | null;
  scope_mode: "drive" | "drive.file";
  encryption_enabled: boolean;
  filename_mode: "reference" | "random";
  max_file_size_bytes: number;
  max_active_proofs_per_pledge: number;
  retention_days: number;
  allow_guest_uploads: boolean;
  last_health_check_at?: string | null;
  last_health_status?: string | null;
  last_health_error?: string | null;
  updated_at?: string;
}

export const DEFAULT_PAYMENT_PROOFS_SETTINGS: PaymentProofsSettings = {
  id: "default",
  storage_driver: "google-drive",
  client_id: process.env.GOOGLE_CLIENT_ID || null,
  client_secret: process.env.GOOGLE_CLIENT_SECRET || null,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN || null,
  root_folder_id: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null,
  scope_mode: (process.env.GOOGLE_DRIVE_SCOPE_MODE as any) === "drive.file" ? "drive.file" : "drive",
  encryption_enabled: process.env.PROOF_ENCRYPTION === "on",
  filename_mode: (process.env.PROOF_FILENAME_MODE as any) === "random" ? "random" : "reference",
  max_file_size_bytes: 5 * 1024 * 1024, // 5 MB
  max_active_proofs_per_pledge: 3,
  retention_days: 90,
  allow_guest_uploads: true,
};

/**
 * Ensures all tables and columns for Payment Proofs, Google Drive Folders,
 * Single-Pledge Access Tokens, and PKR-Only Currency lock exist in MySQL.
 */
export async function ensurePaymentProofTablesDb(force = false): Promise<void> {
  if (global.__paymentProofTablesInitialized && !force) return;
  if (paymentProofTablesInitialized && !force) return;
  if (paymentProofInitPromise && !force) return paymentProofInitPromise;

  paymentProofInitPromise = (async () => {
    try {
      const pool = getPool();

      // 1. payment_proofs table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payment_proofs (
          id VARCHAR(64) PRIMARY KEY,
          donation_id VARCHAR(64) NOT NULL,
          donor_id VARCHAR(64) NULL,
          storage_driver VARCHAR(32) NOT NULL DEFAULT 'google-drive',
          drive_file_id VARCHAR(128) NOT NULL,
          drive_folder_id VARCHAR(128) NOT NULL,
          folder_path VARCHAR(255) NOT NULL,
          filename VARCHAR(255) NOT NULL,
          mime VARCHAR(64) NOT NULL,
          size_bytes BIGINT NOT NULL,
          sha256 VARCHAR(64) NOT NULL,
          is_encrypted TINYINT(1) NOT NULL DEFAULT 0,
          encryption_version INT NULL DEFAULT 1,
          wrapped_data_key TEXT NULL,
          encryption_iv VARCHAR(64) NULL,
          encryption_tag VARCHAR(64) NULL,
          transaction_ref VARCHAR(128) NULL,
          sender_bank VARCHAR(128) NULL,
          paid_at TIMESTAMP NULL,
          paid_amount_minor BIGINT NULL,
          note TEXT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'submitted',
          reject_reason TEXT NULL,
          uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          reviewed_by VARCHAR(128) NULL,
          reviewed_at TIMESTAMP NULL,
          deleted_at TIMESTAMP NULL,
          INDEX idx_donation_id (donation_id),
          INDEX idx_donor_id (donor_id),
          INDEX idx_sha256 (sha256),
          INDEX idx_status (status),
          INDEX idx_uploaded_at (uploaded_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 2. drive_folders table (lazy folder creation & concurrency safety)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS drive_folders (
          id VARCHAR(64) PRIMARY KEY,
          path_key VARCHAR(64) NOT NULL UNIQUE,
          folder_name VARCHAR(64) NOT NULL,
          drive_folder_id VARCHAR(128) NOT NULL,
          parent_folder_id VARCHAR(128) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_path_key (path_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 3. pledge_access_tokens table (secure, single-pledge guest access)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pledge_access_tokens (
          id VARCHAR(64) PRIMARY KEY,
          donation_id VARCHAR(64) NOT NULL,
          token_hash VARCHAR(128) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          used_at TIMESTAMP NULL,
          ip VARCHAR(64) NULL,
          user_agent TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_token_hash (token_hash),
          INDEX idx_donation_id (donation_id),
          INDEX idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 4. payment_proofs_settings table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payment_proofs_settings (
          id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
          storage_driver VARCHAR(32) NOT NULL DEFAULT 'google-drive',
          root_folder_id VARCHAR(128) NULL,
          scope_mode VARCHAR(32) NOT NULL DEFAULT 'drive',
          encryption_enabled TINYINT(1) NOT NULL DEFAULT 0,
          filename_mode VARCHAR(32) NOT NULL DEFAULT 'reference',
          max_file_size_bytes INT NOT NULL DEFAULT 5242880,
          max_active_proofs_per_pledge INT NOT NULL DEFAULT 3,
          retention_days INT NOT NULL DEFAULT 90,
          allow_guest_uploads TINYINT(1) NOT NULL DEFAULT 1,
          last_health_check_at TIMESTAMP NULL,
          last_health_status VARCHAR(32) NULL,
          last_health_error TEXT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        INSERT IGNORE INTO payment_proofs_settings (
          id, storage_driver, root_folder_id, scope_mode, encryption_enabled,
          filename_mode, max_file_size_bytes, max_active_proofs_per_pledge, retention_days, allow_guest_uploads
        ) VALUES (
          'default', 'google-drive', ?, ?, ?, ?, 5242880, 3, 90, 1
        );
      `, [
        DEFAULT_PAYMENT_PROOFS_SETTINGS.root_folder_id,
        DEFAULT_PAYMENT_PROOFS_SETTINGS.scope_mode,
        DEFAULT_PAYMENT_PROOFS_SETTINGS.encryption_enabled ? 1 : 0,
        DEFAULT_PAYMENT_PROOFS_SETTINGS.filename_mode,
      ]);

      // 5. Add columns to donations safely
      const donationAlterQueries = [
        "ALTER TABLE donations ADD COLUMN proof_status VARCHAR(32) NOT NULL DEFAULT 'none' AFTER status",
        "ALTER TABLE donations ADD COLUMN bank_transaction_ref VARCHAR(128) NULL AFTER bank_account_id",
        "ALTER TABLE donations ADD COLUMN confirmed_by VARCHAR(128) NULL AFTER bank_transaction_ref",
        "ALTER TABLE donations ADD COLUMN confirmed_at TIMESTAMP NULL AFTER confirmed_by",
        "ALTER TABLE donations ADD INDEX idx_proof_status (proof_status)",
        "ALTER TABLE donations ADD UNIQUE INDEX uq_bank_tx_ref (bank_transaction_ref)",
      ];

      for (const alterSql of donationAlterQueries) {
        try {
          await pool.query(alterSql);
        } catch {
          // ignore already existing column / index
        }
      }

      // Backfill proof_status on donations
      try {
        await pool.query(`
          UPDATE donations
          SET proof_status = 'none'
          WHERE proof_status IS NULL OR proof_status = '';
        `);
      } catch {}

      // 6. Add enabled_currencies column to app_settings (defaults to '["PKR"]')
      try {
        await pool.query(`
          ALTER TABLE app_settings ADD COLUMN enabled_currencies JSON NULL;
        `);
      } catch {}

      try {
        await pool.query(`
          UPDATE app_settings
          SET enabled_currencies = JSON_ARRAY('PKR')
          WHERE enabled_currencies IS NULL;
        `);
      } catch {}

      paymentProofTablesInitialized = true;
      global.__paymentProofTablesInitialized = true;
    } catch (err: any) {
      console.warn("[Payment Proofs Schema] Table initialization warning:", err.message);
    } finally {
      paymentProofInitPromise = null;
    }
  })();

  return paymentProofInitPromise;
}

/**
 * Returns currently enabled currencies list. Defaults to ["PKR"].
 */
export async function getEnabledCurrenciesDb(): Promise<string[]> {
  try {
    await ensurePaymentProofTablesDb();
    const rows = await query<RowDataPacket[]>(
      "SELECT enabled_currencies FROM app_settings WHERE id = 'default' LIMIT 1"
    );
    if (rows && rows.length > 0 && rows[0].enabled_currencies) {
      const val = rows[0].enabled_currencies;
      const parsed = typeof val === "string" ? JSON.parse(val) : val;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: any) => String(c).toUpperCase());
      }
    }
  } catch (err) {
    console.warn("[Enabled Currencies] Fallback to PKR:", err);
  }
  return ["PKR"];
}

/**
 * Gets payment proofs settings.
 */
export async function getPaymentProofsSettingsDb(): Promise<PaymentProofsSettings> {
  try {
    await ensurePaymentProofTablesDb();
    const rows = await query<RowDataPacket[]>(
      "SELECT * FROM payment_proofs_settings WHERE id = 'default' LIMIT 1"
    );
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id,
        storage_driver: r.storage_driver || "google-drive",
        client_id: r.client_id || process.env.GOOGLE_CLIENT_ID || null,
        client_secret: r.client_secret || process.env.GOOGLE_CLIENT_SECRET || null,
        refresh_token: r.refresh_token || process.env.GOOGLE_REFRESH_TOKEN || null,
        root_folder_id: r.root_folder_id || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null,
        scope_mode: r.scope_mode || "drive",
        encryption_enabled: Boolean(r.encryption_enabled),
        filename_mode: r.filename_mode || "reference",
        max_file_size_bytes: Number(r.max_file_size_bytes) || 5242880,
        max_active_proofs_per_pledge: Number(r.max_active_proofs_per_pledge) || 3,
        retention_days: Number(r.retention_days) ?? 90,
        allow_guest_uploads: Boolean(r.allow_guest_uploads),
        last_health_check_at: r.last_health_check_at,
        last_health_status: r.last_health_status,
        last_health_error: r.last_health_error,
        updated_at: r.updated_at,
      };
    }
  } catch (err) {
    console.warn("[Payment Proofs Settings] Failed to fetch settings, using defaults:", err);
  }
  return DEFAULT_PAYMENT_PROOFS_SETTINGS;
}

/**
 * Updates payment proofs settings.
 */
export async function updatePaymentProofsSettingsDb(
  updates: Partial<PaymentProofsSettings>
): Promise<void> {
  await ensurePaymentProofTablesDb();
  await query(`
    UPDATE payment_proofs_settings
    SET
      storage_driver = COALESCE(?, storage_driver),
      client_id = COALESCE(?, client_id),
      client_secret = COALESCE(?, client_secret),
      refresh_token = COALESCE(?, refresh_token),
      root_folder_id = COALESCE(?, root_folder_id),
      scope_mode = COALESCE(?, scope_mode),
      encryption_enabled = COALESCE(?, encryption_enabled),
      filename_mode = COALESCE(?, filename_mode),
      max_file_size_bytes = COALESCE(?, max_file_size_bytes),
      max_active_proofs_per_pledge = COALESCE(?, max_active_proofs_per_pledge),
      retention_days = COALESCE(?, retention_days),
      allow_guest_uploads = COALESCE(?, allow_guest_uploads),
      last_health_check_at = COALESCE(?, last_health_check_at),
      last_health_status = COALESCE(?, last_health_status),
      last_health_error = COALESCE(?, last_health_error),
      updated_at = NOW()
    WHERE id = 'default'
  `, [
    updates.storage_driver ?? null,
    updates.client_id ?? null,
    updates.client_secret ?? null,
    updates.refresh_token ?? null,
    updates.root_folder_id ?? null,
    updates.scope_mode ?? null,
    updates.encryption_enabled !== undefined ? (updates.encryption_enabled ? 1 : 0) : null,
    updates.filename_mode ?? null,
    updates.max_file_size_bytes ?? null,
    updates.max_active_proofs_per_pledge ?? null,
    updates.retention_days ?? null,
    updates.allow_guest_uploads !== undefined ? (updates.allow_guest_uploads ? 1 : 0) : null,
    updates.last_health_check_at ?? null,
    updates.last_health_status ?? null,
    updates.last_health_error ?? null,
  ]);
}
