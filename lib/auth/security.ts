/**
 * Edge-compatible cryptographic security and URL sanitation utilities.
 * Uses native Web Crypto API (SubtleCrypto) supported in Next.js Edge Middleware,
 * Node.js 18+, and modern browser runtimes with zero external native dependencies.
 */

const DEFAULT_SECRET = "gjtf-enterprise-auth-secret-key-2026-secure-edge";

function getSecretKey(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.CRON_SECRET ||
    DEFAULT_SECRET
  );
}

// Convert string to Uint8Array
function textToBuffer(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

// Base64Url encode
function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Base64Url decode
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

/**
 * Signs a payload using HMAC-SHA256 into a compact JWT (header.payload.signature).
 */
export async function signJwt(
  payload: Record<string, any>,
  expiresInSeconds: number,
  customSecret?: string
): Promise<string> {
  const secret = customSecret || getSecretKey();
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(textToBuffer(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(textToBuffer(JSON.stringify(fullPayload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    textToBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, textToBuffer(dataToSign));
  const encodedSignature = base64UrlEncode(signature);

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verifies a JWT token signature and expiry.
 * Returns decoded payload if valid and unexpired; returns null if tampered or expired.
 */
export async function verifyJwt<T = Record<string, any>>(
  token: string,
  customSecret?: string
): Promise<T | null> {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;
    const secret = customSecret || getSecretKey();

    const key = await crypto.subtle.importKey(
      "raw",
      textToBuffer(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decode signature
    const signatureBinary = base64UrlDecode(encodedSignature);
    const signatureBytes = new Uint8Array(signatureBinary.length);
    for (let i = 0; i < signatureBinary.length; i++) {
      signatureBytes[i] = signatureBinary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      textToBuffer(dataToVerify)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson);

    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload as T;
  } catch (err) {
    return null;
  }
}

/**
 * Open-Redirect Prevention:
 * Validates that nextUrl is a safe, same-origin relative path starting with a single '/'
 * and NOT '//' or '/\' or containing a protocol or host (e.g. https://evil.com).
 * Falls back to defaultPath if unsafe.
 */
export function getSafeRedirectUrl(
  nextUrl: string | null | undefined,
  fallback = "/admin"
): string {
  if (!nextUrl || typeof nextUrl !== "string") return fallback;

  const trimmed = nextUrl.trim();

  // Must start with '/' and not '//' or '/\'
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Reject anything containing scheme separator or carriage returns / newlines
  if (
    trimmed.includes("://") ||
    trimmed.includes("javascript:") ||
    trimmed.includes("data:") ||
    trimmed.includes("\n") ||
    trimmed.includes("\r")
  ) {
    return fallback;
  }

  return trimmed;
}
