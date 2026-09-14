-- =========================================================
-- Ghais Jhuggi Taleem Foundation (GJTF) Database Schema
-- Supabase Migration: 001_initial_schema.sql
-- =========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------
-- 1. Profiles (Linked 1:1 to auth.users for Admin Access)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (new.id, new.email, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ---------------------------------------------------------
-- 2. Donations Table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cause TEXT NOT NULL CHECK (cause IN ('General Education', 'Educate a Child', 'Support a Classroom', 'Support a Child: KG to Matric')),
  frequency TEXT NOT NULL CHECK (frequency IN ('once', 'monthly')),
  currency TEXT NOT NULL CHECK (currency IN ('PKR', 'AED')),
  amount NUMERIC(12, 2) NOT NULL,
  donation_type TEXT NOT NULL CHECK (donation_type IN ('General', 'Zakat', 'Sadqah')),
  country TEXT NOT NULL,
  donor_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_reference TEXT
);

-- ---------------------------------------------------------
-- 3. Contact Submissions Table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived'))
);

-- ---------------------------------------------------------
-- 4. Volunteer Signups Table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.volunteer_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('general', 'university_chapter', 'city_chapter')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  university TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'archived'))
);

-- ---------------------------------------------------------
-- 5. Schools Directory Table (CMS / Dynamic Data)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  campus_type TEXT NOT NULL DEFAULT 'Primary',
  shift TEXT NOT NULL DEFAULT 'Morning',
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  area_sq_ft INTEGER NOT NULL DEFAULT 6500,
  classrooms INTEGER NOT NULL DEFAULT 6,
  student_capacity INTEGER NOT NULL DEFAULT 180,
  current_students INTEGER NOT NULL DEFAULT 0,
  established_year INTEGER NOT NULL DEFAULT 2017,
  description TEXT NOT NULL,
  facilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  card_image TEXT NOT NULL,
  hero_image TEXT NOT NULL,
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 6. Success Stories Table (CMS / Dynamic Data)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'GJTF Team',
  author_role TEXT NOT NULL DEFAULT 'Communications',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Helper function to verify admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can view own profile; admins can view & update all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- Donations:
-- 1. Public can insert donations (anon insert)
CREATE POLICY "Public anon can insert donations"
  ON public.donations FOR INSERT
  WITH CHECK (true);

-- 2. Only authenticated admins can read, update, or delete donations
CREATE POLICY "Admins have full access to donations"
  ON public.donations FOR ALL
  USING (public.is_admin());

-- Contact Submissions:
-- 1. Public can insert contact submissions
CREATE POLICY "Public anon can insert contact submissions"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

-- 2. Only authenticated admins can read, update, or delete contact submissions
CREATE POLICY "Admins have full access to contact submissions"
  ON public.contact_submissions FOR ALL
  USING (public.is_admin());

-- Volunteer Signups:
-- 1. Public can insert volunteer signups
CREATE POLICY "Public anon can insert volunteer signups"
  ON public.volunteer_signups FOR INSERT
  WITH CHECK (true);

-- 2. Only authenticated admins can read, update, or delete volunteer signups
CREATE POLICY "Admins have full access to volunteer signups"
  ON public.volunteer_signups FOR ALL
  USING (public.is_admin());

-- Schools:
-- 1. Public read-only access
CREATE POLICY "Public read-only access to schools"
  ON public.schools FOR SELECT
  USING (true);

-- 2. Admins have full access to schools
CREATE POLICY "Admins have full access to schools"
  ON public.schools FOR ALL
  USING (public.is_admin());

-- Stories:
-- 1. Public read-only access
CREATE POLICY "Public read-only access to stories"
  ON public.stories FOR SELECT
  USING (true);

-- 2. Admins have full access to stories
CREATE POLICY "Admins have full access to stories"
  ON public.stories FOR ALL
  USING (public.is_admin());
