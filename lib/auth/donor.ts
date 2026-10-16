import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
import { signJwt, verifyJwt, getSafeRedirectUrl } from "./security";

export const DONOR_SESSION_COOKIE = "gjtf_donor_session";
const DONOR_SESSION_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Derives the currently logged-in donor strictly from the verified server-side session cookie.
 * NEVER trusts client-supplied donor_id or request body IDs (Zero-Trust).
 */
export async function getAuthenticatedDonor(): Promise<DonorRecord | null> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(DONOR_SESSION_COOKIE)?.value;
    if (!cookieValue || cookieValue.length < 16) {
      return null;
    }

    let rawToken = cookieValue;

    // Check if token is signed JWT
    if (cookieValue.includes(".")) {
      const payload = await verifyJwt<any>(cookieValue);
      if (!payload || payload.role !== "donor" || !payload.jti) {
        return null;
      }
      rawToken = payload.jti;
    }

    const tokenHash = hashToken(rawToken);
    const donor = await getDonorBySessionTokenDb(tokenHash);
    return donor;
  } catch (err: any) {
    console.error("[Donor Auth] Session verification error:", err.message);
    return null;
  }
}

/**
 * Guard for Server Components and Server Actions.
 * Redirects or throws if not authenticated.
 */
export async function requireAuthenticatedDonor(currentPath = "/donor/dashboard"): Promise<DonorRecord> {
  const donor = await getAuthenticatedDonor();
  if (!donor) {
    throw new Error("UNAUTHORIZED");
  }
  return donor;
}

/**
 * Page guard: redirects to login if donor is not authenticated
 */
export async function requireDonor(currentPath = "/donor/dashboard"): Promise<DonorRecord> {
  const donor = await getAuthenticatedDonor();
  if (!donor) {
    const safeNext = getSafeRedirectUrl(currentPath, "/donor/dashboard");
    redirect(`/donor/login?next=${encodeURIComponent(safeNext)}`);
  }
  return donor;
}

/**
 * Creates and attaches an httpOnly session cookie with a signed JWT
 */
export async function setDonorSessionCookie(
  donorId: string,
  ip?: string,
  userAgent?: string
): Promise<string> {
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);

  await createDonorSessionDb({
    donorId,
    sessionTokenHash: tokenHash,
    expiresInDays: 30,
    ip,
    userAgent,
  });

  // Sign JWT with donor identity and session token reference
  const signedToken = await signJwt(
    {
      sub: donorId,
      role: "donor",
      jti: rawToken,
    },
    DONOR_SESSION_EXPIRY_SECONDS
  );

  const cookieStore = await cookies();
  cookieStore.set(DONOR_SESSION_COOKIE, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DONOR_SESSION_EXPIRY_SECONDS,
  });

  // Update donor last login
  await updateDonorDb(donorId, {
    last_login_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    failed_login_count: 0,
    locked_until: null,
  });

  return signedToken;
}

/**
 * Clears the session cookie and revokes session in DB
 */
export async function clearDonorSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(DONOR_SESSION_COOKIE)?.value;
    if (cookieValue) {
      let rawToken = cookieValue;
      if (cookieValue.includes(".")) {
        const payload = await verifyJwt<any>(cookieValue);
        if (payload?.jti) {
          rawToken = payload.jti;
        }
      }
      await revokeDonorSessionDb(hashToken(rawToken));
    }
    cookieStore.delete(DONOR_SESSION_COOKIE);
  } catch {}
}
