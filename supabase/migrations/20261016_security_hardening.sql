-- ========================================================================
-- GJTF FOUNDATION ENTERPRISE HARDENING & RELIABILITY MIGRATION
-- Migration: 20261016_security_hardening.sql
-- Covers: P0 Admin Sessions, Contact Message Deletion & Replies, Retention
-- ========================================================================

-- 1. admin_sessions table for revocable edge/server admin authentication
CREATE TABLE IF NOT EXISTS admin_sessions (
  id VARCHAR(64) PRIMARY KEY,
  admin_email VARCHAR(255) NOT NULL,
  session_token_hash VARCHAR(128) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip VARCHAR(64) NULL,
  user_agent TEXT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hash (session_token_hash),
  INDEX idx_email (admin_email),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. admin_login_attempts for IP and account lockout hardening
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  identifier VARCHAR(191) PRIMARY KEY,
  failed_count INT NOT NULL DEFAULT 1,
  locked_until TIMESTAMP NULL,
  last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. contact_message_replies table for in-app contact message replies
CREATE TABLE IF NOT EXISTS contact_message_replies (
  id VARCHAR(64) PRIMARY KEY,
  message_id VARCHAR(64) NOT NULL,
  admin_id VARCHAR(128) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'sent',
  error TEXT NULL,
  provider_message_id VARCHAR(128) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  INDEX idx_msg_id (message_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. contact_messages_settings table for automated retention and auto-delete
CREATE TABLE IF NOT EXISTS contact_messages_settings (
  id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
  auto_delete_enabled TINYINT(1) DEFAULT 0,
  retention_days INT DEFAULT 30,
  delete_only_replied TINYINT(1) DEFAULT 0,
  last_cleanup_at TIMESTAMP NULL,
  last_cleanup_count INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO contact_messages_settings (id, auto_delete_enabled, retention_days, delete_only_replied)
VALUES ('default', 0, 30, 0);

-- 5. Add soft delete and reply tracking columns to contact_submissions
-- (Compatible with MySQL 5.7, 8.0, and MariaDB)
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP NULL;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS replied_by VARCHAR(128) NULL;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS phone VARCHAR(64) NULL;
