import { query, getPool } from "./mysql";

let coreTablesInitialized = false;
let coreTablesInitPromise: Promise<void> | null = null;

/**
 * Ensures all Enterprise Donor Portal, Monthly Commitment, Auth,
 * Payment Settings, Audit Logs and Receipt tables exist in MySQL.
 */
export async function ensureCoreTablesDb(): Promise<void> {
  if (coreTablesInitialized) return;
  if (coreTablesInitPromise) return coreTablesInitPromise;

  coreTablesInitPromise = (async () => {
    try {
      const pool = getPool();

      // 1. donors table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS donors (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          phone VARCHAR(64) NULL,
          country VARCHAR(100) DEFAULT 'Pakistan',
          password_hash VARCHAR(255) NULL,
          email_verified_at TIMESTAMP NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'active',
          prefers_anonymous TINYINT(1) DEFAULT 0,
          marketing_opt_in TINYINT(1) DEFAULT 1,
          notification_prefs JSON NULL,
          last_login_at TIMESTAMP NULL,
          failed_login_count INT DEFAULT 0,
          locked_until TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 2. donation_plans table (recurring monthly commitments)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS donation_plans (
          id VARCHAR(64) PRIMARY KEY,
          donor_id VARCHAR(64) NOT NULL,
          cause VARCHAR(128) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
          amount_minor BIGINT NOT NULL,
          amount DECIMAL(12, 2) NOT NULL,
          donation_type VARCHAR(32) NOT NULL DEFAULT 'General',
          billing_day INT NOT NULL DEFAULT 1,
          start_date DATE NOT NULL,
          next_due_date DATE NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'active',
          pause_until DATE NULL,
          cancelled_at TIMESTAMP NULL,
          cycles_completed INT NOT NULL DEFAULT 0,
          payment_method VARCHAR(64) DEFAULT 'bank_transfer',
          gateway_subscription_id VARCHAR(128) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_donor (donor_id),
          INDEX idx_due (next_due_date),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 3. Update existing donations table with new enterprise columns
      const alterQueries = [
        "ALTER TABLE donations ADD COLUMN reference_no VARCHAR(64) NULL UNIQUE AFTER id",
        "ALTER TABLE donations ADD COLUMN donor_id VARCHAR(64) NULL AFTER reference_no",
        "ALTER TABLE donations ADD COLUMN plan_id VARCHAR(64) NULL AFTER donor_id",
        "ALTER TABLE donations ADD COLUMN amount_minor BIGINT NULL AFTER amount",
        "ALTER TABLE donations ADD COLUMN payment_method VARCHAR(64) DEFAULT 'bank_transfer' AFTER status",
        "ALTER TABLE donations ADD COLUMN gateway_provider VARCHAR(64) NULL AFTER payment_method",
        "ALTER TABLE donations ADD COLUMN gateway_transaction_id VARCHAR(128) NULL AFTER gateway_provider",
        "ALTER TABLE donations ADD COLUMN proof_url VARCHAR(500) NULL AFTER gateway_transaction_id",
        "ALTER TABLE donations ADD COLUMN due_date DATE NULL AFTER proof_url",
        "ALTER TABLE donations ADD COLUMN paid_at TIMESTAMP NULL AFTER due_date",
        "ALTER TABLE donations ADD COLUMN failed_reason TEXT NULL AFTER paid_at",
        "ALTER TABLE donations ADD COLUMN admin_note TEXT NULL AFTER failed_reason",
        "ALTER TABLE donations ADD COLUMN is_anonymous TINYINT(1) DEFAULT 0 AFTER admin_note",
      ];

      for (const alterSql of alterQueries) {
        try {
          await pool.query(alterSql);
        } catch {
          // Column may already exist, ignore duplicate column error
        }
      }

      // Backfill reference_no on existing donations if null
      try {
        await pool.query(`
          UPDATE donations 
          SET reference_no = CONCAT('GJTF-', YEAR(created_at), '-', LPAD(SUBSTRING(id, 4), 6, '0'))
          WHERE reference_no IS NULL OR reference_no = '';
        `);
      } catch {}

      // Backfill amount_minor if null
      try {
        await pool.query(`
          UPDATE donations 
          SET amount_minor = ROUND(amount * 100)
          WHERE amount_minor IS NULL OR amount_minor = 0;
        `);
      } catch {}

      // 4. donation_status_history
      await pool.query(`
        CREATE TABLE IF NOT EXISTS donation_status_history (
          id VARCHAR(64) PRIMARY KEY,
          donation_id VARCHAR(64) NOT NULL,
          old_status VARCHAR(32) NULL,
          new_status VARCHAR(32) NOT NULL,
          changed_by VARCHAR(128) NOT NULL DEFAULT 'system',
          note TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_donation (donation_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 5. auth_tokens (single-use hashed tokens for password set/reset, email verify, OTP, magic links)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_tokens (
          id VARCHAR(64) PRIMARY KEY,
          donor_id VARCHAR(64) NOT NULL,
          type VARCHAR(64) NOT NULL,
          token_hash VARCHAR(128) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used_at TIMESTAMP NULL,
          ip VARCHAR(64) NULL,
          user_agent TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_token (token_hash),
          INDEX idx_donor (donor_id),
          INDEX idx_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 6. donor_sessions (secure database-backed sessions)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS donor_sessions (
          id VARCHAR(64) PRIMARY KEY,
          donor_id VARCHAR(64) NOT NULL,
          session_token_hash VARCHAR(128) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          ip VARCHAR(64) NULL,
          user_agent TEXT NULL,
          revoked_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_hash (session_token_hash),
          INDEX idx_donor (donor_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 7. receipts
      await pool.query(`
        CREATE TABLE IF NOT EXISTS receipts (
          id VARCHAR(64) PRIMARY KEY,
          donation_id VARCHAR(64) NOT NULL UNIQUE,
          receipt_no VARCHAR(64) NOT NULL UNIQUE,
          issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          pdf_url VARCHAR(500) NULL,
          access_token VARCHAR(128) NOT NULL,
          INDEX idx_rec_no (receipt_no),
          INDEX idx_donation (donation_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 8. payment_settings (editable bank details & gateway readiness)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payment_settings (
          id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
          bank_title VARCHAR(255) DEFAULT 'Ghais Jhuggi Taleem Foundation',
          bank_name VARCHAR(255) DEFAULT 'Meezan Bank Limited',
          account_number VARCHAR(64) DEFAULT '02010103847291',
          iban VARCHAR(64) DEFAULT 'PK72MEZN0002010103847291',
          branch_name VARCHAR(255) DEFAULT 'Model Town Link Road Branch Lahore',
          swift_code VARCHAR(32) DEFAULT 'MEZNPKKA',
          doorstep_enabled TINYINT(1) DEFAULT 1,
          doorstep_phone VARCHAR(64) DEFAULT '0800-00823',
          cheque_enabled TINYINT(1) DEFAULT 1,
          bank_transfer_enabled TINYINT(1) DEFAULT 1,
          jazzcash_number VARCHAR(64) DEFAULT '0303-3934771',
          easypaisa_number VARCHAR(64) DEFAULT '0328-6477314',
          gateway_provider VARCHAR(64) DEFAULT 'manual',
          gateway_mode VARCHAR(32) DEFAULT 'test',
          gateway_api_key_encrypted TEXT NULL,
          gateway_webhook_secret VARCHAR(255) NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        INSERT IGNORE INTO payment_settings (
          id, bank_title, bank_name, account_number, iban, branch_name, swift_code,
          doorstep_enabled, doorstep_phone, cheque_enabled, bank_transfer_enabled,
          jazzcash_number, easypaisa_number, gateway_provider, gateway_mode
        ) VALUES (
          'default', 'Ghais Jhuggi Taleem Foundation', 'Meezan Bank Limited',
          '02010103847291', 'PK72MEZN0002010103847291', 'Model Town Link Road Branch Lahore', 'MEZNPKKA',
          1, '0800-00823', 1, 1,
          '0303-3934771', '0328-6477314', 'manual', 'test'
        );
      `);

      // 9. audit_logs (append-only ledger for all security and financial changes)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(64) PRIMARY KEY,
          actor_type VARCHAR(32) NOT NULL,
          actor_id VARCHAR(64) NULL,
          action VARCHAR(128) NOT NULL,
          target_type VARCHAR(64) NOT NULL,
          target_id VARCHAR(64) NULL,
          metadata JSON NULL,
          ip VARCHAR(64) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_actor (actor_type, actor_id),
          INDEX idx_action (action),
          INDEX idx_target (target_type, target_id),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 10. app_settings (impact calculation formulas)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
          pkr_per_child_monthly INT DEFAULT 2000,
          pkr_per_child_annual INT DEFAULT 24000,
          aed_per_child_monthly INT DEFAULT 50,
          aed_per_child_annual INT DEFAULT 600,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        INSERT IGNORE INTO app_settings (
          id, pkr_per_child_monthly, pkr_per_child_annual, aed_per_child_monthly, aed_per_child_annual
        ) VALUES ('default', 2000, 24000, 50, 600);
      `);

      coreTablesInitialized = true;
    } catch (err: any) {
      console.warn("[Core Schema] Table initialization warning:", err.message);
    } finally {
      coreTablesInitPromise = null;
    }
  })();

  return coreTablesInitPromise;
}
