import { NextResponse, type NextRequest } from "next/server";
import { verifyJwt, getSafeRedirectUrl } from "@/lib/auth/security";

const ADMIN_SESSION_COOKIE = "gjtf_admin_session";
const DONOR_SESSION_COOKIE = "gjtf_donor_session";

// Public pre-auth routes for donors
const DONOR_PRE_AUTH_ROUTES = [
  "/donor/login",
  "/donor/forgot-password",
  "/donor/reset-password",
  "/donor/set-password",
  "/donor/verify-email",
  "/donor/verify",
];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Pass current pathname to Server Components via request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Security response headers for private sections
  const privateHeaders = {
    "Cache-Control": "no-store, private, no-cache, must-revalidate, max-age=0",
    "Vary": "Cookie",
    "X-Robots-Tag": "noindex, nofollow",
  };

  // -------------------------------------------------------------
  // 1. ADMIN SECTION (/admin/:path*)
  // -------------------------------------------------------------
  if (pathname.startsWith("/admin")) {
    const adminToken =
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value ||
      request.cookies.get("admin_session")?.value ||
      request.cookies.get("admin-session")?.value;
    let validAdmin = false;

    if (adminToken) {
      const payload = await verifyJwt<any>(adminToken);
      if (payload && payload.role === "admin" && payload.email) {
        validAdmin = true;
      }
    }

    // A: Visiting /admin/login
    if (pathname === "/admin/login") {
      if (validAdmin) {
        // Issue 1: Already logged in -> redirect to /admin or validated next
        const rawNext = searchParams.get("next") || searchParams.get("redirectTo");
        const safeTarget = getSafeRedirectUrl(rawNext, "/admin");
        return NextResponse.redirect(new URL(safeTarget, request.url));
      }
      // Allow unauthenticated admin to see login page
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // B: All other /admin/:path* routes -> Protected!
    if (!validAdmin) {
      // P0: Instant redirect at HTTP edge before any dashboard HTML is generated
      const safeRelativePath = getSafeRedirectUrl(pathname + request.nextUrl.search, "/admin");
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", safeRelativePath);
      return NextResponse.redirect(loginUrl);
    }

    // Authorized admin: apply private no-store headers
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    Object.entries(privateHeaders).forEach(([key, val]) => {
      response.headers.set(key, val);
    });
    return response;
  }

  // -------------------------------------------------------------
  // 2. DONOR SECTION (/donor/:path*)
  // -------------------------------------------------------------
  if (pathname.startsWith("/donor")) {
    const donorCookie = request.cookies.get(DONOR_SESSION_COOKIE)?.value;
    let validDonor = false;

    if (donorCookie) {
      if (donorCookie.includes(".")) {
        const payload = await verifyJwt<any>(donorCookie);
        if (payload && payload.role === "donor" && payload.sub) {
          validDonor = true;
        }
      } else if (donorCookie.length >= 32) {
        validDonor = true;
      }
    }

    const isPreAuthRoute = DONOR_PRE_AUTH_ROUTES.some((route) => pathname.startsWith(route));

    // A: Pre-Auth routes (login, forgot-password, set-password, etc.)
    if (isPreAuthRoute) {
      if (validDonor) {
        // Issue 1: Already logged in -> redirect to /donor/dashboard or validated next
        const rawNext = searchParams.get("next") || searchParams.get("redirectTo");
        const safeTarget = getSafeRedirectUrl(rawNext, "/donor/dashboard");
        return NextResponse.redirect(new URL(safeTarget, request.url));
      }
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // B: Protected Donor pages (/donor/dashboard, /donor/donations, etc.)
    if (!validDonor) {
      const safeRelativePath = getSafeRedirectUrl(pathname + request.nextUrl.search, "/donor/dashboard");
      const loginUrl = new URL("/donor/login", request.url);
      loginUrl.searchParams.set("next", safeRelativePath);
      return NextResponse.redirect(loginUrl);
    }

    // Authorized donor: apply private no-store headers
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    Object.entries(privateHeaders).forEach(([key, val]) => {
      response.headers.set(key, val);
    });
    return response;
  }

  // -------------------------------------------------------------
  // 3. ADMIN API ENDPOINTS (/api/admin/:path*)
  // -------------------------------------------------------------
  if (pathname.startsWith("/api/admin")) {
    const adminToken =
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value ||
      request.cookies.get("admin_session")?.value ||
      request.cookies.get("admin-session")?.value;
    let validAdmin = false;

    if (adminToken) {
      const payload = await verifyJwt<any>(adminToken);
      if (payload && payload.role === "admin") {
        validAdmin = true;
      }
    }

    const authHeader = request.headers.get("authorization");
    if (!validAdmin && authHeader?.startsWith("Bearer ")) {
      const bearerToken = authHeader.substring(7).trim();
      const payload = await verifyJwt<any>(bearerToken);
      if (payload && payload.role === "admin") {
        validAdmin = true;
      }
    }

    if (!validAdmin) {
      return NextResponse.json(
        {
          ok: false,
          code: "UNAUTHORIZED",
          message: "Authentication required for admin API operations.",
        },
        {
          status: 401,
          headers: privateHeaders,
        }
      );
    }

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    Object.entries(privateHeaders).forEach(([key, val]) => {
      response.headers.set(key, val);
    });
    return response;
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/donor/:path*",
    "/api/admin/:path*",
  ],
};
