"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Upload,
  Receipt,
  AlertCircle,
  PauseCircle,
  XCircle,
  Loader2,
  CalendarClock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import siteConfig from "@/lib/siteConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getDonorDashboardDataAction,
  submitProofOfPaymentAction,
  updateMonthlyPlanAction,
} from "@/app/actions/donorPortal";

export default function DonorDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Proof upload modal state
  const [proofModalOpen, setProofModalOpen] = React.useState(false);
  const [selectedPledge, setSelectedPledge] = React.useState<any>(null);
  const [paymentRef, setPaymentRef] = React.useState("");
  const [proofUrl, setProofUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submittingProof, setSubmittingProof] = React.useState(false);
  const [proofSuccessMsg, setProofSuccessMsg] = React.useState<string | null>(null);

  // Monthly plan action state
  const [planActionLoading, setPlanActionLoading] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const res = await getDonorDashboardDataAction();
      if (res && (res as any).unauthorized) {
        router.push("/donor/login");
        return;
      }
      if (res && res.donor && res.stats) {
        setData(res);
      } else {
        setError("Could not load your dashboard. Please try again.");
      }
      setLoading(false);
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        router.push("/donor/login");
      } else {
        setError("Could not load your dashboard. Please try again.");
        setLoading(false);
      }
    }
  }, [router]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenProofModal = (pledge: any) => {
    setSelectedPledge(pledge);
    setPaymentRef("");
    setProofUrl("");
    setNotes("");
    setProofSuccessMsg(null);
    setProofModalOpen(true);
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPledge) return;

    setSubmittingProof(true);
    const res = await submitProofOfPaymentAction({
      donationId: selectedPledge.id,
      proofUrl: proofUrl || undefined,
      paymentReference: paymentRef || undefined,
      notes: notes || undefined,
    });

    setSubmittingProof(false);
    if (res.success) {
      setProofSuccessMsg(res.message);
      setTimeout(() => {
        setProofModalOpen(false);
        loadData();
      }, 1500);
    }
  };

  const handlePausePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to pause your monthly sponsorship for 30 days?")) return;
    setPlanActionLoading(true);
    await updateMonthlyPlanAction({ planId, action: "pause" });
    setPlanActionLoading(false);
    loadData();
  };

  const handleResumePlan = async (planId: string) => {
    setPlanActionLoading(true);
    await updateMonthlyPlanAction({ planId, action: "resume" });
    setPlanActionLoading(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-500">Loading your supporter dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600">{error || "Please sign in to view your dashboard."}</p>
        <Link href="/donor/login">
          <Button className="rounded-xl font-bold bg-emerald-700 text-white">Go to Login</Button>
        </Link>
      </div>
    );
  }

  const { donor, stats } = data;
  const activePlan = stats.activePlan;
  const pendingPledges = stats.pendingPledges || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 text-xs font-semibold border border-emerald-800/80">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Supporter Account Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Assalam-o-Alaikum, {donor.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Welcome to your personal donor portal. Here you can track your education sponsorships, download official receipts, and manage your monthly plans.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/donate-now">
              <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl px-5 py-2.5 shadow-md">
                <Heart className="w-4 h-4 mr-1.5 fill-current" />
                Make a New Pledge
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Pledges Banner (Actionable Alert) */}
      {pendingPledges.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-950">
                  You Have {pendingPledges.length} Pending Donation Pledge(s)
                </h3>
                <p className="text-xs text-amber-800/90 leading-relaxed mt-0.5">
                  Complete your bank transfer or doorstep cash collection to activate your official tax receipt.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {pendingPledges.map((pledge: any) => (
              <div
                key={pledge.id}
                className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {pledge.reference_no}
                    </span>
                    <span className="font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full text-[10px]">
                      Pending Verification
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 text-sm mt-1">
                    {pledge.cause}
                  </div>
                  <div className="font-bold text-emerald-800 text-base mt-0.5">
                    {pledge.currency} {Number(pledge.amount).toLocaleString()}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href="#bank-details-card"
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline"
                  >
                    View Bank Details
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenProofModal(pledge)}
                    className="h-8 rounded-lg text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    Upload Proof
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* PKR Lifetime */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Donations (PKR)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
              Lifetime
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            PKR {stats.pkr.lifetime.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex justify-between">
            <span>This Year: PKR {stats.pkr.thisYear.toLocaleString()}</span>
            <span>{stats.pkr.completedCount} gift(s)</span>
          </div>
        </div>

        {/* Completed Donations Count */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verified Receipts
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            {stats.totalCompletedCount}
          </div>
          <p className="text-xs text-slate-500 pt-1 border-t border-slate-100">
            Official tax receipts available for download
          </p>
        </div>

        {/* Educational Impact Card (Child-Months) */}
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-bold uppercase tracking-wider">
              Educational Impact
            </span>
            <Sparkles className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-200">
            {stats.childMonthsFunded ?? Math.round(stats.pkr.lifetime / 5000)} Child-Months
          </div>
          <p className="text-xs text-emerald-100/80 pt-1 border-t border-emerald-800">
            {activePlan
              ? `Supporting ${activePlan.children_count || Math.max(1, Math.round(activePlan.amount / 5000))} child(ren) this month`
              : "Total child-months funded across nomadic community schools"}
          </p>
        </div>
      </div>

      {/* Active Monthly Plan Section */}
      {activePlan && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                <CalendarClock className="w-3.5 h-3.5 text-emerald-700" />
                Active Monthly Commitment
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                {activePlan.cause}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Supporting {activePlan.children_count || Math.max(1, Math.round(activePlan.amount / 5000))} child(ren) this month &bull; Billing Day {activePlan.billing_day} of every month &bull; {activePlan.donation_type}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {activePlan.currency} {activePlan.amount.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">/ month</span>
              </div>
              <div className="text-xs font-semibold text-emerald-700 mt-1">
                Next scheduled: {activePlan.next_due_date}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span className="text-slate-600">
              Completed cycles to date: <strong>{activePlan.cycles_completed} month(s)</strong>.
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={planActionLoading}
                onClick={() => handlePausePlan(activePlan.id)}
                className="h-8 rounded-xl text-xs font-bold text-slate-700"
              >
                <PauseCircle className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Pause 30 Days
              </Button>
              <Link href="/donor/plans">
                <Button size="sm" className="h-8 rounded-xl text-xs font-bold bg-slate-900 text-white">
                  Manage Plan &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Official Bank Transfer Details Card (Bank Islami) */}
      <div id="bank-details-card" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-heading text-slate-900">
              Official Foundation Bank Details (Bank Islami)
            </h3>
            <p className="text-xs text-slate-500">
              Please include your Reference Number in the transaction remarks for automatic receipt matching.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Primary Account</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Single Account</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">{siteConfig.bankAccount.bankName}</div>
            <div>Account Title: <strong>{siteConfig.bankAccount.accountTitle}</strong></div>
            <div className="flex items-center justify-between">
              <div>Account Number: <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">{siteConfig.bankAccount.accountNumber}</code></div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(siteConfig.bankAccount.accountNumber);
                  alert("Account number copied to clipboard!");
                }}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Copy
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>IBAN: <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">{siteConfig.bankAccount.iban}</code></div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(siteConfig.bankAccount.iban);
                  alert("IBAN copied to clipboard!");
                }}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Copy
              </button>
            </div>
            <div>Branch: {siteConfig.bankAccount.branch}</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="text-slate-500 block font-semibold">Doorstep Collection &amp; Verification</span>
            <div>Collection Hotline: <strong className="text-emerald-800 font-bold">{siteConfig.phone1.display}</strong> ({siteConfig.supportHours})</div>
            <div>WhatsApp Payment Proof: <strong>{siteConfig.phone2.display}</strong></div>
            <p className="text-[11px] text-slate-500 mt-2">
              For doorstep cash and crossed cheque receipts, an official foundation rider delivers the stamped carbon receipt directly to your home or office.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/donor/donations"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div>
            <div className="text-base font-bold text-slate-900 group-hover:text-emerald-700">
              View All Donations
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Review history and status timelines
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/donor/receipts"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div>
            <div className="text-base font-bold text-slate-900 group-hover:text-emerald-700">
              Download Tax Receipts
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Annual tax statements and certificates
            </div>
          </div>
          <Receipt className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/donor/profile"
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div>
            <div className="text-base font-bold text-slate-900 group-hover:text-emerald-700">
              Privacy &amp; Profile
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Manage personal data &amp; security
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Modal: Upload Proof of Payment */}
      {proofModalOpen && selectedPledge && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-slate-900">
                Submit Payment Confirmation
              </h3>
              <button
                onClick={() => setProofModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div>Reference Code: <strong className="font-mono text-emerald-800">{selectedPledge.reference_no}</strong></div>
              <div>Cause: <strong>{selectedPledge.cause}</strong> ({selectedPledge.currency} {Number(selectedPledge.amount).toLocaleString()})</div>
            </div>

            {proofSuccessMsg ? (
              <div className="py-6 text-center space-y-2 text-emerald-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold">{proofSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleProofSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Bank Transfer Reference / Transaction ID *
                  </label>
                  <Input
                    required
                    placeholder="e.g. MEZN-98471203 or Easypaisa TID"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Screenshot or Receipt URL (Optional)
                  </label>
                  <Input
                    placeholder="https://drive.google.com/... or image link"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">
                    You may also WhatsApp your receipt screenshot to <strong>{siteConfig.phone2.display}</strong> with your reference code.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Notes for Accounts Team (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Sent via mobile banking from Faisal's account"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setProofModalOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingProof || !paymentRef.trim()}
                    className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    {submittingProof ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Submit for Approval
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
