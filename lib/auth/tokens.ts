import crypto from "crypto";

/**
 * Generates an unguessable high-entropy token (64-char hex string)
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hashes a token using SHA-256 before storing in the database.
 * Raw tokens are NEVER stored in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Generates a 6-digit numeric OTP code
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hashes an OTP code with an internal secret salt
 */
export function hashOtp(otp: string): string {
  const secret = process.env.AUTH_SECRET || "gjtf-foundation-donor-secret-salt-2026";
  return crypto.createHmac("sha256", secret).update(otp.trim()).digest("hex");
}

/**
 * Secure PBKDF2 Password Hashing (100,000 iterations, SHA-512)
 * Compatible with edge and serverless environments with zero external native dependencies.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

/**
 * Verifies a password against the stored PBKDF2 hash using timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];

    const computed = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(originalHash));
  } catch {
    return false;
  }
}

/**
 * Validates password strength rules:
 * - At least 8 characters
 * - Contains at least one letter and at least one digit or special symbol
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one letter." };
  }
  if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number or special character." };
  }
  return { valid: true };
}
