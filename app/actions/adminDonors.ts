"use server";

import { revalidatePath } from "next/cache";
import {
  getAllDonorsAdminDb,
  getDonorDetailsAdminDb,
  updateDonorDb,
  createAuthTokenDb,
  createAuditLogDb,
  getPaymentSettingsDb,
  savePaymentSettingsDb,
  createDonationDb,
  createDonationStatusHistoryDb,
  getOrCreateReceiptDb,
  query,
} from "@/lib/db/mysql";
import { generateSecureToken, hashToken } from "@/lib/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/sender";
import { createPasswordResetEmail } from "@/lib/email/templates/donorTemplates";
import { createDonationCompletedEmail } from "@/lib/email/templates/donationTemplates";
import { RowDataPacket } from "mysql2/promise";
import { getActivePricingSettingsDb } from "@/lib/db/pricingDb";

const APP_URL = process.env.APP_URL || "https://gjtfoundation.com";


// -------------------------------------------------------------
// 1. Donors Listing & Audit Logged Detail View
// -------------------------------------------------------------
export async function getAdminDonorsAction(filters?: {
  search?: string;
  status?: string;
  page?: number;
}) {
  const page = Math.max(1, filters?.page || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const result = await getAllDonorsAdminDb({
    search: filters?.search,
    status: filters?.status,
    limit,
    offset,
  });

  return {
    donors: result.donors,
    total: result.total,
    page,
    totalPages: Math.ceil(result.total / limit),
  };
}

export async function getAdminDonorDetailAction(donorId: string, adminEmail: string = "admin") {
  const details = await getDonorDetailsAdminDb(donorId);
  if (!details) {
    return { success: false, message: "Donor record not found." };
  }

  // Audit Log: Record that an admin opened this donor's personal file (Least Privilege Tracking)
  await createAuditLogDb({
    actor_type: "admin",
    actor_id: adminEmail,
    action: "admin.donor_viewed",
    target_type: "donor",
    target_id: donorId,
  });

  return {
    success: true,
    ...details,
  };
}

// -------------------------------------------------------------
// 2. Admin Actions on Donor Accounts
// -------------------------------------------------------------
export async function adminTriggerPasswordResetAction(donorId: string, adminEmail: string = "admin") {
  const details = await getDonorDetailsAdminDb(donorId);
  if (!details || !details.donor) {
    return { success: false, message: "Donor not found." };
  }

  const donor = details.donor;
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);

  await createAuthTokenDb({
    donorId: donor.id,
    type: "reset_password",
    tokenHash,
    expiresInMinutes: 60,
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
    metadata: { donorId: donor.id, triggeredBy: adminEmail },
  });

  await createAuditLogDb({
    actor_type: "admin",
    actor_id: adminEmail,
    action: "admin.triggered_password_reset",
    target_type: "donor",
    target_id: donor.id,
  });

  return {
    success: true,
    message: `Password reset link dispatched to ${donor.email}.`,
  };
}

export async function adminToggleDonorBlockAction(
  donorId: string,
  newStatus: "active" | "blocked",
  adminEmail: string = "admin"
) {
  await updateDonorDb(donorId, { status: newStatus });

  await createAuditLogDb({
    actor_type: "admin",
    actor_id: adminEmail,
    action: newStatus === "blocked" ? "admin.donor_blocked" : "admin.donor_unblocked",
    target_type: "donor",
    target_id: donorId,
  });

  revalidatePath("/admin/donors");
  return {
    success: true,
    message: `Donor status updated to ${newStatus}.`,
  };
}

// -------------------------------------------------------------
// 3. Payment & Bank Settings (Admin Configurable)
// -------------------------------------------------------------
export async function adminGetPaymentSettingsAction() {
  return await getPaymentSettingsDb();
}

export async function adminSavePaymentSettingsAction(data: any, adminEmail: string = "admin") {
  await savePaymentSettingsDb(data);

  await createAuditLogDb({
    actor_type: "admin",
    actor_id: adminEmail,
    action: "admin.payment_settings_updated",
    target_type: "settings",
    target_id: "payment_settings",
    metadata: { bank: data.bank_name, account: data.account_number },
  });

  revalidatePath("/admin/payment-settings");
  revalidatePath("/donate-now");
  revalidatePath("/donor/dashboard");

  return { success: true, message: "Payment & bank settings saved successfully." };
}

// -------------------------------------------------------------
// 4. Financial & Impact Reports (Grouped by Currency)
// -------------------------------------------------------------
export async function adminGetFinancialReportsAction() {
  const [
    currencyTotals,
    categoryTotals,
    frequencyTotals,
    monthlyTrends,
    planHealth,
    topSupporters,
    pricing,
    enrolledRow,
    monthlyCommitmentsRow,
    completedOneTimeRow,
    childMonthsMonthly,
  ] = await Promise.all([
    // Totals by currency for COMPLETED donations
    query<RowDataPacket[]>(`
      SELECT 
        UPPER(TRIM(currency)) as currency,
        COALESCE(SUM(amount), 0) as total_completed,
        COALESCE(SUM(CASE WHEN YEAR(created_at) = YEAR(NOW()) THEN amount ELSE 0 END), 0) as this_year_completed,
        COALESCE(SUM(CASE WHEN YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW()) THEN amount ELSE 0 END), 0) as this_month_completed,
        COUNT(*) as completed_count
      FROM donations
      WHERE status = 'completed'
      GROUP BY UPPER(TRIM(currency))
    `),

    // Category breakdown (General vs Zakat vs Sadqah)
    query<RowDataPacket[]>(`
      SELECT 
        UPPER(TRIM(currency)) as currency,
        donation_type,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as count
      FROM donations
      WHERE status = 'completed'
      GROUP BY UPPER(TRIM(currency)), donation_type
    `),

    // Frequency breakdown (once vs monthly)
    query<RowDataPacket[]>(`
      SELECT 
        UPPER(TRIM(currency)) as currency,
        frequency,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as count
      FROM donations
      WHERE status = 'completed'
      GROUP BY UPPER(TRIM(currency)), frequency
    `),

    // Monthly trends (last 12 months)
    query<RowDataPacket[]>(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        UPPER(TRIM(currency)) as currency,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as count
      FROM donations
      WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), UPPER(TRIM(currency))
      ORDER BY month ASC
    `),

    // Recurring Monthly Plans Health
    query<RowDataPacket[]>(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as monthly_pledge_value
      FROM donation_plans
      GROUP BY status
    `),

    // Top supporters (PKR & AED separately)
    query<RowDataPacket[]>(`
      SELECT 
        d.id, d.name, d.email, d.country,
        UPPER(TRIM(dn.currency)) as currency,
        COALESCE(SUM(dn.amount), 0) as total_given,
        COUNT(dn.id) as donation_count
      FROM donors d
      INNER JOIN donations dn ON d.id = dn.donor_id
      WHERE dn.status = 'completed'
      GROUP BY d.id, UPPER(TRIM(dn.currency))
      ORDER BY total_given DESC
      LIMIT 10
    `),

    // Active pricing settings (cost per child month)
    getActivePricingSettingsDb().catch(() => ({ costPerChildMonthPkr: 5000 })),

    // Enrolled children setting from app_settings
    query<RowDataPacket[]>(`
      SELECT setting_value FROM app_settings WHERE setting_key = 'enrolled_children' LIMIT 1
    `).catch(() => []),

    // Active monthly commitments in PKR
    query<RowDataPacket[]>(`
      SELECT 
        COALESCE(SUM(amount), 0) as monthly_pkr,
        COUNT(*) as active_plans
      FROM donation_plans
      WHERE status = 'active'
    `).catch(() => [{ monthly_pkr: 0, active_plans: 0 }]),

    // Completed one-time donations in current calendar month in PKR
    query<RowDataPacket[]>(`
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN amount_pkr_minor IS NOT NULL AND amount_pkr_minor > 0 THEN amount_pkr_minor / 100
            WHEN UPPER(TRIM(currency)) = 'PKR' THEN amount
            ELSE amount * 76.5
          END
        ), 0) as completed_pkr,
        COUNT(*) as count
      FROM donations
      WHERE status = 'completed'
        AND (frequency = 'once' OR frequency IS NULL)
        AND YEAR(created_at) = YEAR(NOW())
        AND MONTH(created_at) = MONTH(NOW())
    `).catch(() => [{ completed_pkr: 0, count: 0 }]),

    // Child-months funded per month (last 12 months)
    query<RowDataPacket[]>(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as donation_count,
        COALESCE(SUM(
          CASE 
            WHEN children_equivalent IS NOT NULL AND children_equivalent > 0 THEN children_equivalent
            WHEN amount_pkr_minor IS NOT NULL AND amount_pkr_minor > 0 THEN (amount_pkr_minor / 100) / 5000.0
            WHEN UPPER(TRIM(currency)) = 'PKR' THEN amount / 5000.0
            ELSE (amount * 76.5) / 5000.0
          END
        ), 0) as child_months_funded,
        COALESCE(SUM(
          CASE 
            WHEN amount_pkr_minor IS NOT NULL AND amount_pkr_minor > 0 THEN amount_pkr_minor / 100
            WHEN UPPER(TRIM(currency)) = 'PKR' THEN amount
            ELSE amount * 76.5
          END
        ), 0) as total_pkr
      FROM donations
      WHERE status = 'completed'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `).catch(() => []),
  ]);

  const costPerChild = (pricing as any)?.costPerChildMonthPkr || 5000;
  const enrolledChildren = enrolledRow?.[0]?.setting_value ? parseInt(enrolledRow[0].setting_value, 10) : 1000;

  const monthlyPkr = Number(monthlyCommitmentsRow?.[0]?.monthly_pkr || 0);
  const activePlansCount = Number(monthlyCommitmentsRow?.[0]?.active_plans || 0);

  const completedOneTimePkr = Number(completedOneTimeRow?.[0]?.completed_pkr || 0);
  const completedOneTimeCount = Number(completedOneTimeRow?.[0]?.count || 0);

  const totalAvailableThisMonthPkr = monthlyPkr + completedOneTimePkr;
  const childrenCoveredThisMonth = Math.round((totalAvailableThisMonthPkr / costPerChild) * 10) / 10;
  const fundingGapChildren = Math.max(0, enrolledChildren - Math.floor(childrenCoveredThisMonth));
  const fundingGapPkr = Math.max(0, (enrolledChildren * costPerChild) - totalAvailableThisMonthPkr);
  const coveragePercentage = Math.min(100, Math.round((totalAvailableThisMonthPkr / (enrolledChildren * costPerChild)) * 100));

  return {
    currencyTotals: currencyTotals || [],
    categoryTotals: categoryTotals || [],
    frequencyTotals: frequencyTotals || [],
    monthlyTrends: monthlyTrends || [],
    planHealth: planHealth || [],
    topSupporters: topSupporters || [],
    childMonthsMonthly: (childMonthsMonthly || []).map((r: any) => ({
      month: r.month,
      donationCount: Number(r.donation_count),
      childMonthsFunded: Math.round(Number(r.child_months_funded) * 10) / 10,
      totalPkr: Math.round(Number(r.total_pkr)),
    })),
    fundingStatus: {
      costPerChildMonth: costPerChild,
      enrolledChildren,
      monthlyCommitmentsPkr: monthlyPkr,
      activePlansCount,
      completedOneTimeThisMonthPkr: completedOneTimePkr,
      completedOneTimeCount,
      totalAvailableThisMonthPkr,
      childrenCoveredThisMonth,
      fundingGapChildren,
      fundingGapPkr,
      coveragePercentage,
    },
  };
}

/**
 * Updates the admin-set number of enrolled children for Funding Status calculations.
 */
export async function adminUpdateEnrolledChildrenAction(count: number, adminEmail: string = "admin@gjtfoundation.com") {
  if (!count || count < 1) {
    throw new Error("Enrolled children count must be at least 1.");
  }

  await query(`
    INSERT INTO app_settings (setting_key, setting_value)
    VALUES ('enrolled_children', ?)
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
  `, [count.toString()]);

  await createAuditLogDb({
    actor_type: "admin",
    actor_id: adminEmail,
    action: "admin.enrolled_children_updated",
    target_type: "settings",
    target_id: "enrolled_children",
    metadata: { count },
  });

  revalidatePath("/admin/reports");
  return { success: true, message: `Enrolled students capacity updated to ${count.toLocaleString()}.` };
}


// -------------------------------------------------------------
// 5. Manual Donation Entry (Doorstep Cash / Direct Cheques)
// -------------------------------------------------------------
export async function adminRecordManualDonationAction(input: {
  donor_name?: string;
  donor_email?: string;
  donor_phone?: string;
  cause: string;
  amount: number;
  currency: string;
  donation_type: "General" | "Zakat" | "Sadqah";
  payment_method: "doorstep_cash" | "cheque" | "direct_deposit";
  payment_reference?: string;
  admin_note?: string;
  status: "completed" | "pending";
}, adminEmail: string = "admin") {
  const currentYear = new Date().getFullYear();
  const referenceNo = `GJTF-${currentYear}-${Math.floor(100000 + Math.random() * 900000)}`;

  const donationId = await createDonationDb({
    ...input,
    reference_no: referenceNo,
    frequency: "once",
    country: "Pakistan",
    paid_at: input.status === "completed" ? new Date().toISOString().slice(0, 19).replace("T", " ") : null,
  });

  await createDonationStatusHistoryDb({
    donation_id: donationId,
    old_status: null,
    new_status: input.status,
    changed_by: `admin:${adminEmail}`,
    note: `Manual entry by admin (${input.payment_method}). Note: ${input.admin_note || "None"}`,
  });

  if (input.status === "completed") {
    await getOrCreateReceiptDb(donationId);

    // If email provided, dispatch completed email
    if (input.donor_email && input.donor_email.trim()) {
      try {
        const { subject, html, text } = createDonationCompletedEmail({
          pledgeId: referenceNo,
          donorName: input.donor_name,
          donorEmail: input.donor_email,
          amount: input.amount,
          currency: input.currency,
          cause: input.cause,
          donationType: input.donation_type,
        });

        await sendTransactionalEmail({
          to: input.donor_email,
          recipientName: input.donor_name,
          emailType: "donation_completed",
          subject,
          html,
          text,
          metadata: { donationId, referenceNo },
        });
      } catch {}
    }
  }

  await createAuditLogDb({
    actor_type: "admin",
    actor_id: adminEmail,
    action: "admin.manual_donation_created",
    target_type: "donation",
    target_id: donationId,
    metadata: { referenceNo, amount: input.amount, method: input.payment_method },
  });

  revalidatePath("/admin/donations");
  return {
    success: true,
    donationId,
    referenceNo,
    message: `Manual donation recorded with reference #${referenceNo}.`,
  };
}
