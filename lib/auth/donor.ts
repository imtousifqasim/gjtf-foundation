import { cookies } from "next/headers";
import {
  getDonorBySessionTokenDb,
  getDonorByEmailDb,
  createDonorSessionDb,
  revokeDonorSessionDb,
  revokeAllDonorSessionsDb,
  updateDonorDb,
  linkDonationsToDonorDb,
  createAuthTokenDb,
  verifyAndConsumeAuthTokenDb,
  createAuditLogDb,
  DonorRecord,
} from "@/lib/db/mysql";
import {
  generateSecureToken,
  hashToken,
  generateOtpCode,
  hashOtp,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "./tokens";

export const DONOR_SESSION_COOKIE = "gjtf_donor_session";

/**
 * Derives the currently logged-in donor strictly from the verified server-side session cookie.
 * NEVER trusts client-supplied donor_id or request body IDs (Zero-Trust).
 */
export async function getAuthenticatedDonor(): Promise<DonorRecord | null> {
  try {
    const cookieStore = await cookies();
    const sessionTokenRaw = cookieStore.get(DONOR_SESSION_COOKIE)?.value;
    if (!sessionTokenRaw || sessionTokenRaw.length < 32) {
      return null;
    }

    const tokenHash = hashToken(sessionTokenRaw);
    const donor = await getDonorBySessionTokenDb(tokenHash);
    return donor;
  } catch (err: any) {
    console.error("[Donor Auth] Session verification error:", err.message);
    return null;
  }
}

/**
 * Throws or returns an error if not authenticated
 */
export async function requireAuthenticatedDonor(): Promise<DonorRecord> {
  const donor = await getAuthenticatedDonor();
  if (!donor) {
    throw new Error("UNAUTHORIZED");
  }
  return donor;
}

/**
 * Creates and attaches an httpOnly session cookie
 */
export async function setDonorSessionCookie(donorId: string, ip?: string, userAgent?: string): Promise<string> {
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);

  await createDonorSessionDb({
    donorId,
    sessionTokenHash: tokenHash,
    expiresInDays: 30,
    ip,
    userAgent,
  });

  const cookieStore = await cookies();
  cookieStore.set(DONOR_SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  // Update donor last login
  await updateDonorDb(donorId, {
    last_login_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    failed_login_count: 0,
    locked_until: null,
  });

  return rawToken;
}

/**
 * Clears the session cookie and revokes session in DB
 */
export async function clearDonorSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(DONOR_SESSION_COOKIE)?.value;
    if (rawToken) {
      await revokeDonorSessionDb(hashToken(rawToken));
    }
    cookieStore.delete(DONOR_SESSION_COOKIE);
  } catch {}
}
