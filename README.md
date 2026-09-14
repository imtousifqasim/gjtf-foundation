# Ghais Jhuggi Taleem Foundation (GJTF) — Official Website

> **Pakistan's largest educational and skill development movement for over 20 million nomadic communities ("Jhuggi Nasheen").**

This is the complete, modern, production-ready rebuild of the GJTF website built with Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, and Supabase.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components by default)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom warm NGO design system
- **UI Primitives:** Custom polished components (Buttons, Cards, Inputs, Dialogs, Tabs, Tables, Badges)
- **Animations:** Framer Motion (count-up stat counters, scroll reveals, interactive micro-animations)
- **Icons:** `lucide-react`
- **Database & Backend:** **Supabase** (Postgres + Row Level Security + Auth)
- **Forms:** React Hook Form + Server Actions + Zod schema validation
- **Images:** `next/image` with remote patterns configured
- **Typography:** Google Fonts (*Plus Jakarta Sans* for headings + *Inter* for body)

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Note: The app includes graceful development fallback data so you can test and preview all pages and admin workflows immediately even before plugging in live Supabase keys.)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live website.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## Routes & Pages

| Route | Page Name & Description |
|---|---|
| `/` | **Home Page** (Hero with video bg, About, Vision/Mission/Values, Stats Counter, Model, Programmes, Volunteer Bento, Community Services, Schools, 4 Video Success Stories) |
| `/about-gjtf-volunteers` | **About GJTF Volunteers** (Multi-paragraph intro, Medical vs Non-Medical tracks, 11-item benefit grid, Hierarchy, Join CTA) |
| `/city-chapter-leads` | **City Chapter Leads** (Executive city leadership, Personal growth, Career advancement, Perks, Application modal) |
| `/university-chapter` | **University Chapter** (Campus-level societies, Executive roles, Campus benefits, Application) |
| `/general-volunteer` | **General Volunteer** (Flexible volunteering, Ways to help, Time commitment tiers, Sign-up form) |
| `/aims-and-objectives` | **Aims and Objectives** (50-year vision, Education decline context, UNICEF stats, Digital tablets, Community services, Beneficiary cards) |
| `/our-school` | **Our Schools** (Campus specs comparison, 2,033 unit stat banner, Interactive Pakistan SVG map, Searchable & filterable directory) |
| `/school/[slug]` | **School Detail Page** (Dynamic campus page with facilities, specs, photo gallery, and donation CTA) |
| `/news-stories` | **Success Stories** (Tabbed filter: Blogs, Events, Success Stories, GJTF in Media, Videos) |
| `/news-stories/[slug]` | **Story Detail Page** (Full article view, author attribution, social share, related stories) |
| `/contact-us` | **Contact Us** (Google Maps embed, Lahore HQ & regional contacts, 180-char live counter form) |
| `/donate-now` | **Donate Now** (Multi-step widget: 4 causes, frequency, PKR/AED, chips, duration, student impact counter, 200+ countries, bank details) |
| `/admin/login` | **Admin Login** (Supabase Auth email/password login) |
| `/admin` | **Admin Dashboard** (Total donations count & sum, unread messages, volunteer count, recent activity stream) |
| `/admin/donations` | **Donations Table** (Search, cause & status filters, modal status updater, CSV export) |
| `/admin/contact-messages` | **Contact Messages** (Search, read/archive actions, mailto reply) |
| `/admin/volunteer-signups` | **Volunteer Sign-ups** (Filter by type, mark contacted/archived, call/email links) |
| `/admin/schools` | **Schools CMS** (Create, edit, and delete landmark school campuses) |
| `/admin/stories` | **Stories CMS** (Create, edit, and publish success stories & articles) |
| `/admin/settings` | **System Settings** (Supabase connection health check and RLS table overview) |

---

## 📷 MEDIA ASSET REPLACEMENT CHECKLIST

All media URLs across the entire site are centralized in a single file:
👉 **`data/media.ts`**

When you have the final high-resolution photos and videos ready, simply replace the URLs in that file. Below is the complete checklist of every media slot on the site:

### 1. Home Page (`/`)
- [x] `media.home.heroYouTubeId`: Background YouTube video (`nyZjxfqfu-c`, muted autoplay at 1m 40s with black overlay)
- [ ] `media.home.heroImage`: Hero background fallback image — Pakistani children in a bright classroom setting (Recommended: 1920x1080)
- [ ] `media.home.aboutSectionImage`: About Section — Jhuggi Taleemi Project teacher with slum children (1200x900)
- [ ] `media.home.educationProgrammes.connecting`: "Connecting with Jhuggi Nasheen children to make them comfortable" (900x600)
- [ ] `media.home.educationProgrammes.learningEnjoyable`: "Making learning enjoyable to encourage school attendance" (900x600)
- [ ] `media.home.educationProgrammes.passionateEducators`: "Passionate educators working hard to teach and mentor students" (900x600)
- [ ] `media.home.volunteerProgram.universityStudents`: "Students from partnered universities join our initiatives" (900x600)
- [ ] `media.home.volunteerProgram.teachingMentoring`: "Assisting in teaching and mentoring Jhuggi Nasheen children" (900x600)
- [ ] `media.home.volunteerProgram.workshops`: "Conducting workshops on vocational training and soft skills" (900x600)
- [ ] `media.home.volunteerProgram.awarenessEvents`: "Organizing awareness sessions and interactive events" (900x600)
- [ ] `media.home.volunteerProgram.youthChange`: "Encouraging youth to contribute to social change" (900x600)
- [ ] `media.home.communityServices.vocationalCenters`: Vocational Centers — stitching and handicrafts (900x600)
- [ ] `media.home.communityServices.smallBusiness`: Small Business Support — youth entrepreneurship (900x600)
- [ ] `media.home.communityServices.computerSkills`: Computer Skills Training — tablets/digital literacy (900x600)
- [ ] `media.home.communityServices.youthEmpowerment`: Youth Empowerment — self-sufficiency (900x600)
- [ ] `media.home.galleryImages[0..3]`: 4 Photo Gallery images showing smiling children, classrooms, and activities (800x800 square)

### 2. City Chapter Leads (`/city-chapter-leads`)
- [ ] `media.cityChapterLeads.heroImage`: Featured Hero Header image — youth leaders collaborating (1600x900)

### 3. University Chapter (`/university-chapter`)
- [ ] `media.universityChapter.heroImage`: Campus society leadership hero — university students (1600x900)

### 4. General Volunteer (`/general-volunteer`)
- [ ] `media.generalVolunteer.heroImage`: Community volunteering hero (1600x900)
- [ ] `media.generalVolunteer.mentoringField`: Volunteer mentor working directly with slum children (1200x900)

### 5. Aims and Objectives (`/aims-and-objectives`)
- [ ] `media.aimsAndObjectives.heroBanner`: Children studying in a classroom setting (1600x900)

### 6. Our School (`/our-school` & `/school/[slug]`)
- [ ] `media.ourSchool.heroBanner`: School building exterior (1600x900)
- [ ] `media.ourSchool.schools["meghani-family-campus-primary-morning"].cardImage`: Meghani Family Campus directory thumbnail (1000x650)
- [ ] `media.ourSchool.schools["meghani-family-campus-primary-morning"].heroImage`: Meghani Family Campus detail page banner (1800x900)
- [ ] `media.ourSchool.schools["meghani-family-campus-primary-morning"].galleryImages[0..3]`: 4 campus photo gallery images (classrooms, lab, playground, library)

### 7. Success Stories (`/news-stories` & `/news-stories/[slug]`)
- [ ] `media.newsStories.khanAcademyPartnership`: Khan Academy Partnership / AI-powered education (900x600)
- [ ] `media.newsStories.sadiaPoliceOfficer`: Sadia's Path from GJTF Graduate to Police Officer (900x600)
- [ ] `media.newsStories.myFateChanged`: Asad's journey from Landhi slum to Software Engineering (900x600)
- [ ] `media.newsStories.cmMuradAliShah`: CM Murad Ali Shah lauding GJTF efforts (900x600)
- [ ] `media.newsStories.mahiraKhanAppeal`: Mahira Khan's Ramzan appeal video/photo (900x600)
- [ ] `media.newsStories.witnessChangeVideo`: "Witness Change in Action" documentary thumbnail & embed URL (900x600)

### 8. Donate Now (`/donate-now`)
- [ ] `media.donateNow.heroBanner`: Hero banner at top of donation page (1920x900)

### 9. Contact Us (`/contact-us`)
- [ ] `media.contactUs.mapEmbedUrl`: Google Maps iframe embed URL for New Liberty Tower, Model Town Link Road, Lahore

### 10. Brand Assets
- [ ] `media.shared.logo`: Official GJTF brand color logo
- [ ] `media.shared.logoWhite`: Official GJTF white logo for dark footers

---

## Admin Panel & Database Setup

See **[README-admin-setup.md](README-admin-setup.md)** for detailed instructions on provisioning Supabase, running the database migration `supabase/migrations/001_initial_schema.sql`, configuring Row Level Security (RLS), and setting up your first admin credentials.
