"use client";

import * as React from "react";
import {
  DollarSign,
  TrendingUp,
  Building,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  History,
  Lock,
  Layers,
  ArrowRight,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminGetPricingDataAction,
  adminCreatePricingVersionAction,
  adminUpdateFxSettingsAction,
  adminRefreshFxRateLiveAction,
  adminUpdateBankAccountAction,
} from "@/app/actions/adminPricing";

export default function AdminPricingSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState<"pricing" | "fx" | "bank">("pricing");
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // New Pricing Version state
  const [newCostPkr, setNewCostPkr] = React.useState("5000");
  const [pricingSubmitting, setPricingSubmitting] = React.useState(false);
  const [pricingFeedback, setPricingFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // FX state
  const [manualPkrRate, setManualPkrRate] = React.useState("76.5");
  const [bufferPct, setBufferPct] = React.useState("1.0");
  const [fxRefreshing, setFxRefreshing] = React.useState(false);
  const [fxSaving, setFxSaving] = React.useState(false);
  const [fxFeedback, setFxFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bank Account edit state
  const [bankForm, setBankForm] = React.useState({
    id: "bank-islami-primary",
    bank_name: "Bank Islami",
    branch: "Allama Iqbal Town, Lahore",
    account_title: "Ghais Jhuggi Taleem Foundation",
    account_number: "203756213050001",
    iban: "PK19BKIP0203756213050001",
    swift: "",
    instructions: "Please include your Reference Number (GJTF-YYYY-NNNNNN) in the transfer description/remarks so your pledge can be verified immediately.",
    is_active: true,
  });
  const [bankSaving, setBankSaving] = React.useState(false);
  const [bankFeedback, setBankFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminGetPricingDataAction();
      setData(res);
      if (res.activePricing) {
        setNewCostPkr(String(res.activePricing.costPerChildMonthPkr));
      }
      if (res.fxRate) {
        setManualPkrRate(String(res.fxRate.pkrPerAed));
        setBufferPct(String(res.fxRate.bufferPct));
      }
      if (res.bankAccounts && res.bankAccounts.length > 0) {
        const primary = res.bankAccounts[0];
        setBankForm({
          id: primary.id,
          bank_name: primary.bank_name,
          branch: primary.branch,
          account_title: primary.account_title,
          account_number: primary.account_number,
          iban: primary.iban,
          swift: primary.swift || "",
          instructions: primary.instructions || "",
          is_active: Boolean(primary.is_active),
        });
      }
    } catch (e) {
      console.error("Failed to load pricing data", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCreatePricingVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setPricingSubmitting(true);
    setPricingFeedback(null);
    try {
      const pkr = parseInt(newCostPkr, 10);
      if (isNaN(pkr) || pkr < 100) {
        alert("Please enter a valid amount (at least PKR 100).");
        setPricingSubmitting(false);
        return;
      }
      const res = await adminCreatePricingVersionAction({ costPkr: pkr });
      setPricingFeedback({ type: "success", text: res.message });
      await loadData();
    } catch (err: any) {
      setPricingFeedback({ type: "error", text: err.message || "Failed to create pricing version" });
    } finally {
      setPricingSubmitting(false);
    }
  };

  const handleRefreshFxLive = async () => {
    setFxRefreshing(true);
    setFxFeedback(null);
    try {
      const res = await adminRefreshFxRateLiveAction();
      setFxFeedback({ type: "success", text: res.message });
      await loadData();
    } catch (err: any) {
      setFxFeedback({ type: "error", text: err.message || "Failed to refresh live rate" });
    } finally {
      setFxRefreshing(false);
    }
  };

  const handleSaveFxManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setFxSaving(true);
    setFxFeedback(null);
    try {
      const rate = parseFloat(manualPkrRate);
      const buf = parseFloat(bufferPct);
      if (isNaN(rate) || rate <= 0) {
        alert("Please enter a valid rate.");
        setFxSaving(false);
        return;
      }
      const res = await adminUpdateFxSettingsAction({
        manualPkrPerAed: rate,
        bufferPct: isNaN(buf) ? 1.0 : buf,
      });
      setFxFeedback({ type: "success", text: res.message });
      await loadData();
    } catch (err: any) {
      setFxFeedback({ type: "error", text: err.message || "Failed to save FX settings" });
    } finally {
      setFxSaving(false);
    }
  };

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to update official bank details? An automated security audit alert will be dispatched to all Super Admins immediately.")) {
      return;
    }
    setBankSaving(true);
    setBankFeedback(null);
    try {
      const res = await adminUpdateBankAccountAction(bankForm);
      setBankFeedback({ type: "success", text: res.message });
      await loadData();
    } catch (err: any) {
      setBankFeedback({ type: "error", text: err.message || "Failed to update bank account" });
    } finally {
      setBankSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading Section 15 enterprise pricing configurations...</p>
      </div>
    );
  }

  const active = data?.activePricing;
  const fx = data?.fxRate;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Section 15 Enterprise Pricing &amp; Bank Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pricing &amp; Sponsorship Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
          Single source of truth for the PKR 5,000/child-month educational unit cost, versioned pricing tiers, and official Bank Islami account details.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab("pricing")}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "pricing"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Pricing Settings (Version {active?.version || 1})
        </button>

        <button
          onClick={() => setActiveTab("bank")}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "bank"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Building className="w-4 h-4" />
          Official Bank Account (Bank Islami)
        </button>
      </div>

      {/* -------------------------------------------------------------
          TAB 1: PRICING SETTINGS (SECTION 15.1)
          ------------------------------------------------------------- */}
      {activeTab === "pricing" && (
        <div className="space-y-8">
          {pricingFeedback && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 border ${
                pricingFeedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {pricingFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{pricingFeedback.text}</span>
            </div>
          )}

          {/* Active Pricing Configuration Card */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold px-3 py-1 bg-blue-800/80 rounded-full border border-blue-700/50 text-blue-200">
                  Active Single Source of Truth • Version {active?.version}
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight mt-3">
                  PKR {active?.costPerChildMonthPkr?.toLocaleString()}{" "}
                  <span className="text-sm font-normal text-blue-200">/ child-month</span>
                </h2>
                <p className="text-xs text-blue-200/80 mt-1">
                  Canonical value: {active?.costPerChildMonthMinor?.toString()} paisa (minor integer units, zero floating-point drift).
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Classroom of 30 Students</span>
                <span className="text-xl font-bold text-white block mt-0.5">
                  Rs. {( (active?.costPerChildMonthPkr || 5000) * (active?.classroomSize || 30) ).toLocaleString()}/mo
                </span>
                <span className="text-[11px] text-blue-300 block mt-1">
                  KG to Matric Sponsorship: {active?.sponsorshipMonths || 120} months
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block">Classroom Size</span>
                <span className="text-base font-bold text-white mt-0.5 block">{active?.classroomSize || 30} Students</span>
              </div>
              <div>
                <span className="text-slate-400 block">Preset Child Counts</span>
                <span className="text-base font-bold text-white mt-0.5 block">
                  {Array.isArray(active?.presetChildCounts) ? active.presetChildCounts.join(", ") : "1, 2, 5, 10, 30, 50"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Custom Amount Limits</span>
                <span className="text-base font-bold text-white mt-0.5 block">
                  Rs. {active?.minCustomAmountPkr?.toLocaleString()} - {active?.maxCustomAmountPkr?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">50 Children Impact</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                  Rs. {( (active?.costPerChildMonthPkr || 5000) * 50 ).toLocaleString()}/mo
                </span>
              </div>
            </div>
          </div>

          {/* Create New Version Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Pricing Version</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Per Section 15.1 business rules: when price changes, existing monthly plans are NOT raised automatically. Donors are notified to choose to update.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreatePricingVersion} className="space-y-4 max-w-xl text-xs">
              <div>
                <Label className="text-xs font-bold text-slate-700">Cost Per Child-Month (PKR)</Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    min="100"
                    step="100"
                    value={newCostPkr}
                    onChange={(e) => setNewCostPkr(e.target.value)}
                    className="h-11 rounded-xl font-bold text-sm pr-16"
                    required
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">PKR</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Current: PKR {active?.costPerChildMonthPkr?.toLocaleString()}. Next version will be Version {(active?.version || 1) + 1}.
                </span>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/70 text-amber-900 text-xs flex gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Non-Breaking Versioning:</strong> Pledges made on Version {active?.version || 1} will permanently preserve their original pledged rate. Future pledges on /donate-now will instantly use the new version.
                </p>
              </div>

              <Button
                type="submit"
                disabled={pricingSubmitting}
                className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 px-5"
              >
                {pricingSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                Publish Version {(active?.version || 1) + 1}
              </Button>
            </form>
          </div>

          {/* Pricing Versions History Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-7">
            <h3 className="text-base font-bold text-slate-900 mb-1">Pricing Version Audit History</h3>
            <p className="text-xs text-slate-500 mb-4">Complete immutable history of pricing changes across the foundation.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Cost / Child-Month</th>
                    <th className="py-3 px-4">Classroom (30)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created By</th>
                    <th className="py-3 px-4 text-right">Effective From</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.allVersions && data.allVersions.length > 0 ? (
                    data.allVersions.map((v: any) => (
                      <tr key={v.version} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">Version {v.version}</td>
                        <td className="py-3 px-4 font-bold text-blue-600">
                          PKR {(Number(v.cost_per_child_month_minor) / 100).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          PKR {((Number(v.cost_per_child_month_minor) / 100) * (v.classroom_size || 30)).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              v.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {v.is_active ? "ACTIVE (Default)" : "Archived"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{v.created_by}</td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          {new Date(v.effective_from || v.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Version 1 is active.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: LIVE AED FX SETTINGS (SECTION 15.5)
          ------------------------------------------------------------- */}
      {activeTab === "fx" && (
        <div className="space-y-8">
          {fxFeedback && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 border ${
                fxFeedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {fxFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{fxFeedback.text}</span>
            </div>
          )}

          {/* Current Rate Display Card */}
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold px-3 py-1 bg-amber-800/80 rounded-full border border-amber-700/50 text-amber-200">
                  Cached DB Rate • {fx?.isStale ? "⚠️ Stale Fallback Active" : "🟢 Live Sync"}
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight mt-3">
                  1 AED = {fx?.pkrPerAed ? Number(fx.pkrPerAed).toFixed(2) : "76.50"} PKR
                </h2>
                <p className="text-xs text-amber-200/80 mt-1">
                  1 Child-Month (PKR 5,000) converts to ≈ AED {Math.ceil(5000 / (fx?.pkrPerAed || 76.5) * (1 + (fx?.bufferPct || 1) / 100))} (includes {fx?.bufferPct || 1}% buffer, rounded UP).
                </p>
              </div>

              <Button
                onClick={handleRefreshFxLive}
                disabled={fxRefreshing}
                className="rounded-xl text-xs font-bold gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fxRefreshing ? "animate-spin" : ""}`} />
                {fxRefreshing ? "Syncing API..." : "Sync Live Rate Now"}
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block">Buffer Percentage</span>
                <span className="text-base font-bold text-white mt-0.5 block">{fx?.bufferPct || 1.0}% Protection</span>
              </div>
              <div>
                <span className="text-slate-400 block">Rounding Rule</span>
                <span className="text-base font-bold text-white mt-0.5 block">Round UP to next AED</span>
              </div>
              <div>
                <span className="text-slate-400 block">Rate Lock Period</span>
                <span className="text-base font-bold text-white mt-0.5 block">48 Hours / Pledge</span>
              </div>
              <div>
                <span className="text-slate-400 block">Fetched At</span>
                <span className="text-base font-bold text-slate-200 mt-0.5 block">
                  {fx?.fetchedAt ? new Date(fx.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                </span>
              </div>
            </div>
          </div>

          {/* Manual FX Override Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Exchange Rate &amp; Buffer Control</h3>
            <p className="text-xs text-slate-500 mb-6">
              Configure manual conversion rate and risk buffer percentage. When external currency APIs fail, this manual rate acts as the trusted fallback.
            </p>

            <form onSubmit={handleSaveFxManual} className="space-y-4 max-w-xl text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700">1 AED in PKR</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    value={manualPkrRate}
                    onChange={(e) => setManualPkrRate(e.target.value)}
                    className="h-11 rounded-xl font-bold text-sm mt-1"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">e.g. 76.50 PKR per 1 AED</span>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Buffer Percentage (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={bufferPct}
                    onChange={(e) => setBufferPct(e.target.value)}
                    className="h-11 rounded-xl font-bold text-sm mt-1"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Default: 1.0% (covers exchange slip)</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={fxSaving}
                className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 h-10 px-5"
              >
                {fxSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save FX Configuration
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 3: OFFICIAL BANK ACCOUNT (SECTION 15.6)
          ------------------------------------------------------------- */}
      {activeTab === "bank" && (
        <div className="space-y-8">
          {bankFeedback && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 border ${
                bankFeedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {bankFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{bankFeedback.text}</span>
            </div>
          )}

          {/* Current Bank Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-extrabold px-3 py-1 bg-emerald-800/80 rounded-full border border-emerald-700/50 text-emerald-200">
                Single Bank Account (Active Everywhere)
              </span>
              <span className="text-xs text-emerald-300 font-semibold">100% Shariah Compliant</span>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <span className="text-xs text-slate-400">Bank &amp; Branch</span>
                <div className="text-xl font-extrabold text-white">
                  {bankForm.bank_name} — {bankForm.branch}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400">Account Title</span>
                <div className="text-base font-bold text-white">{bankForm.account_title}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-300 block">Account Number</span>
                    <span className="text-sm font-mono font-bold text-white">{bankForm.account_number}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(bankForm.account_number, "acc")}
                    className="h-8 px-2.5 text-xs text-emerald-300 hover:text-white hover:bg-white/20"
                  >
                    {copiedField === "acc" ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copiedField === "acc" ? "Copied" : "Copy"}
                  </Button>
                </div>

                <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-300 block">IBAN</span>
                    <span className="text-sm font-mono font-bold text-white">{bankForm.iban}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(bankForm.iban, "iban")}
                    className="h-8 px-2.5 text-xs text-emerald-300 hover:text-white hover:bg-white/20"
                  >
                    {copiedField === "iban" ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copiedField === "iban" ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              {bankForm.swift && (
                <div className="pt-2 text-xs">
                  <span className="text-slate-400">SWIFT/BIC Code:</span>{" "}
                  <span className="font-mono font-bold text-white">{bankForm.swift}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bank Edit Form with Fraud Protection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl mb-6 text-rose-900 text-xs flex gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Bank-Detail Fraud Protection (Section 15.6)</p>
                <p className="text-rose-700 mt-0.5">
                  Only Super Admins may edit bank details. Every change records an immutable audit log entry and dispatches an emergency alert email to all super administrators.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveBankAccount} className="space-y-4 max-w-2xl text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Bank Name</Label>
                  <Input
                    value={bankForm.bank_name}
                    onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                    className="h-10 rounded-xl mt-1"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Branch Name &amp; City</Label>
                  <Input
                    value={bankForm.branch}
                    onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                    className="h-10 rounded-xl mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Account Title</Label>
                  <Input
                    value={bankForm.account_title}
                    onChange={(e) => setBankForm({ ...bankForm, account_title: e.target.value })}
                    className="h-10 rounded-xl mt-1 font-bold"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Account Number</Label>
                  <Input
                    value={bankForm.account_number}
                    onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                    className="h-10 rounded-xl mt-1 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700">IBAN Number</Label>
                  <Input
                    value={bankForm.iban}
                    onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                    className="h-10 rounded-xl mt-1 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">SWIFT / BIC Code (Optional)</Label>
                  <Input
                    placeholder="Leave blank until confirmed with branch"
                    value={bankForm.swift}
                    onChange={(e) => setBankForm({ ...bankForm, swift: e.target.value })}
                    className="h-10 rounded-xl mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Transfer Instructions &amp; Remarks Note</Label>
                <textarea
                  value={bankForm.instructions}
                  onChange={(e) => setBankForm({ ...bankForm, instructions: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs mt-1"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={bankSaving}
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-2 h-10 px-5 shadow-sm"
              >
                {bankSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Save Official Bank Details (Super Admin)
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
