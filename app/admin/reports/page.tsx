"use client";

import * as React from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Heart,
  Repeat,
  ShieldAlert,
  Download,
  Calendar,
  Layers,
  Award,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  GraduationCap,
  AlertCircle,
  Edit2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminGetFinancialReportsAction,
  adminRecordManualDonationAction,
  adminUpdateEnrolledChildrenAction,
} from "@/app/actions/adminDonors";

export default function AdminReportsPage() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);
  const [showManualModal, setShowManualModal] = React.useState(false);
  const [manualSubmitting, setManualSubmitting] = React.useState(false);
  const [manualSuccessMsg, setManualSuccessMsg] = React.useState<string | null>(null);

  // Enrolled capacity edit state
  const [showEnrolledModal, setShowEnrolledModal] = React.useState(false);
  const [enrolledInput, setEnrolledInput] = React.useState("1000");
  const [savingEnrolled, setSavingEnrolled] = React.useState(false);

  // Manual entry form state
  const [manualForm, setManualForm] = React.useState({
    donor_name: "",
    donor_email: "",
    donor_phone: "",
    cause: "Support a Classroom (30-student unit)",
    amount: "15000",
    currency: "PKR",
    donation_type: "General" as "General" | "Zakat" | "Sadqah",
    payment_method: "doorstep_cash" as "doorstep_cash" | "cheque" | "direct_deposit",
    payment_reference: "",
    admin_note: "",
    status: "completed" as "completed" | "pending",
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminGetFinancialReportsAction();
      setData(res);
      if (res?.fundingStatus?.enrolledChildren) {
        setEnrolledInput(String(res.fundingStatus.enrolledChildren));
      }
    } catch (e) {
      console.error("Failed to load reports", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReports();
  }, []);

  const handleEnrolledSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEnrolled(true);
    try {
      const val = parseInt(enrolledInput, 10);
      if (isNaN(val) || val <= 0) {
        alert("Please enter a valid student capacity (at least 1).");
        return;
      }
      await adminUpdateEnrolledChildrenAction(val);
      setShowEnrolledModal(false);
      await fetchReports();
    } catch (err: any) {
      alert(err.message || "Failed to update enrolled students capacity.");
    } finally {
      setSavingEnrolled(false);
    }
  };


  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSubmitting(true);
    setManualSuccessMsg(null);
    try {
      const parsedAmount = parseInt(manualForm.amount, 10);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert("Please enter a valid donation amount.");
        setManualSubmitting(false);
        return;
      }

      const res = await adminRecordManualDonationAction({
        donor_name: manualForm.donor_name || undefined,
        donor_email: manualForm.donor_email || undefined,
        donor_phone: manualForm.donor_phone || undefined,
        cause: manualForm.cause,
        amount: parsedAmount,
        currency: manualForm.currency,
        donation_type: manualForm.donation_type,
        payment_method: manualForm.payment_method,
        payment_reference: manualForm.payment_reference || undefined,
        admin_note: manualForm.admin_note || undefined,
        status: manualForm.status,
      });

      if (res.success) {
        setManualSuccessMsg(res.message);
        setManualForm({
          donor_name: "",
          donor_email: "",
          donor_phone: "",
          cause: "Support a Classroom (30-student unit)",
          amount: "15000",
          currency: "PKR",
          donation_type: "General",
          payment_method: "doorstep_cash",
          payment_reference: "",
          admin_note: "",
          status: "completed",
        });
        fetchReports();
        setTimeout(() => {
          setShowManualModal(false);
          setManualSuccessMsg(null);
        }, 2000);
      }
    } catch (err: any) {
      alert(err.message || "Failed to record manual donation");
    } finally {
      setManualSubmitting(false);
    }
  };

  // Groupings by Currency (Strict Rule: PKR & AED Separate)
  const pkrTotal = data?.currencyTotals?.find((c: any) => c.currency === "PKR") || {
    total_amount: 0,
    count: 0,
    avg_donation: 0,
  };
  const aedTotal = data?.currencyTotals?.find((c: any) => c.currency === "AED") || {
    total_amount: 0,
    count: 0,
    avg_donation: 0,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Financial &amp; Impact Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time analytics across completed pledges, Shariah-compliant Zakat distribution, and monthly pledge retention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchReports}
            className="rounded-xl text-xs font-bold gap-1.5 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setShowManualModal(true)}
            className="rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Record Offline Pledge
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Aggregating ledger data from verified transactions...</p>
        </div>
      ) : (
        <>
          {/* SECTION 15.8: Educational Funding Status Card */}
          {data?.fundingStatus && (
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/40 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                    <GraduationCap className="w-4 h-4 text-blue-400" />
                    <span>Monthly Child Educational Funding Status</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {data.fundingStatus.childrenCoveredThisMonth.toLocaleString()} of {data.fundingStatus.enrolledChildren.toLocaleString()} Children Covered
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                    Based on standard PKR {data.fundingStatus.costPerChildMonth.toLocaleString()}/child-month unit cost. Combines active monthly commitments (Rs. {data.fundingStatus.monthlyCommitmentsPkr.toLocaleString()}) and completed one-time donations this month (Rs. {data.fundingStatus.completedOneTimeThisMonthPkr.toLocaleString()}).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEnrolledModal(true)}
                    className="rounded-xl text-xs font-bold gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Enrolled ({data.fundingStatus.enrolledChildren.toLocaleString()})
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-blue-300">{data.fundingStatus.coveragePercentage}% of Monthly Need Funded</span>
                  <span className={data.fundingStatus.fundingGapChildren > 0 ? "text-amber-300" : "text-emerald-300"}>
                    {data.fundingStatus.fundingGapChildren > 0
                      ? `Funding Gap: ${data.fundingStatus.fundingGapChildren.toLocaleString()} children (Rs. ${data.fundingStatus.fundingGapPkr.toLocaleString()})`
                      : "Fully Funded for Current Month!"}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, data.fundingStatus.coveragePercentage))}%` }}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-slate-400 block">Unit Cost / Child</span>
                  <span className="text-lg font-extrabold text-white mt-1 block">
                    Rs. {data.fundingStatus.costPerChildMonth.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400">All-inclusive/mo</span>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-slate-400 block">Active Monthly Plans</span>
                  <span className="text-lg font-extrabold text-white mt-1 block">
                    Rs. {data.fundingStatus.monthlyCommitmentsPkr.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-teal-300">{data.fundingStatus.activePlansCount} recurring donors</span>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-slate-400 block">One-Time Gifts (This Mo)</span>
                  <span className="text-lg font-extrabold text-white mt-1 block">
                    Rs. {data.fundingStatus.completedOneTimeThisMonthPkr.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-blue-300">{data.fundingStatus.completedOneTimeCount} completed</span>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-slate-400 block">Monthly Funding Gap</span>
                  <span className={`text-lg font-extrabold mt-1 block ${data.fundingStatus.fundingGapPkr > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    Rs. {data.fundingStatus.fundingGapPkr.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400">{data.fundingStatus.fundingGapChildren.toLocaleString()} students unfunded</span>
                </div>
              </div>
            </div>
          )}

          {/* Main Financial Totals */}
          <div className="grid grid-cols-1 gap-6">

            {/* PKR Card */}
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider font-extrabold px-3 py-1 bg-emerald-800/80 rounded-full border border-emerald-700/50 text-emerald-200">
                  Total Donations (PKR)
                </span>
                <span className="text-xs text-emerald-300 font-medium">Completed Only</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Rs. {Number(pkrTotal.total_amount).toLocaleString()}
              </div>
              <div className="mt-4 pt-4 border-t border-emerald-800/60 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-emerald-300/80 block">Completed Pledges</span>
                  <span className="text-base font-bold text-white mt-0.5 block">{pkrTotal.count}</span>
                </div>
                <div>
                  <span className="text-emerald-300/80 block">Average Donation</span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    Rs. {Math.round(pkrTotal.avg_donation).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Sections: Shariah Categories & Frequencies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Shariah Category Breakdown */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Donation Categories (Shariah Breakdown)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Segregated allocation for 100% compliance</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Heart className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              <div className="space-y-4">
                {["General", "Zakat", "Sadqah"].map((type) => {
                  const pkrItem = data?.categoryTotals?.find(
                    (c: any) => c.currency === "PKR" && c.donation_type === type
                  );
                  const aedItem = data?.categoryTotals?.find(
                    (c: any) => c.currency === "AED" && c.donation_type === type
                  );

                  return (
                    <div
                      key={type}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-800">
                          {type}
                        </span>
                        <div className="text-xs text-slate-500 mt-1">
                          {pkrItem?.count || 0} pledges
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">
                          Rs. {Number(pkrItem?.total_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recurring Monthly vs One-time */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Frequency Breakdown</h3>
                  <p className="text-xs text-slate-500 mt-0.5">One-time pledges vs Sustainable monthly commitments</p>
                </div>
                <div className="p-2 bg-teal-50 rounded-xl">
                  <Repeat className="w-5 h-5 text-teal-600" />
                </div>
              </div>

              <div className="space-y-4">
                {["once", "monthly"].map((freq) => {
                  const pkrFreq = data?.frequencyTotals?.find(
                    (f: any) => f.currency === "PKR" && f.frequency === freq
                  );
                  const aedFreq = data?.frequencyTotals?.find(
                    (f: any) => f.currency === "AED" && f.frequency === freq
                  );

                  return (
                    <div
                      key={freq}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-800 capitalize">
                          {freq === "once" ? "Single Pledges" : "Monthly Commitments"}
                        </span>
                        <div className="text-xs text-slate-500 mt-1">
                          {pkrFreq?.count || 0} transactions
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">
                          Rs. {Number(pkrFreq?.total_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Monthly Plan Health Status */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Monthly Plan Health Registry
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {["active", "paused", "cancelled"].map((st) => {
                    const planStat = data?.planHealth?.find((p: any) => p.status === st) || { count: 0 };
                    return (
                      <div key={st} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-500">{st}</span>
                        <div className="text-base font-extrabold text-slate-800 mt-0.5">{planStat.count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Child-Months Funded per Month Report */}
          {data?.childMonthsMonthly && data.childMonthsMonthly.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Child-Months Funded per Month</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Historical impact measured in child-month educational units (PKR 5,000/mo)</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-100">
                      <th className="py-3 px-4">Calendar Month</th>
                      <th className="py-3 px-4">Completed Pledges</th>
                      <th className="py-3 px-4">Total Amount (PKR)</th>
                      <th className="py-3 px-4 text-right">Child-Months Funded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.childMonthsMonthly.map((m: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{m.month}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{m.donationCount}</td>
                        <td className="py-3 px-4 text-slate-800">Rs. {m.totalPkr.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-blue-600">
                          {m.childMonthsFunded.toLocaleString()} child-months
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Supporters Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Top Verified Supporters</h3>
                <p className="text-xs text-slate-500 mt-0.5">Highest lifetime educational contributors</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="py-3 px-6">Donor</th>
                    <th className="py-3 px-6">Country</th>
                    <th className="py-3 px-6">Currency</th>
                    <th className="py-3 px-6">Pledges</th>
                    <th className="py-3 px-6 text-right">Lifetime Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {data?.topSupporters && data.topSupporters.length > 0 ? (
                    data.topSupporters.map((supporter: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-6">
                          <Link
                            href={`/admin/donors/${supporter.id}`}
                            className="font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1.5"
                          >
                            {supporter.name || "Anonymous Donor"}
                            <ArrowUpRight className="w-3 h-3 text-slate-400" />
                          </Link>
                          <span className="text-[11px] text-slate-400">{supporter.email}</span>
                        </td>
                        <td className="py-3.5 px-6 font-medium text-slate-600">{supporter.country || "Pakistan"}</td>
                        <td className="py-3.5 px-6">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                            {supporter.currency}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-slate-700">{supporter.donation_count}</td>
                        <td className="py-3.5 px-6 text-right font-extrabold text-slate-900">
                          {supporter.currency === "PKR" ? "Rs." : supporter.currency}{" "}
                          {Number(supporter.total_given).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No completed donations recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Manual Donation Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Record Offline / Doorstep Pledge</h3>
            <p className="text-xs text-slate-500 mb-6">
              Log bank transfers, direct cheques, or doorstep cash collections collected by support team.
            </p>

            {manualSuccessMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                {manualSuccessMsg}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <Label className="text-xs font-bold text-slate-700">Donor Full Name</Label>
                <Input
                  placeholder="Leave empty for Anonymous"
                  value={manualForm.donor_name}
                  onChange={(e) => setManualForm({ ...manualForm, donor_name: e.target.value })}
                  className="rounded-xl mt-1 h-10 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Email (For Receipt)</Label>
                  <Input
                    type="email"
                    placeholder="donor@example.com"
                    value={manualForm.donor_email}
                    onChange={(e) => setManualForm({ ...manualForm, donor_email: e.target.value })}
                    className="rounded-xl mt-1 h-10 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Phone / WhatsApp</Label>
                  <Input
                    placeholder="+92 300 1234567"
                    value={manualForm.donor_phone}
                    onChange={(e) => setManualForm({ ...manualForm, donor_phone: e.target.value })}
                    className="rounded-xl mt-1 h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Currency</Label>
                  <select
                    value={manualForm.currency}
                    onChange={(e) => setManualForm({ ...manualForm, currency: e.target.value })}
                    className="w-full h-10 mt-1 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="PKR">PKR (Pakistani Rupee)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Amount</Label>
                  <Input
                    type="number"
                    min="100"
                    value={manualForm.amount}
                    onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                    className="rounded-xl mt-1 h-10 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Shariah Type</Label>
                  <select
                    value={manualForm.donation_type}
                    onChange={(e: any) => setManualForm({ ...manualForm, donation_type: e.target.value })}
                    className="w-full h-10 mt-1 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="General">General Donation</option>
                    <option value="Zakat">100% Zakat</option>
                    <option value="Sadqah">Sadqah</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Collection Channel</Label>
                  <select
                    value={manualForm.payment_method}
                    onChange={(e: any) => setManualForm({ ...manualForm, payment_method: e.target.value })}
                    className="w-full h-10 mt-1 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="doorstep_cash">Doorstep Cash (04235236622)</option>
                    <option value="direct_deposit">Direct Bank Transfer</option>
                    <option value="cheque">Cheque Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Payment Status</Label>
                <select
                  value={manualForm.status}
                  onChange={(e: any) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full h-10 mt-1 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="completed">Completed (Funds verified &amp; receipt issued)</option>
                  <option value="pending">Pending (Rider dispatched / cheque awaiting clearing)</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Cheque / Slip Ref / Note</Label>
                <Input
                  placeholder="e.g. Bank Islami slip #9821 or Rider Zahid"
                  value={manualForm.admin_note}
                  onChange={(e) => setManualForm({ ...manualForm, admin_note: e.target.value })}
                  className="rounded-xl mt-1 h-10 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-xl text-xs font-bold border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={manualSubmitting}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {manualSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                  Record Transaction
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrolled Students Capacity Edit Modal (Section 15.8) */}
      {showEnrolledModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Set Enrolled Students Target</h3>
            <p className="text-xs text-slate-500 mb-6">
              Total number of enrolled nomadic children requiring monthly educational funding. Used to calculate live monthly funding gap.
            </p>

            <form onSubmit={handleEnrolledSubmit} className="space-y-4 text-xs">
              <div>
                <Label className="text-xs font-bold text-slate-700">Enrolled Children Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  max="100000"
                  value={enrolledInput}
                  onChange={(e) => setEnrolledInput(e.target.value)}
                  className="rounded-xl mt-1 h-11 text-sm font-bold"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Monthly funding target = Enrolled × PKR {data?.fundingStatus?.costPerChildMonth?.toLocaleString() || "5,000"}.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEnrolledModal(false)}
                  className="rounded-xl text-xs font-bold border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingEnrolled}
                  className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  {savingEnrolled ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Capacity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

