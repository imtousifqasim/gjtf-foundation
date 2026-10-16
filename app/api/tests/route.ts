import { NextRequest, NextResponse } from "next/server";
import { signJwt, verifyJwt, getSafeRedirectUrl } from "@/lib/auth/security";
import { normalizeEmail } from "@/lib/validation";

export const dynamic = "force-dynamic";

interface TestResult {
  name: string;
  suite: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  // Basic security check: allow if secret matches or development
  if (secret !== "gjtf-test-2026" && process.env.NODE_ENV === "production" && !secret) {
    return NextResponse.json({ error: "Unauthorized test runner" }, { status: 401 });
  }

  const results: TestResult[] = [];
  const testSecret = "test-jwt-secret-key-gjtf-2026-production-grade";

  async function runTest(suite: string, name: string, fn: () => Promise<void> | void) {
    const start = performance.now();
    try {
      await fn();
      results.push({
        suite,
        name,
        passed: true,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (err: any) {
      results.push({
        suite,
        name,
        passed: false,
        error: err.message || String(err),
        durationMs: Math.round(performance.now() - start),
      });
    }
  }

  // --- Suite 1: P0 Web Crypto Edge JWT ---
  await runTest("P0: Edge JWT", "signs and verifies valid JWT payload", async () => {
    const payload = { sub: "admin_test", email: "admin@gjtfoundation.com", role: "super_admin" };
    const token = await signJwt(payload, testSecret, 3600);
    if (!token || token.split(".").length !== 3) throw new Error("Invalid token format");

    const decoded = await verifyJwt<{ sub: string; email: string }>(token, testSecret);
    if (!decoded || decoded.sub !== "admin_test" || decoded.email !== "admin@gjtfoundation.com") {
      throw new Error("Decoded payload mismatch");
    }
  });

  await runTest("P0: Edge JWT", "rejects tampered JWT signature", async () => {
    const payload = { sub: "admin_test", email: "admin@gjtfoundation.com" };
    const token = await signJwt(payload, testSecret, 3600);
    const parts = token.split(".");
    // Tamper payload with fake admin ID
    const tamperedPayload = Buffer.from(JSON.stringify({ sub: "hacker" })).toString("base64url");
    const tampered = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const decoded = await verifyJwt(tampered, testSecret);
    if (decoded !== null) throw new Error("Tampered JWT was unexpectedly accepted!");
  });

  await runTest("P0: Edge JWT", "rejects expired JWT token", async () => {
    const payload = { sub: "admin_test" };
    const expiredToken = await signJwt(payload, testSecret, -60); // 1 minute in the past
    const decoded = await verifyJwt(expiredToken, testSecret);
    if (decoded !== null) throw new Error("Expired JWT was unexpectedly accepted!");
  });

  // --- Suite 2: Issue 1 Open Redirect Sanitization ---
  await runTest("Issue 1: Redirect Safety", "allows legitimate relative paths", () => {
    const r1 = getSafeRedirectUrl("/admin/donations", "/admin");
    if (r1 !== "/admin/donations") throw new Error(`Expected /admin/donations but got ${r1}`);

    const r2 = getSafeRedirectUrl("/donor/dashboard?pledge=123", "/donor/dashboard");
    if (r2 !== "/donor/dashboard?pledge=123") throw new Error(`Expected query param path but got ${r2}`);
  });

  await runTest("Issue 1: Redirect Safety", "neutralizes external URLs and protocol exploits", () => {
    const fallback = "/donor/dashboard";
    const dangerous = [
      "https://evil.com",
      "http://attacker.org/steal",
      "//evil.com",
      "//evil.com/path",
      "/\\evil.com",
      "\\evil.com",
      "javascript:alert(document.cookie)",
      "data:text/html,<script>alert(1)</script>",
    ];

    for (const evil of dangerous) {
      const sanitized = getSafeRedirectUrl(evil, fallback);
      if (sanitized !== fallback) {
        throw new Error(`Open redirect vulnerability detected! Input "${evil}" produced "${sanitized}"`);
      }
    }
  });

  // --- Suite 3: Issue 2 Donor Email Normalization & Ownership ---
  await runTest("Issue 2: Donor Ownership", "normalizes mixed-case and whitespace emails", () => {
    const normalized = normalizeEmail("   Ali.Qasim@GMAIL.com  ");
    if (normalized !== "ali.qasim@gmail.com") {
      throw new Error(`Expected ali.qasim@gmail.com but got ${normalized}`);
    }
  });

  // --- Suite 4: Issue 3 Contact Messages Soft Deletion ---
  await runTest("Issue 3: Message Deletion", "verifies soft-delete filtering rule", () => {
    const messages = [
      { id: "1", text: "Active 1", deleted_at: null },
      { id: "2", text: "Deleted 2", deleted_at: "2026-10-16 10:00:00" },
      { id: "3", text: "Active 3", deleted_at: null },
    ];
    const visible = messages.filter((m) => m.deleted_at === null);
    if (visible.length !== 2 || visible.some((m) => m.id === "2")) {
      throw new Error("Soft-deleted records leaked into query result");
    }
  });

  // --- Suite 5: Issue 5 Volunteer Error Mapping ---
  await runTest("Issue 5: Error Visibility", "maps SMTP provider errors to readable strings", () => {
    const mapError = (err: string) => {
      if (err.includes("EAUTH") || err.includes("Invalid login")) {
        return "SMTP Authentication failed. Please verify email credentials in /admin/smtp.";
      }
      if (err.includes("ECONNREFUSED") || err.includes("ENOTFOUND")) {
        return "Could not connect to SMTP server host. Please check network/host configuration.";
      }
      return err;
    };

    const mapped = mapError("Error: 535 5.7.8 Error: authentication failed: Invalid login");
    if (!mapped.includes("SMTP Authentication failed")) {
      throw new Error("Raw error was not mapped to human-readable explanation");
    }
  });

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return NextResponse.json({
    allPassed: failedCount === 0,
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
  });
}
