import crypto from "crypto";

function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  const clean = base32.toUpperCase().replace(/=+$/, "");
  for (let i = 0; i < clean.length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

/**
 * Verifies a 6-digit TOTP token against a base32 secret (RFC 6238).
 * Supports a window of ±1 step (30 seconds before/after) for clock drift.
 */
export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleanToken)) return false;

  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000 / 30);

    for (let i = -window; i <= window; i++) {
      const counter = epoch + i;
      const buf = Buffer.alloc(8);
      buf.writeBigInt64BE(BigInt(counter), 0);
      const hmac = crypto.createHmac("sha1", key).update(buf).digest();
      const offset = hmac[hmac.length - 1] & 0x0f;
      const code =
        (((hmac[offset] & 0x7f) << 24) |
          ((hmac[offset + 1] & 0xff) << 16) |
          ((hmac[offset + 2] & 0xff) << 8) |
          (hmac[offset + 3] & 0xff)) %
        1000000;

      if (code.toString().padStart(6, "0") === cleanToken) {
        return true;
      }
    }
  } catch (err) {
    console.error("TOTP verification error:", err);
  }

  return false;
}

/**
 * Returns standard otpauth URL for QR Code scanners (Google Authenticator, Microsoft Authenticator, Authy)
 */
export function getOTPAuthURL(
  email: string,
  secret: string,
  issuer = "Ghais Jhuggi Taleem Foundation"
): string {
  const cleanEmail = encodeURIComponent(email.trim());
  const cleanIssuer = encodeURIComponent(issuer.trim());
  return `otpauth://totp/${cleanIssuer}:${cleanEmail}?secret=${secret}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
}
