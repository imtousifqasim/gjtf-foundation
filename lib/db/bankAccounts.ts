import { query, RowDataPacket } from "./mysql";
import { createAuditLogDb } from "./mysql";
import { BankAccountRecord, DEFAULT_BANK_ISLAMI } from "@/lib/types/bankAccount";

export type { BankAccountRecord };
export { DEFAULT_BANK_ISLAMI };

/**
 * Ensures bank_accounts table exists and is seeded with Bank Islami.
 */
export async function ensureBankAccountsTableDb(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id VARCHAR(64) PRIMARY KEY,
      bank_name VARCHAR(255) NOT NULL,
      branch VARCHAR(255) NOT NULL,
      account_title VARCHAR(255) NOT NULL,
      account_number VARCHAR(64) NOT NULL,
      iban VARCHAR(64) NOT NULL,
      swift VARCHAR(32) NULL DEFAULT '',
      currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 1,
      instructions TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await query(`
    INSERT INTO bank_accounts (
      id, bank_name, branch, account_title, account_number, iban, swift, currency, is_active, sort_order, instructions
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    ) ON DUPLICATE KEY UPDATE
      bank_name = VALUES(bank_name),
      branch = VALUES(branch),
      account_title = VALUES(account_title),
      account_number = VALUES(account_number),
      iban = VALUES(iban),
      swift = VALUES(swift),
      instructions = VALUES(instructions),
      updated_at = NOW();
  `, [
    DEFAULT_BANK_ISLAMI.id,
    DEFAULT_BANK_ISLAMI.bank_name,
    DEFAULT_BANK_ISLAMI.branch,
    DEFAULT_BANK_ISLAMI.account_title,
    DEFAULT_BANK_ISLAMI.account_number,
    DEFAULT_BANK_ISLAMI.iban,
    DEFAULT_BANK_ISLAMI.swift || "",
    DEFAULT_BANK_ISLAMI.currency,
    1,
    1,
    DEFAULT_BANK_ISLAMI.instructions,
  ]);
}

/**
 * Public function to fetch active bank accounts for display on /donate-now, emails, receipts, etc.
 */
export async function getActiveBankAccountsDb(): Promise<BankAccountRecord[]> {
  try {
    await ensureBankAccountsTableDb();
    const rows = await query<RowDataPacket[]>(
      "SELECT * FROM bank_accounts WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC"
    );
    if (!rows || rows.length === 0) {
      return [DEFAULT_BANK_ISLAMI];
    }
    return rows.map((r) => ({
      ...r,
      is_active: Boolean(r.is_active),
      swift: r.swift || "",
    })) as BankAccountRecord[];
  } catch {
    return [DEFAULT_BANK_ISLAMI];
  }
}

/**
 * Super Admin function to update bank account details.
 * Requires verification, writes audit log, and notifies super admins.
 */
export async function updateBankAccountDb(
  adminId: string,
  account: Partial<BankAccountRecord> & { id: string },
  actorEmail: string
): Promise<void> {
  await ensureBankAccountsTableDb();

  const existing = await query<RowDataPacket[]>(
    "SELECT * FROM bank_accounts WHERE id = ? LIMIT 1",
    [account.id]
  );

  const prev = existing?.[0] || null;

  await query(`
    UPDATE bank_accounts
    SET
      bank_name = COALESCE(?, bank_name),
      branch = COALESCE(?, branch),
      account_title = COALESCE(?, account_title),
      account_number = COALESCE(?, account_number),
      iban = COALESCE(?, iban),
      swift = COALESCE(?, swift),
      instructions = COALESCE(?, instructions),
      is_active = COALESCE(?, is_active),
      updated_at = NOW()
    WHERE id = ?
  `, [
    account.bank_name ?? null,
    account.branch ?? null,
    account.account_title ?? null,
    account.account_number ?? null,
    account.iban ?? null,
    account.swift ?? null,
    account.instructions ?? null,
    account.is_active !== undefined ? (account.is_active ? 1 : 0) : null,
    account.id,
  ]);

  // Record critical audit log
  await createAuditLogDb({
    actor_type: "super_admin",
    actor_id: adminId,
    action: "bank_account.updated",
    target_type: "bank_account",
    target_id: account.id,
    metadata: {
      changed_by: actorEmail,
      previous: prev ? { bank_name: prev.bank_name, account_number: prev.account_number, iban: prev.iban } : null,
      updated: account,
      timestamp: new Date().toISOString(),
    },
  });
}
