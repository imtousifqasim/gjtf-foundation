# 📧 GJTF Foundation — Production Transactional Email System Setup Guide

This document outlines the complete setup, DNS deliverability records (SPF, DKIM, DMARC), environment variables, database schema, and operational workflows for the Ghais Jhuggi Taleem Foundation (GJTF) transactional email platform.

---

## 1. Required Environment Variables

Add the following environment variables to your `.env.local` file and to your **Vercel Project Settings &rarr; Environment Variables**:

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `RESEND_API_KEY` | *(Optional / Recommended)* Resend API key for enterprise deliverability. | `re_123456789...` |
| `RESEND_FROM` | Sender address used by Resend API. | `Ghais Jhuggi Taleem Foundation <no-reply@gjtfoundation.com>` |
| `SMTP_HOST` | Hostinger or custom SMTP server host. | `smtp.hostinger.com` or `srv1676.hstgr.io` |
| `SMTP_PORT` | SMTP port (465 for SSL, 587 for TLS). | `465` (or `587`) |
| `SMTP_USER` | SMTP authentication user / email. | `info@gjtfoundation.com` |
| `SMTP_PASS` | SMTP authentication password. | `YourSecureEmailPassword` |
| `SMTP_FROM` | Default From address when sending via SMTP. | `info@gjtfoundation.com` |
| `CRON_SECRET` | Secret token protecting Vercel Cron endpoints from unauthorized hits. | `gjtf_cron_secret_` + 32-char random string |

> **Note on Dual Provider Support**: If `RESEND_API_KEY` is present, the system dispatches via Resend API with zero dependencies. If Resend is omitted or encounters a network timeout, it seamlessly falls back to your configured SMTP credentials (saved in Admin or `.env`).

---

## 2. DNS Deliverability Records (SPF, DKIM, DMARC)

To prevent emails from landing in Spam or Junk folders and ensure 100% inbox deliverability across Gmail, Outlook, Yahoo, and iCloud, add the following DNS records to your domain DNS manager (Hostinger DNS / Cloudflare / GoDaddy for `gjtfoundation.com`):

### A. SPF (Sender Policy Framework) Record
Allows receiving mail servers to verify that GJTF's email servers and Resend are authorized to send mail on behalf of `gjtfoundation.com`.

- **Type**: `TXT`
- **Name / Host**: `@` (or `gjtfoundation.com`)
- **TTL**: `3600` (or Auto)
- **Value**:
  ```text
  v=spf1 include:_spf.resend.com include:spf.hostinger.com ~all
  ```
  *(If only using Hostinger SMTP: `v=spf1 include:spf.hostinger.com ~all`)*

---

### B. DKIM (DomainKeys Identified Mail) Record
Cryptographically signs every outbound email to guarantee that message contents are not altered in transit.

#### For Resend:
When you add your domain in your Resend Dashboard (**Domains &rarr; Add Domain &rarr; `gjtfoundation.com`**), Resend generates 3 DKIM CNAME records. Add them to your DNS:

- **Record 1 (CNAME)**:
  - **Name**: `resend._domainkey`
  - **Value**: `dkim.resend.com`
- **Record 2 (TXT/CNAME)**:
  - As supplied in your Resend domain verification screen.

#### For Hostinger Mail:
Hostinger automatically configures DKIM on its webmail servers:
- **Type**: `TXT`
- **Name**: `hostingermail1._domainkey`
- **Value**: *(Copy the public key generated inside Hostinger hPanel &rarr; Emails &rarr; DNS Records)*

---

### C. DMARC (Domain-based Message Authentication, Reporting & Conformance) Record
Tells receiving mailboxes how to handle emails that fail SPF or DKIM checks, and generates aggregate deliverability reports.

- **Type**: `TXT`
- **Name / Host**: `_dmarc` (or `_dmarc.gjtfoundation.com`)
- **TTL**: `3600`
- **Value**:
  ```text
  v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@gjtfoundation.com; aspf=r; adkim=r
  ```
  - `p=quarantine`: Suspicious/spoofed emails are sent to Spam instead of Inbox.
  - `pct=100`: Applies to 100% of outbound emails.
  - `rua=...`: Deliverability feedback reports sent to your admin mailbox.

---

## 3. Database Schema & Tables

The system automatically verifies and creates the following tables in Hostinger MySQL (`u994156402_gjtff`) on server initialization:

### 1. `email_logs`
Logs every transactional email sent, recipient details, rendered HTML, plain text, delivery status, and errors:
```sql
CREATE TABLE IF NOT EXISTS email_logs (
  id VARCHAR(64) PRIMARY KEY,
  recipient_name VARCHAR(255) NULL,
  recipient_email VARCHAR(255) NOT NULL,
  email_type VARCHAR(64) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body_html LONGTEXT NOT NULL,
  body_text LONGTEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'sent',
  error_message TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created (created_at),
  INDEX idx_type (email_type),
  INDEX idx_status (status),
  INDEX idx_recipient (recipient_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. `donation_reminders`
Tracks scheduled and repeating pledge reminders:
```sql
CREATE TABLE IF NOT EXISTS donation_reminders (
  id VARCHAR(64) PRIMARY KEY,
  pledge_id VARCHAR(64) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  repeat_interval_days INT DEFAULT 0,
  max_reminders INT DEFAULT 1,
  sent_count INT DEFAULT 0,
  last_sent_at TIMESTAMP NULL,
  custom_message TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  unsubscribe_token VARCHAR(128) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pledge (pledge_id),
  INDEX idx_scheduled (scheduled_at),
  INDEX idx_status (status),
  INDEX idx_token (unsubscribe_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. `email_settings`
Stores auto-delete and log retention configurations:
```sql
CREATE TABLE IF NOT EXISTS email_settings (
  id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
  auto_delete_enabled TINYINT(1) DEFAULT 0,
  retention_days INT DEFAULT 30,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO email_settings (id, auto_delete_enabled, retention_days)
VALUES ('default', 0, 30);
```

---

## 4. Automated Workflows & Email Types

### 1. Volunteer Workflows
- **`volunteer_signup`**: Dispatched immediately upon form submission from `/about-gjtf-volunteers`, `/city-chapter-leads`, `/university-chapter`, or `/general-volunteer`. Includes the applicant's complete profile summary and next steps.
- **`volunteer_accepted`**: Dispatched when an admin clicks **Accept Application** in `/admin/volunteer-signups`. Welcomes applicant with onboarding next steps and orientation details.
- **`volunteer_rejected`**: Dispatched when an admin clicks **Reject / Archive** or **Delete Application**. Sends an appreciative, professional notification.
- **`volunteer_reply`**: Dispatched when an admin clicks **Reply via Email** in `/admin/volunteer-signups`. Sends the admin's custom message with GJTF branding.

### 2. Donor Workflows
- **`donation_received`**: Dispatched immediately when a donor submits a pledge on `/donate-now`. Contains Reference ID, cause, amount, frequency, and bank transfer instructions.
- **`donation_completed`**: Dispatched when an admin verifies payment and marks status as `completed`. Sends an official receipt and a direct button linking to the printable online receipt (`/receipt/[id]`).
- **`donation_pending`**: Dispatched when status is marked `pending`. Re-shares official Bank Islami, JazzCash, and EasyPaisa account details.
- **`donation_failed`**: Dispatched when status is marked `failed`. Explains the issue sympathetically with a direct "Try Donating Again" button.
- **`donation_reminder`**: Dispatched by Vercel Cron or on-demand via the admin **"Send Reminder Now"** button. Includes pledge details, optional admin note, and a signed one-click opt-out link.


---

## 5. Vercel Cron Jobs (`vercel.json`)

1. **Donation Reminders Cron**:
   - **Path**: `/api/cron/donation-reminders`
   - **Schedule**: `0 * * * *` (Hourly)
   - Checks for due active reminders where `scheduled_at <= NOW()` and pledge is still `pending`. Idempotent with automatic retry and repeat schedules.
2. **Log Auto-Cleanup Cron**:
   - **Path**: `/api/cron/cleanup-logs`
   - **Schedule**: `0 3 * * *` (Daily at 3:00 AM UTC)
   - Automatically purges email logs older than your selected retention period (7, 15, 30, or 90 days) if auto-cleanup is enabled in Admin settings.

---

## 6. Files Created & Modified

### New Files Created:
1. `lib/email/templates/baseLayout.ts` — Table-based responsive email layout.
2. `lib/email/templates/volunteerTemplates.ts` — Volunteer email templates (Signup, Accepted, Rejected, Reply).
3. `lib/email/templates/donationTemplates.ts` — Donor email templates (Received, Completed, Pending, Failed, Reminder).
4. `lib/email/sender.ts` — Unified transactional dispatcher & error logger.
5. `app/actions/emails.ts` — Server actions for email logs, volunteer replies, reminders, and cleanup settings.
6. `app/admin/email-logs/page.tsx` — Full-featured admin email logs audit dashboard.
7. `app/(public)/receipt/[id]/page.tsx` — Printable official tax-exempt receipt page.
8. `app/(public)/receipt/[id]/ReceiptPrintButton.tsx` — Client print button for receipts.
9. `app/(public)/unsubscribe-reminder/page.tsx` — Donor reminder unsubscribe landing page.
10. `app/api/donations/unsubscribe-reminder/route.ts` — Unsubscribe token processor.
11. `app/api/cron/donation-reminders/route.ts` — Automated hourly donation reminder cron.
12. `app/api/cron/cleanup-logs/route.ts` — Automated daily log cleanup cron.
13. `vercel.json` — Vercel Cron scheduling configuration.
14. `EMAIL_SETUP_GUIDE.md` — This comprehensive setup and DNS guide.

### Modified Files:
1. `lib/db/mysql.ts` — Added `email_logs`, `donation_reminders`, and `email_settings` tables and CRUD queries.
2. `app/actions/volunteer.ts` — Added non-blocking automated sign-up confirmation email dispatch.
3. `app/actions/donations.ts` — Added non-blocking automated pledge acknowledgment email dispatch.
4. `app/actions/admin.ts` — Added automated status-change emails (acceptance, rejection, receipt, bank instructions) and reminder auto-stopping.
5. `app/admin/layout.tsx` — Added "Email Logs" navigation link to the admin sidebar.
6. `app/admin/volunteer-signups/page.tsx` — Added Accept/Reject email triggers and interactive "Reply via Email" modal.
7. `app/admin/donations/page.tsx` — Added reminder scheduling modal, long-pending warning badge (>7 days), and receipt links.
