# Google Drive Storage & OAuth 2.0 Setup Guide
**GJTF Foundation — Automated Payment Proof Storage System**

This guide provides step-by-step instructions for configuring Google Drive as the secure, organized cloud storage backend for donor payment proof screenshots.

---

## 1. Architectural Architecture & Dedicated Account

### Why a Dedicated Google Account?
- **Quota Limitations:** Google Cloud Service Accounts have 0 GB of personal Google Drive storage by default and cannot own files in standard My Drive without Google Workspace Shared Drives.
- **Dedicated Security:** We use a dedicated Google Account (e.g. `proofs-gjtf@gmail.com` or `donations@gjtfoundation.com`) with 2-Step Verification enabled.
- **No Shared Passwords:** Admins never share the Google Account password. Human admins are granted individual **Viewer** access to the root folder, while the application authenticates autonomously via an OAuth 2.0 Refresh Token.

---

## 2. Google Cloud Console Setup

### Step 2.1: Enable Google Drive API
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project (or create a new project named `GJTF-Storage`).
3. Navigate to **APIs & Services > Library**.
4. Search for **Google Drive API** and click **Enable**.

### Step 2.2: Configure OAuth Consent Screen
1. Navigate to **APIs & Services > OAuth consent screen**.
2. Select **User Type: External** and click **Create**.
3. Fill in:
   - **App name:** `GJTF Foundation Storage`
   - **User support email:** `admin@gjtfoundation.com`
   - **Developer contact information:** `admin@gjtfoundation.com`
4. Under **Scopes**, click **Add or Remove Scopes**, select:
   - `.../auth/drive` (Full Drive access for managed root folder descendants)
5. **CRITICAL REQUIREMENT — Publish the App:**
   - On the OAuth consent screen dashboard, under **Publishing status**, click **PUBLISH APP** to move it to **"In production"**.
   - *Why this is mandatory:* If left in "Testing" mode, Google automatically expires refresh tokens after exactly **7 days**, breaking automated uploads. In production mode, refresh tokens remain persistent indefinitely until explicitly revoked.

### Step 2.3: Create Web Application OAuth Client ID
1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Select **Application type:** `Web application`.
4. Name: `GJTF Web Client`.
5. Under **Authorized redirect URIs**, add:
   - `https://developers.google.com/oauthplayground`
6. Click **Create**.
7. Note down:
   - **Client ID** (e.g. `xxxx-yyyy.apps.googleusercontent.com`)
   - **Client Secret** (e.g. `GOCSPX-zzzzzz`)
   > [!CAUTION]
   > Never commit `client_secret_*.json` into GitHub or paste secrets into client-side code. Add them strictly to environment variables.

---

## 3. Generate Persistent Refresh Token (OAuth Playground)

1. Open [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. Click the **Gear icon (Configuration)** in the top right corner:
   - Check **"Use your own OAuth credentials"**.
   - Enter your **OAuth Client ID**.
   - Enter your **OAuth Client Secret**.
3. In **Step 1 (Select & authorize APIs)** on the left panel:
   - Scroll to **Drive API v3**.
   - Select `https://www.googleapis.com/auth/drive`.
   - Click **Authorize APIs**.
4. Sign in using the **Dedicated Google Account** that owns the storage.
   - If prompted with "Google hasn't verified this app", click **Advanced > Go to GJTF Foundation Storage (unsafe)** and grant permissions.
5. In **Step 2 (Exchange authorization code for tokens)**:
   - Click **Exchange authorization code for tokens**.
6. Google Playground will display:
   - `Refresh token`: Copy this value (starts with `1//...`). This is your `GOOGLE_REFRESH_TOKEN`.

---

## 4. Google Drive Root Folder Setup & Permissions

1. Sign in to [Google Drive](https://drive.google.com/) using the dedicated account.
2. Create a new folder named: **`GJTF Payment Proofs`**.
3. Open the folder and copy the Folder ID from the browser URL:
   - URL format: `https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ`
   - The Root Folder ID is `1aBcDeFgHiJkLmNoPqRsTuVwXyZ`.
4. **Security Verification (Zero Public Permission):**
   - Right-click the folder > **Share**.
   - Under **General access**, verify that it is set to **Restricted** (Only people with access can open with the link).
   - Ensure it is **NOT** set to "Anyone with the link". The GJTF application includes an automated safety guard that flags any public root folder.
5. **Granting Admin Human Access:**
   - In the same Share modal, invite authorized foundation admins (e.g. `finance@gjtfoundation.com`) as **Viewer**.
   - Viewers can browse proofs directly in Google Drive without risk of modifying or accidentally deleting files.

---

## 5. Vercel Environment Variables Configuration

In the [Vercel Project Settings](https://vercel.com/) > **Environment Variables**, add the following for **Production** and **Preview**:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `PROOF_STORAGE_DRIVER` | `google-drive` | Storage driver selection |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | OAuth Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | OAuth Client Secret |
| `GOOGLE_REFRESH_TOKEN` | `1//...` | Persistent OAuth Refresh Token |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | `1aBcDeFgHiJkLmNoPq...` | ID of the "GJTF Payment Proofs" root folder |
| `GOOGLE_DRIVE_SCOPE_MODE` | `drive` | Scope mode (`drive` or `drive.file`) |
| `PROOF_FILENAME_MODE` | `reference` | `reference` (reference + sequence) or `random` (uuid) |
| `PROOF_ENCRYPTION` | `off` | `off` (viewable in Drive UI) or `on` (AES-256-GCM) |
| `PROOF_MASTER_KEY` | *(leave empty if off)* | 32-byte hex key (if encryption is `on`) |
| `APP_TIMEZONE` | `Asia/Karachi` | Timezone for Pakistan Standard Time Year/Month folders |
| `CRON_SECRET` | `random-32-char-secret` | Bearer token for Vercel Cron jobs |

---

## 6. Admin Panel Health Verification

1. Log in to the GJTF Foundation Admin Panel.
2. Navigate to **Payment Settings > Proof & Drive Storage** (`/admin/payment-settings/proof-storage`).
3. Click the **"Test Storage Connection"** button.
4. Verify the diagnostics:
   - **Connection Status:** Connected (Green).
   - **Root Folder:** Verified & Not Trashed.
   - **Sharing Permissions:** Private (No public links).
   - **Quota Usage:** Displays total storage, used GB, and remaining headroom.
   - **Target Folder Preview:** Confirms today's upload destination in PKT (e.g. `2026/10-October`).

---

## 7. Automatic Folder Hierarchy & Race Safety

Proofs are automatically organized by the upload timestamp in **`Asia/Karachi` (PKT)**:
```
GJTF Payment Proofs (Root Folder)
  ├── 2026
  │    ├── 10-October
  │    │    ├── GJTF-2026-000123_proof-1_20261016-1432.webp
  │    │    └── GJTF-2026-000124_proof-1_20261016-1505.webp
  │    ├── 11-November
  │    └── 12-December
  └── 2027
       └── 01-January
```

- **Ancestry Safety Lock:** The system verifies that every file belongs strictly within the root folder hierarchy before reading, streaming, or deleting.
- **Race Safety:** The `drive_folders` database table prevents concurrent uploads from creating duplicate folders when a new month begins.
- **Self-Healing:** If someone accidentally trashes a month folder in Google Drive, the system detects it, recreates the folder, updates the database cache, and stores the file seamlessly.
- **Daily Retention Cron:** Runs at `03:00 UTC` / `04:00 UTC` to purge proofs older than the configured retention period (default: 90 days after confirmation) while retaining financial audit records.
