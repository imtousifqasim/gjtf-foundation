# GJTF Website — Client Meeting & Live Demo Walkthrough Guide
*(مرحلہ وار گائیڈ: کلائنٹ کو ویب سائٹ ڈیمو اور پریزنٹیشن دینے کا مکمل طریقہ)*

---

## 🎯 Meeting Objective (میٹنگ کا بنیادی مقصد)
To give the GJTF leadership/client complete confidence in their new digital platform by walking them through:
1. **The Public User Journey** (How a prospective donor or volunteer sees the organization).
2. **The Smart Donation & Volunteer Funnels** (How the website generates real impact & leads).
3. **The Powerful Admin Dashboard** (How their staff will manage everything effortlessly without a developer).

---

## ⏱️ Recommended 15-Minute Demo Agenda

| Duration | Section | Focus Area |
|---|---|---|
| **0 – 3 min** | **High-Impact Intro & Hero Page** | Mission, branding, modern video hero, live impact stats. |
| **3 – 6 min** | **Programs & Campuses Explorer** | Pakistan interactive map, school specifications, dynamic pages. |
| **6 – 9 min** | **Donation & Volunteer Funnels** | Multi-tier donation calculator, bank transfer details, volunteer tracks. |
| **9 – 13 min** | **Admin Control Panel (CMS)** | Live backoffice: donations, inquiries, schools CMS, settings & 2FA. |
| **13 – 15 min** | **Q&A & Handover Steps** | Next steps: domain pointing, SMTP setup, payment gateway roadmap. |

---

## 🗣️ Step-by-Step Presentation Script (ورلڈ کلاس پریزنٹیشن اسکرپٹ)

### Step 1: Opening & Home Page (`/`)

> **Talking Point (English):**
> *"We designed this platform with one single core objective: to match the scale of GJTF's monumental vision of educating 20 million nomadic children with a world-class, trusted digital presence that rivals top international NGOs like UNICEF, TCF, or Shaukat Khanum."*

> **Talking Point (Roman Urdu):**
> *"Assalam-o-Alaikum! Hamne GJTF ki is website ko international standards ke mutabiq build kiya hai. 20 million Jhuggi Nasheen bachon ke mission ko digital duniya mein wohi dignity aur credibility milni chahiye jo Shaukat Khanum ya The Citizens Foundation jaise idaron ko milti hai. Yeh sirf aam website nahi, balkay poora automated ecosystem hai."*

#### What to Show On Screen:
1. **Video Hero**: Scroll smoothly past the hero section. Highlight the bold headline, mission statement, and quick action buttons.
2. **Animated Stats Counter**: Show the dynamic count-up numbers (schools, students enrolled, teachers).
3. **50-Year Vision & Model**: Point out how clearly the nomadic education model is communicated.
4. **Community Services & Bento Grid**: Show the clean cards representing stitching centers, computer labs, and small business support.

---

### Step 2: Schools Directory & Pakistan Interactive Map (`/our-school`)

> **Talking Point (English):**
> *"Transparency is the #1 driver for international and local donors. Donors want to know where schools are located and what facilities they have. Here, we built an interactive geographical explorer."*

> **Talking Point (Roman Urdu):**
> *"Donors ke liye sab se ahem cheez transparency hoti hai. Hamne ek interactive Pakistan map aur filterable schools directory banayi hai jahan koi bhi donor province ya city select karke campuses dekh sakta hai."*

#### What to Show On Screen:
1. Click on **"Our Schools"** in the navigation bar.
2. Filter campuses by **Province** (e.g., Punjab / Sindh) or **Shift** (Morning / Afternoon).
3. Click on the **Meghani Family Campus** card.
4. Point out the dynamic page (`/school/[slug]`):
   * Square footage, student capacity, classroom counts.
   * Specific facility badges: Solar, Computer Lab, Clean Water, Library.
   * The dedicated photo gallery and the **"Sponsor This School"** CTA button.

---

### Step 3: Multi-Step Smart Donation Engine (`/donate-now`)

> **Talking Point (English):**
> *"Many NGO websites lose donations because their forms are confusing or outdated. Our donation widget provides a frictionless 3-step experience: selecting the cause, calculating student impact, and providing verified bank transfer details in PKR and AED."*

> **Talking Point (Roman Urdu):**
> *"Aksar NGO websites par donation process mushkil hota hai. Hamne yahan smart donation widget banaya hai. Donor 'Educate a Child' ya 'Zakat/Sadqah' choose karta hai, PKR ya AED select karta hai, aur system live batata hai ke us raqam se kitne bachon ki taleem sponsor hogi. Meezan Bank ke verified accounts aur IBAN ek click par copy ho jatay hain."*

#### What to Show On Screen:
1. Navigate to `/donate-now`.
2. Toggle between **PKR** and **AED**.
3. Toggle between **One-Time** and **Monthly**.
4. Select **"Support a Child: KG to Matric"** and pick an amount chip.
5. Highlight the **Bank Account Details section** (Account Title, Account Number, IBAN, Swift) and click the copy icon to show the instant copy confirmation.
6. Submit a test pledge to demonstrate that it saves instantly to the database without page reloads.

---

### Step 4: The 3 Volunteer Pathways

> **Talking Point (English):**
> *"GJTF relies on youth power. We created 3 distinct entry points so every kind of volunteer finds their fit: University Chapters, City Chapter Leads, and General Volunteers."*

> **Talking Point (Roman Urdu):**
> *"Youth GJTF ki backbone hai. Is liye humne 3 specific pathways banaye hain: University students ke liye University Chapter, professionals aur leaders ke liye City Chapter Leads, aur aam afrad ke liye General Volunteers. Form fill hote hi data foran admin panel mein chala jata hai."*

#### What to Show On Screen:
1. Open `/city-chapter-leads` or `/university-chapter`.
2. Show the professional layout, leadership benefits, and the application modal.

---

### Step 5: Admin Control Panel (The "Secret Weapon" Demo) (`/admin`)

> **Talking Point (English):**
> *"Here is the most powerful part of the project: Your internal backoffice. You do not need to call a developer every time a phone number changes, a new story happens, or a donor makes a transfer. Your staff has complete control."*

> **Talking Point (Roman Urdu):**
> *"Yeh is project ka sab se powerful hissa hai: Aapka mukammal Admin Control Center. Kisi phone number, address, new school ya blog post add karne ke liye developer ki zaroorat nahi. Aapki team khud har cheez yahan se manage kar sakti hai."*

#### What to Show On Screen:
1. Log into `/admin` with credentials.
2. **Dashboard Overview**: Show total donations raised, total volunteer count, unread inquiries.
3. **Donations Screen (`/admin/donations`)**:
   * Show the search bar and filter dropdowns.
   * Open the action modal to change a status from `pending` to `completed`.
   * Click **Export CSV** to demonstrate real-time Excel/CSV generation.
4. **Contact Messages (`/admin/contact-messages`)**:
   * Show received messages.
   * Point out the one-click `Reply` button that directly opens an email to the citizen.
5. **Volunteer Sign-ups (`/admin/volunteer-signups`)**:
   * Show incoming applicants with phone numbers, university names, and notes.
6. **Schools & Stories CMS (`/admin/schools` & `/admin/stories`)**:
   * Show how easily new campuses or blog stories can be published or updated.
7. **Global Site Settings (`/admin/settings`)**:
   * Show that updating the Head Office Address, Mobile, WhatsApp, or Social Links here automatically updates the entire website footer and contact page.
8. **Security & 2-Factor Authentication (2FA)**:
   * Show the TOTP QR Code setup for Google Authenticator.
   * Show the live Supabase Database health and storage monitor.

---

## 💡 Answers to Tough Client Questions (ممکنہ سوالات اور ان کے تسلی بخش جوابات)

### Q1: "How do we connect live online credit card / debit card payments?"
> **Answer:**
> *"The website is fully built and architected to support live payment gateways (such as Stripe for international credit cards, and PayFast, JazzCash, or EasyPaisa for local Pakistani payments). Currently, it captures the donation record and bank transfer pledges. As soon as your merchant accounts with the bank/gateway are approved, we just plug in the API keys and the checkout button activates automatically."*

### Q2: "Can non-technical staff manage this without breaking the website?"
> **Answer:**
> *"Yes, 100%. The admin panel is completely visual and intuitive. Forms have validation, so incorrect data cannot be submitted. Critical code files are completely protected, and changes happen safely via the admin dashboard."*

### Q3: "Is our donor data safe from hackers?"
> **Answer:**
> *"Yes. We implemented Supabase PostgreSQL with strict Row Level Security (RLS). Public visitors can only insert forms—they cannot view, scrape, or read any other donor's information. Only authenticated administrators with verified credentials (and optional 2-Factor Authentication) can access the data."*

### Q4: "How will the website perform on mobile phones and slow 3G/4G connections in Pakistan?"
> **Answer:**
> *"The site is built with Next.js 15 Server-Side Rendering (SSR) and Next.js Image Optimization. Assets are compressed, responsive breakpoints are tailored for all smartphone screens, and pages load in under 1.5 seconds even on standard mobile networks."*

---

## 🚀 Pre-Presentation Demo Checklist (ڈیمو شروع کرنے سے پہلے یہ چیک کر لیں)

- [ ] Ensure local dev server is running (`npm run dev`) or test on live Vercel staging URL.
- [ ] Open two browser windows:
  1. Incognito / Normal window for **Public Website** (`http://localhost:3000`).
  2. Tab ready at **Admin Login** (`http://localhost:3000/admin/login`).
- [ ] Have test credentials ready to sign in smoothly.
- [ ] Have a test donation and test volunteer inquiry ready to submit during the live demo to show instant real-time sync.
