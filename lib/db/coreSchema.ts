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
        "ALTER TABLE donations ADD COLUMN children_equivalent DECIMAL(8, 2) NOT NULL DEFAULT 1.00 AFTER amount_minor",
        "ALTER TABLE donations ADD COLUMN pricing_version INT NOT NULL DEFAULT 1 AFTER children_equivalent",
        "ALTER TABLE donations ADD COLUMN amount_pkr_minor BIGINT NULL AFTER pricing_version",
        "ALTER TABLE donations ADD COLUMN display_currency VARCHAR(10) NOT NULL DEFAULT 'PKR' AFTER amount_pkr_minor",
        "ALTER TABLE donations ADD COLUMN display_amount_minor BIGINT NULL AFTER display_currency",
        "ALTER TABLE donations ADD COLUMN fx_rate DECIMAL(16, 6) NULL AFTER display_amount_minor",
        "ALTER TABLE donations ADD COLUMN fx_buffer_pct DECIMAL(5, 2) NULL DEFAULT 1.00 AFTER fx_rate",
        "ALTER TABLE donations ADD COLUMN fx_locked_at TIMESTAMP NULL AFTER fx_buffer_pct",
        "ALTER TABLE donations ADD COLUMN fx_valid_until TIMESTAMP NULL AFTER fx_locked_at",
        "ALTER TABLE donations ADD COLUMN bank_account_id VARCHAR(64) NULL AFTER fx_valid_until",
        "ALTER TABLE donations ADD COLUMN received_amount_minor BIGINT NULL AFTER bank_account_id",
        "ALTER TABLE donations ADD COLUMN received_currency VARCHAR(10) NULL AFTER received_amount_minor",
        "ALTER TABLE donations ADD COLUMN received_pkr_minor BIGINT NULL AFTER received_currency",
        "ALTER TABLE donations ADD COLUMN idempotency_key VARCHAR(128) NULL UNIQUE AFTER received_pkr_minor",
        "ALTER TABLE donations ADD COLUMN payment_method VARCHAR(64) DEFAULT 'bank_transfer' AFTER status",
        "ALTER TABLE donations ADD COLUMN gateway_provider VARCHAR(64) NULL AFTER payment_method",
        "ALTER TABLE donations ADD COLUMN gateway_transaction_id VARCHAR(128) NULL AFTER gateway_provider",
        "ALTER TABLE donations ADD COLUMN proof_url VARCHAR(500) NULL AFTER gateway_transaction_id",
        "ALTER TABLE donations ADD COLUMN due_date DATE NULL AFTER proof_url",
        "ALTER TABLE donations ADD COLUMN paid_at TIMESTAMP NULL AFTER due_date",
        "ALTER TABLE donations ADD COLUMN failed_reason TEXT NULL AFTER paid_at",
        "ALTER TABLE donations ADD COLUMN admin_note TEXT NULL AFTER failed_reason",
        "ALTER TABLE donations ADD COLUMN is_anonymous TINYINT(1) DEFAULT 0 AFTER admin_note",
        // donation_plans new columns
        "ALTER TABLE donation_plans ADD COLUMN children_count DECIMAL(8, 2) NOT NULL DEFAULT 1.00 AFTER amount",
        "ALTER TABLE donation_plans ADD COLUMN pledge_basis VARCHAR(16) NOT NULL DEFAULT 'pkr_fixed' AFTER children_count",
        "ALTER TABLE donation_plans ADD COLUMN end_date DATE NULL AFTER next_due_date",
        "ALTER TABLE donation_plans ADD COLUMN total_cycles INT NULL AFTER cycles_completed",
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
          bank_name VARCHAR(255) DEFAULT 'Bank Islami',
          account_number VARCHAR(64) DEFAULT '203756213050001',
          iban VARCHAR(64) DEFAULT 'PK19BKIP0203756213050001',
          branch_name VARCHAR(255) DEFAULT 'Allama Iqbal Town, Lahore',
          swift_code VARCHAR(32) DEFAULT '',
          doorstep_enabled TINYINT(1) DEFAULT 1,
          doorstep_phone VARCHAR(64) DEFAULT '04235236622',
          cheque_enabled TINYINT(1) DEFAULT 1,
          bank_transfer_enabled TINYINT(1) DEFAULT 1,
          jazzcash_number VARCHAR(64) DEFAULT '03033934771',
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
          'default', 'Ghais Jhuggi Taleem Foundation', 'Bank Islami',
          '203756213050001', 'PK19BKIP0203756213050001', 'Allama Iqbal Town, Lahore', '',
          1, '04235236622', 1, 1,
          '03033934771', '0328-6477314', 'manual', 'test'
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

      // 10. app_settings (impact calculation formulas: PKR 5,000 / child-month)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
          pkr_per_child_monthly INT DEFAULT 5000,
          pkr_per_child_annual INT DEFAULT 60000,
          aed_per_child_monthly INT DEFAULT 67,
          aed_per_child_annual INT DEFAULT 800,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        INSERT INTO app_settings (
          id, pkr_per_child_monthly, pkr_per_child_annual, aed_per_child_monthly, aed_per_child_annual
        ) VALUES ('default', 5000, 60000, 67, 800)
        ON DUPLICATE KEY UPDATE
          pkr_per_child_monthly = 5000,
          pkr_per_child_annual = 60000;
      `);

      // 11. Ensure Section 15 tables (pricing_settings, fx_rates, bank_accounts)
      const { ensurePricingTablesDb } = await import("./pricingDb");
      const { ensureBankAccountsTableDb } = await import("./bankAccounts");
      await ensurePricingTablesDb();
      await ensureBankAccountsTableDb();

      coreTablesInitialized = true;
    } catch (err: any) {
      console.warn("[Core Schema] Table initialization warning:", err.message);
    } finally {
      coreTablesInitPromise = null;
    }
  })();

  return coreTablesInitPromise;
}
