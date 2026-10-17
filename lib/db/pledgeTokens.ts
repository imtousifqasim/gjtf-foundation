import crypto from "crypto";
import { cookies } from "next/headers";
import { query, RowDataPacket } from "./mysql";
import { ensurePaymentProofTablesDb } from "./paymentProofsSchema";

const TOKEN_EXPIRY_DAYS = 7;

export function getPledgeCookieName(referenceNo: string): string {
  return `gjtf_pledge_${referenceNo.replace(/[^A-Za-z0-9_-]/g, "_")}`;
}

export function hashPledgeToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Creates a signed, expiring single-pledge access token for guest donors.
 * Stored hashed in pledge_access_tokens, valid for 7 days, scoped strictly to donationId.
 * Attaches an httpOnly, Secure cookie for immediate payment flow access.
 */
export async function createPledgeAccessToken(
  donationId: string,
  referenceNo: string,
  ip?: string,
  userAgent?: string
): Promise<string> {
  await ensurePaymentProofTablesDb();

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashPledgeToken(rawToken);
  const tokenId = `pat_${crypto.randomUUID()}`;

  await query(`
    INSERT INTO pledge_access_tokens (id, donation_id, token_hash, expires_at, ip, user_agent, created_at)
    VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, NOW())
  `, [
    tokenId,
    donationId,
    tokenHash,
    TOKEN_EXPIRY_DAYS,
    ip || null,
    userAgent || null,
  ]);

  // Set httpOnly cookie for 7 days
  try {
    const cookieStore = await cookies();
    cookieStore.set(getPledgeCookieName(referenceNo), rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    });
  } catch (err) {
    // In server actions/API where cookies() is available, set cookie; else caller passes rawToken
  }

  return rawToken;
}

/**
 * Verifies that a raw token or cookie grants valid access to a specific donation pledge.
 * Returns true if valid and unexpired; false otherwise.
 */
export async function verifyPledgeAccess(
  donationId: string,
  referenceNo: string,
  tokenCandidate?: string | null
): Promise<boolean> {
  await ensurePaymentProofTablesDb();

  let tokenToVerify = tokenCandidate;

  // If no explicit token provided, inspect cookie
  if (!tokenToVerify) {
    try {
      const cookieStore = await cookies();
      const cookieVal = cookieStore.get(getPledgeCookieName(referenceNo))?.value;
      if (cookieVal) {
        tokenToVerify = cookieVal;
      }
    } catch {}
  }

  if (!tokenToVerify || tokenToVerify.length < 16) {
    return false;
  }

  const tokenHash = hashPledgeToken(tokenToVerify);

  const rows = await query<RowDataPacket[]>(`
    SELECT id, expires_at
    FROM pledge_access_tokens
    WHERE donation_id = ? AND token_hash = ? AND expires_at > NOW()
    LIMIT 1
  `, [donationId, tokenHash]);

  return Boolean(rows && rows.length > 0);
}
