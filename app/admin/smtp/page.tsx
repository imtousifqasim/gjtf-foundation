"use client";

import * as React from "react";
import {
  Server,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  Zap,
  RefreshCw,
} from "lucide-react";
import { getSmtpSettingsAction, saveSmtpSettingsAction, testSmtpConnectionAction } from "@/app/actions/smtp";
import { SmtpConfig } from "@/lib/email/smtp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSmtpPage() {
  const [config, setConfig] = React.useState<SmtpConfig>({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user_name: "",
    password: "",
    from_name: "Ghais Jhuggi Taleem Foundation",
    from_email: "info@gjtfoundation.com",
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Testing SMTP state
  const [testRecipient, setTestRecipient] = React.useState("tousifdev@outlook.com");
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getSmtpSettingsAction();
        if (data) {
          setConfig(data);
          if (data.user_name && !testRecipient) {
            setTestRecipient(data.user_name);
          }
        }
      } catch (err) {
        console.error("Failed to load SMTP settings:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleApplyPreset = (preset: "hostinger" | "cpanel" | "gmail" | "outlook" | "custom") => {
    if (preset === "hostinger") {
      setConfig((prev) => ({
        ...prev,
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
      }));
    } else if (preset === "cpanel") {
      setConfig((prev) => ({
        ...prev,
        host: "mail.gjtfoundation.com",
        port: 465,
        secure: true,
      }));
    } else if (preset === "gmail") {
      setConfig((prev) => ({
        ...prev,
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
      }));
    } else if (preset === "outlook") {
      setConfig((prev) => ({
        ...prev,
        host: "smtp.office365.com",
        port: 587,
        secure: false,
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    const res = await saveSmtpSettingsAction(config);
    setSaving(false);

    if (res.success) {
      setSaveSuccess(res.message);
      setTimeout(() => setSaveSuccess(null), 4000);
    } else {
      setSaveError(res.message || "Failed to save SMTP configuration.");
    }
  };

  const handleTestConnection = async () => {
    if (!testRecipient.trim()) {
      setTestResult({
        success: false,
        message: "Please enter a recipient email address to send the test verification to.",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const res = await testSmtpConnectionAction({
      settings: config,
      recipientEmail: testRecipient.trim(),
    });

    setTesting(false);

    if (res.success) {
      setTestResult({
        success: true,
        message: res.message || "Test email sent successfully! Please check your inbox.",
      });
    } else {
      setTestResult({
        success: false,
        message: res.error || "Failed to establish SMTP connection. Verify your credentials.",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
                SMTP Configuration
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Set up email delivery for newsletter subscriptions, contact replies, and promotional announcements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{saveError}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Quick Presets Grid */}
        <div className="space-y-3 pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Select SMTP Relay Provider
            </span>
            <span className="text-xs text-slate-500">
              Select your hosting provider or email service to auto-fill host, port, and security defaults.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => handleApplyPreset("hostinger")}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.host === "smtp.hostinger.com"
                  ? "bg-purple-50 border-purple-300 ring-2 ring-purple-500/20 shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Hostinger</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">SSL 465</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">smtp.hostinger.com</p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset("cpanel")}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.host.startsWith("mail.")
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">cPanel / Webmail</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">Port 465</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">mail.yourdomain.com</p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset("gmail")}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.host === "smtp.gmail.com"
                  ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Gmail / Google</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">SSL 465</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">smtp.gmail.com</p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset("outlook")}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.host === "smtp.office365.com"
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Outlook / 365</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">Port 587</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">smtp.office365.com</p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SMTP Server Host *
              </label>
              <Input
                required
                placeholder="smtp.gmail.com or smtp.office365.com"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Port *
              </label>
              <Input
                type="number"
                required
                placeholder="587 or 465"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })}
                className="rounded-xl border-slate-200 focus:border-primary-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Encryption Protocol
              </label>
              <select
                value={config.secure ? "ssl" : "tls"}
                onChange={(e) => setConfig({ ...config, secure: e.target.value === "ssl" })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="tls">STARTTLS / TLS (Recommended for Port 587)</option>
                <option value="ssl">SSL (Recommended for Port 465)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sender Display Name *
              </label>
              <Input
                required
                placeholder="Ghais Jhuggi Taleem Foundation"
                value={config.from_name}
                onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-primary-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SMTP Username / Email *
              </label>
              <Input
                required
                type="email"
                placeholder="e.g. yourname@gmail.com or admin@domain.com"
                value={config.user_name}
                onChange={(e) => setConfig({ ...config, user_name: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SMTP Password or App Password *
              </label>
              <div className="relative">
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter 16-character App Password"
                  value={config.password || ""}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  className="rounded-xl border-slate-200 pr-10 focus:border-primary-600 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                For Gmail or Microsoft 365, use an generated <strong>App Password</strong> instead of your regular password.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Sender Email Address (From Email) *
            </label>
            <Input
              required
              type="email"
              placeholder="e.g. info@gjtfoundation.com"
              value={config.from_email}
              onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
              className="rounded-xl border-slate-200 focus:border-primary-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Settings are securely persisted in Supabase database in real time.</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="w-auto sm:w-auto font-bold px-6 py-2.5 rounded-xl shadow-soft hover:shadow-glow inline-flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Live Test Connection Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-900">
              Test Connection & Send Test Email
            </h2>
            <p className="text-xs text-slate-500">
              Verify that the SMTP server connects properly and can successfully deliver emails to an inbox.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="Enter recipient email (e.g. your personal email)"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              className="rounded-xl border-slate-200"
            />
          </div>
          <Button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            variant="outline"
            className="rounded-xl font-bold border-blue-200 text-blue-700 hover:bg-blue-50 px-6 py-2.5 shrink-0 flex items-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying & Sending...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Send Test Email</span>
              </>
            )}
          </Button>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed flex items-start gap-3 mt-3 ${
              testResult.success
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{testResult.success ? "Success!" : "Connection Failed"}</p>
              <p className="mt-0.5">{testResult.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
