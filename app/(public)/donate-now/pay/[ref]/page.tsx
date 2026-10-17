import * as React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, AlertTriangle, ArrowLeft, Heart, ShieldCheck } from "lucide-react";
import { query, RowDataPacket } from "@/lib/db/mysql";
import { verifyPledgeAccess } from "@/lib/db/pledgeTokens";
import { getActiveBankAccountsDb } from "@/lib/db/bankAccounts";
import { PaymentInstructionsCard } from "@/components/donations/PaymentInstructionsCard";
import { ProofUploadSection, ProofItem } from "@/components/donations/ProofUploadSection";
import { calculateImpact, DEFAULT_PRICING } from "@/lib/pricing/impact";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Your Donation | GJTF Foundation",
  robots: {
    index: false,
    follow: false,
  },
};

interface PayPageProps {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function GuestPayPage({ params, searchParams }: PayPageProps) {
  const { ref } = await params;
  const { token } = await searchParams;

  if (!ref || !ref.startsWith("GJTF-")) {
    notFound();
  }

  // 1. Fetch Donation Record
  const donations = await query<RowDataPacket[]>(
    "SELECT * FROM donations WHERE reference_no = ? LIMIT 1",
    [ref]
  );

  if (!donations || donations.length === 0) {
    notFound();
  }

  const donation = donations[0];

  // 2. Strict Security: Reference Number Alone NEVER Grants Access!
  // Requires valid unexpired pledge_access_token (from query param or httpOnly cookie)
  const isAuthorized = await verifyPledgeAccess(donation.id, donation.reference_no, token);
  if (!isAuthorized) {
    notFound();
  }

  // 3. Fetch Primary Bank Details
  const bankAccounts = await getActiveBankAccountsDb();
  const primaryBank = bankAccounts[0] || null;

  // 4. Fetch Existing Payment Proofs for this Donation
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
    uploaded_at: r.uploaded_at,
    reject_reason: r.reject_reason,
    transaction_ref: r.transaction_ref,
    sender_bank: r.sender_bank,
    paid_amount_minor: r.paid_amount_minor,
  }));

  const amountPkr = Number(donation.amount_pkr_minor ? donation.amount_pkr_minor / 100 : donation.amount);
  const impact = calculateImpact(amountPkr, donation.frequency as any || "once", DEFAULT_PRICING);

  // Status mapping
  const isCompleted = donation.status === "completed";
  const proofStatus = isCompleted ? "approved" : (donation.proof_status || "none");

  return (
    <div className="min-h-screen bg-warm-50/50 py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/donate-now"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-charcoal-muted hover:text-primary-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Donate Now
          </Link>

          <span className="text-xs text-charcoal-muted font-mono">
            Pledge Ref: <strong className="text-charcoal-deep font-bold">{donation.reference_no}</strong>
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
                  Payment Pending
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
          token={token}
          proofStatus={proofStatus}
          existingProofs={proofs}
          rejectionReason={proofs.find((p) => p.status === "rejected")?.reject_reason}
        />
      </div>
    </div>
  );
}
