"use client";

import * as React from "react";
import {
  CreditCard,
  Building,
  Phone,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminGetPaymentSettingsAction,
  adminSavePaymentSettingsAction,
} from "@/app/actions/adminDonors";
import { siteConfig } from "@/lib/siteConfig";

export default function AdminPaymentSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const [settings, setSettings] = React.useState<any>({
    bank_title: siteConfig.bankAccount.accountTitle,
    bank_name: siteConfig.bankAccount.bankName,
    account_number: siteConfig.bankAccount.accountNumber,
    iban: siteConfig.bankAccount.iban,
    branch_name: siteConfig.bankAccount.branch,
    swift_code: siteConfig.bankAccount.swift || "",
    doorstep_enabled: true,
    doorstep_phone: "04235236622",
    cheque_enabled: true,
    bank_transfer_enabled: true,
    jazzcash_number: "03033934771",
    easypaisa_number: "0328-6477314",
    gateway_provider: "manual",
    gateway_mode: "test",
  });

  React.useEffect(() => {
    async function load() {
      const data = await adminGetPaymentSettingsAction();
      if (data) {
        setSettings(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const res = await adminSavePaymentSettingsAction(settings);
    setSaving(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
    } else {
      setFeedback({ type: "error", text: "Failed to save payment settings." });
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Loading payment configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
          Payment Accounts &amp; Gateway Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure official bank accounts, mobile wallets, doorstep toll-free numbers, and future gateway readiness.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Official Islamic Bank Account */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-900">
                Primary Islamic Bank Account
              </h2>
              <p className="text-xs text-slate-500">
                Shown to donors on /donate-now, acknowledgment emails, and donor dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Bank Name *
              </label>
              <Input
                required
                value={settings.bank_name}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Account Title *
              </label>
              <Input
                required
                value={settings.bank_title}
                onChange={(e) => setSettings({ ...settings, bank_title: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Account Number *
              </label>
              <Input
                required
                value={settings.account_number}
                onChange={(e) => setSettings({ ...settings, account_number: e.target.value })}
                className="h-10 text-xs rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                IBAN Number *
              </label>
              <Input
                required
                value={settings.iban}
                onChange={(e) => setSettings({ ...settings, iban: e.target.value })}
                className="h-10 text-xs rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Branch Details
              </label>
              <Input
                value={settings.branch_name}
                onChange={(e) => setSettings({ ...settings, branch_name: e.target.value })}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Swift / BIC Code
              </label>
              <Input
                value={settings.swift_code}
                onChange={(e) => setSettings({ ...settings, swift_code: e.target.value })}
                className="h-10 text-xs rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Doorstep Collection & Mobile Wallets */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-900">
                Doorstep Collection &amp; Mobile Wallets
              </h2>
              <p className="text-xs text-slate-500">
                Toll-free rider collection helpline and mobile wallet account numbers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nationwide Toll-Free Helpline
              </label>
              <Input
                value={settings.doorstep_phone}
                onChange={(e) => setSettings({ ...settings, doorstep_phone: e.target.value })}
                className="h-10 text-xs rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                JazzCash Account Number
              </label>
              <Input
                value={settings.jazzcash_number}
                onChange={(e) => setSettings({ ...settings, jazzcash_number: e.target.value })}
                className="h-10 text-xs rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                EasyPaisa Account Number
              </label>
              <Input
                value={settings.easypaisa_number}
                onChange={(e) => setSettings({ ...settings, easypaisa_number: e.target.value })}
                className="h-10 text-xs rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Future Payment Gateway Readiness */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-900">
                Payment Gateway Integration (Future-Ready)
              </h2>
              <p className="text-xs text-slate-500">
                Currently operating manual transfers. Automated gateways can be toggled on here without code changes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Active Provider
              </label>
              <select
                value={settings.gateway_provider}
                onChange={(e) => setSettings({ ...settings, gateway_provider: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
              >
                <option value="manual">Manual Transfer (Direct Bank / Doorstep / Cheque)</option>
                <option value="safepay">Safepay Pakistan</option>
                <option value="payfast">PayFast (1Link / Cards / Wallets)</option>
                <option value="jazzcash">JazzCash Merchant Gateway</option>
                <option value="stripe">Stripe (International Cards)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Environment Mode
              </label>
              <select
                value={settings.gateway_mode}
                onChange={(e) => setSettings({ ...settings, gateway_mode: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="test">Sandbox / Test Mode</option>
                <option value="live">Live Production</option>
              </select>
            </div>
          </div>

          {settings.gateway_provider !== "manual" && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Gateway Integration Mode: {settings.gateway_provider.toUpperCase()}
              </div>
              <p className="leading-relaxed">
                Configure your API keys in your Vercel Environment Variables (<code>PAYMENT_GATEWAY_KEY</code> and <code>PAYMENT_WEBHOOK_SECRET</code>) for zero-trust security.
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="rounded-xl text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-6 h-11 shadow-md gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Payment &amp; Bank Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
