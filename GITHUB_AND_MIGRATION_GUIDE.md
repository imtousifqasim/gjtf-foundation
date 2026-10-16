# GJTF Foundation — PC Migration & GitHub Security Guide
*(Dusray PC Par Transfer Karnay Aur Setup Ka Mukammal Tareeqa)*

---

## 📌 1. Sab Se Zaroori Files Jo Ready Kar Di Gayi Hain

Aap ke liye tamam zaroori cheezein project ke root folder mein save aur update kar di gayi hain:

1. **`SECRETS_FOR_NEW_PC.env.local`**:
   - Is file mein live **Hostinger MySQL Database**, **Supabase**, **Admin Credentials**, **2FA Emergency Codes**, aur **API Secrets** saved hain.
   - Naye PC par sirf is file ko rename kar ke `.env.local` banana hai.
2. **`PROJECT_MEMORY.md`**:
   - Is mein poore project ka complete blueprint (tamam 19 database tables, public pages, Donor Portal, Admin CRM, API endpoints, aur server actions) tafseel se darj hai.
3. **`FIRST_PROMPT_FOR_NEW_PC.txt`** (aur `First promt.txt`):
   - Naye PC par AI (ChatGPT, Claude, Cursor, Antigravity) ko dene wala master prompt.

---

## 🔒 2. Wo Cheezein Jo GitHub Par Push Nahi Hoti (Security Rules)

GitHub public ya shared repo par passwords aur tokens push nahi hone chahiye. Is project ke `.gitignore` mein ye cheezein pehle se protected hain:

| File / Folder | Wajah (Reason) | Kiya Karna Hai? |
|---|---|---|
| **`.env.local` / `.env`** | Is mein Hostinger MySQL ka password, Supabase keys, aur tokens hain. | Isey USB, private zip, ya secure chat se dusray PC par le jayein. |
| **`SECRETS_FOR_NEW_PC.env.local`** | Ye backup secrets file hai. Ye bhi `.gitignore` mein blocked hai taake leak na ho. | Isey folder ke sath USB ya ZIP mein naye PC par copy karein. |
| **`node_modules/`** | 500MB+ ka bhari folder jo har PC par fresh download hota hai. | Transfer karne ki zaroorat nahi. Naye PC par `npm install` chalayein. |
| **`.next/`** | Temporary build cache files. | Transfer karne ki zaroorat nahi. |

---

## 🚀 3. Dusray PC Par Project Shift Karnay Ka Tareeqa (Step-by-Step)

Aap 2 aasan tareeqon se project doosray computer par chala sakte hain:

### Tareeqa A: USB Drive Ya ZIP File Ke Zariye (Sab Se Asaan & Fastest)

1. **Copy Karein:**
   - Is computer se `GJTF – Foundation` folder ko USB drive mein copy karein.
   - *(Note: Transfer fast karne ke liye aap `node_modules` aur `.next` folder ko delete ya chor sakte hain).*
   - **Khaas dhyan rakhein** ke `SECRETS_FOR_NEW_PC.env.local` file project folder ke andar zaroor mojood ho.

2. **Naye PC Par Paste Karein:**
   - Naye PC par folder ko paste karein (e.g. `D:\Web\GJTF – Foundation`).

3. **Terminal / PowerShell Kholein Aur Yeh Commands Chalayein:**
   ```powershell
   # Step 1: Secrets file ko .env.local bana lein
   copy SECRETS_FOR_NEW_PC.env.local .env.local

   # Step 2: Dependencies install karein
   npm install

   # Step 3: Local Dev Server chalayein
   npm run dev
   ```

4. **Browser Kholein:**
   - `http://localhost:3000` par aap ki website chal paray gi!

---

### Tareeqa B: GitHub Repository Ke Zariye

1. **Is PC Se GitHub Par Push Karein:**
   ```bash
   git add .
   git commit -m "feat: complete project state with updated memory and donor portal"
   git push origin main
   ```
2. **Naye PC Par Clone Karein:**
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd "GJTF – Foundation"
   ```
3. **Secrets File Copy Karein:**
   - Kyun ke GitHub par passwords push nahi hote, is liye `SECRETS_FOR_NEW_PC.env.local` ko USB ya private message se project root folder mein rakhein aur command chalayein:
   ```powershell
   copy SECRETS_FOR_NEW_PC.env.local .env.local
   ```
4. **Run Karein:**
   ```bash
   npm install
   npm run dev
   ```

---

## 🤖 4. Naye PC Par AI (Antigravity / Cursor / Claude / ChatGPT) Ko Kaise Samjhana Hai?

Naye PC par aap ko AI ko shuru se kuch samjhanay ki zaroorat nahi!

1. Naye PC par apna editor (Antigravity / Cursor / VS Code) kholiye.
2. Root folder mein mojood **`FIRST_PROMPT_FOR_NEW_PC.txt`** (ya `First promt.txt`) ko open karein.
3. Is ka saara text copy karein (`Ctrl + A`, `Ctrl + C`).
4. AI Chat mein paste kar ke send karein (`Enter`).
5. **Kamaal:** AI foran `PROJECT_MEMORY.md` aur project structure parh kar 100% trained ho jaye ga!

---

## 🔑 5. Tamam Logins, APIs & Credentials (Quick Reference)

### 👑 1. Staff Admin Portal
- **Login URL:** `http://localhost:3000/admin/login`
- **Default Email:** `admin@gjtfoundation.com`
- **Default Password:** `Admin@GJTF2025!`
- **Secondary Admin:** `tousifdev@outlook.com`
- **2FA Emergency Recovery Codes:**
  - `GJTF-7821-9941`
  - `GJTF-5390-1284`
  - `GJTF-8842-6619`
  - `GJTF-3105-7792`

### 💙 2. Donor Self-Service Portal
- **Login URL:** `http://localhost:3000/donor/login`
- **Features:** OTP / Magic Link instant sign-in, password login, and reset password.
- **Pages:** `/donor/dashboard`, `/donor/donations`, `/donor/commitments`, `/donor/receipts`, `/donor/profile`.

### 🗄️ 3. Live Primary Database (Hostinger Cloud MySQL)
- **Host:** `srv1676.hstgr.io`
- **Port:** `3306`
- **User:** `u994156402_gjtff`
- **Password:** `2>RV>E~Lb`
- **Database:** `u994156402_gjtff`

### ☁️ 4. Backup Database (Supabase Cloud)
- **URL:** `https://giztmeevfsywsldylgxn.supabase.co`
- **Anon Key & Service Role:** Saved in `.env.local` and `SECRETS_FOR_NEW_PC.env.local`

### 💳 5. Official NGO Payment Accounts (From `payment_settings` & `bank_accounts`)
- **Bank Name:** Bank Islami
- **Account Title:** Ghais Jhuggi Taleem Foundation
- **Account Number:** `203756213050001`
- **IBAN:** `PK19BKIP0203756213050001`
- **Branch:** Allama Iqbal Town, Lahore
- **Swift Code:** Left empty until branch confirmation
- **JazzCash:** `0303-3934771`
- **EasyPaisa:** `0328-6477314`
- **Doorstep Hotline:** `04235236622` / `03033934771`

 
### 📧 6. Official Foundation Contact
- **Emails:** `jhuggitaleemiproject@gmail.com`, `admin@gjtfoundation.com`
- **Head Office:** Office # 46-47, First Floor, New Liberty Tower, Model Town Link Road, Lahore
