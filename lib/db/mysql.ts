import mysql, { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { createAdminClient } from "@/lib/supabase/server";

// Global pool caching for Next.js hot reloading
declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!global.__mysqlPool) {
    global.__mysqlPool = mysql.createPool({
      host: process.env.MYSQL_HOST || "srv1676.hstgr.io",
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || "u994156402_gjtff",
      password: process.env.MYSQL_PASSWORD || "2>RV>E~Lb",
      database: process.env.MYSQL_DATABASE || "u994156402_gjtff",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 15000,
    });
  }
  return global.__mysqlPool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const pool = getPool();
  const [results] = await pool.query(sql, params);
  return results as T;
}

// Helper for backup sync to Supabase (Secondary / Backup)
export async function syncBackupToSupabase(actionName: string, fn: (supabase: any) => Promise<any>) {
  try {
    const isConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-gjtf.supabase.co"
    );
    if (!isConfigured) return;

    const supabase = createAdminClient();
    const res = await fn(supabase);
    if (res?.error) {
      console.warn(`[Supabase Backup Sync] ${actionName} warning:`, res.error.message);
    }
  } catch (err: any) {
    console.warn(`[Supabase Backup Sync] ${actionName} failed (non-blocking):`, err.message);
  }
}

// -------------------------------------------------------------
// 1. Schools
// -------------------------------------------------------------
export async function getSchoolsDb(): Promise<any[]> {
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM schools ORDER BY created_at DESC"
  );
  return rows.map((s) => ({
    ...s,
    facilities: typeof s.facilities === "string" ? JSON.parse(s.facilities) : (s.facilities || []),
    gallery_images: typeof s.gallery_images === "string" ? JSON.parse(s.gallery_images) : (s.gallery_images || []),
    featured: Boolean(s.featured),
  }));
}

export async function saveSchoolDb(data: any): Promise<void> {
  const facilitiesJson = JSON.stringify(Array.isArray(data.facilities) ? data.facilities : []);
  const galleryJson = JSON.stringify(
    Array.isArray(data.galleryImages)
      ? data.galleryImages
      : Array.isArray(data.gallery_images)
      ? data.gallery_images
      : []
  );

  const sql = `
    INSERT INTO schools (
      id, slug, name, campus_type, shift, city, province, area_sq_ft,
      classrooms, student_capacity, current_students, established_year,
      description, facilities, card_image, hero_image, gallery_images, featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      slug = VALUES(slug),
      name = VALUES(name),
      campus_type = VALUES(campus_type),
      shift = VALUES(shift),
      city = VALUES(city),
      province = VALUES(province),
      area_sq_ft = VALUES(area_sq_ft),
      classrooms = VALUES(classrooms),
      student_capacity = VALUES(student_capacity),
      current_students = VALUES(current_students),
      established_year = VALUES(established_year),
      description = VALUES(description),
      facilities = VALUES(facilities),
      card_image = VALUES(card_image),
      hero_image = VALUES(hero_image),
      gallery_images = VALUES(gallery_images),
      featured = VALUES(featured);
  `;

  const params = [
    data.id,
    data.slug,
    data.name,
    data.campusType || data.campus_type || "Primary",
    data.shift || "Morning",
    data.city || "Karachi",
    data.province || "Punjab",
    Number(data.areaSqFt ?? data.area_sq_ft ?? 0),
    Number(data.classrooms ?? 0),
    Number(data.studentCapacity ?? data.student_capacity ?? 0),
    Number(data.currentStudents ?? data.current_students ?? 0),
    Number(data.establishedYear ?? data.established_year ?? 2024),
    data.description || "",
    facilitiesJson,
    data.cardImage || data.card_image || "",
    data.heroImage || data.hero_image || data.cardImage || data.card_image || "",
    galleryJson,
    data.featured ? 1 : 0,
  ];

  await query(sql, params);

  // Sync to Supabase as backup
  syncBackupToSupabase("saveSchool", (sb) =>
    sb.from("schools").upsert({
      id: data.id,
      slug: data.slug,
      name: data.name,
      campus_type: data.campusType || data.campus_type || "Primary",
      shift: data.shift || "Morning",
      city: data.city || "Karachi",
      province: data.province || "Punjab",
      area_sq_ft: Number(data.areaSqFt ?? data.area_sq_ft ?? 0),
      classrooms: Number(data.classrooms ?? 0),
      student_capacity: Number(data.studentCapacity ?? data.student_capacity ?? 0),
      current_students: Number(data.currentStudents ?? data.current_students ?? 0),
      established_year: Number(data.establishedYear ?? data.established_year ?? 2024),
      description: data.description || "",
      facilities: Array.isArray(data.facilities) ? data.facilities : [],
      card_image: data.cardImage || data.card_image || "",
      hero_image: data.heroImage || data.hero_image || data.cardImage || data.card_image || "",
      gallery_images: Array.isArray(data.galleryImages)
        ? data.galleryImages
        : Array.isArray(data.gallery_images)
        ? data.gallery_images
        : [],
      featured: Boolean(data.featured),
    })
  );
}

export async function deleteSchoolDb(id: string): Promise<void> {
  await query("DELETE FROM schools WHERE id = ?", [id]);
  syncBackupToSupabase("deleteSchool", (sb) => sb.from("schools").delete().eq("id", id));
}

// -------------------------------------------------------------
// 2. Stories
// -------------------------------------------------------------
export async function getStoriesDb(): Promise<any[]> {
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM stories ORDER BY published_at DESC"
  );
  return rows;
}

export async function saveStoryDb(data: any): Promise<void> {
  const bodyText = Array.isArray(data.content)
    ? data.content.join("\n\n")
    : (data.body || "");

  const sql = `
    INSERT INTO stories (
      id, slug, title, category, excerpt, body, cover_image_url,
      author_name, author_role, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      slug = VALUES(slug),
      title = VALUES(title),
      category = VALUES(category),
      excerpt = VALUES(excerpt),
      body = VALUES(body),
      cover_image_url = VALUES(cover_image_url),
      author_name = VALUES(author_name),
      author_role = VALUES(author_role);
  `;

  const params = [
    data.id,
    data.slug,
    data.title,
    data.category || "Success Stories",
    data.excerpt || "",
    bodyText,
    data.coverImage || data.cover_image_url || "",
    data.author?.name || data.author_name || "GJTF Editorial",
    data.author?.role || data.author_role || "Communications",
  ];

  await query(sql, params);

  // Sync to Supabase as backup
  syncBackupToSupabase("saveStory", (sb) =>
    sb.from("stories").upsert({
      id: data.id,
      slug: data.slug,
      title: data.title,
      category: data.category || "Success Stories",
      excerpt: data.excerpt || "",
      body: bodyText,
      cover_image_url: data.coverImage || data.cover_image_url || "",
      author_name: data.author?.name || data.author_name || "GJTF Editorial",
      author_role: data.author?.role || data.author_role || "Communications",
    })
  );
}

export async function deleteStoryDb(id: string): Promise<void> {
  await query("DELETE FROM stories WHERE id = ?", [id]);
  syncBackupToSupabase("deleteStory", (sb) => sb.from("stories").delete().eq("id", id));
}

// -------------------------------------------------------------
// 3. Donations
// -------------------------------------------------------------
export async function getDonationsDb(limit = 100): Promise<any[]> {
  return await query<RowDataPacket[]>(
    "SELECT * FROM donations ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
}

export async function createDonationDb(data: any): Promise<string> {
  const id = "dn_" + Math.random().toString(36).substring(2, 11);
  const sql = `
    INSERT INTO donations (
      id, cause, frequency, currency, amount, donation_type,
      country, donor_name, donor_email, donor_phone, status, payment_reference
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  const params = [
    id,
    data.cause,
    data.frequency,
    data.currency,
    data.amount,
    data.donation_type,
    data.country,
    data.donor_name || null,
    data.donor_email || null,
    data.donor_phone || null,
    data.status || "pending",
    data.payment_reference || null,
  ];

  await query(sql, params);

  // Sync to Supabase as backup
  syncBackupToSupabase("createDonation", (sb) =>
    sb.from("donations").insert({
      id,
      cause: data.cause,
      frequency: data.frequency,
      currency: data.currency,
      amount: data.amount,
      donation_type: data.donation_type,
      country: data.country,
      donor_name: data.donor_name || null,
      donor_email: data.donor_email || null,
      donor_phone: data.donor_phone || null,
      status: data.status || "pending",
      payment_reference: data.payment_reference || null,
    })
  );

  return id;
}

export async function updateDonationStatusDb(id: string, status: string): Promise<void> {
  await query("UPDATE donations SET status = ? WHERE id = ?", [status, id]);
  syncBackupToSupabase("updateDonationStatus", (sb) =>
    sb.from("donations").update({ status }).eq("id", id)
  );
}

export async function deleteDonationDb(id: string): Promise<void> {
  await query("DELETE FROM donations WHERE id = ?", [id]);
  syncBackupToSupabase("deleteDonation", (sb) => sb.from("donations").delete().eq("id", id));
}

// -------------------------------------------------------------
// 4. Contact Submissions
// -------------------------------------------------------------
export async function getContactMessagesDb(limit = 100): Promise<any[]> {
  return await query<RowDataPacket[]>(
    "SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
}

export async function createContactMessageDb(data: any): Promise<string> {
  const id = "msg_" + Math.random().toString(36).substring(2, 11);
  const sql = `
    INSERT INTO contact_submissions (id, name, email, subject, message, status)
    VALUES (?, ?, ?, ?, ?, ?);
  `;
  await query(sql, [id, data.name, data.email, data.subject, data.message, "new"]);

  syncBackupToSupabase("createContactMessage", (sb) =>
    sb.from("contact_submissions").insert({
      id,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: "new",
    })
  );

  return id;
}

export async function updateContactStatusDb(id: string, status: string): Promise<void> {
  await query("UPDATE contact_submissions SET status = ? WHERE id = ?", [status, id]);
  syncBackupToSupabase("updateContactStatus", (sb) =>
    sb.from("contact_submissions").update({ status }).eq("id", id)
  );
}

export async function deleteContactMessageDb(id: string): Promise<void> {
  await query("DELETE FROM contact_submissions WHERE id = ?", [id]);
  syncBackupToSupabase("deleteContactMessage", (sb) =>
    sb.from("contact_submissions").delete().eq("id", id)
  );
}

// -------------------------------------------------------------
// 5. Volunteer Signups
// -------------------------------------------------------------
export async function getVolunteerSignupsDb(limit = 100): Promise<any[]> {
  return await query<RowDataPacket[]>(
    "SELECT * FROM volunteer_signups ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
}

export async function createVolunteerSignupDb(data: any): Promise<string> {
  const id = "vol_" + Math.random().toString(36).substring(2, 11);
  const sql = `
    INSERT INTO volunteer_signups (id, type, full_name, email, phone, city, university, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  await query(sql, [
    id,
    data.type,
    data.full_name,
    data.email,
    data.phone,
    data.city,
    data.university || null,
    data.message || null,
    "new",
  ]);

  syncBackupToSupabase("createVolunteerSignup", (sb) =>
    sb.from("volunteer_signups").insert({
      id,
      type: data.type,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      university: data.university || null,
      message: data.message || null,
      status: "new",
    })
  );

  return id;
}

export async function updateVolunteerStatusDb(id: string, status: string): Promise<void> {
  await query("UPDATE volunteer_signups SET status = ? WHERE id = ?", [status, id]);
  syncBackupToSupabase("updateVolunteerStatus", (sb) =>
    sb.from("volunteer_signups").update({ status }).eq("id", id)
  );
}

export async function deleteVolunteerSignupDb(id: string): Promise<void> {
  await query("DELETE FROM volunteer_signups WHERE id = ?", [id]);
  syncBackupToSupabase("deleteVolunteerSignup", (sb) =>
    sb.from("volunteer_signups").delete().eq("id", id)
  );
}

// -------------------------------------------------------------
// 6. Newsletter Subscribers
// -------------------------------------------------------------
export async function getSubscribersDb(): Promise<any[]> {
  return await query<RowDataPacket[]>(
    "SELECT * FROM newsletter_subscribers ORDER BY created_at DESC"
  );
}

export async function addSubscriberDb(email: string): Promise<void> {
  const id = "sub_" + Math.random().toString(36).substring(2, 11);
  await query(
    "INSERT INTO newsletter_subscribers (id, email, status) VALUES (?, ?, 'active') ON DUPLICATE KEY UPDATE status = 'active'",
    [id, email]
  );

  syncBackupToSupabase("addSubscriber", (sb) =>
    sb.from("newsletter_subscribers").upsert({ email, status: "active" }, { onConflict: "email" })
  );
}

// -------------------------------------------------------------
// 7. Site Settings
// -------------------------------------------------------------
export async function getSiteSettingsDb(): Promise<any> {
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM site_settings WHERE id = 'default' LIMIT 1"
  );
  return rows[0] || null;
}

export async function saveSiteSettingsDb(settings: any): Promise<void> {
  const sql = `
    INSERT INTO site_settings (
      id, head_office_address, contact_person, telephone, mobile, whatsapp,
      email, secondary_email, toll_free, facebook_url, instagram_url,
      youtube_url, tiktok_url, twitter_url, linkedin_url
    ) VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      head_office_address = VALUES(head_office_address),
      contact_person = VALUES(contact_person),
      telephone = VALUES(telephone),
      mobile = VALUES(mobile),
      whatsapp = VALUES(whatsapp),
      email = VALUES(email),
      secondary_email = VALUES(secondary_email),
      toll_free = VALUES(toll_free),
      facebook_url = VALUES(facebook_url),
      instagram_url = VALUES(instagram_url),
      youtube_url = VALUES(youtube_url),
      tiktok_url = VALUES(tiktok_url),
      twitter_url = VALUES(twitter_url),
      linkedin_url = VALUES(linkedin_url),
      updated_at = NOW();
  `;
  const params = [
    settings.head_office_address || "",
    settings.contact_person || "",
    settings.telephone || "",
    settings.mobile || "",
    settings.whatsapp || "",
    settings.email || "",
    settings.secondary_email || "",
    settings.toll_free || "",
    settings.facebook_url || "",
    settings.instagram_url || "",
    settings.youtube_url || "",
    settings.tiktok_url || "",
    settings.twitter_url || "",
    settings.linkedin_url || "",
  ];

  await query(sql, params);

  syncBackupToSupabase("saveSiteSettings", (sb) =>
    sb.from("site_settings").upsert({
      id: "default",
      ...settings,
      updated_at: new Date().toISOString(),
    })
  );
}

// -------------------------------------------------------------
// 8. Admin Security & 2FA
// -------------------------------------------------------------
export async function getAdminSecurityDb(): Promise<any> {
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM admin_security WHERE id = 'default' LIMIT 1"
  );
  if (!rows[0]) return null;
  const row = rows[0];
  let recoveryCodes: string[] = [];
  if (Array.isArray(row.recovery_codes)) {
    recoveryCodes = row.recovery_codes;
  } else if (typeof row.recovery_codes === "string") {
    try {
      recoveryCodes = JSON.parse(row.recovery_codes);
    } catch {
      recoveryCodes = [];
    }
  }
  return {
    ...row,
    two_factor_enabled: Boolean(row.two_factor_enabled),
    recovery_codes: recoveryCodes,
  };
}

export async function saveAdminSecurityDb(security: any): Promise<void> {
  const codesJson = JSON.stringify(security.recovery_codes || []);
  const sql = `
    INSERT INTO admin_security (id, admin_email, two_factor_enabled, two_factor_secret, recovery_codes)
    VALUES ('default', ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      admin_email = VALUES(admin_email),
      two_factor_enabled = VALUES(two_factor_enabled),
      two_factor_secret = VALUES(two_factor_secret),
      recovery_codes = VALUES(recovery_codes),
      updated_at = NOW();
  `;
  await query(sql, [
    security.admin_email || "tousifdev@outlook.com",
    security.two_factor_enabled ? 1 : 0,
    security.two_factor_secret || "",
    codesJson,
  ]);

  syncBackupToSupabase("saveAdminSecurity", (sb) =>
    sb.from("admin_security").upsert({
      id: "default",
      admin_email: security.admin_email,
      two_factor_enabled: Boolean(security.two_factor_enabled),
      two_factor_secret: security.two_factor_secret,
      recovery_codes: security.recovery_codes,
      updated_at: new Date().toISOString(),
    })
  );
}

// -------------------------------------------------------------
// 9. SMTP Settings
// -------------------------------------------------------------
export async function getSmtpSettingsDb(): Promise<any> {
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM smtp_settings WHERE id = 'default' LIMIT 1"
  );
  if (!rows[0]) return null;
  return {
    ...rows[0],
    secure: Boolean(rows[0].secure),
  };
}

export async function saveSmtpSettingsDb(smtp: any): Promise<void> {
  const sql = `
    INSERT INTO smtp_settings (id, host, port, secure, user_name, password, from_name, from_email)
    VALUES ('default', ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      host = VALUES(host),
      port = VALUES(port),
      secure = VALUES(secure),
      user_name = VALUES(user_name),
      password = VALUES(password),
      from_name = VALUES(from_name),
      from_email = VALUES(from_email),
      updated_at = NOW();
  `;
  await query(sql, [
    smtp.host || "smtp.gmail.com",
    Number(smtp.port) || 587,
    smtp.secure ? 1 : 0,
    smtp.user_name || "",
    smtp.password || "",
    smtp.from_name || "Ghais Jhuggi Taleem Foundation",
    smtp.from_email || "info@gjtfoundation.com",
  ]);

  syncBackupToSupabase("saveSmtpSettings", (sb) =>
    sb.from("smtp_settings").upsert({
      id: "default",
      host: smtp.host,
      port: Number(smtp.port),
      secure: Boolean(smtp.secure),
      user_name: smtp.user_name,
      password: smtp.password,
      from_name: smtp.from_name,
      from_email: smtp.from_email,
      updated_at: new Date().toISOString(),
    })
  );
}

// -------------------------------------------------------------
// 10. Database Metrics
// -------------------------------------------------------------
export async function getDatabaseMetricsDb(): Promise<any> {
  const [
    donations,
    contactSubmissions,
    volunteerSignups,
    schools,
    stories,
    subscribers,
  ] = await Promise.all([
    query<RowDataPacket[]>("SELECT count(*) as cnt FROM donations"),
    query<RowDataPacket[]>("SELECT count(*) as cnt FROM contact_submissions"),
    query<RowDataPacket[]>("SELECT count(*) as cnt FROM volunteer_signups"),
    query<RowDataPacket[]>("SELECT count(*) as cnt FROM schools"),
    query<RowDataPacket[]>("SELECT count(*) as cnt FROM stories"),
    query<RowDataPacket[]>("SELECT count(*) as cnt FROM newsletter_subscribers"),
  ]);

  const c1 = donations[0]?.cnt || 0;
  const c2 = contactSubmissions[0]?.cnt || 0;
  const c3 = volunteerSignups[0]?.cnt || 0;
  const c4 = schools[0]?.cnt || 0;
  const c5 = stories[0]?.cnt || 0;
  const c6 = subscribers[0]?.cnt || 0;

  const totalRecords = c1 + c2 + c3 + c4 + c5 + c6;
  const estimatedSizeMb = 1.2 + (totalRecords * 4) / 1024;
  const quotaMb = 2048; // Hostinger MySQL standard allocation ~2GB
  const usagePercent = Number(((estimatedSizeMb / quotaMb) * 100).toFixed(2));

  return {
    provider: "Hostinger MySQL",
    host: process.env.MYSQL_HOST || "srv1676.hstgr.io",
    database: process.env.MYSQL_DATABASE || "u994156402_gjtff",
    user: process.env.MYSQL_USER || "u994156402_gjtff",
    port: 3306,
    backupSync: "Supabase PostgreSQL (Dual-Write Active)",
    totalRecords,
    tableCounts: {
      donations: c1,
      contactSubmissions: c2,
      volunteerSignups: c3,
      schools: c4,
      stories: c5,
      subscribers: c6,
    },
    estimatedSizeKb: Math.round(estimatedSizeMb * 1024),
    quotaMb,
    usagePercent,
    status: usagePercent > 85 ? "warning" : "healthy",
  };
}

// -------------------------------------------------------------
// 11. Page Contents (Live In-Line Visual Editor & Instant Hosting Persistence)
// -------------------------------------------------------------
function makeSafeContentId(pagePath: string, elementKey: string): string {
  const normPath = (pagePath || "/").replace(/\/$/, "") || "/";
  const raw = `${normPath}__${elementKey}`.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  if (raw.length <= 180) return raw;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `${raw.slice(0, 140)}_${Math.abs(hash)}`;
}

export async function getPageContentsDb(pagePath?: string): Promise<Record<string, { text?: string; url?: string }>> {
  const map: Record<string, { text?: string; url?: string }> = {};

  // 1. Load from hardcoded JSON file as base if available
  try {
    const fs = await import("fs");
    const path = await import("path");
    const jsonPath = path.join(process.cwd(), "data", "content", "site-content.json");
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.pages) {
        if (pagePath) {
          const norm = (pagePath || "/").replace(/\/$/, "") || "/";
          const pageData = parsed.pages[norm] || parsed.pages["*"] || {};
          Object.assign(map, pageData);
        } else {
          Object.values(parsed.pages).forEach((pageData: any) => {
            if (pageData && typeof pageData === "object") {
              Object.assign(map, pageData);
            }
          });
        }
      }
    }
  } catch {
    // Non-blocking in serverless/Vercel read-only
  }

  // 2. Fetch and overlay live changes from Hostinger MySQL
  try {
    let sql = "SELECT page_path, element_key, content_text, link_url FROM page_contents";
    const params: any[] = [];
    if (pagePath) {
      const norm = pagePath.replace(/\/$/, "") || "/";
      sql += " WHERE page_path = ? OR page_path = ? OR page_path = '*'";
      params.push(norm, norm === "/" ? "/" : norm + "/");
    }
    const rows = await query<RowDataPacket[]>(sql, params);
    for (const r of rows) {
      map[r.element_key] = {
        text: r.content_text !== null && r.content_text !== undefined ? r.content_text : undefined,
        url: r.link_url !== null && r.link_url !== undefined ? r.link_url : undefined,
      };
    }
  } catch (err: any) {
    console.error("Error fetching page_contents from Hostinger MySQL:", err.message);
  }

  return map;
}

export async function savePageContentsDb(
  items: Array<{ page_path: string; element_key: string; content_text?: string; link_url?: string }>
): Promise<{ success: boolean; count: number }> {
  if (!items || items.length === 0) return { success: true, count: 0 };

  const normPath = (items[0]?.page_path || "/").replace(/\/$/, "") || "/";

  // 1. Save to Hostinger MySQL (Primary Live Store for Vercel)
  for (const item of items) {
    const safeId = makeSafeContentId(item.page_path, item.element_key);
    const safeKey = item.element_key.slice(0, 180);
    const safePath = (item.page_path || "/").slice(0, 180);

    await query(
      `INSERT INTO page_contents (id, page_path, element_key, content_text, link_url)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         content_text = VALUES(content_text),
         link_url = VALUES(link_url),
         updated_at = CURRENT_TIMESTAMP`,
      [safeId, safePath, safeKey, item.content_text ?? null, item.link_url ?? null]
    );
  }

  // 2. Dual-persist to local hardcoded JSON file in development/localhost
  try {
    const fs = await import("fs");
    const path = await import("path");
    const jsonPath = path.join(process.cwd(), "data", "content", "site-content.json");
    let currentStore: any = { _info: "GJTF Foundation Content Store", pages: {} };
    if (fs.existsSync(jsonPath)) {
      try {
        currentStore = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      } catch {
        currentStore = { pages: {} };
      }
    }
    if (!currentStore.pages) currentStore.pages = {};
    if (!currentStore.pages[normPath]) currentStore.pages[normPath] = {};

    for (const item of items) {
      currentStore.pages[normPath][item.element_key] = {
        text: item.content_text,
        url: item.link_url,
      };
    }

    fs.writeFileSync(jsonPath, JSON.stringify(currentStore, null, 2), "utf-8");
  } catch {
    // Non-blocking on Vercel runtime (read-only filesystem)
  }

  // 3. Backup sync to Supabase
  syncBackupToSupabase("savePageContents", async (sb) => {
    const upsertRows = items.map((item) => ({
      id: makeSafeContentId(item.page_path, item.element_key),
      page_path: (item.page_path || "/").slice(0, 180),
      element_key: item.element_key.slice(0, 180),
      content_text: item.content_text || null,
      link_url: item.link_url || null,
    }));
    return sb.from("page_contents").upsert(upsertRows);
  });

  return { success: true, count: items.length };
}

// -------------------------------------------------------------
// 12. Dynamic Live Stats (Calculated directly from Schools DB)
// -------------------------------------------------------------
export async function getLiveStatsDb(): Promise<{
  totalSchools: number;
  totalStudents: number;
  yearsOfService: number;
  nomadsTargetMillion: number;
}> {
  try {
    const [schoolsRes] = await Promise.all([
      query<RowDataPacket[]>(
        "SELECT COUNT(*) as count, COALESCE(SUM(current_students), 0) as total_students, MIN(established_year) as min_year FROM schools"
      ),
    ]);

    const count = Number(schoolsRes[0]?.count) || 7;
    const students = Number(schoolsRes[0]?.total_students) || 7000;
    const currentYear = new Date().getFullYear();
    const minYear = Number(schoolsRes[0]?.min_year) || 2014;
    const years = Math.max(11, currentYear - minYear);

    return {
      totalSchools: count,
      totalStudents: students,
      yearsOfService: years,
      nomadsTargetMillion: 20,
    };
  } catch (err: any) {
    console.error("Error calculating live stats from DB:", err.message);
    return {
      totalSchools: 24,
      totalStudents: 7000,
      yearsOfService: 11,
      nomadsTargetMillion: 20,
    };
  }
}

// -------------------------------------------------------------
// 13. Complete Database SQL Backup Export
// -------------------------------------------------------------
export async function exportFullDatabaseSql(): Promise<string> {
  const pool = getPool();
  const tables = [
    "schools",
    "stories",
    "donations",
    "contact_submissions",
    "volunteer_signups",
    "newsletter_subscribers",
    "site_settings",
    "smtp_settings",
    "admin_security",
    "page_contents",
  ];

  let sqlDump = `-- =============================================================\n`;
  sqlDump += `-- Ghais Jhuggi Taleem Foundation (GJTF) Database Backup\n`;
  sqlDump += `-- Provider: Hostinger MySQL (srv1676.hstgr.io)\n`;
  sqlDump += `-- Database: ${process.env.MYSQL_DATABASE || "u994156402_gjtff"}\n`;
  sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
  sqlDump += `-- =============================================================\n\n`;
  sqlDump += `SET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n\n`;

  for (const table of tables) {
    try {
      const [createRows]: any = await pool.query(`SHOW CREATE TABLE \`${table}\``);
      if (!createRows || createRows.length === 0) continue;

      sqlDump += `-- -------------------------------------------------------------\n`;
      sqlDump += `-- Table structure for \`${table}\`\n`;
      sqlDump += `-- -------------------------------------------------------------\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
      sqlDump += `${createRows[0]["Create Table"]};\n\n`;

      const [rows]: any = await pool.query(`SELECT * FROM \`${table}\``);
      if (rows && rows.length > 0) {
        sqlDump += `-- Data for table \`${table}\` (${rows.length} rows)\n`;
        const columns = Object.keys(rows[0]);
        const colList = columns.map((c) => `\`${c}\``).join(", ");

        for (const row of rows) {
          const valList = columns
            .map((col) => {
              const val = row[col];
              if (val === null || val === undefined) return "NULL";
              if (typeof val === "number") return val;
              if (typeof val === "boolean") return val ? 1 : 0;
              if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
              const str = typeof val === "object" ? JSON.stringify(val) : String(val);
              return `'${str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
                switch (char) {
                  case "\0": return "\\0";
                  case "\x08": return "\\b";
                  case "\x09": return "\\t";
                  case "\x1a": return "\\z";
                  case "\n": return "\\n";
                  case "\r": return "\\r";
                  case "\"":
                  case "'":
                  case "\\":
                  case "%": return "\\" + char;
                  default: return char;
                }
              })}'`;
            })
            .join(", ");

          sqlDump += `INSERT INTO \`${table}\` (${colList}) VALUES (${valList});\n`;
        }
        sqlDump += `\n`;
      }
    } catch (tblErr: any) {
      sqlDump += `-- Warning: Could not dump table ${table}: ${tblErr.message}\n\n`;
    }
  }

  sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;
  sqlDump += `-- [End of GJTF Database Backup]\n`;
  return sqlDump;
}
