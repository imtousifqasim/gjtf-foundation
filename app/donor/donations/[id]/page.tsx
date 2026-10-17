import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, AlertTriangle, ArrowLeft, Heart, ShieldCheck } from "lucide-react";
import { query, RowDataPacket } from "@/lib/db/mysql";
import { getAuthenticatedDonor } from "@/lib/auth/donor";
import { getActiveBankAccountsDb } from "@/lib/db/bankAccounts";
import { PaymentInstructionsCard } from "@/components/donations/PaymentInstructionsCard";
import { ProofUploadSection, ProofItem } from "@/components/donations/ProofUploadSection";
import { calculateImpact, DEFAULT_PRICING } from "@/lib/pricing/impact";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Donation Details & Payment Proof | GJTF Donor Portal",
  robots: {
    index: false,
    follow: false,
  },
};

interface DonorDonationPageProps {
  params: Promise<{ id: string }>;
}

export default async function DonorDonationDetailPage({ params }: DonorDonationPageProps) {
  const { id } = await params;

  // 1. Authenticate Donor
  const donor = await getAuthenticatedDonor();
  if (!donor) {
    redirect(`/donor/login?next=/donor/donations/${encodeURIComponent(id)}`);
  }

  // 2. Fetch Donation Record (supports both UUID id and reference_no)
  const donations = await query<RowDataPacket[]>(
    "SELECT * FROM donations WHERE id = ? OR reference_no = ? LIMIT 1",
    [id, id]
  );

  if (!donations || donations.length === 0) {
    notFound();
  }

  const donation = donations[0];

  // 3. Strict Ownership Guard (Donor A cannot view Donor B's donation, auto-linking if matching email)
  if (donation.donor_id !== donor.id) {
    if (donation.donor_email && donation.donor_email.toLowerCase() === donor.email.toLowerCase()) {
      try {
        await query("UPDATE donations SET donor_id = ? WHERE id = ?", [donor.id, donation.id]);
      } catch {}
    } else {
      notFound();
    }
  }

  // 4. Fetch Primary Bank Details
  const bankAccounts = await getActiveBankAccountsDb();
  const primaryBank = bankAccounts[0] || null;

  // 5. Fetch Existing Payment Proofs for this Donation
  const proofRows = await query<RowDataPacket[]>(`
    SELECT id, filename, status, reject_reason, transaction_ref, sender_bank, paid_amount_minor, uploaded_at
    FROM payment_proofs
    WHERE donation_id = ? AND status != 'deleted'
    ORDER BY uploaded_at DESC
  `, [donation.id]);

  const proofs: ProofItem[] = (proofRows || []).map((r) => ({
    id: r.id,
    filename: r.filename,
    status: r.status,
    uploaded_at: r.uploaded_at instanceof Date ? r.uploaded_at.toISOString() : String(r.uploaded_at || ""),
    reject_reason: r.reject_reason,
    transaction_ref: r.transaction_ref,
    sender_bank: r.sender_bank,
    paid_amount_minor: r.paid_amount_minor,
  }));

  const amountPkr = Number(donation.amount_pkr_minor ? donation.amount_pkr_minor / 100 : donation.amount) || 0;
  const impact = calculateImpact(amountPkr, donation.frequency as any || "once", DEFAULT_PRICING);

  // Status mapping
  const isCompleted = donation.status === "completed";
  const proofStatus = isCompleted ? "approved" : (donation.proof_status || "none");

  return (
    <div className="space-y-8 pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/donor/donations"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-charcoal-muted hover:text-primary-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Donations
        </Link>

        <span className="text-xs text-charcoal-muted font-mono">
          Ref: <strong className="text-charcoal-deep font-bold">{donation.reference_no}</strong>
        </span>
      </div>

      {/* Top Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-warm-200 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-200 pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary-50 text-primary-800 text-xs font-bold tracking-wide uppercase border border-primary-200">
              <Heart className="w-3.5 h-3.5 text-primary-600 fill-primary-600" />
              {donation.cause}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-charcoal-deep mt-2">
              Donation Pledge: PKR {amountPkr.toLocaleString()}
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
              Frequency: <strong className="capitalize text-charcoal-deep">{donation.frequency || "Once"}</strong> • Type: <strong className="text-charcoal-deep">{donation.donation_type || "General"}</strong> • Pledged on: {new Date(donation.created_at).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {/* Status Pill */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Verified &amp; Completed
              </span>
            ) : proofStatus === "submitted" ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider border border-amber-300">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                Under Verification
              </span>
            ) : proofStatus === "rejected" ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-100 text-red-900 text-xs font-bold uppercase tracking-wider border border-red-300">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Re-Upload Requested
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border border-slate-300">
                <Clock className="w-4 h-4 text-slate-500" />
                Pending Payment
              </span>
            )}
          </div>
        </div>

        {/* Impact Statement */}
        <div className="pt-4 flex items-center gap-3 text-xs sm:text-sm text-charcoal-deep">
          <span className="font-bold text-primary-800">Your Educational Impact:</span>
          <span>{impact.headline} — {impact.summary}</span>
        </div>
      </div>

      {/* Official Completed Receipt Card OR Payment Instructions */}
      {isCompleted ? (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Donation Completed &amp; Cleared
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-heading">
                Official Tax Receipt Available
              </h2>
              <p className="text-xs sm:text-sm text-emerald-800/90 leading-relaxed max-w-xl">
                Your payment of PKR {amountPkr.toLocaleString()} has been verified. You can view, download, or print your official tax-exempt donation invoice and receipt anytime.
              </p>
            </div>

            <Link href={`/receipt/${donation.reference_no || donation.id}`} target="_blank">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all shrink-0 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                View Official Receipt &rarr;
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Bank Transfer Instructions Card */}
          <PaymentInstructionsCard
            referenceNo={donation.reference_no}
            amountPkr={amountPkr}
            bankAccount={primaryBank}
            cause={donation.cause}
            frequency={donation.frequency}
          />

          {/* Proof Upload Component */}
          <ProofUploadSection
            donationId={donation.id}
            referenceNo={donation.reference_no}
            proofStatus={proofStatus}
            existingProofs={proofs}
            rejectionReason={proofs.find((p) => p.status === "rejected")?.reject_reason}
          />
        </>
      )}
    </div>
  );
}
