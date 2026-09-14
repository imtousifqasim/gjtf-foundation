# GJTF Admin Setup & Supabase Configuration Guide

This guide walks you through setting up Supabase for the **Ghais Jhuggi Taleem Foundation (GJTF)** website, configuring database tables, setting up Row Level Security (RLS), and creating your first authenticated admin staff account.

---

## 1. Create a Supabase Project

1. Navigate to [Supabase](https://supabase.com) and create an account or sign in.
2. Click **New Project**.
3. Set your project details:
   - **Name**: `gjtf-foundation`
   - **Database Password**: Generate a secure password and save it in a password manager.
   - **Region**: Choose a region close to Pakistan (e.g., `Singapore` or `Frankfurt`).
4. Click **Create new project** and wait ~2 minutes for provisioning to complete.

---

## 2. Run Database Migrations

1. In your Supabase project dashboard, open the **SQL Editor** from the left navigation.
2. Click **New query**.
3. Copy and paste the entire contents of:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
4. Click **Run** (or `Ctrl + Enter`).
5. Verify that the following tables were created under **Table Editor**:
   - `profiles`
   - `donations`
   - `contact_submissions`
   - `volunteer_signups`
   - `schools`
   - `stories`

---

## 3. Configure Environment Variables

1. In your Supabase Dashboard, go to **Project Settings** (gear icon) -> **API**.
2. Copy the following credentials:
   - **Project URL**
   - **anon (public) key**
   - **service_role (secret) key**
3. In the root of this project, create or edit `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Allowed admin emails
ADMIN_EMAILS=jhuggitaleemiproject@gmail.com,gjtfoundation1@gmail.com

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 4. Create the First Admin User

1. In Supabase Dashboard, navigate to **Authentication** -> **Users**.
2. Click **Add User** -> **Create User**.
3. Enter:
   - **Email**: `admin@gjtfoundation.com` (or your staff email)
   - **Password**: Set a strong password
   - Check **Auto Confirm User?** to bypass email confirmation.
4. Click **Create User**.
5. Once created, copy the user's **User UID** (e.g., `12345678-abcd-...`).
6. Go back to **SQL Editor** and run the following command to grant admin rights:

```sql
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'admin@gjtfoundation.com';
```

*(Note: If the user was just created, the database trigger `on_auth_user_created` will have automatically inserted a corresponding row into `public.profiles`. The update query sets `is_admin = TRUE`.)*

---

## 5. Log in to the Admin Panel

1. Run the local development server:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:3000/admin/login
   ```
3. Enter your admin email and password.
4. You will be redirected to `/admin` where you can view:
   - **Donations**: Real-time pledges, status updates (pending/completed/failed), and CSV export.
   - **Contact Messages**: Public inquiries, read/archive status, and one-click `mailto:` replies.
   - **Volunteer Sign-ups**: Applications for General Volunteers, University Chapters, and City Chapter Leads.
   - **Schools Directory**: CRUD management for school campuses.
   - **Success Stories**: CRUD management for articles and video stories.

---

## 6. Payment Gateway Integration Note

The `/donate-now` form records donation pledges directly into the `donations` table with status `pending`. To wire in a live payment gateway (such as Stripe, JazzCash, or EasyPaisa):
1. Add your payment gateway API keys into `.env.local`.
2. Update `app/actions/donations.ts` to redirect the user to the gateway checkout session with the generated `donationId`.
3. Set up a Supabase Webhook / Next.js Route Handler at `app/api/webhooks/payment/route.ts` to listen for completed payment events and update `status = 'completed'`.
