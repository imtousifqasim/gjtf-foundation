-- ==============================================================================
-- GJTF FOUNDATION: SECTION 15 MIGRATION SCRIPT
-- Pricing Model (PKR 5,000/child-month), Single Bank Account (Bank Islami), Live AED FX
-- ==============================================================================

-- 1. Table: pricing_settings (Versioned single source of truth for child-month pricing)
CREATE TABLE IF NOT EXISTS pricing_settings (
  id VARCHAR(64) PRIMARY KEY,
  version INT NOT NULL UNIQUE,
  cost_per_child_month_minor BIGINT NOT NULL DEFAULT 500000,
  classroom_size INT NOT NULL DEFAULT 30,
  preset_child_counts JSON NOT NULL,
  min_custom_amount_pkr INT NOT NULL DEFAULT 500,
  max_custom_amount_pkr INT NOT NULL DEFAULT 10000000,
  sponsorship_months INT NOT NULL DEFAULT 120,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  effective_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(128) NOT NULL DEFAULT 'system',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Initial Version 1 (1 child = PKR 5,000, Classroom 30 = PKR 150,000)
INSERT IGNORE INTO pricing_settings (
  id, version, cost_per_child_month_minor, classroom_size, preset_child_counts,
  min_custom_amount_pkr, max_custom_amount_pkr, sponsorship_months, is_active, created_by
) VALUES (
  'pricing-v1', 1, 500000, 30, '[1, 2, 5, 10, 30, 50]',
  500, 10000000, 120, 1, 'system'
);

-- 2. Table: fx_rates (Cached AED/PKR rates with buffer and audit source)
CREATE TABLE IF NOT EXISTS fx_rates (
  id VARCHAR(64) PRIMARY KEY,
  base_currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  target_currency VARCHAR(10) NOT NULL DEFAULT 'AED',
  rate DECIMAL(16, 6) NOT NULL,
  pkr_per_aed DECIMAL(16, 6) NOT NULL,
  buffer_pct DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
  effective_rate DECIMAL(16, 6) NOT NULL,
  provider VARCHAR(64) NOT NULL DEFAULT 'manual',
  is_stale TINYINT(1) NOT NULL DEFAULT 0,
  fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pair (base_currency, target_currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default FX Rate (1 AED = 76.5 PKR with 1% buffer)
INSERT IGNORE INTO fx_rates (
  id, base_currency, target_currency, rate, pkr_per_aed, buffer_pct, effective_rate, provider, is_stale
) VALUES (
  'fx-default', 'PKR', 'AED', 0.013072, 76.500000, 1.00, 0.013203, 'manual', 0
);

-- 3. Table: bank_accounts (Single official account: Bank Islami)
CREATE TABLE IF NOT EXISTS bank_accounts (
  id VARCHAR(64) PRIMARY KEY,
  bank_name VARCHAR(255) NOT NULL,
  branch VARCHAR(255) NOT NULL,
  account_title VARCHAR(255) NOT NULL,
  account_number VARCHAR(64) NOT NULL,
  iban VARCHAR(64) NOT NULL,
  swift VARCHAR(32) NULL DEFAULT '',
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 1,
  instructions TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Official Bank Islami Account
INSERT INTO bank_accounts (
  id, bank_name, branch, account_title, account_number, iban, swift, currency, is_active, sort_order, instructions
) VALUES (
  'bank-islami-primary',
  'Bank Islami',
  'Allama Iqbal Town, Lahore',
  'Ghais Jhuggi Taleem Foundation',
  '203756213050001',
  'PK19BKIP0203756213050001',
  '',
  'PKR',
  1,
  1,
  'Please write your Reference Number (GJTF-YYYY-NNNNNN) in the transfer description/remarks so your pledge can be verified immediately.'
) ON DUPLICATE KEY UPDATE
  bank_name = VALUES(bank_name),
  branch = VALUES(branch),
  account_title = VALUES(account_title),
  account_number = VALUES(account_number),
  iban = VALUES(iban),
  swift = VALUES(swift),
  instructions = VALUES(instructions),
  updated_at = NOW();

-- 4. Update payment_settings table to Bank Islami details
UPDATE payment_settings
SET
  bank_name = 'Bank Islami',
  branch_name = 'Allama Iqbal Town, Lahore',
  account_title = 'Ghais Jhuggi Taleem Foundation',
  account_number = '203756213050001',
  iban = 'PK19BKIP0203756213050001',
  swift_code = '',
  updated_at = NOW()
WHERE id = 'default';

-- 5. Alter donations table with Section 15 tracking columns
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS children_equivalent DECIMAL(10, 2) NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS pricing_version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS amount_pkr_minor BIGINT NULL,
  ADD COLUMN IF NOT EXISTS display_currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  ADD COLUMN IF NOT EXISTS display_amount_minor BIGINT NULL,
  ADD COLUMN IF NOT EXISTS fx_rate DECIMAL(16, 6) NULL,
  ADD COLUMN IF NOT EXISTS fx_buffer_pct DECIMAL(5, 2) NULL DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS fx_locked_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS fx_valid_until TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS bank_account_id VARCHAR(64) NULL DEFAULT 'bank-islami-primary',
  ADD COLUMN IF NOT EXISTS received_amount_minor BIGINT NULL,
  ADD COLUMN IF NOT EXISTS received_currency VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS received_pkr_minor BIGINT NULL,
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128) NULL UNIQUE;

-- 6. Alter donation_plans table with Section 15 recurring columns
ALTER TABLE donation_plans
  ADD COLUMN IF NOT EXISTS children_count DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS pledge_basis ENUM('pkr_fixed', 'aed_fixed') NOT NULL DEFAULT 'pkr_fixed',
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS total_cycles INT NULL;

-- 7. Ensure app_settings has enrolled_children setting (default 1000)
INSERT INTO app_settings (setting_key, setting_value)
VALUES ('enrolled_children', '1000')
ON DUPLICATE KEY UPDATE updated_at = NOW();
