import mysql, { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { createAdminClient } from "@/lib/supabase/server";
import { ensureCoreTablesDb } from "./coreSchema";

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
// High-Performance In-Memory Cache (Sub-millisecond reads)
// -------------------------------------------------------------
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __dbMemoryCache: Map<string, CacheEntry<any>> | undefined;
}

if (!global.__dbMemoryCache) {
  global.__dbMemoryCache = new Map<string, CacheEntry<any>>();
}

export function getCached<T>(key: string): T | null {
  const cache = global.__dbMemoryCache!;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlSeconds: number = 60): void {
  const cache = global.__dbMemoryCache!;
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function invalidateDbCache(prefix?: string): void {
  const cache = global.__dbMemoryCache;
  if (!cache) return;
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

// -------------------------------------------------------------
// 1. Schools
// -------------------------------------------------------------
export async function getSchoolsDb(): Promise<any[]> {
  const cached = getCached<any[]>("schools:all");
  if (cached) return cached;

  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM schools ORDER BY created_at DESC"
  );
  const result = rows.map((s) => ({
    ...s,
    facilities: typeof s.facilities === "string" ? JSON.parse(s.facilities) : (s.facilities || []),
    gallery_images: typeof s.gallery_images === "string" ? JSON.parse(s.gallery_images) : (s.gallery_images || []),
    featured: Boolean(s.featured),
  }));

  setCached("schools:all", result, 60);
  return result;
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
  invalidateDbCache("schools");
  invalidateDbCache("stats");
}

export async function deleteSchoolDb(id: string): Promise<void> {
  await query("DELETE FROM schools WHERE id = ?", [id]);
  invalidateDbCache("schools");
  invalidateDbCache("stats");
  syncBackupToSupabase("deleteSchool", (sb) => sb.from("schools").delete().eq("id", id));
}

// -------------------------------------------------------------
// 2. Stories
// -------------------------------------------------------------
export async function getStoriesDb(): Promise<any[]> {
  const cached = getCached<any[]>("stories:all");
  if (cached) return cached;

  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM stories ORDER BY published_at DESC"
  );
  setCached("stories:all", rows, 60);
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
  invalidateDbCache("stories");
}

export async function deleteStoryDb(id: string): Promise<void> {
  await query("DELETE FROM stories WHERE id = ?", [id]);
  invalidateDbCache("stories");
  syncBackupToSupabase("deleteStory", (sb) => sb.from("stories").delete().eq("id", id));
}

// -------------------------------------------------------------
// 3. Donations
// -------------------------------------------------------------
export async function getDonationsDb(limit = 100): Promise<any[]> {
  const cacheKey = `donations:${limit}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM donations ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  setCached(cacheKey, rows, 30);
  return rows;
}

export async function getDonationStatsDb(): Promise<{
  byCurrency: Array<{ currency: string; totalAmount: number; count: number; completedAmount: number }>;
  totalPledges: number;
}> {
  const cacheKey = "donations:stats";
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  try {
    const [rows, totalRes] = await Promise.all([
      query<RowDataPacket[]>(
        `SELECT 
          UPPER(TRIM(currency)) as currency, 
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as completed_amount,
          COUNT(*) as count
        FROM donations 
        GROUP BY UPPER(TRIM(currency))
        ORDER BY total_amount DESC`
      ),
      query<RowDataPacket[]>("SELECT COUNT(*) as total FROM donations"),
    ]);

    const result = {
      byCurrency: (rows || []).map((r) => ({
        currency: r.currency || "PKR",
        totalAmount: Number(r.total_amount) || 0,
        completedAmount: Number(r.completed_amount) || 0,
        count: Number(r.count) || 0,
      })),
      totalPledges: Number(totalRes[0]?.total) || 0,
    };
    setCached(cacheKey, result, 30);
    return result;
  } catch (err: any) {
    console.error("Error calculating donation stats:", err.message);
    return { byCurrency: [], totalPledges: 0 };
  }
}

export async function getDonationByIdempotencyKeyDb(key: string): Promise<any | null> {
  if (!key || key.trim() === "") return null;
  await ensureCoreTablesDb();
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM donations WHERE idempotency_key = ? LIMIT 1",
    [key.trim()]
  );
  return rows[0] || null;
}

export async function createDonationDb(data: any): Promise<string> {
  await ensureCoreTablesDb();

  // Idempotency check: prevent duplicate pledges on double clicks
  if (data.idempotency_key) {
    const existing = await getDonationByIdempotencyKeyDb(data.idempotency_key);
    if (existing) {
      return existing.id;
    }
  }

  const id = data.id || "dn_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
  const currentYear = new Date().getFullYear();
  const referenceNo = data.reference_no || `GJTF-${currentYear}-${Math.floor(100000 + Math.random() * 900000)}`;
  const amountMinor = data.amount_minor || Math.round((Number(data.amount) || 0) * 100);
  const amountPkrMinor = data.amount_pkr_minor || amountMinor;
  const displayAmountMinor = data.display_amount_minor || amountMinor;

  const sql = `
    INSERT INTO donations (
      id, reference_no, donor_id, plan_id, cause, frequency, currency,
      amount_minor, amount, children_equivalent, pricing_version, amount_pkr_minor,
      display_currency, display_amount_minor, fx_rate, fx_buffer_pct, fx_locked_at,
      fx_valid_until, bank_account_id, idempotency_key, donation_type, country,
      donor_name, donor_email, donor_phone, status, payment_method, payment_reference,
      is_anonymous, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());
  `;
  const params = [
    id,
    referenceNo,
    data.donor_id || null,
    data.plan_id || null,
    data.cause,
    data.frequency || "once",
    (data.currency || "PKR").toUpperCase(),
    amountMinor,
    data.amount,
    data.children_equivalent || 1.0,
    data.pricing_version || 1,
    amountPkrMinor,
    (data.display_currency || data.currency || "PKR").toUpperCase(),
    displayAmountMinor,
    data.fx_rate || null,
    data.fx_buffer_pct || 1.0,
    data.fx_locked_at || null,
    data.fx_valid_until || null,
    data.bank_account_id || "bank-islami-primary",
    data.idempotency_key || null,
    data.donation_type || "General",
    data.country || "Pakistan",
    data.donor_name || null,
    data.donor_email || null,
    data.donor_phone || null,
    data.status || "pending",
    data.payment_method || "bank_transfer",
    data.payment_reference || referenceNo,
    data.is_anonymous ? 1 : 0,
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
      payment_reference: referenceNo,
    })
  );

  invalidateDbCache("donations");
  return id;
}

export async function updateDonationStatusDb(id: string, status: string): Promise<void> {
  await query("UPDATE donations SET status = ? WHERE id = ?", [status, id]);
  invalidateDbCache("donations");
  syncBackupToSupabase("updateDonationStatus", (sb) =>
    sb.from("donations").update({ status }).eq("id", id)
  );
}

export async function deleteDonationDb(id: string): Promise<void> {
  await query("DELETE FROM donations WHERE id = ?", [id]);
  invalidateDbCache("donations");
  syncBackupToSupabase("deleteDonation", (sb) => sb.from("donations").delete().eq("id", id));
}

// -------------------------------------------------------------
// 4. Contact Submissions
// -------------------------------------------------------------
export async function getContactMessagesDb(limit = 100): Promise<any[]> {
  const cacheKey = `contact_messages:${limit}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  await ensureCoreTablesDb();
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM contact_submissions WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  setCached(cacheKey, rows, 30);
  return rows;
}

export async function createContactMessageDb(data: any): Promise<string> {
  await ensureCoreTablesDb();
  const id = "msg_" + Math.random().toString(36).substring(2, 11);
  const sql = `
    INSERT INTO contact_submissions (id, name, email, subject, message, status)
    VALUES (?, ?, ?, ?, ?, ?);
  `;
  await query(sql, [id, data.name, data.email, data.subject, data.message, "new"]);
  invalidateDbCache("contact_messages");

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
  await ensureCoreTablesDb();
  await query("UPDATE contact_submissions SET status = ? WHERE id = ? AND deleted_at IS NULL", [status, id]);
  invalidateDbCache("contact_messages");
  syncBackupToSupabase("updateContactStatus", (sb) =>
    sb.from("contact_submissions").update({ status }).eq("id", id)
  );
}

export async function deleteContactMessageDb(id: string): Promise<boolean> {
  await ensureCoreTablesDb();
  const res: any = await query(
    "UPDATE contact_submissions SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL",
    [id]
  );
  invalidateDbCache("contact_messages");
  const affected = (res?.affectedRows || 0) > 0;
  if (affected) {
    syncBackupToSupabase("deleteContactMessage", (sb) =>
      sb.from("contact_submissions").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    );
  }
  return affected;
}

export async function deleteContactMessagesBulkDb(ids: string[]): Promise<number> {
  await ensureCoreTablesDb();
  if (!ids || ids.length === 0) return 0;
  const placeholders = ids.map(() => "?").join(",");
  const res: any = await query(
    `UPDATE contact_submissions SET deleted_at = NOW() WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
    ids
  );
  invalidateDbCache("contact_messages");
  return res?.affectedRows || 0;
}

export async function getContactMessageRepliesDb(messageId: string): Promise<any[]> {
  await ensureCoreTablesDb();
  return await query<RowDataPacket[]>(
    "SELECT * FROM contact_message_replies WHERE message_id = ? ORDER BY created_at ASC",
    [messageId]
  );
}

export async function createContactMessageReplyDb(data: {
  id?: string;
  messageId: string;
  adminId: string;
  subject: string;
  body: string;
  status?: "sent" | "failed";
  error?: string | null;
  providerMessageId?: string | null;
}): Promise<string> {
  await ensureCoreTablesDb();
  const id = data.id || "c_rep_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
  await query(
    `INSERT INTO contact_message_replies (id, message_id, admin_id, subject, body, status, error, provider_message_id, created_at, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      data.messageId,
      data.adminId,
      data.subject,
      data.body,
      data.status || "sent",
      data.error || null,
      data.providerMessageId || null,
    ]
  );

  // Update parent submission status to replied
  await query(
    `UPDATE contact_submissions SET status = 'replied', replied_at = NOW(), replied_by = ? WHERE id = ? AND deleted_at IS NULL`,
    [data.adminId, data.messageId]
  );

  return id;
}

export async function getContactMessagesSettingsDb(): Promise<{
  auto_delete_enabled: boolean;
  retention_days: number;
  delete_only_replied: boolean;
  last_cleanup_at: string | null;
  last_cleanup_count: number;
}> {
  await ensureCoreTablesDb();
  const rows: any = await query("SELECT * FROM contact_messages_settings WHERE id = 'default' LIMIT 1");
  if (!rows || rows.length === 0) {
    return {
      auto_delete_enabled: false,
      retention_days: 30,
      delete_only_replied: false,
      last_cleanup_at: null,
      last_cleanup_count: 0,
    };
  }
  const r = rows[0];
  return {
    auto_delete_enabled: Boolean(r.auto_delete_enabled),
    retention_days: Number(r.retention_days) || 30,
    delete_only_replied: Boolean(r.delete_only_replied),
    last_cleanup_at: r.last_cleanup_at,
    last_cleanup_count: Number(r.last_cleanup_count) || 0,
  };
}

export async function saveContactMessagesSettingsDb(settings: {
  auto_delete_enabled?: boolean;
  retention_days?: number;
  delete_only_replied?: boolean;
}): Promise<void> {
  await ensureCoreTablesDb();
  await query(
    `INSERT INTO contact_messages_settings (id, auto_delete_enabled, retention_days, delete_only_replied)
     VALUES ('default', ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       auto_delete_enabled = COALESCE(?, auto_delete_enabled),
       retention_days = COALESCE(?, retention_days),
       delete_only_replied = COALESCE(?, delete_only_replied),
       updated_at = NOW()`,
    [
      settings.auto_delete_enabled ? 1 : 0,
      settings.retention_days || 30,
      settings.delete_only_replied ? 1 : 0,
      settings.auto_delete_enabled != null ? (settings.auto_delete_enabled ? 1 : 0) : null,
      settings.retention_days != null ? settings.retention_days : null,
      settings.delete_only_replied != null ? (settings.delete_only_replied ? 1 : 0) : null,
    ]
  );
}

export async function cleanupOldContactMessagesDb(retentionDays = 30, onlyReplied = false): Promise<number> {
  await ensureCoreTablesDb();
  let totalDeleted = 0;
  const batchSize = 500;
  let hasMore = true;

  while (hasMore) {
    let whereSql = "deleted_at IS NULL AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)";
    if (onlyReplied) {
      whereSql += " AND status = 'replied'";
    }

    const res: any = await query(
      `UPDATE contact_submissions SET deleted_at = NOW() WHERE ${whereSql} LIMIT ?`,
      [retentionDays, batchSize]
    );

    const affected = res?.affectedRows || 0;
    totalDeleted += affected;
    if (affected < batchSize) {
      hasMore = false;
    }
  }

  // Update cleanup metadata
  await query(
    "UPDATE contact_messages_settings SET last_cleanup_at = NOW(), last_cleanup_count = ? WHERE id = 'default'",
    [totalDeleted]
  );

  return totalDeleted;
}

export async function clearAllContactMessagesDb(confirmationWord: string): Promise<number> {
  if (confirmationWord !== "DELETE") {
    throw new Error("Confirmation word must be 'DELETE' to clear all messages.");
  }
  await ensureCoreTablesDb();
  const res: any = await query(
    "UPDATE contact_submissions SET deleted_at = NOW() WHERE deleted_at IS NULL"
  );
  return res?.affectedRows || 0;
}

// -------------------------------------------------------------
// 5. Volunteer Signups
// -------------------------------------------------------------
export async function getVolunteerSignupsDb(limit = 100): Promise<any[]> {
  const cacheKey = `volunteer_signups:${limit}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM volunteer_signups ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  setCached(cacheKey, rows, 30);
  return rows;
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
  invalidateDbCache("volunteer_signups");

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
  invalidateDbCache("volunteer_signups");
  syncBackupToSupabase("updateVolunteerStatus", (sb) =>
    sb.from("volunteer_signups").update({ status }).eq("id", id)
  );
}

export async function deleteVolunteerSignupDb(id: string): Promise<void> {
  await query("DELETE FROM volunteer_signups WHERE id = ?", [id]);
  invalidateDbCache("volunteer_signups");
  syncBackupToSupabase("deleteVolunteerSignup", (sb) =>
    sb.from("volunteer_signups").delete().eq("id", id)
  );
}

// -------------------------------------------------------------
// 6. Newsletter Subscribers
// -------------------------------------------------------------
export async function getSubscribersDb(): Promise<any[]> {
  const cached = getCached<any[]>("subscribers:all");
  if (cached) return cached;

  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM newsletter_subscribers ORDER BY created_at DESC"
  );
  setCached("subscribers:all", rows, 30);
  return rows;
}

export async function addSubscriberDb(email: string): Promise<void> {
  const id = "sub_" + Math.random().toString(36).substring(2, 11);
  await query(
    "INSERT INTO newsletter_subscribers (id, email, status) VALUES (?, ?, 'active') ON DUPLICATE KEY UPDATE status = 'active'",
    [id, email]
  );
  invalidateDbCache("subscribers");

  syncBackupToSupabase("addSubscriber", (sb) =>
    sb.from("newsletter_subscribers").upsert({ email, status: "active" }, { onConflict: "email" })
  );
}

// -------------------------------------------------------------
// 7. Site Settings
// -------------------------------------------------------------
export async function getSiteSettingsDb(): Promise<any> {
  const cached = getCached<any>("site_settings:default");
  if (cached) return cached;

  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM site_settings WHERE id = 'default' LIMIT 1"
  );
  const data = rows[0] || null;
  setCached("site_settings:default", data, 60);
  return data;
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
  invalidateDbCache("site_settings");

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
    security.admin_email || "admin@gjtfoundation.com",
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
    smtp.host || "smtp.hostinger.com",
    Number(smtp.port) || 465,
    smtp.secure ? 1 : (Number(smtp.port) === 465 ? 1 : 0),
    smtp.user_name || "admin@gjtfoundation.com",
    smtp.password || "",
    smtp.from_name || "Ghais Jhuggi Taleem Foundation",
    smtp.from_email || "admin@gjtfoundation.com",
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
    query<RowDataPacket[]>("SELECT count(*) as cnt FROM contact_submissions WHERE deleted_at IS NULL"),
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
    password: process.env.MYSQL_PASSWORD || "2>RV>E~Lb",
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
  const cacheKey = `page_contents:${pagePath || "all"}`;
  const cached = getCached<Record<string, { text?: string; url?: string }>>(cacheKey);
  if (cached) return cached;

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

  setCached(cacheKey, map, 60);
  return map;
}

export async function savePageContentsDb(
  items: Array<{ page_path: string; element_key: string; content_text?: string; link_url?: string }>
): Promise<{ success: boolean; count: number }> {
  if (!items || items.length === 0) return { success: true, count: 0 };

  invalidateDbCache("page_contents");
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
  const cached = getCached<any>("stats:live");
  if (cached) return cached;

  try {
    const [schoolsRes] = await Promise.all([
      query<RowDataPacket[]>(
        "SELECT COUNT(*) as count, COALESCE(SUM(current_students), 0) as total_students, MIN(established_year) as min_year FROM schools"
      ),
    ]);

    const count = schoolsRes[0]?.count !== undefined && schoolsRes[0]?.count !== null ? Number(schoolsRes[0]?.count) : 0;
    const students = schoolsRes[0]?.total_students !== undefined && schoolsRes[0]?.total_students !== null ? Number(schoolsRes[0]?.total_students) : 0;
    const currentYear = new Date().getFullYear();
    const minYear = Number(schoolsRes[0]?.min_year) || 2014;
    const years = Math.max(11, currentYear - minYear);

    // If table is empty (0 rows), fallback to static schools configuration
    if (count === 0 && students === 0) {
      try {
        const { schools: staticSchools } = await import("@/data/schools");
        const fallbackStats = {
          totalSchools: staticSchools.length,
          totalStudents: staticSchools.reduce((acc, s) => acc + (s.currentStudents || 0), 0),
          yearsOfService: years,
          nomadsTargetMillion: 20,
        };
        setCached("stats:live", fallbackStats, 60);
        return fallbackStats;
      } catch {
        const fallbackStats = {
          totalSchools: 7,
          totalStudents: 1081,
          yearsOfService: years,
          nomadsTargetMillion: 20,
        };
        setCached("stats:live", fallbackStats, 60);
        return fallbackStats;
      }
    }

    const liveStats = {
      totalSchools: count,
      totalStudents: students,
      yearsOfService: years,
      nomadsTargetMillion: 20,
    };
    setCached("stats:live", liveStats, 60);
    return liveStats;
  } catch (err: any) {
    console.error("Error calculating live stats from DB:", err.message);
    try {
      const { schools: staticSchools } = await import("@/data/schools");
      return {
        totalSchools: staticSchools.length,
        totalStudents: staticSchools.reduce((acc, s) => acc + (s.currentStudents || 0), 0),
        yearsOfService: 11,
        nomadsTargetMillion: 20,
      };
    } catch {
      return {
        totalSchools: 7,
        totalStudents: 1081,
        yearsOfService: 11,
        nomadsTargetMillion: 20,
      };
    }
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
    "email_logs",
    "donation_reminders",
    "email_settings",
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

// -------------------------------------------------------------
// 14. Transactional Email System: Logs, Settings, Reminders
// -------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __emailTablesInitialized: boolean | undefined;
}

let emailTablesInitialized = false;
let emailTablesInitPromise: Promise<void> | null = null;

export async function ensureEmailTablesDb(force = false): Promise<void> {
  if (global.__emailTablesInitialized && !force) return;
  if (emailTablesInitialized && !force) return;
  if (emailTablesInitPromise && !force) return emailTablesInitPromise;

  emailTablesInitPromise = (async () => {
    try {
      const pool = getPool();

      // Ultra-fast check: If email_logs table exists, tables are already provisioned!
      if (!force) {
        try {
          await pool.query("SELECT 1 FROM email_logs LIMIT 1");
          emailTablesInitialized = true;
          global.__emailTablesInitialized = true;
          return;
        } catch {
          // Table missing, proceed below
        }
      }

      // 1. email_logs
      await pool.query(`
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
      `);

      // 2. donation_reminders
      await pool.query(`
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
      `);

      // 3. email_settings
      await pool.query(`
        CREATE TABLE IF NOT EXISTS email_settings (
          id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
          auto_delete_enabled TINYINT(1) DEFAULT 0,
          retention_days INT DEFAULT 30,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        INSERT IGNORE INTO email_settings (id, auto_delete_enabled, retention_days)
        VALUES ('default', 0, 30);
      `);

      emailTablesInitialized = true;
      global.__emailTablesInitialized = true;
    } catch (err: any) {
      console.warn("Could not auto-create email tables on MySQL:", err.message);
    } finally {
      emailTablesInitPromise = null;
    }
  })();

  return emailTablesInitPromise;
}

export interface EmailLogEntry {
  id?: string;
  recipient_name?: string | null;
  recipient_email: string;
  email_type: string;
  subject: string;
  body_html: string;
  body_text?: string | null;
  status: "sent" | "failed";
  error_message?: string | null;
  metadata?: any;
}

/**
 * Redacts secret auth tokens, reset tokens, OTPs, and magic link query params
 * before persisting to email_logs table, ensuring zero-leakage security.
 */
function redactSecretTokens(content: string): string {
  if (!content) return content;
  return content
    .replace(/(token=)[a-zA-Z0-9_\-\.%]+/gi, "$1[secure-link-hidden]")
    .replace(/(otp=)[0-9]{4,8}/gi, "$1[hidden]")
    .replace(/(code=)[0-9a-zA-Z_\-]+/gi, "$1[hidden]")
    .replace(/(rcptk_)[a-zA-Z0-9_\-]+/gi, "$1[hidden]");
}

export async function saveEmailLogDb(entry: EmailLogEntry): Promise<string> {
  await ensureEmailTablesDb();
  const id = entry.id || "eml_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
  const metadataJson = entry.metadata ? JSON.stringify(entry.metadata) : null;

  // Redact secrets for privacy
  const sanitizedHtml = redactSecretTokens(entry.body_html || "");
  const sanitizedText = entry.body_text ? redactSecretTokens(entry.body_text) : null;

  const sql = `
    INSERT INTO email_logs (
      id, recipient_name, recipient_email, email_type, subject,
      body_html, body_text, status, error_message, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      error_message = VALUES(error_message),
      updated_at = CURRENT_TIMESTAMP;
  `;

  await query(sql, [
    id,
    entry.recipient_name || null,
    entry.recipient_email,
    entry.email_type,
    entry.subject,
    sanitizedHtml,
    sanitizedText,
    entry.status,
    entry.error_message || null,
    metadataJson,
  ]);

  return id;
}

export async function getEmailLogsDb(filters?: {
  search?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: any[]; total: number }> {
  const cacheKey = `email_logs:${JSON.stringify(filters || {})}`;
  const cached = getCached<{ logs: any[]; total: number }>(cacheKey);
  if (cached) return cached;

  await ensureEmailTablesDb();
  const limit = Math.min(filters?.limit || 50, 200);
  const offset = filters?.offset || 0;

  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.search?.trim()) {
    conditions.push("(recipient_name LIKE ? OR recipient_email LIKE ? OR subject LIKE ?)");
    const s = `%${filters.search.trim()}%`;
    params.push(s, s, s);
  }

  if (filters?.type && filters.type !== "All") {
    conditions.push("email_type = ?");
    params.push(filters.type);
  }

  if (filters?.status && filters.status !== "All") {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  if (filters?.startDate) {
    conditions.push("created_at >= ?");
    params.push(filters.startDate + " 00:00:00");
  }

  if (filters?.endDate) {
    conditions.push("created_at <= ?");
    params.push(filters.endDate + " 23:59:59");
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const countRows = await query<RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM email_logs ${whereClause}`,
    params
  );
  const total = Number(countRows[0]?.cnt) || 0;

  const logs = await query<RowDataPacket[]>(
    `SELECT id, recipient_name, recipient_email, email_type, subject, status, error_message, created_at
     FROM email_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const result = { logs, total };
  setCached(cacheKey, result, 20); // 20s cache
  return result;
}

export async function getEmailLogByIdDb(id: string): Promise<any | null> {
  const cacheKey = `email_log_detail:${id}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  await ensureEmailTablesDb();
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM email_logs WHERE id = ? LIMIT 1",
    [id]
  );
  if (!rows || rows.length === 0) return null;
  const log = rows[0];
  if (typeof log.metadata === "string") {
    try {
      log.metadata = JSON.parse(log.metadata);
    } catch {}
  }
  setCached(cacheKey, log, 60);
  return log;
}

export async function deleteEmailLogDb(id: string): Promise<void> {
  await ensureEmailTablesDb();
  await query("DELETE FROM email_logs WHERE id = ?", [id]);
  invalidateDbCache("email_logs");
}

export async function bulkDeleteEmailLogsDb(ids: string[]): Promise<number> {
  await ensureEmailTablesDb();
  if (!ids || ids.length === 0) return 0;
  const placeholders = ids.map(() => "?").join(",");
  const res: any = await query(
    `DELETE FROM email_logs WHERE id IN (${placeholders})`,
    ids
  );
  invalidateDbCache("email_logs");
  return res?.affectedRows || 0;
}

export async function clearAllEmailLogsDb(): Promise<void> {
  await ensureEmailTablesDb();
  await query("TRUNCATE TABLE email_logs");
  invalidateDbCache("email_logs");
}

export async function cleanupOldEmailLogsDb(retentionDays: number): Promise<number> {
  await ensureEmailTablesDb();
  const safeDays = Math.max(1, retentionDays);
  const res: any = await query(
    `DELETE FROM email_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [safeDays]
  );
  invalidateDbCache("email_logs");
  return res?.affectedRows || 0;
}

// Email Settings
export async function getEmailSettingsDb(): Promise<{ auto_delete_enabled: boolean; retention_days: number }> {
  await ensureEmailTablesDb();
  const rows = await query<RowDataPacket[]>(
    "SELECT auto_delete_enabled, retention_days FROM email_settings WHERE id = 'default' LIMIT 1"
  );
  if (!rows || rows.length === 0) {
    return { auto_delete_enabled: false, retention_days: 30 };
  }
  return {
    auto_delete_enabled: Boolean(rows[0].auto_delete_enabled),
    retention_days: Number(rows[0].retention_days) || 30,
  };
}

export async function saveEmailSettingsDb(settings: {
  auto_delete_enabled: boolean;
  retention_days: number;
}): Promise<void> {
  await ensureEmailTablesDb();
  await query(
    `INSERT INTO email_settings (id, auto_delete_enabled, retention_days)
     VALUES ('default', ?, ?)
     ON DUPLICATE KEY UPDATE
       auto_delete_enabled = VALUES(auto_delete_enabled),
       retention_days = VALUES(retention_days),
       updated_at = CURRENT_TIMESTAMP`,
    [settings.auto_delete_enabled ? 1 : 0, settings.retention_days]
  );
}

// Donation Reminders
export interface DonationReminderDbRecord {
  id: string;
  pledge_id: string;
  scheduled_at: string;
  repeat_interval_days: number;
  max_reminders: number;
  sent_count: number;
  last_sent_at?: string | null;
  custom_message?: string | null;
  status: "active" | "cancelled" | "completed";
  unsubscribe_token: string;
}

export async function saveDonationReminderDb(data: {
  pledge_id: string;
  scheduled_at: string;
  repeat_interval_days?: number;
  max_reminders?: number;
  custom_message?: string | null;
}): Promise<string> {
  await ensureEmailTablesDb();
  const existing = await getDonationReminderByPledgeDb(data.pledge_id);
  const id = existing?.id || "rem_" + Math.random().toString(36).substring(2, 11);
  const token = existing?.unsubscribe_token || "unsub_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now().toString(36);

  const sql = `
    INSERT INTO donation_reminders (
      id, pledge_id, scheduled_at, repeat_interval_days, max_reminders,
      sent_count, custom_message, status, unsubscribe_token
    ) VALUES (?, ?, ?, ?, ?, 0, ?, 'active', ?)
    ON DUPLICATE KEY UPDATE
      scheduled_at = VALUES(scheduled_at),
      repeat_interval_days = VALUES(repeat_interval_days),
      max_reminders = VALUES(max_reminders),
      custom_message = VALUES(custom_message),
      status = 'active',
      updated_at = CURRENT_TIMESTAMP;
  `;

  await query(sql, [
    id,
    data.pledge_id,
    data.scheduled_at,
    data.repeat_interval_days || 0,
    data.max_reminders || 1,
    data.custom_message || null,
    token,
  ]);

  return id;
}

export async function getDonationReminderByPledgeDb(pledge_id: string): Promise<DonationReminderDbRecord | null> {
  await ensureEmailTablesDb();
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM donation_reminders WHERE pledge_id = ? ORDER BY created_at DESC LIMIT 1",
    [pledge_id]
  );
  if (!rows || rows.length === 0) return null;
  return rows[0] as DonationReminderDbRecord;
}

export async function getAllActiveDonationRemindersDb(): Promise<DonationReminderDbRecord[]> {
  await ensureEmailTablesDb();
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM donation_reminders WHERE status = 'active'"
  );
  return rows as DonationReminderDbRecord[];
}

export async function getDueDonationRemindersDb(): Promise<any[]> {
  await ensureEmailTablesDb();
  const sql = `
    SELECT r.*, d.donor_name, d.donor_email, d.donor_phone, d.amount, d.currency, d.cause, d.status as donation_status, d.created_at as pledge_date
    FROM donation_reminders r
    INNER JOIN donations d ON r.pledge_id = d.id
    WHERE r.status = 'active'
      AND r.scheduled_at <= NOW()
      AND d.status = 'pending'
      AND d.donor_email IS NOT NULL
      AND d.donor_email != ''
  `;
  return await query<RowDataPacket[]>(sql);
}

export async function markReminderSentDb(id: string, nextSchedule?: string | null): Promise<void> {
  await ensureEmailTablesDb();
  if (nextSchedule) {
    await query(
      `UPDATE donation_reminders
       SET sent_count = sent_count + 1,
           last_sent_at = NOW(),
           scheduled_at = ?
       WHERE id = ?`,
      [nextSchedule, id]
    );
  } else {
    await query(
      `UPDATE donation_reminders
       SET sent_count = sent_count + 1,
           last_sent_at = NOW(),
           status = 'completed'
       WHERE id = ?`,
      [id]
    );
  }
}

export async function cancelDonationReminderDb(pledge_id: string): Promise<void> {
  await ensureEmailTablesDb();
  await query(
    "UPDATE donation_reminders SET status = 'cancelled' WHERE pledge_id = ? AND status = 'active'",
    [pledge_id]
  );
}

export async function unsubscribeDonationReminderDb(token: string): Promise<boolean> {
  await ensureEmailTablesDb();
  const res: any = await query(
    "UPDATE donation_reminders SET status = 'cancelled' WHERE unsubscribe_token = ?",
    [token]
  );
  return (res.affectedRows || 0) > 0;
}

// Re-export core schema and donor database functions for unified access
export * from "./coreSchema";
export * from "./donorDb";

