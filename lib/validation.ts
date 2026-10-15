import { z } from "zod";

/**
 * Domain Typo Dictionary
 * Common typos made by users when registering their email
 */
const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  // Gmail typos
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmaile.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.cpm": "gmail.com",
  "g-mail.com": "gmail.com",
  "gmaul.com": "gmail.com",

  // Yahoo typos
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhoo.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "ymail.con": "ymail.com",

  // Hotmail / Outlook typos
  "hotmial.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmial.con": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.con": "outlook.com",

  // iCloud typos
  "iclod.com": "icloud.com",
  "icld.com": "icloud.com",
  "icloud.con": "icloud.com",
};

/**
 * Common invalid / dummy emails
 */
const DUMMY_EMAILS = new Set([
  "test@test.com",
  "test@gmail.com",
  "admin@admin.com",
  "123@123.com",
  "asdf@asdf.com",
  "fake@fake.com",
  "no@no.com",
  "a@a.com",
  "temp@temp.com",
  "none@none.com",
  "user@example.com",
]);

/**
 * Disposable email domains
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "tempmail.com",
  "guerrillamail.com",
  "trashmail.com",
  "yopmail.com",
  "dispostable.com",
  "sharklasers.com",
  "getnada.com",
  "throwawaymail.com",
]);

/**
 * Strict Email Validator
 */
export function validateEmail(emailInput?: string | null): {
  valid: boolean;
  cleaned: string;
  error?: string;
  suggestion?: string;
} {
  const email = (emailInput || "").trim().toLowerCase();

  if (!email) {
    return { valid: false, cleaned: "", error: "Email address is required." };
  }

  // Basic RFC pattern
  const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!basicRegex.test(email)) {
    return {
      valid: false,
      cleaned: email,
      error: "Please enter a valid email format (e.g., name@example.com).",
    };
  }

  // Prevent consecutive dots or trailing dots
  if (email.includes("..") || email.startsWith(".") || email.endsWith(".")) {
    return { valid: false, cleaned: email, error: "Email contains invalid dot placements." };
  }

  const parts = email.split("@");
  if (parts.length !== 2) {
    return { valid: false, cleaned: email, error: "Email must contain exactly one '@' symbol." };
  }

  const [localPart, domainPart] = parts;

  if (localPart.length < 1 || localPart.length > 64) {
    return { valid: false, cleaned: email, error: "The username portion of the email is invalid." };
  }

  if (domainPart.length < 4 || domainPart.length > 255) {
    return { valid: false, cleaned: email, error: "The domain portion of the email is invalid." };
  }

  // Check dummy addresses
  if (DUMMY_EMAILS.has(email)) {
    return { valid: false, cleaned: email, error: "Please enter a genuine, active email address." };
  }

  // Check disposable domains
  if (DISPOSABLE_DOMAINS.has(domainPart)) {
    return {
      valid: false,
      cleaned: email,
      error: "Temporary or disposable email addresses are not permitted.",
    };
  }

  // Check domain typos
  if (COMMON_DOMAIN_TYPOS[domainPart]) {
    const suggestedDomain = COMMON_DOMAIN_TYPOS[domainPart];
    const suggestedEmail = `${localPart}@${suggestedDomain}`;
    return {
      valid: false,
      cleaned: email,
      suggestion: suggestedEmail,
      error: `Did you mean "${suggestedEmail}"? The domain "${domainPart}" appears to have a typo.`,
    };
  }

  // Check top-level domain (TLD)
  const domainSections = domainPart.split(".");
  const tld = domainSections[domainSections.length - 1];

  if (!tld || tld.length < 2) {
    return { valid: false, cleaned: email, error: "Email domain must include a valid extension." };
  }

  // Common TLD typos
  if (tld === "con" || tld === "cpm" || tld === "cm") {
    return {
      valid: false,
      cleaned: email,
      error: `Invalid email ending ".${tld}". Did you mean ".com"?`,
    };
  }

  return { valid: true, cleaned: email };
}

/**
 * Strict Phone & WhatsApp Number Validator
 * Supports Pakistani local (03xx), international format (+923xx), and international donors (+1, +44, +971, +966, etc.)
 */
export function validatePhoneNumber(phoneInput?: string | null): {
  valid: boolean;
  cleaned: string;
  formatted: string;
  error?: string;
} {
  const raw = (phoneInput || "").trim();

  if (!raw) {
    return { valid: false, cleaned: "", formatted: "", error: "Phone / WhatsApp number is required." };
  }

  // Strip spaces, dashes, brackets, dots
  let cleaned = raw.replace(/[\s\-\(\)\.]/g, "");

  // Must contain only digits and optional leading plus
  if (!/^\+?[0-9]{9,16}$/.test(cleaned)) {
    return {
      valid: false,
      cleaned,
      formatted: raw,
      error: "Phone number contains invalid characters. Only digits and '+' are allowed.",
    };
  }

  // Check for dummy identical numbers (e.g. 00000000000, 11111111111, 12345678901)
  const digitsOnly = cleaned.replace(/\D/g, "");
  if (/^(\d)\1+$/.test(digitsOnly)) {
    return {
      valid: false,
      cleaned,
      formatted: raw,
      error: "Please enter a genuine, active phone / WhatsApp number.",
    };
  }

  if (digitsOnly === "1234567890" || digitsOnly === "0123456789" || digitsOnly === "03123456789" || digitsOnly === "03012345678") {
    return {
      valid: false,
      cleaned,
      formatted: raw,
      error: "Sequential dummy numbers are not allowed.",
    };
  }

  // 1. Pakistani Number Validation
  // Formats: 03001234567 (11 digits), +923001234567 (13 chars), 923001234567 (12 digits), 00923001234567 (14 digits)
  if (
    cleaned.startsWith("03") ||
    cleaned.startsWith("+923") ||
    cleaned.startsWith("923") ||
    cleaned.startsWith("00923")
  ) {
    let standardized = "";
    if (cleaned.startsWith("03") && cleaned.length === 11) {
      standardized = "+92" + cleaned.slice(1);
    } else if (cleaned.startsWith("+923") && cleaned.length === 13) {
      standardized = cleaned;
    } else if (cleaned.startsWith("923") && cleaned.length === 12) {
      standardized = "+" + cleaned;
    } else if (cleaned.startsWith("00923") && cleaned.length === 14) {
      standardized = "+" + cleaned.slice(2);
    } else {
      return {
        valid: false,
        cleaned,
        formatted: raw,
        error: "Pakistani mobile numbers must be 11 digits (e.g., 03001234567 or +923001234567).",
      };
    }

    // Verify valid mobile network operator prefix (030x to 037x)
    const operatorDigit = standardized.charAt(4); // +92 3 [operatorDigit]
    if (!"01234567".includes(operatorDigit)) {
      return {
        valid: false,
        cleaned,
        formatted: raw,
        error: "Invalid mobile network code. Expected 030x, 031x, 032x, 033x, 034x, 035x, or 036x.",
      };
    }

    // Formatted presentation: +92 300 1234567
    const display = `${standardized.slice(0, 3)} ${standardized.slice(3, 6)} ${standardized.slice(6)}`;
    return { valid: true, cleaned: standardized, formatted: display };
  }

  // 2. Pakistani Landline Validation (e.g. 042-35236622, 021-34567890, 051-xxxxxxx)
  if (cleaned.startsWith("0") && digitsOnly.length >= 10 && digitsOnly.length <= 11) {
    return {
      valid: true,
      cleaned,
      formatted: cleaned,
    };
  }

  // 3. International Numbers (e.g. +1 555..., +44 7..., +971 5..., +966 5...)
  if (cleaned.startsWith("+") && digitsOnly.length >= 8 && digitsOnly.length <= 15) {
    return {
      valid: true,
      cleaned,
      formatted: cleaned,
    };
  }

  // If user entered international without '+' (e.g. 971501234567, 447123456789)
  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return {
      valid: true,
      cleaned: "+" + digitsOnly,
      formatted: "+" + digitsOnly,
    };
  }

  return {
    valid: false,
    cleaned,
    formatted: raw,
    error: "Please enter a valid phone number with country code (e.g., 0300 1234567 or +971 50 1234567).",
  };
}

/**
 * Reusable Zod Schemas for Server Actions
 */
export const strictEmailZod = z.string().refine((val) => {
  const res = validateEmail(val);
  return res.valid;
}, {
  message: "Please enter a valid, active email address without typos.",
});

export const strictOptionalEmailZod = z.string().optional().refine((val) => {
  if (!val || val.trim() === "") return true;
  const res = validateEmail(val);
  return res.valid;
}, {
  message: "Please enter a valid email address without typos.",
});

export const strictPhoneZod = z.string().refine((val) => {
  const res = validatePhoneNumber(val);
  return res.valid;
}, {
  message: "Please enter a valid phone / WhatsApp number (e.g., 0300 1234567).",
});

export const strictOptionalPhoneZod = z.string().optional().refine((val) => {
  if (!val || val.trim() === "") return true;
  const res = validatePhoneNumber(val);
  return res.valid;
}, {
  message: "Please enter a valid phone / WhatsApp number (e.g., 0300 1234567).",
});
