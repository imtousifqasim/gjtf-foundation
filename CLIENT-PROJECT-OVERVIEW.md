# Ghais Jhuggi Taleem Foundation (GJTF) — Project Overview & Client Handover Guide
*(Pakistani Nomadic Community "Jhuggi Nasheen" Educational Movement)*

---

## 📌 Executive Summary (خلاصہ برائے کلائنٹ)

This project is a **modern, high-performance, enterprise-grade digital platform** built specifically for the **Ghais Jhuggi Taleem Foundation (GJTF)**. It is designed to represent Pakistan's largest grassroots educational movement serving over **20 million nomadic ("Jhuggi Nasheen") community members**.

The platform is not just a static brochure website; it is an **all-in-one digital ecosystem** comprising:
1. **A World-Class Public Portal**: Inspiring, highly interactive, fast, and optimized for high-volume donations, volunteer enrollments, and international NGO credibility.
2. **An Advanced Admin Control Center (CMS & Backoffice)**: A secure, restricted backoffice where foundation staff can manage donations, volunteers, schools, stories, contact messages, site settings, newsletter subscribers, SMTP email notifications, and 2-Factor Authentication (2FA) security without touching any code.
3. **Rock-Solid Cloud Architecture**: Powered by **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL with Row Level Security)**.

---

## 🛠️ Complete Technology Stack & Why It Matters

| Layer | Technology | Why It Matters for the Client |
|---|---|---|
| **Frontend Framework** | **Next.js 15 (App Router)** & **React 19** | Super fast page loads (SSR & SSG), top Google SEO ranking, and lightning performance on both 4G mobile and desktop. |
| **Language** | **TypeScript 5** | Zero runtime crashes, strict enterprise-level code quality, and maintainability. |
| **Styling & UI** | **Tailwind CSS + Lucide Icons** | Custom NGO color palette (Inspiring Gold/Amber, Warm Emerald, Deep Slate), 100% mobile-responsive, modern aesthetic. |
| **Micro-Interactions** | **Framer Motion** | Animated counter statistics, smooth transitions, interactive Pakistani campus map, and modern card hover effects that build donor trust. |
| **Backend & Database** | **Supabase (PostgreSQL 15)** | Scalable cloud database, real-time updates, strict Row Level Security (RLS) data protection. |
| **Authentication & Security** | **Supabase Auth + TOTP 2FA** | Military-grade encrypted sessions, password protection, and optional Google Authenticator 2-Factor Authentication for admins. |
| **Email Engine** | **Nodemailer + SMTP Gateway** | Configurable directly inside the admin panel with live test emails, automated donation receipts, and contact alerts. |
| **Forms & Validation** | **React Hook Form + Zod** | Prevents bad data, protects against spam, and provides instantaneous feedback to users. |

---

## 🌐 Public Website Modules (مکمل پبلک پورٹل فیچرز)

### 1. High-Impact Home Page (`/`)
* **Hero Experience**: Immersive cinematic video background with clear call-to-actions ("Donate Now", "Become a Volunteer").
* **Live Impact Numbers**: Animated counters showing schools established, students enrolled, teachers trained, and communities reached.
* **Our 50-Year Vision & Model**: Explains how mobile classrooms and nomadic school units operate.
* **Core Programmes**: Highlighting primary education, digital tablet learning, and teacher mentorship.
* **Interactive Volunteer Bento Grid**: Modern visual grid showing avenues for youth, universities, and professionals.
* **Community Services Section**: Showcases vocational centers (stitching, embroidery), small business setups, and computer skills.
* **Campus Highlights**: Spotlight on flagship campuses (such as the Meghani Family Campus).
* **Video Success Stories**: Direct video documentaries showing real student transformations.
* **Newsletter Subscription**: Real-time email capture with instant duplicate check and validation.

### 2. Dedicated Volunteer Hub (3 Distinct Paths)
* **About GJTF Volunteers (`/about-gjtf-volunteers`)**:
  * Medical vs. Non-Medical volunteer tracks.
  * 11-item career and personal growth benefit grid.
  * Organizational volunteer hierarchy.
* **City Chapter Leads (`/city-chapter-leads`)**:
  * Targeted leadership program for metropolitan youth leaders.
  * Dynamic multi-field leadership application modal.
* **University Chapters (`/university-chapter`)**:
  * Campus ambassador and student society framework.
  * Direct partnership sign-up for colleges and universities.
* **General Volunteer (`/general-volunteer`)**:
  * Flexible hour commitments (part-time, weekend drives, teaching assistance).
  * Instant online submission synced to the Admin Dashboard.

### 3. Aims and Objectives (`/aims-and-objectives`)
* Pakistan education crisis context (UNICEF stats on out-of-school children).
* Detailed breakdown of the **50-Year Strategic Vision**.
* Introduction of **Digital Tablets & Tech-assisted learning** in nomadic slums.
* **Beneficiary Identity & Support Cards** distribution model.

### 4. Schools Directory & Interactive Campus Explorer
* **Directory Page (`/our-school`)**:
  * **Interactive Pakistan Map (SVG)**: Visual geographic distribution across provinces.
  * **Search & Filter Bar**: Instant filtering by province (Punjab, Sindh, KPK, Balochistan), city, and shift (Morning/Afternoon/Evening).
  * **2,033+ Unit Stat Banner**: Highlighting the ambitious scale of the foundation.
* **Dynamic Campus Details (`/school/[slug]`)**:
  * Each campus has its own dedicated URL (e.g., `/school/meghani-family-campus-primary-morning`).
  * Features campus specs: student capacity, classroom counts, square footage, established year.
  * Facility tags: Solar Power, Clean Drinking Water, Computer Lab, Science Lab, Library, Playground.
  * Dedicated photo gallery and direct **"Sponsor This Campus"** donation CTA.

### 5. News, Stories & Media Center
* **Hub Page (`/news-stories`)**:
  * Tabbed category filters: **All**, **Blogs**, **Events**, **Success Stories**, **GJTF in Media**, and **Video Documentaries**.
  * Keyword search bar with instant client-side filtering.
* **Story Article View (`/news-stories/[slug]`)**:
  * Rich storytelling layout with high-res imagery, author attribution, publication date, social sharing buttons, and related articles.

### 6. Multi-Step Smart Donation Engine (`/donate-now`)
Designed to convert visitors into recurring donors:
* **Cause Selection**: *General Education*, *Educate a Child*, *Support a Classroom*, or *Support a Child: KG to Matric*.
* **Frequency Modes**: *One-Time* or *Monthly Recurring*.
* **Dual Currency Support**: PKR (Pakistani Rupee) and AED (UAE Dirham).
* **Donation Classification**: *General Donation*, *Zakat*, or *Sadqah*.
* **Smart Impact Calculator**: Shows the tangible real-world outcome of the selected donation amount.
* **Bank Transfer Direct Verification**: Displays verified Pakistani bank accounts (Meezan Bank, Account Title, IBAN, SWIFT) with one-click copy buttons.
* **Instant Submission Tracking**: Generates a donation record in the database marked as `pending` or `completed` with full donor details.

### 7. Contact Us & Regional Offices (`/contact-us`)
* Direct Lahore Head Office details (New Liberty Tower, Model Town Link Road, Lahore).
* Toll-free helpline, WhatsApp click-to-chat, and mobile numbers.
* Interactive responsive Google Maps embed.
* Direct inquiry submission form with a live 180-character counter.

---

## 🔒 Backoffice & Admin Control Panel (`/admin`)

The client has full autonomy over their organization via a modern web interface. **No developer is needed for day-to-day operations.**

### 1. Executive Dashboard (`/admin`)
* Real-time metrics: Total Donations Raised, Total Volunteers Registered, Unread Inquiries, Active Subscribers.
* Visual progress meters and recent activity log.

### 2. Donations Management (`/admin/donations`)
* Searchable table with real-time status indicators (`Pending`, `Completed`, `Failed`).
* Filter by specific cause, payment currency, and date.
* Modal status editor to confirm bank transfers.
* **One-Click CSV Export**: Download complete financial donation records for bookkeeping and auditing.

### 3. Contact Queries Hub (`/admin/contact-messages`)
* Central inbox of all incoming citizen inquiries.
* Filter by `New`, `Read`, and `Archived`.
* One-click direct email reply button (`mailto:`) launching your mail client pre-addressed.

### 4. Volunteer Applicants Pipeline (`/admin/volunteer-signups`)
* Complete applicant profiles with contact details, city, university, and motivation notes.
* Categorized by track (*General*, *University Chapter*, *City Chapter Lead*).
* Direct click-to-call and click-to-email actions.

### 5. Newsletter Subscribers List (`/admin/subscribers`)
* Manage mailing list subscribers.
* Instant CSV export for integration with Mailchimp, Brevo, or bulk emailing campaigns.

### 6. Schools Directory CMS (`/admin/schools`)
* Add new campuses or update existing campus specifications (capacity, facilities, photos) on the fly without writing code.

### 7. Success Stories & Media CMS (`/admin/stories`)
* Publish new blog posts, press releases, video links, and beneficiary transformation stories.

### 8. SMTP Email Server Gateway (`/admin/smtp`)
* Configure any custom mail server (Google Workspace, Office 365, Zoho, Hostinger, cPanel SMTP).
* Built-in **"Send Test Email"** button to verify deliverability in seconds.
* Automatically sends transactional emails and notification alerts.

### 9. Master Site Settings & Security (`/admin/settings`)
* **Global Contact Info**: Update phone numbers, WhatsApp, emails, and address across the entire website from one form.
* **Social Media Handles**: Instant update for Facebook, Instagram, YouTube, TikTok, LinkedIn, and X (Twitter).
* **Two-Factor Authentication (2FA)**: Time-based One-Time Password (TOTP) QR code setup compatible with Google Authenticator or Microsoft Authenticator.
* **Database Quota & Health Monitor**: Live Supabase storage consumption counter and table record totals.

---

## 🛡️ Enterprise Security & Data Integrity

1. **Row Level Security (RLS)**: Public visitors can only submit forms and read published pages. Only authenticated administrators can inspect sensitive donor or financial data.
2. **Server Actions Architecture**: Database credentials and API secrets are never exposed to the client browser.
3. **Environment Isolation**: Live keys (`.env.local`) are stored securely and excluded from public repositories.
4. **Automated Error Handling**: Graceful fallback data prevents white screens even during upstream network hiccups.

---

## 📊 Summary of Client Benefits

1. **Brand Authority**: Elevates GJTF to the level of global institutions (UNICEF, TCF, Shaukat Khanum).
2. **Donor Conversion**: Frictionless donation forms with clear bank account details and impact metrics.
3. **Operational Efficiency**: Eliminates messy WhatsApp spreadsheets by consolidating volunteers, donors, and inquiries into one centralized dashboard.
4. **Zero Maintenance Burden**: Non-technical staff can update stories, campuses, phone numbers, and social links in seconds.
