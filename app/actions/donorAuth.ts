"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  getDonorByEmailDb,
  getDonorByIdDb,
  updateDonorDb,
  createAuthTokenDb,
  verifyAndConsumeAuthTokenDb,
  revokeAllDonorSessionsDb,
  linkDonationsToDonorDb,
  createAuditLogDb,
  anonymizeDonorDb,
  exportDonorDataDb,
} from "@/lib/db/mysql";
import {
  setDonorSessionCookie,
  clearDonorSessionCookie,
  getAuthenticatedDonor,
  requireAuthenticatedDonor,
} from "@/lib/auth/donor";
import {
  generateSecureToken,
  hashToken,
  generateOtpCode,
  hashOtp,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "@/lib/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/sender";
import {
  createPasswordResetEmail,
  createPasswordChangedEmail,
  createMagicLinkEmail,
} from "@/lib/email/templates/donorTemplates";
import { validateEmail, validatePhoneNumber } from "@/lib/validation";

const APP_URL = process.env.APP_URL || "https://gjtfoundation.com";

// -------------------------------------------------------------
// 1. Password Login (Anti-enumeration, Rate limiting & Lockout)
// -------------------------------------------------------------
export async function loginWithPasswordAction(input: {
  email: string;
  password: string;
}) {
  const normalizedEmail = (input.email || "").trim().toLowerCase();
  const password = input.password || "";

  if (!normalizedEmail || !password) {
    return { success: false, message: "Please provide both email and password." };
  }

  const donor = await getDonorByEmailDb(normalizedEmail);

  // Anti-enumeration: Generic message
  const genericFailMessage = "Invalid email or password. Please verify your credentials.";

  if (!donor) {
    return { success: false, message: genericFailMessage };
  }

  // Check lockout
  if (donor.locked_until && new Date(donor.locked_until) > new Date()) {
    const minutesLeft = Math.ceil(
      (new Date(donor.locked_until).getTime() - Date.now()) / (60 * 1000)
    );
    return {
      success: false,
      message: `Account is temporarily locked due to repeated failed attempts. Please try again in ${minutesLeft} minute(s) or use a Magic Link.`,
    };
  }

  if (donor.status === "blocked") {
    return {
      success: false,
      message: "This account has been suspended. Please contact foundation administration.",
    };
  }

  // If donor has no password set yet (e.g. created through donation pledge)
  if (!donor.password_hash) {
    return {
      success: false,
      message: "A password has not been set for this account yet. Please use the Magic Link or Forgot Password option below.",
    };
  }

  const passwordValid = verifyPassword(password, donor.password_hash);

  if (!passwordValid) {
    const failedCount = (donor.failed_login_count || 0) + 1;
    let lockUntil: string | null = null;

    if (failedCount >= 5) {
      // Lock for 15 minutes
      const lockDate = new Date(Date.now() + 15 * 60 * 1000);
      lockUntil = lockDate.toISOString().slice(0, 19).replace("T", " ");
    }

    await updateDonorDb(donor.id, {
      failed_login_count: failedCount,
      locked_until: lockUntil,
    });

    await createAuditLogDb({
      actor_type: "donor",
      actor_id: donor.id,
      action: "donor.login_failed",
      target_type: "donor",
      target_id: donor.id,
      metadata: { failedCount },
    });

    return { success: false, message: genericFailMessage };
  }

  // Successful Login
  await setDonorSessionCookie(donor.id);
  await linkDonationsToDonorDb(donor.id, donor.email);

  await createAuditLogDb({
    actor_type: "donor",
    actor_id: donor.id,
    action: "donor.login_success",
    target_type: "donor",
    target_id: donor.id,
  });

  revalidatePath("/donor/dashboard");
  return { success: true };
}

// -------------------------------------------------------------
// 2. Magic Link & OTP Login
// -------------------------------------------------------------
export async function requestMagicLinkAction(emailInput: string) {
  const normalizedEmail = (emailInput || "").trim().toLowerCase();
  const genericMessage = "If an account exists with this email address, a secure login link and 6-digit code has been sent.";

  if (!normalizedEmail) {
    return { success: false, message: "Please provide a valid email address." };
  }

  const donor = await getDonorByEmailDb(normalizedEmail);
  if (!donor || donor.status === "blocked") {
    // Return identical message for anti-enumeration
    return { success: true, message: genericMessage };
  }

  try {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const otpCode = generateOtpCode();
    const otpHash = hashOtp(otpCode);

    // Save token with 15 minutes expiry
    await createAuthTokenDb({
      donorId: donor.id,
      type: "magic_link",
      tokenHash,
      expiresInMinutes: 15,
    });

    // Save OTP token with 15 minutes expiry
    await createAuthTokenDb({
      donorId: donor.id,
      type: "otp",
      tokenHash: otpHash,
      expiresInMinutes: 15,
    });

    const magicEmail = createMagicLinkEmail({
      donorName: donor.name,
      donorEmail: donor.email,
      actionUrl: `${APP_URL}/donor/login?token=${rawToken}`,
      expiresInText: "15 minutes",
      otpCode,
    });

    await sendTransactionalEmail({
      to: donor.email,
      recipientName: donor.name,
      emailType: "magic_link",
      subject: magicEmail.subject,
      html: magicEmail.html,
      text: magicEmail.text,
      metadata: { donorId: donor.id },
    });

    await createAuditLogDb({
      actor_type: "donor",
      actor_id: donor.id,
      action: "donor.magic_link_requested",
      target_type: "donor",
      target_id: donor.id,
    });

    return { success: true, message: genericMessage };
  } catch (err: any) {
    console.error("[Magic Link] Dispatch error:", err.message);
    return { success: true, message: genericMessage };
  }
}

export async function verifyMagicLinkOrOtpAction(input: {
  token?: string;
  otp?: string;
  email?: string;
}) {
  let donorId: string | null = null;

  if (input.token && input.token.trim()) {
    const tokenHash = hashToken(input.token.trim());
    const res = await verifyAndConsumeAuthTokenDb(tokenHash, "magic_link");
    if (res.valid && res.donorId) {
      donorId = res.donorId;
    }
  } else if (input.otp && input.otp.trim()) {
    const otpHash = hashOtp(input.otp.trim());
    const res = await verifyAndConsumeAuthTokenDb(otpHash, "otp");
    if (res.valid && res.donorId) {
      donorId = res.donorId;
    }
  }

  if (!donorId) {
    return {
      success: false,
      message: "The login link or OTP code has expired or is invalid. Please request a new one.",
    };
  }

  const donor = await getDonorByIdDb(donorId);
  if (!donor || donor.status === "blocked") {
    return { success: false, message: "Account is not active." };
  }

  // Mark email verified
  if (!donor.email_verified_at) {
    await updateDonorDb(donor.id, {
      email_verified_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    });
  }

  await setDonorSessionCookie(donor.id);
  await linkDonationsToDonorDb(donor.id, donor.email);

  await createAuditLogDb({
    actor_type: "donor",
    actor_id: donor.id,
    action: "donor.otp_login_success",
    target_type: "donor",
    target_id: donor.id,
  });

  revalidatePath("/donor/dashboard");
  return { success: true };
}

// -------------------------------------------------------------
// 3. Forgot Password Request
// -------------------------------------------------------------
export async function requestPasswordResetAction(emailInput: string) {
  const normalizedEmail = (emailInput || "").trim().toLowerCase();
  const genericMessage = "If this email is registered with us, a password reset link has been dispatched to your inbox.";

  if (!normalizedEmail) {
    return { success: false, message: "Please enter your email address." };
  }

  const donor = await getDonorByEmailDb(normalizedEmail);
  if (!donor || donor.status === "blocked") {
    return { success: true, message: genericMessage };
  }

  try {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    await createAuthTokenDb({
      donorId: donor.id,
      type: "reset_password",
      tokenHash,
      expiresInMinutes: 60, // 60 minutes
    });

    const resetEmail = createPasswordResetEmail({
      donorName: donor.name,
      donorEmail: donor.email,
      actionUrl: `${APP_URL}/donor/reset-password?token=${rawToken}`,
      expiresInText: "60 minutes",
    });

    await sendTransactionalEmail({
      to: donor.email,
      recipientName: donor.name,
      emailType: "password_reset",
      subject: resetEmail.subject,
      html: resetEmail.html,
      text: resetEmail.text,
      metadata: { donorId: donor.id },
    });

    await createAuditLogDb({
      actor_type: "donor",
      actor_id: donor.id,
      action: "donor.password_reset_requested",
      target_type: "donor",
      target_id: donor.id,
    });

    return { success: true, message: genericMessage };
  } catch (err: any) {
    console.error("[Password Reset] Dispatch error:", err.message);
    return { success: true, message: genericMessage };
  }
}

// -------------------------------------------------------------
// 4. Reset Password with Single-Use Token
// -------------------------------------------------------------
export async function resetPasswordWithTokenAction(input: {
  token: string;
  newPassword: string;
}) {
  const rawToken = (input.token || "").trim();
  const newPassword = input.newPassword || "";

  if (!rawToken) {
    return { success: false, message: "Invalid or missing password reset token." };
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    return { success: false, message: strength.error || "Password does not meet security requirements." };
  }

  const tokenHash = hashToken(rawToken);
  const tokenRes = await verifyAndConsumeAuthTokenDb(tokenHash, "reset_password");

  if (!tokenRes.valid || !tokenRes.donorId) {
    return {
      success: false,
      message: "This password reset link has expired or has already been used. Please request a new one.",
    };
  }

  const donor = await getDonorByIdDb(tokenRes.donorId);
  if (!donor) {
    return { success: false, message: "Account not found." };
  }

  const newPasswordHash = hashPassword(newPassword);

  // Update password & verify email
  await updateDonorDb(donor.id, {
    password_hash: newPasswordHash,
    email_verified_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    failed_login_count: 0,
    locked_until: null,
  });

  // Revoke all existing sessions for security
  await revokeAllDonorSessionsDb(donor.id);

  // Link historical pledges
  await linkDonationsToDonorDb(donor.id, donor.email);

  // Send security alert confirmation email
  const alertEmail = createPasswordChangedEmail(donor.email, donor.name);
  await sendTransactionalEmail({
    to: donor.email,
    recipientName: donor.name,
    emailType: "password_changed",
    subject: alertEmail.subject,
    html: alertEmail.html,
    text: alertEmail.text,
    metadata: { donorId: donor.id },
  });

  // Log in immediately
  await setDonorSessionCookie(donor.id);

  await createAuditLogDb({
    actor_type: "donor",
    actor_id: donor.id,
    action: "donor.password_reset_completed",
    target_type: "donor",
    target_id: donor.id,
  });

  revalidatePath("/donor/dashboard");
  return {
    success: true,
    message: "Your password has been reset successfully. Welcome to your dashboard!",
  };
}

// -------------------------------------------------------------
// 5. Welcome Set Password (from /donate-now signup)
// -------------------------------------------------------------
export async function setPasswordFromWelcomeAction(input: {
  token: string;
  password: string;
}) {
  const rawToken = (input.token || "").trim();
  const password = input.password || "";

  if (!rawToken) {
    return { success: false, message: "Invalid or missing activation token." };
  }

  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    return { success: false, message: strength.error || "Password does not meet strength rules." };
  }

  const tokenHash = hashToken(rawToken);
  const tokenRes = await verifyAndConsumeAuthTokenDb(tokenHash, "set_password");

  if (!tokenRes.valid || !tokenRes.donorId) {
    return {
      success: false,
      message: "This activation link has expired or has already been used. Please use Forgot Password to receive a fresh link.",
    };
  }

  const donor = await getDonorByIdDb(tokenRes.donorId);
  if (!donor) {
    return { success: false, message: "Account record not found." };
  }

  const passwordHash = hashPassword(password);

  await updateDonorDb(donor.id, {
    password_hash: passwordHash,
    email_verified_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    failed_login_count: 0,
    locked_until: null,
  });

  // Link all previous pledges associated with this email
  await linkDonationsToDonorDb(donor.id, donor.email);

  // Log donor in directly
  await setDonorSessionCookie(donor.id);

  await createAuditLogDb({
    actor_type: "donor",
    actor_id: donor.id,
    action: "donor.account_activated",
    target_type: "donor",
    target_id: donor.id,
  });

  revalidatePath("/donor/dashboard");
  return {
    success: true,
    message: "Account activated successfully! Redirecting to your dashboard...",
  };
}

// -------------------------------------------------------------
// 6. Logout
// -------------------------------------------------------------
export async function logoutDonorAction() {
  const donor = await getAuthenticatedDonor();
  if (donor) {
    await createAuditLogDb({
      actor_type: "donor",
      actor_id: donor.id,
      action: "donor.logout",
      target_type: "donor",
      target_id: donor.id,
    });
  }
  await clearDonorSessionCookie();
  revalidatePath("/");
  return { success: true };
}

// -------------------------------------------------------------
// 7. Profile & Security Updates (Strictly Scoped)
// -------------------------------------------------------------
export async function updateDonorProfileAction(input: {
  name?: string;
  phone?: string;
  prefers_anonymous?: boolean;
  marketing_opt_in?: boolean;
}) {
  const donor = await requireAuthenticatedDonor();

  const updates: any = {};
  if (input.name !== undefined) {
    updates.name = input.name.trim() || null;
  }
  if (input.phone !== undefined) {
    if (input.phone.trim()) {
      const pRes = validatePhoneNumber(input.phone);
      if (!pRes.valid) {
        return { success: false, message: pRes.error || "Invalid phone number." };
      }
      updates.phone = pRes.formatted;
    } else {
      updates.phone = null;
    }
  }
  if (input.prefers_anonymous !== undefined) {
    updates.prefers_anonymous = input.prefers_anonymous;
  }
  if (input.marketing_opt_in !== undefined) {
    updates.marketing_opt_in = input.marketing_opt_in;
  }

  await updateDonorDb(donor.id, updates);

  await createAuditLogDb({
    actor_type: "donor",
    actor_id: donor.id,
    action: "donor.profile_updated",
    target_type: "donor",
    target_id: donor.id,
  });

  revalidatePath("/donor/profile");
  revalidatePath("/donor/dashboard");
  return { success: true, message: "Profile updated successfully." };
}

export async function changeDonorPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const donor = await requireAuthenticatedDonor();

  if (!donor.password_hash) {
    return { success: false, message: "No password currently set. Please use Forgot Password." };
  }

  const valid = verifyPassword(input.currentPassword, donor.password_hash);
  if (!valid) {
    return { success: false, message: "Current password is incorrect." };
  }

  const strength = validatePasswordStrength(input.newPassword);
  if (!strength.valid) {
    return { success: false, message: strength.error || "New password is not strong enough." };
  }

  const newHash = hashPassword(input.newPassword);
  await updateDonorDb(donor.id, { password_hash: newHash });

  // Security alert
  const alertEmail = createPasswordChangedEmail(donor.email, donor.name);
  await sendTransactionalEmail({
    to: donor.email,
    recipientName: donor.name,
    emailType: "password_changed",
    subject: alertEmail.subject,
    html: alertEmail.html,
    text: alertEmail.text,
    metadata: { donorId: donor.id },
  });

  await createAuditLogDb({
    actor_type: "donor",
    actor_id: donor.id,
    action: "donor.password_changed",
    target_type: "donor",
    target_id: donor.id,
  });

  return { success: true, message: "Your password has been changed successfully." };
}

// -------------------------------------------------------------
// 8. GDPR / Privacy: Data Export & Account Deletion
// -------------------------------------------------------------
export async function exportMyDonorDataAction() {
  const donor = await requireAuthenticatedDonor();
  const data = await exportDonorDataDb(donor.id);

  await createAuditLogDb({
    actor_type: "donor",
    actor_id: donor.id,
    action: "donor.data_exported",
    target_type: "donor",
    target_id: donor.id,
  });

  return { success: true, data };
}

export async function requestDonorDeletionAction() {
  const donor = await requireAuthenticatedDonor();

  await createAuditLogDb({
    actor_type: "donor",
    actor_id: donor.id,
    action: "donor.account_deleted_gdpr",
    target_type: "donor",
    target_id: donor.id,
  });

  await anonymizeDonorDb(donor.id);
  await clearDonorSessionCookie();

  revalidatePath("/");
  return { success: true, message: "Your account and personal data have been anonymized." };
}
