-- Migration: 20261017_pkr_proofs_storage.sql
-- Goal: PKR-only lock, payment proofs, drive folders, pledge access tokens, settings.

-- 1. payment_proofs
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

-- 2. drive_folders (for lazy folder creation and race-safety)
CREATE TABLE IF NOT EXISTS drive_folders (
  id VARCHAR(64) PRIMARY KEY,
  path_key VARCHAR(64) NOT NULL UNIQUE,
  folder_name VARCHAR(64) NOT NULL,
  drive_folder_id VARCHAR(128) NOT NULL,
  parent_folder_id VARCHAR(128) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_path_key (path_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. pledge_access_tokens (7-day single-pledge guest access)
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

-- 4. payment_proofs_settings
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

-- 5. Alter donations table
ALTER TABLE donations ADD COLUMN proof_status VARCHAR(32) NOT NULL DEFAULT 'none' AFTER status;
ALTER TABLE donations ADD COLUMN bank_transaction_ref VARCHAR(128) NULL AFTER bank_account_id;
ALTER TABLE donations ADD COLUMN confirmed_by VARCHAR(128) NULL AFTER bank_transaction_ref;
ALTER TABLE donations ADD COLUMN confirmed_at TIMESTAMP NULL AFTER confirmed_by;
ALTER TABLE donations ADD INDEX idx_proof_status (proof_status);
ALTER TABLE donations ADD UNIQUE INDEX uq_bank_tx_ref (bank_transaction_ref);

UPDATE donations SET proof_status = 'none' WHERE proof_status IS NULL OR proof_status = '';

-- 6. Alter app_settings for enabled_currencies
ALTER TABLE app_settings ADD COLUMN enabled_currencies JSON NULL;
UPDATE app_settings SET enabled_currencies = JSON_ARRAY('PKR') WHERE enabled_currencies IS NULL;
