import { query } from "./mysql";
import { ensureCoreTablesDb } from "./coreSchema";
import { RowDataPacket } from "mysql2/promise";

export interface DonorRecord {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  country: string;
  password_hash: string | null;
  email_verified_at: string | null;
  status: "active" | "blocked" | "deleted_by_user";
  prefers_anonymous: boolean;
  marketing_opt_in: boolean;
  notification_prefs: any;
  last_login_at: string | null;
  failed_login_count: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonationPlanRecord {
  id: string;
  donor_id: string;
  cause: string;
  currency: string;
  amount_minor: number;
  amount: number;
  donation_type: "General" | "Zakat" | "Sadqah";
  billing_day: number;
  start_date: string;
  next_due_date: string;
  status: "active" | "paused" | "cancelled";
  pause_until: string | null;
  cancelled_at: string | null;
  cycles_completed: number;
  payment_method: string;
  gateway_subscription_id: string | null;
  created_at: string;
}

export interface PaymentSettingsRecord {
  id: string;
  bank_title: string;
  bank_name: string;
  account_number: string;
  iban: string;
  branch_name: string;
  swift_code: string;
  doorstep_enabled: boolean;
  doorstep_phone: string;
  cheque_enabled: boolean;
  bank_transfer_enabled: boolean;
  jazzcash_number: string;
  easypaisa_number: string;
  gateway_provider: string;
  gateway_mode: "test" | "live";
  gateway_api_key_encrypted?: string | null;
  gateway_webhook_secret?: string | null;
  updated_at?: string;
}

// -------------------------------------------------------------
// 1. Donor Profile & Account Operations
// -------------------------------------------------------------

export async function createDonorDb(data: {
  email: string;
  name?: string | null;
  phone?: string | null;
  country?: string;
  password_hash?: string | null;
  email_verified?: boolean;
  prefers_anonymous?: boolean;
}): Promise<string> {
  await ensureCoreTablesDb();
  const id = "dnr_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
  const normalizedEmail = data.email.trim().toLowerCase();

  const sql = `
    INSERT INTO donors (
      id, name, email, phone, country, password_hash, email_verified_at, prefers_anonymous
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = COALESCE(VALUES(name), name),
      phone = COALESCE(VALUES(phone), phone),
      country = COALESCE(VALUES(country), country);
  `;

  await query(sql, [
    id,
    data.name || null,
    normalizedEmail,
    data.phone || null,
    data.country || "Pakistan",
    data.password_hash || null,
    data.email_verified ? new Date() : null,
    data.prefers_anonymous ? 1 : 0,
  ]);

  const existing = await getDonorByEmailDb(normalizedEmail);
  return existing ? existing.id : id;
}

export async function getDonorByEmailDb(email: string): Promise<DonorRecord | null> {
  await ensureCoreTablesDb();
  const normalized = email.trim().toLowerCase();
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM donors WHERE email = ? LIMIT 1",
    [normalized]
  );
  if (!rows || rows.length === 0) return null;
  return formatDonorRow(rows[0]);
}

export async function getDonorByIdDb(id: string): Promise<DonorRecord | null> {
  await ensureCoreTablesDb();
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM donors WHERE id = ? LIMIT 1",
    [id]
  );
  if (!rows || rows.length === 0) return null;
  return formatDonorRow(rows[0]);
}

export async function updateDonorDb(id: string, updates: Partial<DonorRecord>): Promise<void> {
  await ensureCoreTablesDb();
  const sets: string[] = [];
  const params: any[] = [];

  if (updates.name !== undefined) {
    sets.push("name = ?");
    params.push(updates.name);
  }
  if (updates.phone !== undefined) {
    sets.push("phone = ?");
    params.push(updates.phone);
  }
  if (updates.country !== undefined) {
    sets.push("country = ?");
    params.push(updates.country);
  }
  if (updates.password_hash !== undefined) {
    sets.push("password_hash = ?");
    params.push(updates.password_hash);
  }
  if (updates.email_verified_at !== undefined) {
    sets.push("email_verified_at = ?");
    params.push(updates.email_verified_at);
  }
  if (updates.status !== undefined) {
    sets.push("status = ?");
    params.push(updates.status);
  }
  if (updates.prefers_anonymous !== undefined) {
    sets.push("prefers_anonymous = ?");
    params.push(updates.prefers_anonymous ? 1 : 0);
  }
  if (updates.marketing_opt_in !== undefined) {
    sets.push("marketing_opt_in = ?");
    params.push(updates.marketing_opt_in ? 1 : 0);
  }
  if (updates.notification_prefs !== undefined) {
    sets.push("notification_prefs = ?");
    params.push(JSON.stringify(updates.notification_prefs));
  }
  if (updates.last_login_at !== undefined) {
    sets.push("last_login_at = ?");
    params.push(updates.last_login_at);
  }
  if (updates.failed_login_count !== undefined) {
    sets.push("failed_login_count = ?");
    params.push(updates.failed_login_count);
  }
  if (updates.locked_until !== undefined) {
    sets.push("locked_until = ?");
    params.push(updates.locked_until);
  }

  if (sets.length === 0) return;

  params.push(id);
  await query(`UPDATE donors SET ${sets.join(", ")}, updated_at = NOW() WHERE id = ?`, params);
}

export async function linkDonationsToDonorDb(donorId: string, email: string): Promise<number> {
  await ensureCoreTablesDb();
  const normalized = email.trim().toLowerCase();
  const res: any = await query(
    "UPDATE donations SET donor_id = ? WHERE donor_email = ? AND (donor_id IS NULL OR donor_id = '')",
    [donorId, normalized]
  );
  return res.affectedRows || 0;
}

export async function anonymizeDonorDb(donorId: string): Promise<void> {
  await ensureCoreTablesDb();
  const anonEmail = `deleted_${donorId.slice(-8)}@anonymized.gjtfoundation.com`;
  await query(
    `UPDATE donors 
     SET name = 'Former Supporter', 
         email = ?, 
         phone = NULL, 
         password_hash = NULL, 
         status = 'deleted_by_user', 
         prefers_anonymous = 1,
         updated_at = NOW()
     WHERE id = ?`,
    [anonEmail, donorId]
  );

  await query(
    "UPDATE donations SET donor_name = 'Anonymous Supporter', donor_email = ?, donor_phone = NULL, is_anonymous = 1 WHERE donor_id = ?",
    [anonEmail, donorId]
  );

  await query("DELETE FROM donor_sessions WHERE donor_id = ?", [donorId]);
  await query("DELETE FROM auth_tokens WHERE donor_id = ?", [donorId]);
}

export async function exportDonorDataDb(donorId: string): Promise<any> {
  await ensureCoreTablesDb();
  const [donorRows, donationRows, planRows] = await Promise.all([
    query<RowDataPacket[]>("SELECT id, name, email, phone, country, prefers_anonymous, created_at FROM donors WHERE id = ?", [donorId]),
    query<RowDataPacket[]>("SELECT reference_no, cause, frequency, currency, amount, donation_type, status, payment_method, created_at, paid_at FROM donations WHERE donor_id = ? ORDER BY created_at DESC", [donorId]),
    query<RowDataPacket[]>("SELECT id, cause, currency, amount, donation_type, billing_day, status, start_date, cycles_completed FROM donation_plans WHERE donor_id = ?", [donorId]),
  ]);

  return {
    profile: donorRows[0] || null,
    donations: donationRows || [],
    plans: planRows || [],
    exportedAt: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// 2. Authentication Tokens & Database Sessions
// -------------------------------------------------------------

export async function createAuthTokenDb(data: {
  donorId: string;
  type: string;
  tokenHash: string;
  expiresInMinutes: number;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  await ensureCoreTablesDb();
  const id = "tok_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
  const sql = `
    INSERT INTO auth_tokens (id, donor_id, type, token_hash, expires_at, ip, user_agent)
    VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), ?, ?)
  `;
  await query(sql, [
    id,
    data.donorId,
    data.type,
    data.tokenHash,
    data.expiresInMinutes,
    data.ip || null,
    data.userAgent || null,
  ]);
  return id;
}

export async function verifyAndConsumeAuthTokenDb(
  tokenHash: string,
  type: string
): Promise<{ valid: boolean; donorId?: string; error?: string }> {
  await ensureCoreTablesDb();
  const rows = await query<RowDataPacket[]>(
    `SELECT * FROM auth_tokens 
     WHERE token_hash = ? AND type = ? AND used_at IS NULL AND expires_at > NOW() 
     LIMIT 1`,
    [tokenHash, type]
  );

  if (!rows || rows.length === 0) {
    return { valid: false, error: "Security link has expired or has already been used." };
  }

  const tok = rows[0];
  await query("UPDATE auth_tokens SET used_at = NOW() WHERE id = ?", [tok.id]);
  return { valid: true, donorId: tok.donor_id };
}

export async function createDonorSessionDb(data: {
  donorId: string;
  sessionTokenHash: string;
  expiresInDays?: number;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  await ensureCoreTablesDb();
  const id = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
  const days = data.expiresInDays || 30;

  const sql = `
    INSERT INTO donor_sessions (id, donor_id, session_token_hash, expires_at, ip, user_agent)
    VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?)
  `;

  await query(sql, [
    id,
    data.donorId,
    data.sessionTokenHash,
    days,
    data.ip || null,
    data.userAgent || null,
  ]);

  return id;
}

export async function getDonorBySessionTokenDb(sessionTokenHash: string): Promise<DonorRecord | null> {
  await ensureCoreTablesDb();
  const sql = `
    SELECT d.* FROM donors d
    INNER JOIN donor_sessions s ON d.id = s.donor_id
    WHERE s.session_token_hash = ?
      AND s.revoked_at IS NULL
      AND s.expires_at > NOW()
      AND d.status = 'active'
    LIMIT 1
  `;
  const rows = await query<RowDataPacket[]>(sql, [sessionTokenHash]);
  if (!rows || rows.length === 0) return null;
  return formatDonorRow(rows[0]);
}

export async function revokeDonorSessionDb(sessionTokenHash: string): Promise<void> {
  await ensureCoreTablesDb();
  await query("UPDATE donor_sessions SET revoked_at = NOW() WHERE session_token_hash = ?", [sessionTokenHash]);
}

export async function revokeAllDonorSessionsDb(donorId: string): Promise<void> {
  await ensureCoreTablesDb();
  await query("UPDATE donor_sessions SET revoked_at = NOW() WHERE donor_id = ? AND revoked_at IS NULL", [donorId]);
}

// -------------------------------------------------------------
// 3. Recurring Monthly Plans
// -------------------------------------------------------------

export async function createDonationPlanDb(data: {
  donor_id: string;
  cause: string;
  currency: string;
  amount: number;
  donation_type: "General" | "Zakat" | "Sadqah";
  billing_day: number;
  start_date: string;
  payment_method?: string;
}): Promise<string> {
  await ensureCoreTablesDb();
  const id = "pln_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
  const amountMinor = Math.round(data.amount * 100);

  // Calculate first next_due_date
  const nextDueDate = calculateNextBillingDate(data.billing_day, new Date(data.start_date));

  const sql = `
    INSERT INTO donation_plans (
      id, donor_id, cause, currency, amount_minor, amount, donation_type,
      billing_day, start_date, next_due_date, status, payment_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
  `;

  await query(sql, [
    id,
    data.donor_id,
    data.cause,
    data.currency.toUpperCase(),
    amountMinor,
    data.amount,
    data.donation_type,
    data.billing_day,
    data.start_date,
    nextDueDate,
    data.payment_method || "bank_transfer",
  ]);

  return id;
}

export async function getDonationPlansByDonorDb(donorId: string): Promise<DonationPlanRecord[]> {
  await ensureCoreTablesDb();
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM donation_plans WHERE donor_id = ? ORDER BY created_at DESC",
    [donorId]
  );
  return (rows || []).map(formatPlanRow);
}

export async function getDonationPlanByIdScopedDb(planId: string, donorId: string): Promise<DonationPlanRecord | null> {
  await ensureCoreTablesDb();
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM donation_plans WHERE id = ? AND donor_id = ? LIMIT 1",
    [planId, donorId]
  );
  if (!rows || rows.length === 0) return null;
  return formatPlanRow(rows[0]);
}

export async function updateDonationPlanDb(
  planId: string,
  donorId: string,
  updates: {
    status?: "active" | "paused" | "cancelled";
    pause_until?: string | null;
    amount?: number;
    billing_day?: number;
  }
): Promise<boolean> {
  await ensureCoreTablesDb();
  const sets: string[] = [];
  const params: any[] = [];

  if (updates.status !== undefined) {
    sets.push("status = ?");
    params.push(updates.status);
    if (updates.status === "cancelled") {
      sets.push("cancelled_at = NOW()");
    }
  }
  if (updates.pause_until !== undefined) {
    sets.push("pause_until = ?");
    params.push(updates.pause_until);
  }
  if (updates.amount !== undefined) {
    sets.push("amount = ?");
    sets.push("amount_minor = ?");
    params.push(updates.amount, Math.round(updates.amount * 100));
  }
  if (updates.billing_day !== undefined) {
    sets.push("billing_day = ?");
    params.push(updates.billing_day);
  }

  if (sets.length === 0) return false;

  params.push(planId, donorId);
  const res: any = await query(
    `UPDATE donation_plans SET ${sets.join(", ")}, updated_at = NOW() WHERE id = ? AND donor_id = ?`,
    params
  );
  return (res.affectedRows || 0) > 0;
}

// -------------------------------------------------------------
// 4. Scoped Donor Donations & Dashboard Statistics
// -------------------------------------------------------------

export async function getDonationsByDonorDb(
  donorId: string,
  filters?: {
    status?: string;
    currency?: string;
    donationType?: string;
    year?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ donations: any[]; total: number }> {
  await ensureCoreTablesDb();
  const limit = Math.min(filters?.limit || 50, 100);
  const offset = filters?.offset || 0;

  const conditions: string[] = ["d.donor_id = ?"];
  const params: any[] = [donorId];

  if (filters?.status && filters.status !== "All") {
    conditions.push("d.status = ?");
    params.push(filters.status.toLowerCase());
  }

  if (filters?.currency && filters.currency !== "All") {
    conditions.push("d.currency = ?");
    params.push(filters.currency.toUpperCase());
  }

  if (filters?.donationType && filters.donationType !== "All") {
    conditions.push("d.donation_type = ?");
    params.push(filters.donationType);
  }

  if (filters?.year && filters.year !== "All") {
    conditions.push("YEAR(d.created_at) = ?");
    params.push(Number(filters.year));
  }

  const whereClause = "WHERE " + conditions.join(" AND ");

  const countRows = await query<RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM donations d ${whereClause}`,
    params
  );
  const total = Number(countRows[0]?.cnt) || 0;

  const sql = `
    SELECT 
      d.id, d.reference_no, d.cause, d.frequency, d.currency, d.amount, d.donation_type,
      d.country, d.status, d.payment_method, d.due_date, d.paid_at, d.created_at,
      r.receipt_no, r.access_token as receipt_token
    FROM donations d
    LEFT JOIN receipts r ON d.id = r.donation_id
    ${whereClause}
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const rows = await query<RowDataPacket[]>(sql, [...params, limit, offset]);

  return { donations: rows || [], total };
}

export async function getDonationByIdScopedDb(donationId: string, donorId: string): Promise<any | null> {
  await ensureCoreTablesDb();
  const sql = `
    SELECT d.*, r.receipt_no, r.access_token as receipt_token
    FROM donations d
    LEFT JOIN receipts r ON d.id = r.donation_id
    WHERE d.id = ? AND d.donor_id = ?
    LIMIT 1
  `;
  const rows = await query<RowDataPacket[]>(sql, [donationId, donorId]);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

export async function getDonationByReferenceDb(referenceNo: string): Promise<any | null> {
  await ensureCoreTablesDb();
  const sql = `
    SELECT d.*, r.receipt_no, r.access_token as receipt_token
    FROM donations d
    LEFT JOIN receipts r ON d.id = r.donation_id
    WHERE d.reference_no = ?
    LIMIT 1
  `;
  const rows = await query<RowDataPacket[]>(sql, [referenceNo]);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

export async function createDonationStatusHistoryDb(data: {
  donation_id: string;
  old_status?: string | null;
  new_status: string;
  changed_by?: string;
  note?: string | null;
}): Promise<void> {
  await ensureCoreTablesDb();
  const id = "dsh_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
  await query(
    `INSERT INTO donation_status_history (id, donation_id, old_status, new_status, changed_by, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.donation_id,
      data.old_status || null,
      data.new_status,
      data.changed_by || "system",
      data.note || null,
    ]
  );
}

export async function getDonationStatusHistoryDb(donationId: string): Promise<any[]> {
  await ensureCoreTablesDb();
  return await query<RowDataPacket[]>(
    "SELECT * FROM donation_status_history WHERE donation_id = ? ORDER BY created_at ASC",
    [donationId]
  );
}

/**
 * Calculates Lifetime & Monthly Totals for a Donor.
 * Strictly separates PKR and AED, counts completed donations only.
 */
export async function getDonorDashboardStatsDb(donorId: string): Promise<{
  pkr: { lifetime: number; thisYear: number; thisMonth: number; completedCount: number };
  aed: { lifetime: number; thisYear: number; thisMonth: number; completedCount: number };
  totalCompletedCount: number;
  pendingPledges: any[];
  activePlan: DonationPlanRecord | null;
  childrenEducatedYears: number;
}> {
  await ensureCoreTablesDb();

  const [statsRows, pendingRows, planRows, appSettingsRows] = await Promise.all([
    query<RowDataPacket[]>(
      `SELECT 
        UPPER(TRIM(currency)) as currency,
        COALESCE(SUM(amount), 0) as lifetime,
        COALESCE(SUM(CASE WHEN YEAR(created_at) = YEAR(NOW()) THEN amount ELSE 0 END), 0) as this_year,
        COALESCE(SUM(CASE WHEN YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW()) THEN amount ELSE 0 END), 0) as this_month,
        COUNT(*) as count
      FROM donations
      WHERE donor_id = ? AND status = 'completed'
      GROUP BY UPPER(TRIM(currency))`,
      [donorId]
    ),
    query<RowDataPacket[]>(
      `SELECT id, reference_no, cause, frequency, currency, amount, donation_type, created_at
       FROM donations
       WHERE donor_id = ? AND status = 'pending'
       ORDER BY created_at DESC LIMIT 3`,
      [donorId]
    ),
    query<RowDataPacket[]>(
      "SELECT * FROM donation_plans WHERE donor_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
      [donorId]
    ),
    query<RowDataPacket[]>("SELECT * FROM app_settings WHERE id = 'default' LIMIT 1"),
  ]);

  const pkrStats = { lifetime: 0, thisYear: 0, thisMonth: 0, completedCount: 0 };
  const aedStats = { lifetime: 0, thisYear: 0, thisMonth: 0, completedCount: 0 };

  for (const row of statsRows || []) {
    if (row.currency === "PKR") {
      pkrStats.lifetime = Number(row.lifetime) || 0;
      pkrStats.thisYear = Number(row.this_year) || 0;
      pkrStats.thisMonth = Number(row.this_month) || 0;
      pkrStats.completedCount = Number(row.count) || 0;
    } else if (row.currency === "AED") {
      aedStats.lifetime = Number(row.lifetime) || 0;
      aedStats.thisYear = Number(row.this_year) || 0;
      aedStats.thisMonth = Number(row.this_month) || 0;
      aedStats.completedCount = Number(row.count) || 0;
    }
  }

  const appSettings = appSettingsRows?.[0] || { pkr_per_child_annual: 24000, aed_per_child_annual: 600 };
  const pkrPerChild = Number(appSettings.pkr_per_child_annual) || 24000;
  const aedPerChild = Number(appSettings.aed_per_child_annual) || 600;

  const childrenPkr = pkrStats.lifetime / pkrPerChild;
  const childrenAed = aedStats.lifetime / aedPerChild;
  const childrenEducatedYears = Math.round((childrenPkr + childrenAed) * 10) / 10;

  return {
    pkr: pkrStats,
    aed: aedStats,
    totalCompletedCount: pkrStats.completedCount + aedStats.completedCount,
    pendingPledges: pendingRows || [],
    activePlan: planRows?.[0] ? formatPlanRow(planRows[0]) : null,
    childrenEducatedYears,
  };
}

// -------------------------------------------------------------
// 5. Receipts Management
// -------------------------------------------------------------

export async function getOrCreateReceiptDb(donationId: string): Promise<{ receiptNo: string; accessToken: string }> {
  await ensureCoreTablesDb();
  const existing = await query<RowDataPacket[]>(
    "SELECT receipt_no, access_token FROM receipts WHERE donation_id = ? LIMIT 1",
    [donationId]
  );

  if (existing && existing.length > 0) {
    return { receiptNo: existing[0].receipt_no, accessToken: existing[0].access_token };
  }

  const receiptNo = `RCP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const accessToken = "rcptk_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now().toString(36);
  const id = "rcp_" + Math.random().toString(36).substring(2, 11);

  await query(
    `INSERT INTO receipts (id, donation_id, receipt_no, access_token) VALUES (?, ?, ?, ?)`,
    [id, donationId, receiptNo, accessToken]
  );

  return { receiptNo, accessToken };
}

export async function getReceiptByDonationScopedDb(donationId: string, donorId: string): Promise<any | null> {
  await ensureCoreTablesDb();
  const sql = `
    SELECT r.*, d.reference_no, d.cause, d.amount, d.currency, d.donation_type, d.donor_name, d.donor_email, d.paid_at, d.created_at
    FROM receipts r
    INNER JOIN donations d ON r.donation_id = d.id
    WHERE r.donation_id = ? AND d.donor_id = ?
    LIMIT 1
  `;
  const rows = await query<RowDataPacket[]>(sql, [donationId, donorId]);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

// -------------------------------------------------------------
// 6. Settings & Administration
// -------------------------------------------------------------

export async function getPaymentSettingsDb(): Promise<PaymentSettingsRecord> {
  await ensureCoreTablesDb();
  const rows = await query<RowDataPacket[]>(
    "SELECT * FROM payment_settings WHERE id = 'default' LIMIT 1"
  );
  if (!rows || rows.length === 0) {
    return {
      id: "default",
      bank_title: "Ghais Jhuggi Taleem Foundation",
      bank_name: "Meezan Bank Limited",
      account_number: "02010103847291",
      iban: "PK72MEZN0002010103847291",
      branch_name: "Model Town Link Road Branch Lahore",
      swift_code: "MEZNPKKA",
      doorstep_enabled: true,
      doorstep_phone: "04235236622",
      cheque_enabled: true,
      bank_transfer_enabled: true,
      jazzcash_number: "03033934771",
      easypaisa_number: "0328-6477314",
      gateway_provider: "manual",
      gateway_mode: "test",
    };
  }
  return {
    ...rows[0],
    doorstep_enabled: Boolean(rows[0].doorstep_enabled),
    cheque_enabled: Boolean(rows[0].cheque_enabled),
    bank_transfer_enabled: Boolean(rows[0].bank_transfer_enabled),
  } as PaymentSettingsRecord;
}

export async function savePaymentSettingsDb(settings: Partial<PaymentSettingsRecord>): Promise<void> {
  await ensureCoreTablesDb();
  const sql = `
    INSERT INTO payment_settings (
      id, bank_title, bank_name, account_number, iban, branch_name, swift_code,
      doorstep_enabled, doorstep_phone, cheque_enabled, bank_transfer_enabled,
      jazzcash_number, easypaisa_number, gateway_provider, gateway_mode, updated_at
    ) VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      bank_title = VALUES(bank_title),
      bank_name = VALUES(bank_name),
      account_number = VALUES(account_number),
      iban = VALUES(iban),
      branch_name = VALUES(branch_name),
      swift_code = VALUES(swift_code),
      doorstep_enabled = VALUES(doorstep_enabled),
      doorstep_phone = VALUES(doorstep_phone),
      cheque_enabled = VALUES(cheque_enabled),
      bank_transfer_enabled = VALUES(bank_transfer_enabled),
      jazzcash_number = VALUES(jazzcash_number),
      easypaisa_number = VALUES(easypaisa_number),
      gateway_provider = VALUES(gateway_provider),
      gateway_mode = VALUES(gateway_mode),
      updated_at = NOW();
  `;

  await query(sql, [
    settings.bank_title || "Ghais Jhuggi Taleem Foundation",
    settings.bank_name || "Meezan Bank Limited",
    settings.account_number || "02010103847291",
    settings.iban || "PK72MEZN0002010103847291",
    settings.branch_name || "Model Town Link Road Branch Lahore",
    settings.swift_code || "MEZNPKKA",
    settings.doorstep_enabled ? 1 : 0,
    settings.doorstep_phone || "04235236622",
    settings.cheque_enabled ? 1 : 0,
    settings.bank_transfer_enabled ? 1 : 0,
    settings.jazzcash_number || "03033934771",
    settings.easypaisa_number || "0328-6477314",
    settings.gateway_provider || "manual",
    settings.gateway_mode || "test",
  ]);
}

export async function getAppSettingsDb(): Promise<any> {
  await ensureCoreTablesDb();
  const rows = await query<RowDataPacket[]>("SELECT * FROM app_settings WHERE id = 'default' LIMIT 1");
  return rows[0] || { pkr_per_child_monthly: 2000, pkr_per_child_annual: 24000, aed_per_child_monthly: 50, aed_per_child_annual: 600 };
}

export async function saveAppSettingsDb(settings: any): Promise<void> {
  await ensureCoreTablesDb();
  await query(
    `INSERT INTO app_settings (id, pkr_per_child_monthly, pkr_per_child_annual, aed_per_child_monthly, aed_per_child_annual, updated_at)
     VALUES ('default', ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       pkr_per_child_monthly = VALUES(pkr_per_child_monthly),
       pkr_per_child_annual = VALUES(pkr_per_child_annual),
       aed_per_child_monthly = VALUES(aed_per_child_monthly),
       aed_per_child_annual = VALUES(aed_per_child_annual),
       updated_at = NOW()`,
    [
      settings.pkr_per_child_monthly || 2000,
      settings.pkr_per_child_annual || 24000,
      settings.aed_per_child_monthly || 50,
      settings.aed_per_child_annual || 600,
    ]
  );
}

// -------------------------------------------------------------
// 7. Audit Logging (Zero-Trust Security & Append-Only Record)
// -------------------------------------------------------------

export async function createAuditLogDb(data: {
  actor_type: "admin" | "donor" | "system";
  actor_id?: string | null;
  action: string;
  target_type: string;
  target_id?: string | null;
  metadata?: any;
  ip?: string | null;
}): Promise<void> {
  try {
    await ensureCoreTablesDb();
    const id = "aud_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
    const metaJson = data.metadata ? JSON.stringify(data.metadata) : null;
    await query(
      `INSERT INTO audit_logs (id, actor_type, actor_id, action, target_type, target_id, metadata, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.actor_type,
        data.actor_id || null,
        data.action,
        data.target_type,
        data.target_id || null,
        metaJson,
        data.ip || null,
      ]
    );
  } catch (err: any) {
    console.error("[Audit Log] Failed to insert audit log:", err.message);
  }
}

// -------------------------------------------------------------
// 8. Admin Donors Management
// -------------------------------------------------------------

export async function getAllDonorsAdminDb(filters?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ donors: any[]; total: number }> {
  await ensureCoreTablesDb();
  const limit = Math.min(filters?.limit || 50, 100);
  const offset = filters?.offset || 0;

  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.search?.trim()) {
    conditions.push("(d.name LIKE ? OR d.email LIKE ? OR d.phone LIKE ?)");
    const s = `%${filters.search.trim()}%`;
    params.push(s, s, s);
  }

  if (filters?.status && filters.status !== "All") {
    conditions.push("d.status = ?");
    params.push(filters.status.toLowerCase());
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const countRows = await query<RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM donors d ${whereClause}`,
    params
  );
  const total = Number(countRows[0]?.cnt) || 0;

  const sql = `
    SELECT 
      d.id, d.name, d.email, d.phone, d.country, d.status, d.prefers_anonymous, d.created_at, d.last_login_at,
      COALESCE(SUM(CASE WHEN dn.status = 'completed' AND UPPER(dn.currency) = 'PKR' THEN dn.amount ELSE 0 END), 0) as total_pkr,
      COALESCE(SUM(CASE WHEN dn.status = 'completed' AND UPPER(dn.currency) = 'AED' THEN dn.amount ELSE 0 END), 0) as total_aed,
      COUNT(CASE WHEN dn.status = 'completed' THEN dn.id END) as completed_donations_count,
      MAX(dn.created_at) as last_donation_at
    FROM donors d
    LEFT JOIN donations dn ON d.id = dn.donor_id
    ${whereClause}
    GROUP BY d.id
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const rows = await query<RowDataPacket[]>(sql, [...params, limit, offset]);

  return { donors: rows || [], total };
}

export async function getDonorDetailsAdminDb(donorId: string): Promise<any | null> {
  await ensureCoreTablesDb();
  const [donorRows, donationsRows, plansRows, logsRows] = await Promise.all([
    query<RowDataPacket[]>("SELECT * FROM donors WHERE id = ? LIMIT 1", [donorId]),
    query<RowDataPacket[]>("SELECT * FROM donations WHERE donor_id = ? ORDER BY created_at DESC", [donorId]),
    query<RowDataPacket[]>("SELECT * FROM donation_plans WHERE donor_id = ? ORDER BY created_at DESC", [donorId]),
    query<RowDataPacket[]>(
      `SELECT id, email_type, subject, status, created_at, error_message 
       FROM email_logs 
       WHERE recipient_email = (SELECT email FROM donors WHERE id = ?) 
       ORDER BY created_at DESC LIMIT 20`,
      [donorId]
    ),
  ]);

  if (!donorRows || donorRows.length === 0) return null;

  return {
    donor: formatDonorRow(donorRows[0]),
    donations: donationsRows || [],
    plans: (plansRows || []).map(formatPlanRow),
    emailLogs: logsRows || [],
  };
}

// -------------------------------------------------------------
// Helpers & Row Formatters
// -------------------------------------------------------------

function formatDonorRow(row: any): DonorRecord {
  return {
    ...row,
    prefers_anonymous: Boolean(row.prefers_anonymous),
    marketing_opt_in: Boolean(row.marketing_opt_in),
    notification_prefs: typeof row.notification_prefs === "string" ? JSON.parse(row.notification_prefs) : row.notification_prefs,
  };
}

function formatPlanRow(row: any): DonationPlanRecord {
  return {
    ...row,
    amount: Number(row.amount),
    amount_minor: Number(row.amount_minor),
    billing_day: Number(row.billing_day),
    cycles_completed: Number(row.cycles_completed),
  };
}

function calculateNextBillingDate(billingDay: number, fromDate: Date = new Date()): string {
  const d = new Date(fromDate);
  let targetMonth = d.getMonth() + 1;
  let targetYear = d.getFullYear();

  if (targetMonth > 11) {
    targetMonth = 0;
    targetYear += 1;
  }

  // Handle month end cap (e.g. Feb 28/29, April 30, etc.)
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(billingDay, daysInTargetMonth);

  const targetDate = new Date(targetYear, targetMonth, clampedDay);
  return targetDate.toISOString().slice(0, 10);
}
