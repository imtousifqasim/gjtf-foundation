# PROJECT_MEMORY.md — Ghais Jhuggi Taleem Foundation (GJTF)

> **Complete Architectural Blueprint, Data Models, API Catalog, Donor Portal, and AI Context Memory**  
> *Target System: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Hostinger MySQL + Supabase*  
> *Last Updated: March 2026*

---

## 1. Project Overview & Mission

- **Organization:** Ghais Jhuggi Taleem Foundation (GJTF)
- **Mission:** Pakistan's premier educational movement delivering primary & secondary education, digital literacy labs, clean water, and nutritional support directly inside nomadic & slum settlements (*"Jhuggi Nasheen"*).
- **Core Goal of Web System:** High-converting, trustworthy portal for online donations, recurring commitments, donor self-service portal, volunteer recruitment (city leads, university chapters, general), school directory, press/story publishing, visual page customization, financial reports, and a comprehensive secure staff admin portal.
- **Repository Name:** `GJTF – Foundation`

---

## 2. Technology Stack & Runtime Specifications

| Layer | Technology | Details / Version |
|---|---|---|
| **Runtime / Node** | Node.js | `24.x` (or `>=20.x`), npm |
| **Framework** | Next.js 15 | App Router with Server Components by default (`^15.1.7`) |
| **Language** | TypeScript | Strict mode, Node 22+ types (`^5.7.3`) |
| **Styling** | Tailwind CSS | Custom warm NGO tokens & typography (`^3.4.17`) |
| **Motion** | Framer Motion | Dynamic stat counters, scroll animations (`^12.4.7`) |
| **Icons** | Lucide React | High-quality SVG icon set (`^0.475.0`) |
| **Primary Database** | Hostinger MySQL | Remote Cloud MySQL Server (`srv1676.hstgr.io:3306`), `mysql2` connection pooling |
| **Secondary / Backup DB** | Supabase | Postgres backup with `@supabase/ssr` & `@supabase/supabase-js` |
| **Form Management** | React Hook Form + Zod | Client validation with server action schemas |
| **Email Service** | Nodemailer + Resend API | Dual email delivery with HTML branded templates and delivery logging |
| **QR Code Engine** | `qrcode` | QR generation for donations, bank accounts, and 2FA TOTP |
| **Security & Cryptography** | Node crypto | PBKDF2 (100,000 rounds SHA-512) for passwords; SHA-256 for tokens |

---

## 3. Database Architecture & Dual-Sync Engine

The application implements a **Dual-Layer Database Strategy**:
1. **Primary Database (Hostinger Cloud MySQL):**
   - Direct connection via `mysql2/promise` with global connection pooling in `lib/db/mysql.ts`.
   - All website reads and writes default directly to Hostinger MySQL.
   - Core tables and enterprise donor schemas are auto-ensured via `lib/db/coreSchema.ts` (`ensureCoreTablesDb()`).
2. **Secondary Database (Supabase Cloud Postgres):**
   - Used for authentication sessions and automatic, non-blocking asynchronous backup sync (`syncBackupToSupabase`).
   - If Supabase is unreachable or unconfigured, the app falls back smoothly to MySQL without throwing errors.

### Hostinger MySQL Connection Parameters
- **Host:** `srv1676.hstgr.io`
- **Port:** `3306`
- **User:** `u994156402_gjtff`
- **Database:** `u994156402_gjtff`
- **Pool Settings:** 10 connections limit, keepalive enabled, 15s connection timeout.

---

## 4. Complete Database Schemas & Table Specifications

Managed through `lib/db/mysql.ts`, `lib/db/coreSchema.ts`, and `lib/db/donorDb.ts`.

### 1. `donors` (Enterprise Donor CRM & Portal)
- `id` (VARCHAR 64, PK) — e.g. `'dnr-001'`
- `name` (VARCHAR 255)
- `email` (VARCHAR 255, UNIQUE)
- `phone` (VARCHAR 64)
- `country` (VARCHAR 100, DEFAULT 'Pakistan')
- `password_hash` (VARCHAR 255) — PBKDF2 formatted hash (`pbkdf2$100000$salt$hash`)
- `email_verified_at` (TIMESTAMP)
- `status` (VARCHAR 32, DEFAULT 'active') — `'active'` | `'suspended'`
- `prefers_anonymous` (TINYINT 1, DEFAULT 0)
- `marketing_opt_in` (TINYINT 1, DEFAULT 1)
- `notification_prefs` (JSON)
- `last_login_at` (TIMESTAMP)
- `failed_login_count` (INT, DEFAULT 0)
- `locked_until` (TIMESTAMP)
- `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP)

### 2. `donation_plans` (Recurring Monthly Commitments)
- `id` (VARCHAR 64, PK) — e.g. `'plan-001'`
- `donor_id` (VARCHAR 64) — FK to `donors.id`
- `cause` (VARCHAR 128)
- `currency` (VARCHAR 10, DEFAULT 'PKR')
- `amount_minor` (BIGINT)
- `amount` (DECIMAL 12,2)
- `donation_type` (VARCHAR 32, DEFAULT 'General')
- `billing_day` (INT, DEFAULT 1)
- `start_date` (DATE), `next_due_date` (DATE)
- `status` (VARCHAR 32, DEFAULT 'active') — `'active'` | `'paused'` | `'cancelled'`
- `pause_until` (DATE)
- `cancelled_at` (TIMESTAMP)
- `cycles_completed` (INT, DEFAULT 0)
- `payment_method` (VARCHAR 64, DEFAULT 'bank_transfer')
- `gateway_subscription_id` (VARCHAR 128)
- `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP)

### 3. `donations` (Core Transactions & Pledges)
- `id` (VARCHAR 64, PK)
- `reference_no` (VARCHAR 64, UNIQUE) — e.g. `'GJTF-2026-000123'`
- `donor_id` (VARCHAR 64) — Linked donor
- `plan_id` (VARCHAR 64) — Linked recurring plan if part of monthly pledge
- `cause` (VARCHAR 100) — e.g. `'Educate a Child'`, `'Support a Classroom'`
- `frequency` (VARCHAR 50) — `'once'` | `'monthly'`
- `currency` (VARCHAR 10) — `'PKR'` | `'USD'` | `'GBP'` | `'AED'`
- `amount` (DECIMAL 12,2), `amount_minor` (BIGINT)
- `donation_type` (VARCHAR 50) — `'Zakat'` | `'Sadqah'` | `'General'`
- `country` (VARCHAR 100)
- `donor_name` (VARCHAR 255), `donor_email` (VARCHAR 255), `donor_phone` (VARCHAR 100)
- `status` (VARCHAR 50) — `'pending'` | `'completed'` | `'failed'`
- `payment_method` (VARCHAR 64) — `'bank_transfer'` | `'jazzcash'` | `'easypaisa'` | `'doorstep'` | `'cheque'`
- `gateway_provider` (VARCHAR 64), `gateway_transaction_id` (VARCHAR 128)
- `proof_url` (VARCHAR 500)
- `due_date` (DATE), `paid_at` (TIMESTAMP)
- `failed_reason` (TEXT), `admin_note` (TEXT), `is_anonymous` (TINYINT 1)
- `created_at` (DATETIME)

### 4. `donation_status_history` (Audit Ledger for Transactions)
- `id` (VARCHAR 64, PK)
- `donation_id` (VARCHAR 64)
- `old_status` (VARCHAR 32), `new_status` (VARCHAR 32)
- `changed_by` (VARCHAR 128)
- `note` (TEXT)
- `created_at` (TIMESTAMP)

### 5. `auth_tokens` (Secure High-Entropy Tokens)
- `id` (VARCHAR 64, PK)
- `donor_id` (VARCHAR 64)
- `type` (VARCHAR 64) — `'password_reset'` | `'set_password'` | `'email_verify'` | `'otp'` | `'magic_link'`
- `token_hash` (VARCHAR 128) — SHA-256 hash (raw token never stored)
- `expires_at` (TIMESTAMP), `used_at` (TIMESTAMP)
- `ip` (VARCHAR 64), `user_agent` (TEXT)
- `created_at` (TIMESTAMP)

### 6. `donor_sessions` (Server-Side Session Store)
- `id` (VARCHAR 64, PK)
- `donor_id` (VARCHAR 64)
- `session_token_hash` (VARCHAR 128, UNIQUE)
- `expires_at` (TIMESTAMP), `revoked_at` (TIMESTAMP)
- `ip` (VARCHAR 64), `user_agent` (TEXT)
- `created_at` (TIMESTAMP)

### 7. `receipts` (Official Donation Tax Receipts)
- `id` (VARCHAR 64, PK)
- `donation_id` (VARCHAR 64, UNIQUE)
- `receipt_no` (VARCHAR 64, UNIQUE) — e.g. `'REC-2026-0001'`
- `issued_at` (TIMESTAMP)
- `pdf_url` (VARCHAR 500)
- `access_token` (VARCHAR 128)

### 8. `payment_settings` (Dynamic Financial Credentials)
- `id` (VARCHAR 32, PK, DEFAULT 'default')
- `bank_title`, `bank_name`, `account_number`, `iban`, `branch_name`, `swift_code`
- `doorstep_enabled`, `doorstep_phone`
- `cheque_enabled`, `bank_transfer_enabled`
- `jazzcash_number`, `easypaisa_number`
- `gateway_provider`, `gateway_mode`, `gateway_api_key_encrypted`, `gateway_webhook_secret`
- `updated_at` (TIMESTAMP)

### 9. `audit_logs` (Append-Only Security Ledger)
- `id` (VARCHAR 64, PK)
- `actor_type` (VARCHAR 32), `actor_id` (VARCHAR 64)
- `action` (VARCHAR 128)
- `target_type` (VARCHAR 64), `target_id` (VARCHAR 64)
- `metadata` (JSON), `ip` (VARCHAR 64)
- `created_at` (TIMESTAMP)

### 10. `email_logs` (Transactional Email History)
- `id` (VARCHAR 64, PK)
- `recipient` (VARCHAR 255), `recipient_name` (VARCHAR 255)
- `email_type` (VARCHAR 64), `subject` (VARCHAR 255)
- `status` (VARCHAR 32) — `'sent'` | `'failed'` | `'pending'`
- `error_message` (TEXT), `metadata` (JSON)
- `sent_at` (TIMESTAMP)

### 11. `schools`
- `id` (VARCHAR 100, PK), `slug` (VARCHAR 255, UNIQUE), `name` (VARCHAR 255)
- `campus_type`, `shift`, `city`, `province`
- `area_sq_ft`, `classrooms`, `student_capacity`, `current_students`, `established_year`
- `description`, `facilities` (JSON), `card_image`, `hero_image`, `gallery_images` (JSON)
- `featured` (TINYINT 1), `created_at` (DATETIME)

### 12. `stories` (CMS Blogs & Media Coverage)
- `id` (VARCHAR 100, PK), `slug` (VARCHAR 255, UNIQUE), `title` (VARCHAR 500)
- `category` ('Blogs' | 'Success Stories' | 'GJTF in Media' | 'Events' | 'Videos')
- `excerpt`, `body` (LONGTEXT), `cover_image_url`, `author_name`, `author_role`
- `published_at` (DATETIME), `created_at` (DATETIME)

### 13. `volunteer_signups`
- `id` (VARCHAR 64, PK), `type` ('city_chapter' | 'university_chapter' | 'general')
- `full_name`, `email`, `phone`, `city`, `university`, `message`
- `status` ('new' | 'contacted' | 'approved' | 'archived')
- `created_at` (DATETIME)

### 14. `contact_submissions`
- `id` (VARCHAR 64, PK), `name`, `email`, `subject`, `message`
- `status` ('new' | 'read' | 'archived'), `created_at` (DATETIME)

### 15. `newsletter_subscribers`
- `id` (VARCHAR 64, PK), `email` (UNIQUE), `status`, `created_at` (DATETIME)

### 16. `site_settings`
- Global address, phone numbers, WhatsApp, social media URLs.

### 17. `smtp_settings`
- Host, port, secure, user_name, password, from_name, from_email.

### 18. `admin_security`
- TOTP 2FA secret, recovery codes, admin email.

### 19. `page_contents`
- Key-value overrides for the live visual text and banner editor.

---

## 5. API Endpoints Catalog

| Endpoint | Method | Params / Query | Purpose |
|---|---|---|---|
| `/api/data/[table]` | `GET` | `table`: `schools`, `stories`, `donations`, `contact-messages`, `volunteer-signups`, `subscribers`, `site-settings` | Fetches live rows directly from Hostinger MySQL in JSON format. |
| `/api/data/stats` | `GET` | — | Returns live counter statistics: `{ totalSchools: 24, totalStudents: 7000, yearsOfService: 11, nomadsTargetMillion: 20 }`. |
| `/api/qr` | `GET` | `?text=...&size=...` | Generates on-the-fly high-res PNG / SVG QR codes. |
| `/api/admin/database-backup` | `GET` | `?format=sql` or `?format=txt` | Exports and streams complete Hostinger MySQL SQL dump file directly to browser download. |
| `/api/admin/page-content` | `GET`, `POST` | `?page=...` | Reads and updates visual page content blocks for CMS editing. |
| `/api/cron/recurring-reminders` | `GET`, `POST` | `Bearer ${CRON_SECRET}` | Automates monthly recurring commitment reminders and updates billing cycles. |
| `/api/donations/receipt` | `GET` | `?ref=...` | Public receipt metadata provider. |

---

## 6. Server Actions Catalog (`app/actions/`)

All server actions run with Next.js path revalidation (`revalidatePath`):

1. **`app/actions/donorAuth.ts`**
   - `requestMagicLinkOrOtp(email, preferredMethod)`: Generates and emails secure login token.
   - `verifyOtpAction(email, code)` / `verifyTokenAction(token)`: Validates token and issues `gjtf_donor_session` httpOnly cookie.
   - `donorPasswordLoginAction(email, password)`: Authenticates donor via PBKDF2 hash.
   - `requestPasswordResetAction(email)`: Sends password reset email.
   - `completePasswordResetAction(token, newPassword)`: Updates donor password hash.
   - `logoutDonorAction()`: Revokes active session and clears cookie.

2. **`app/actions/donorPortal.ts`**
   - `getDonorDashboardDataAction()`: Zero-trust fetch of logged-in donor's donations, active commitments, and receipts.
   - `updateDonorProfileAction(data)`: Updates personal details and notification preferences.
   - `pauseDonationPlanAction(planId, pauseUntil)` / `cancelDonationPlanAction(planId)`: Manages recurring commitment lifecycle.

3. **`app/actions/adminDonors.ts`**
   - `getAdminDonorsAction(filters)`: Searchable donor directory with total given and status metrics.
   - `getAdminDonorDetailAction(id)`: Comprehensive donor profile with timeline and linked donations.
   - `updateDonorStatusAction(id, status)`: Suspends or reactivates donor account.
   - `resendDonorPortalInvite(id)`: Sends instant setup link to donor.

4. **`app/actions/admin.ts`**
   - `updateDonationStatus(id, status)`: Updates donation status, writes audit entry, and automatically generates receipt & sends email on completion.
   - `deleteDonation(id)`, `saveSchool(data)`, `deleteSchool(id)`, `saveStory(data)`, `deleteStory(id)`.

5. **`app/actions/emails.ts`**
   - `getAdminEmailLogsAction()`: Views outbound transactional emails with statuses and errors.
   - `retrySendEmailAction(logId)`: Retries sending failed emails.

6. **`app/actions/contact.ts`**, **`app/actions/donations.ts`**, **`app/actions/volunteer.ts`**, **`app/actions/newsletter.ts`**, **`app/actions/siteSettings.ts`**, **`app/actions/smtp.ts`**, **`app/actions/security.ts`**.

---

## 7. Complete Frontend Page Routing Matrix

### Public Website (`app/(public)/`)
- `/` — Homepage (Hero video background, Mission/Vision, Live animated counters, Model, Programmes, Bento Grid, Schools carousel, Success video stories).
- `/donate-now` — Multi-step donation funnel with custom amounts, causes, and payment instructions.
- `/about-gjtf-volunteers` — Volunteer manifesto, hierarchy, benefits grid, medical & educational tracks.
- `/city-chapter-leads` — Executive city chapters leadership recruitment.
- `/university-chapter` — University societies & campus leads onboarding.
- `/general-volunteer` — Community volunteers sign-up form.
- `/our-school` — Full interactive school directory with campus filter (Karachi, Lahore, Faisalabad, Raiwind, Sheikhupura, Rawalpindi).
- `/school/[slug]` — Deep-dive campus detail page with classroom specs, facilities list, and photo gallery.
- `/news-stories` — Press releases, media coverage, and success stories.
- `/blogs` — Educational articles and foundation updates.
- `/aims-and-objectives` — Strategic pillars and operational blueprint.
- `/contact-us` — Contact form, Google map, and live head-office contact cards.
- `/receipt/[reference_no]` — Public, printable official donation tax receipt.
- `/privacy-policy` — Official NGO privacy and data protection charter.
- `/unsubscribe-reminder` — Single-click donor notification opt-out.

### Donor Portal (`app/donor/`)
- `/donor/login` — Dual-mode donor login (OTP / Magic Link or Password).
- `/donor/dashboard` — Master donor dashboard: lifetime contributions, active children sponsored, commitment summary.
- `/donor/donations` — Complete historical ledger of one-time and recurring donations.
- `/donor/commitments` — Manage monthly pledges (pause, resume, cancel).
- `/donor/receipts` — Download and view official tax receipts.
- `/donor/profile` — Profile settings, phone, address, and email notification toggles.
- `/donor/set-password` — Token-authenticated password creation for new donors.
- `/donor/reset-password` — Self-service password reset.

### Admin Portal (`app/admin/`)
- `/admin/login` — Secure staff login with password & TOTP 2FA modal.
- `/admin` — Master dashboard with summary cards, database storage metrics, recent activity feeds.
- `/admin/donors` — Enterprise Donor CRM with search, filters, lifetime value, and status.
- `/admin/donors/[id]` — Deep donor drill-down view with transaction timeline.
- `/admin/donations` — Manage transactions, filter by status, export data.
- `/admin/payment-settings` — Live bank accounts (Bank Islami, JazzCash, EasyPaisa, Doorstep).

- `/admin/email-logs` — Transactional email delivery monitor and retry station.
- `/admin/reports` — Financial summaries, monthly recurring donor retention, cause breakdown.
- `/admin/schools` — Add/edit campus units, upload photo URLs, update student capacities.
- `/admin/stories` & `/admin/blogs` — Full CMS article creation, category tagging, Markdown/rich text body.
- `/admin/volunteer-signups` — Application review board for City Leads and volunteers.
- `/admin/contact-messages` — Inbox for public contact submissions.
- `/admin/subscribers` — Newsletter audience management.
- `/admin/visual-editor` — Live in-browser text and banner editor for homepage sections.
- `/admin/settings` — Organizational phone numbers, addresses, and social links.
- `/admin/smtp` — Outbound SMTP configuration & real-time test email sender.

---

## 8. Authentication & Security Reference

- **Admin Login:** `http://localhost:3000/admin/login`
- **Default Admin Email:** `admin@gjtfoundation.com`
- **Default Password:** `Admin@GJTF2025!`
- **Secondary Admin:** `tousifdev@outlook.com`
- **2FA Emergency Recovery Codes:**
  - `GJTF-7821-9941`
  - `GJTF-5390-1284`
  - `GJTF-8842-6619`
  - `GJTF-3105-7792`
- **Zero-Trust Donor Session:** `gjtf_donor_session` httpOnly, sameSite lax, secure cookie verified against hashed database sessions.

---

## 9. Developer Setup Commands

```bash
# 1. Copy secrets to .env.local
copy SECRETS_FOR_NEW_PC.env.local .env.local

# 2. Install dependencies
npm install

# 3. Launch local development server
npm run dev

# 4. Open in browser
http://localhost:3000
```
