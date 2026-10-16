import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { signJwt, verifyJwt, getSafeRedirectUrl } from "./security";
import { query } from "@/lib/db/mysql";

export const ADMIN_SESSION_COOKIE = "gjtf_admin_session";
const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface AdminSession {
  email: string;
  role: "admin";
  sessionId: string;
  exp: number;
}

/**
 * Creates an admin session: registers it in the DB (for revocability) and sets
 * an httpOnly, Secure, SameSite=Lax cookie containing a signed JWT.
 */
export async function createAdminSession(
  email: string,
  ip?: string,
  userAgent?: string
): Promise<string> {
  const sessionId = "adm_sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);

  // Store in database for server-side revocability (if DB available)
  try {
    await query(
      `INSERT INTO admin_sessions (id, admin_email, session_token_hash, expires_at, ip, user_agent)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?, ?)
       ON DUPLICATE KEY UPDATE expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY), revoked_at = NULL`,
      [sessionId, email.toLowerCase().trim(), sessionId, ip || null, userAgent || null]
    );
  } catch (err) {
    // If table not yet ready, will be created via core schema
    console.warn("[Admin Auth] Database session logging notice:", err);
  }

  const token = await signJwt(
    {
      sub: email.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      role: "admin",
      jti: sessionId,
    },
    SESSION_EXPIRY_SECONDS
  );

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_SECONDS,
  });

  return token;
}

/**
 * Reads and cryptographically verifies the admin session from cookies.
 * Verifies signature, expiry, and revocability.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return null;

    const payload = await verifyJwt<any>(token);
    if (!payload || payload.role !== "admin" || !payload.email) {
      return null;
    }

    // Server-side revocation check
    if (payload.jti) {
      try {
        const rows: any = await query(
          "SELECT revoked_at, expires_at FROM admin_sessions WHERE id = ? LIMIT 1",
          [payload.jti]
        );
        if (rows && rows.length > 0) {
          if (rows[0].revoked_at != null) {
            return null; // Session was explicitly revoked
          }
        }
      } catch {
        // Fall back to cryptographic token validity if DB table in transition
      }
    }

    return {
      email: payload.email,
      role: "admin",
      sessionId: payload.jti || "",
      exp: payload.exp || 0,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Guard for Server Components and Server Actions.
 * Redirects to /admin/login if unauthenticated, never rendering protected content.
 */
export async function requireAdmin(currentPath = "/admin"): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    const safeNext = getSafeRedirectUrl(currentPath, "/admin");
    redirect(`/admin/login?next=${encodeURIComponent(safeNext)}`);
  }
  return session;
}

/**
 * Guard for API Route Handlers.
 * Returns an AdminSession or a 401 Unauthorized Response.
 */
export async function verifyAdminApi(req?: Request): Promise<
  | { authorized: true; session: AdminSession }
  | { authorized: false; response: NextResponse }
> {
  // 1. Check cookies via getAdminSession
  const session = await getAdminSession();
  if (session) {
    return { authorized: true, session };
  }

  // 2. Check Bearer token in Authorization header
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const bearerToken = authHeader.substring(7).trim();
      const payload = await verifyJwt<any>(bearerToken);
      if (payload && payload.role === "admin" && payload.email) {
        return {
          authorized: true,
          session: {
            email: payload.email,
            role: "admin",
            sessionId: payload.jti || "",
            exp: payload.exp || 0,
          },
        };
      }
    }
  }

  return {
    authorized: false,
    response: NextResponse.json(
      {
        ok: false,
        code: "UNAUTHORIZED",
        message: "Authentication required. Admin privileges missing or session expired.",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, private, max-age=0",
          "Vary": "Cookie",
        },
      }
    ),
  };
}

/**
 * Clears the admin session cookie and revokes server-side session.
 */
export async function clearAdminSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (token) {
      const payload = await verifyJwt<any>(token);
      if (payload?.jti) {
        try {
          await query("UPDATE admin_sessions SET revoked_at = NOW() WHERE id = ?", [payload.jti]);
        } catch {}
      }
    }
    cookieStore.delete(ADMIN_SESSION_COOKIE);
  } catch {}
}
