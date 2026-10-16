"use server";

import { revalidatePath } from "next/cache";
import {
  requireAuthenticatedDonor,
  getAuthenticatedDonor,
} from "@/lib/auth/donor";
import {
  getDonorDashboardStatsDb,
  getDonationsByDonorDb,
  getDonationByIdScopedDb,
  getDonationStatusHistoryDb,
  getDonationPlansByDonorDb,
  getDonationPlanByIdScopedDb,
  updateDonationPlanDb,
  createDonationStatusHistoryDb,
  createAuditLogDb,
  getOrCreateReceiptDb,
  getReceiptByDonationScopedDb,
  query,
} from "@/lib/db/mysql";
import { sendTransactionalEmail } from "@/lib/email/sender";

// -------------------------------------------------------------
// 1. Dashboard Home Data (Strictly Scoped)
// -------------------------------------------------------------
export async function getDonorDashboardDataAction() {
  const donor = await requireAuthenticatedDonor();
  const stats = await getDonorDashboardStatsDb(donor.id);
  const plans = await getDonationPlansByDonorDb(donor.id);

  return {
    donor: {
      id: donor.id,
      name: donor.name || "Generous Supporter",
      email: donor.email,
      phone: donor.phone,
      country: donor.country,
      prefers_anonymous: donor.prefers_anonymous,
      email_verified: Boolean(donor.email_verified_at),
      created_at: donor.created_at,
    },
    stats,
    plans,
  };
}

// -------------------------------------------------------------
// 2. Donations Listing & Detail (Strictly Scoped)
// -------------------------------------------------------------
export async function getDonorDonationsAction(filters?: {
  status?: string;
  currency?: string;
  donationType?: string;
  year?: string;
  page?: number;
}) {
  const donor = await requireAuthenticatedDonor();
  const page = Math.max(1, filters?.page || 1);
  const limit = 15;
  const offset = (page - 1) * limit;

  const result = await getDonationsByDonorDb(donor.id, {
    status: filters?.status,
    currency: filters?.currency,
    donationType: filters?.donationType,
    year: filters?.year,
    limit,
    offset,
  });

  return {
    donations: result.donations,
    total: result.total,
    page,
    totalPages: Math.ceil(result.total / limit),
  };
}

export async function getDonorDonationDetailAction(donationId: string) {
  const donor = await requireAuthenticatedDonor();
  const donation = await getDonationByIdScopedDb(donationId, donor.id);

  // Return 404 error if not found or not owned by the donor (Zero-Trust)
  if (!donation) {
    return { success: false, notFound: true, message: "Record not found." };
  }

  const history = await getDonationStatusHistoryDb(donationId);

  return {
    success: true,
    donation,
    history,
  };
}

// -------------------------------------------------------------
// 3. Upload Proof of Payment (For Bank Transfers / Cheques)
// -------------------------------------------------------------
export async function submitProofOfPaymentAction(input: {
  donationId: string;
  proofUrl?: string;
  paymentReference?: string;
  notes?: string;
}) {
  const donor = await requireAuthenticatedDonor();
  const donation = await getDonationByIdScopedDb(input.donationId, donor.id);

  if (!donation) {
    return { success: false, message: "Donation record not found." };
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (input.proofUrl) {
    updates.push("proof_url = ?");
    params.push(input.proofUrl.trim());
  }
  if (input.paymentReference) {
    updates.push("payment_reference = ?");
    params.push(input.paymentReference.trim());
  }

  if (updates.length > 0) {
    params.push(donation.id);
    await query(`UPDATE donations SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`, params);
  }

  await createDonationStatusHistoryDb({
    donation_id: donation.id,
    old_status: donation.status,
    new_status: donation.status,
    changed_by: `donor:${donor.id}`,
    note: `Proof of payment submitted by donor. Reference: ${input.paymentReference || "N/A"}. Notes: ${input.notes || "None"}`,
  });

  await createAuditLogDb({
    actor_type: "donor",
    actor_id: donor.id,
    action: "donation.proof_uploaded",
    target_type: "donation",
    target_id: donation.id,
    metadata: { referenceNo: donation.reference_no, paymentReference: input.paymentReference },
  });

  revalidatePath("/donor/dashboard");
  revalidatePath("/donor/donations");
  revalidatePath("/admin/donations");

  return {
    success: true,
    message: "Proof of payment submitted! Our accounts team will review and verify it shortly.",
  };
}

// -------------------------------------------------------------
// 4. Monthly Commitment Plan Management (Strictly Scoped)
// -------------------------------------------------------------
export async function updateMonthlyPlanAction(input: {
  planId: string;
  action: "pause" | "cancel" | "resume" | "change_amount";
  pauseUntil?: string;
  newAmount?: number;
}) {
  const donor = await requireAuthenticatedDonor();
  const plan = await getDonationPlanByIdScopedDb(input.planId, donor.id);

  if (!plan) {
    return { success: false, message: "Monthly commitment plan not found." };
  }

  if (input.action === "pause") {
    const pauseDate = input.pauseUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await updateDonationPlanDb(plan.id, donor.id, {
      status: "paused",
      pause_until: pauseDate,
    });

    await createAuditLogDb({
      actor_type: "donor",
      actor_id: donor.id,
      action: "plan.paused",
      target_type: "donation_plan",
      target_id: plan.id,
      metadata: { pauseUntil: pauseDate },
    });

    revalidatePath("/donor/plans");
    revalidatePath("/donor/dashboard");
    return { success: true, message: `Your monthly plan has been paused until ${pauseDate}.` };
  }

  if (input.action === "resume") {
    await updateDonationPlanDb(plan.id, donor.id, {
      status: "active",
      pause_until: null,
    });

    await createAuditLogDb({
      actor_type: "donor",
      actor_id: donor.id,
      action: "plan.resumed",
      target_type: "donation_plan",
      target_id: plan.id,
    });

    revalidatePath("/donor/plans");
    revalidatePath("/donor/dashboard");
    return { success: true, message: "Your monthly plan is now active." };
  }

  if (input.action === "cancel") {
    await updateDonationPlanDb(plan.id, donor.id, {
      status: "cancelled",
    });

    await createAuditLogDb({
      actor_type: "donor",
      actor_id: donor.id,
      action: "plan.cancelled",
      target_type: "donation_plan",
      target_id: plan.id,
    });

    revalidatePath("/donor/plans");
    revalidatePath("/donor/dashboard");
    return { success: true, message: "Your monthly commitment has been cancelled." };
  }

  if (input.action === "change_amount") {
    const amt = Number(input.newAmount);
    if (!amt || amt < 500) {
      return { success: false, message: "Minimum monthly commitment amount is 500." };
    }

    await updateDonationPlanDb(plan.id, donor.id, {
      amount: amt,
    });

    await createAuditLogDb({
      actor_type: "donor",
      actor_id: donor.id,
      action: "plan.amount_changed",
      target_type: "donation_plan",
      target_id: plan.id,
      metadata: { oldAmount: plan.amount, newAmount: amt },
    });

    revalidatePath("/donor/plans");
    revalidatePath("/donor/dashboard");
    return { success: true, message: `Monthly commitment updated to ${plan.currency} ${amt.toLocaleString()} starting from your next cycle.` };
  }

  return { success: false, message: "Invalid action." };
}

// -------------------------------------------------------------
// 5. Download / Print Receipt (Scoped to Donor)
// -------------------------------------------------------------
export async function getReceiptDownloadDetailsAction(donationId: string) {
  const donor = await requireAuthenticatedDonor();
  const receipt = await getReceiptByDonationScopedDb(donationId, donor.id);

  if (!receipt) {
    return { success: false, message: "Receipt not available for this donation." };
  }

  return {
    success: true,
    receipt,
  };
}
