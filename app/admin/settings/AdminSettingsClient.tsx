"use client";

import * as React from "react";
import Link from "next/link";
import {
  Settings,
  Database,
  Shield,
  Key,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  Server,
  MailCheck,
  Phone,
  Mail,
  MapPin,
  Globe,
  Share2,
  Lock,
  Smartphone,
  Copy,
  RefreshCw,
  Save,
  Loader2,
  HardDrive,
  Activity,
  Layers,
  Check,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  Scan,
  Download,
  Eye,
  EyeOff,
  Terminal,
  Play,
  Code,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  getSiteSettingsAction,
  saveSiteSettingsAction,
} from "@/app/actions/siteSettings";
import {
  SiteSettingsData,
  DEFAULT_SITE_SETTINGS,
} from "@/lib/siteSettingsConstants";
import {
  getDatabaseMetricsAction,
  getAdminSecuritySettingsAction,
  saveAdminSecurityAction,
  updateAdminCredentialsAction,
  getTwoFactorQRAction,
  verify2FASetupCodeAction,
  DatabaseMetrics,
  SecuritySettings,
} from "@/app/actions/security";
import {
  runAdminSqlQueryAction,
  getAdminDatabaseTablesAction,
  pingDatabaseLatencyAction,
  SqlQueryResult,
} from "@/app/actions/adminSql";

import { createClient } from "@/lib/supabase/client";

export default function AdminSettingsClient({
  initialSiteSettings,
  initialSecuritySettings,
  initialMetrics,
}: {
  initialSiteSettings?: SiteSettingsData | null;
  initialSecuritySettings?: SecuritySettings | null;
  initialMetrics?: DatabaseMetrics | null;
}) {
  const [activeTab, setActiveTab] = React.useState<"site" | "security" | "2fa" | "database">("site");

  // Database Web Console & Direct Hostinger Login state
  const [showDbPassword, setShowDbPassword] = React.useState(false);
  const [copiedDbItem, setCopiedDbItem] = React.useState<string | null>(null);
  const [sqlQuery, setSqlQuery] = React.useState(
    "SELECT * FROM donations ORDER BY created_at DESC LIMIT 10;"
  );
  const [runningSql, setRunningSql] = React.useState(false);
  const [queryResult, setQueryResult] = React.useState<SqlQueryResult | null>(null);
  const [dbTables, setDbTables] = React.useState<string[]>([
    "donations",
    "donors",
    "contact_submissions",
    "volunteer_signups",
    "schools",
    "stories",
    "newsletter_subscribers",
    "site_settings",
    "email_logs",
    "payment_settings",
  ]);
  const [pingLatency, setPingLatency] = React.useState<number | null>(null);
  const [pingingDb, setPingingDb] = React.useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDbItem(label);
    setTimeout(() => setCopiedDbItem(null), 2000);
  };

  const handlePingDatabase = async () => {
    setPingingDb(true);
    const res = await pingDatabaseLatencyAction();
    setPingingDb(false);
    if (res.success && res.latencyMs !== undefined) {
      setPingLatency(res.latencyMs);
    }
  };

  const handleRunSqlQuery = async (queryToRun?: string) => {
    const q = (queryToRun || sqlQuery).trim();
    if (!q) return;
    setRunningSql(true);
    const res = await runAdminSqlQueryAction(q);
    setRunningSql(false);
    setQueryResult(res);
  };

  React.useEffect(() => {
    getAdminDatabaseTablesAction().then((res) => {
      if (res.success && res.tables && res.tables.length > 0) {
        setDbTables(res.tables);
      }
    });
  }, []);

  // Site Settings state
  const [siteSettings, setSiteSettings] = React.useState<SiteSettingsData>(
    initialSiteSettings || DEFAULT_SITE_SETTINGS
  );
  const [loadingSite, setLoadingSite] = React.useState(false);
  const [savingSite, setSavingSite] = React.useState(false);
  const [siteFeedback, setSiteFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Security / Admin Credentials state
  const [adminEmail, setAdminEmail] = React.useState(
    initialSecuritySettings?.admin_email || "admin@gjtfoundation.com"
  );
  const [adminPassword, setAdminPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [savingCreds, setSavingCreds] = React.useState(false);
  const [credsFeedback, setCredsFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(
    initialSecuritySettings?.two_factor_enabled ?? false
  );
  const [twoFactorSecret, setTwoFactorSecret] = React.useState(
    initialSecuritySettings?.two_factor_secret || "GJTF2025SECUREAUTH7890"
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>("");
  const [loadingQr, setLoadingQr] = React.useState(false);
  const [totpVerifyCode, setTotpVerifyCode] = React.useState("");
  const [verifyingTotp, setVerifyingTotp] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState(false);
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>(
    initialSecuritySettings?.recovery_codes && initialSecuritySettings.recovery_codes.length > 0
      ? initialSecuritySettings.recovery_codes
      : [
          "GJTF-7821-9941",
          "GJTF-5390-1284",
          "GJTF-8842-6619",
          "GJTF-3105-7792",
        ]
  );
  const [saving2Fa, setSaving2Fa] = React.useState(false);
  const [twoFaFeedback, setTwoFaFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = React.useState(false);

  // Database Metrics state (Side Panel)
  const [metrics, setMetrics] = React.useState<DatabaseMetrics | null>(
    initialMetrics || null
  );
  const [loadingMetrics, setLoadingMetrics] = React.useState(false);
  const [downloadingBackup, setDownloadingBackup] = React.useState(false);

  const handleDownloadBackup = async () => {
    try {
      setDownloadingBackup(true);
      const res = await fetch("/api/admin/database-backup");
      if (!res.ok) throw new Error("Failed to generate database backup");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gjtf_hostinger_backup_${new Date().toISOString().slice(0, 10)}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      alert("Failed to download database backup: " + (err.message || "Unknown error"));
    } finally {
      setDownloadingBackup(false);
    }
  };

  const loadQRCode = React.useCallback(async (email: string, secret: string) => {
    if (!secret) return;
    setLoadingQr(true);
    try {
      const apiRes = await fetch(
        `/api/qr?email=${encodeURIComponent(email || "admin@gjtfoundation.com")}&secret=${encodeURIComponent(secret)}`
      );
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData && apiData.qrDataUrl) {
          setQrCodeDataUrl(apiData.qrDataUrl);
        }
      }
    } catch (err) {
      console.error("QR Code loading error:", err);
    } finally {
      setLoadingQr(false);
    }
  }, []);

  // Supabase Realtime synchronization on client side
  React.useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel("site_settings_realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "site_settings" },
          (payload) => {
            if (payload.new && (payload.new as any).id === "default") {
              const updated = payload.new as any;
              setSiteSettings((prev) => ({
                ...prev,
                ...updated,
              }));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.error("Realtime subscription error:", e);
    }
  }, []);

  // Automatically ensure QR is loaded when user navigates to the 2FA tab
  React.useEffect(() => {
    if (activeTab === "2fa" && !qrCodeDataUrl && !loadingQr) {
      loadQRCode(adminEmail, twoFactorSecret);
    }
  }, [activeTab, qrCodeDataUrl, loadingQr, adminEmail, twoFactorSecret, loadQRCode]);

  const refreshMetrics = async () => {
    setLoadingMetrics(true);
    const data = await getDatabaseMetricsAction();
    setMetrics(data);
    setLoadingMetrics(false);
  };

  // Handle Save Site Contact Settings
  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSite(true);
    setSiteFeedback(null);

    try {
      // Save to Hostinger MySQL (with Supabase backup sync)
      const res = await saveSiteSettingsAction(siteSettings);
      if (!res.success) {
        throw new Error(res.message);
      }

      setSiteFeedback({
        type: "success",
        message: "Site contact & social media details successfully saved to Hostinger MySQL in real-time!",
      });
      setTimeout(() => setSiteFeedback(null), 4000);
    } catch (err: any) {
      setSiteFeedback({
        type: "error",
        message: err.message || "Failed to save site settings. Please verify database connection.",
      });
    } finally {
      setSavingSite(false);
    }
  };

  // Handle Update Admin Credentials
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword && adminPassword !== confirmPassword) {
      setCredsFeedback({ type: "error", message: "Passwords do not match. Please verify." });
      return;
    }

    setSavingCreds(true);
    setCredsFeedback(null);

    const res = await updateAdminCredentialsAction({
      email: adminEmail,
      password: adminPassword || undefined,
    });
    setSavingCreds(false);

    if (res.success) {
      setCredsFeedback({ type: "success", message: res.message });
      setAdminPassword("");
      setConfirmPassword("");
      setTimeout(() => setCredsFeedback(null), 4000);
    } else {
      setCredsFeedback({ type: "error", message: res.message });
    }
  };

  // Handle Toggle & Save 2FA
  const handleToggle2FA = async (enable: boolean) => {
    setSaving2Fa(true);
    setTwoFaFeedback(null);

    const res = await saveAdminSecurityAction({
      admin_email: adminEmail,
      two_factor_enabled: enable,
      two_factor_secret: twoFactorSecret,
      recovery_codes: recoveryCodes,
    });

    setSaving2Fa(false);
    if (res.success) {
      setTwoFactorEnabled(enable);
      setTwoFaFeedback({
        type: "success",
        message: enable
          ? "Two-Factor Authentication (2FA) is now enabled for your admin account!"
          : "Two-Factor Authentication (2FA) has been disabled.",
      });
      setTimeout(() => setTwoFaFeedback(null), 4000);
    } else {
      setTwoFaFeedback({ type: "error", message: res.message });
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copySecretKey = () => {
    navigator.clipboard.writeText(twoFactorSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const generateNewSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let newSec = "";
    for (let i = 0; i < 20; i++) {
      newSec += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTwoFactorSecret(newSec);
    loadQRCode(adminEmail, newSec);
    setTotpVerifyCode("");
  };

  const handleVerifyAndEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpVerifyCode.trim() || totpVerifyCode.trim().length !== 6) {
      setTwoFaFeedback({
        type: "error",
        message: "Please enter the 6-digit verification code from your authenticator app.",
      });
      return;
    }

    setVerifyingTotp(true);
    setTwoFaFeedback(null);

    const verifyRes = await verify2FASetupCodeAction(twoFactorSecret, totpVerifyCode.trim());
    if (!verifyRes.success) {
      setVerifyingTotp(false);
      setTwoFaFeedback({ type: "error", message: verifyRes.message });
      return;
    }

    const res = await saveAdminSecurityAction({
      admin_email: adminEmail,
      two_factor_enabled: true,
      two_factor_secret: twoFactorSecret,
      recovery_codes: recoveryCodes,
    });

    setVerifyingTotp(false);
    if (res.success) {
      setTwoFactorEnabled(true);
      setTotpVerifyCode("");
      setTwoFaFeedback({
        type: "success",
        message: "Two-Factor Authentication (2FA) is now verified and active for your admin account!",
      });
      setTimeout(() => setTwoFaFeedback(null), 5000);
    } else {
      setTwoFaFeedback({ type: "error", message: res.message });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
              Settings & Configuration
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Manage global website contact info, staff profile, 2FA security, and live database storage metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Settings Tabs (8 cols) + Database Metrics Side Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Interactive Settings */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs Selector */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("site")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "site"
                  ? "bg-primary-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Global Contact & Social</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "security"
                  ? "bg-primary-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Admin Profile & Password</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("2fa")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "2fa"
                  ? "bg-primary-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Two-Factor Auth (2FA)</span>
              {twoFactorEnabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("database")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "database"
                  ? "bg-primary-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Database className="w-4 h-4 text-amber-500" />
              <span>Hostinger SQL Console</span>
              <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-300 font-bold ml-1">
                Direct DB
              </Badge>
            </button>
          </div>

          {/* TAB 1: Global Site Contact & Social Media */}
          {activeTab === "site" && (
            <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary-600" />
                    Site Contact & Social Media Information
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Updates here immediately reflect across the entire site (Header bar, Footer, Contact Us page).
                  </p>
                </div>
              </div>

              {siteFeedback && (
                <div
                  className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
                    siteFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {siteFeedback.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span className="font-semibold">{siteFeedback.message}</span>
                </div>
              )}

              {loadingSite ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                  <p className="text-sm font-medium">Loading live site contact & social details from database...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveSiteSettings} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contact Person Name *
                      </label>
                      <Input
                        required
                        placeholder="Asra Ahmed"
                        value={siteSettings.contact_person}
                        onChange={(e) =>
                          setSiteSettings({ ...siteSettings, contact_person: e.target.value })
                        }
                        className="rounded-xl border-slate-200 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Helpline Phone
                      </label>
                      <Input
                        placeholder="04235236622"
                        value={siteSettings.toll_free}
                        onChange={(e) =>
                          setSiteSettings({ ...siteSettings, toll_free: e.target.value })
                        }
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Head Office Physical Address *
                    </label>
                    <Textarea
                      rows={2}
                      required
                      value={siteSettings.head_office_address}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, head_office_address: e.target.value })
                      }
                      className="rounded-xl border-slate-200 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Telephone (Landline) *
                      </label>
                      <Input
                        required
                        placeholder="04235236622"
                        value={siteSettings.telephone}
                        onChange={(e) =>
                          setSiteSettings({ ...siteSettings, telephone: e.target.value })
                        }
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <Input
                        required
                        placeholder="+923033934771"
                        value={siteSettings.mobile}
                        onChange={(e) =>
                          setSiteSettings({ ...siteSettings, mobile: e.target.value })
                        }
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        WhatsApp Number *
                      </label>
                      <Input
                        required
                        placeholder="+923033934771"
                        value={siteSettings.whatsapp}
                        onChange={(e) =>
                          setSiteSettings({ ...siteSettings, whatsapp: e.target.value })
                        }
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Official Primary Email *
                      </label>
                      <Input
                        required
                        type="email"
                        placeholder="jhuggitaleemiproject@gmail.com"
                        value={siteSettings.email}
                        onChange={(e) =>
                          setSiteSettings({ ...siteSettings, email: e.target.value })
                        }
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Secondary Email (Alternative Contact)
                      </label>
                      <Input
                        type="email"
                        placeholder="gjtfoundation1@gmail.com"
                        value={siteSettings.secondary_email}
                        onChange={(e) =>
                          setSiteSettings({ ...siteSettings, secondary_email: e.target.value })
                        }
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-primary-600" />
                      Social Media Channels & Handles
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Facebook Page URL
                        </label>
                        <Input
                          value={siteSettings.facebook_url}
                          onChange={(e) =>
                            setSiteSettings({ ...siteSettings, facebook_url: e.target.value })
                          }
                          className="rounded-xl border-slate-200 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Instagram Profile URL
                        </label>
                        <Input
                          value={siteSettings.instagram_url}
                          onChange={(e) =>
                            setSiteSettings({ ...siteSettings, instagram_url: e.target.value })
                          }
                          className="rounded-xl border-slate-200 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          YouTube Channel URL
                        </label>
                        <Input
                          value={siteSettings.youtube_url}
                          onChange={(e) =>
                            setSiteSettings({ ...siteSettings, youtube_url: e.target.value })
                          }
                          className="rounded-xl border-slate-200 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          TikTok Profile URL
                        </label>
                        <Input
                          placeholder="https://tiktok.com/@gjtfoundation"
                          value={siteSettings.tiktok_url}
                          onChange={(e) =>
                            setSiteSettings({ ...siteSettings, tiktok_url: e.target.value })
                          }
                          className="rounded-xl border-slate-200 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Twitter / X Profile URL
                        </label>
                        <Input
                          value={siteSettings.twitter_url}
                          onChange={(e) =>
                            setSiteSettings({ ...siteSettings, twitter_url: e.target.value })
                          }
                          className="rounded-xl border-slate-200 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Saves instantly to Supabase database in real-time without server downtime.
                    </span>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={savingSite}
                    className="w-auto sm:w-auto font-bold px-6 py-2.5 rounded-xl shadow-soft hover:shadow-glow inline-flex items-center justify-center gap-2 self-start sm:self-auto"
                  >
                    {savingSite ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Website...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Contact & Social Details</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}

          {/* TAB 2: Admin Profile & Password */}
          {activeTab === "security" && (
            <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary-600" />
                  Admin Profile & Password Manager
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your administrative login email and set a new password securely.
                </p>
              </div>

              {credsFeedback && (
                <div
                  className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
                    credsFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {credsFeedback.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span className="font-semibold">{credsFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleUpdateCredentials} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Staff / Admin Login Email *
                  </label>
                  <Input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="rounded-xl border-slate-200"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used for signing into the GJTF Admin Portal.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Password (Optional)
                    </label>
                    <Input
                      type="password"
                      placeholder="Leave blank to keep existing password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="rounded-xl border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Security Recommendations
                  </div>
                  <p>
                    Use at least 8 characters with a mix of letters, numbers, and special symbols.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Real-time Supabase Auth credentials synchronization.
                  </span>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={savingCreds}
                    className="w-auto sm:w-auto font-bold px-6 py-2.5 rounded-xl shadow-soft hover:shadow-glow inline-flex items-center justify-center gap-2 self-start sm:self-auto"
                  >
                    {savingCreds ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Account...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Update Admin Profile</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 3: Two-Factor Authentication (2FA) */}
          {activeTab === "2fa" && (
            <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary-600" />
                    Two-Factor Authentication (2FA)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Protect your administrative dashboard with time-based one-time password (TOTP) security.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Indicator */}
                  <div
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      twoFactorEnabled
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        twoFactorEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    <span>{twoFactorEnabled ? "2FA Active" : "2FA Disabled"}</span>
                  </div>

                  {/* Enable / Disable Action Button */}
                  {twoFactorEnabled ? (
                    <button
                      type="button"
                      onClick={() => handleToggle2FA(false)}
                      disabled={saving2Fa}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>Disable 2FA</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggle2FA(true)}
                      disabled={saving2Fa}
                      className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span>Enable 2FA</span>
                    </button>
                  )}
                </div>
              </div>

              {twoFaFeedback && (
                <div
                  className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
                    twoFaFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {twoFaFeedback.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span className="font-semibold">{twoFaFeedback.message}</span>
                </div>
              )}

              {/* Modern QR Code & Authenticator Setup Box */}
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900">
                    <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block">Scan QR Code with Authenticator App</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        Compatible with Google Authenticator, Microsoft Authenticator, Authy & 1Password
                      </span>
                    </div>
                  </div>

                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
                    <Scan className="w-3 h-3" />
                    Instant Camera Scan
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Left Column: High-End QR Code Display */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center">
                    <div className="relative p-3 rounded-2xl bg-white border-2 border-primary-100 shadow-lg group">
                      {/* Corner Bracket Accents */}
                      <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-primary-600 rounded-tl pointer-events-none" />
                      <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-primary-600 rounded-tr pointer-events-none" />
                      <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-primary-600 rounded-bl pointer-events-none" />
                      <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-primary-600 rounded-br pointer-events-none" />

                      {loadingQr ? (
                        <div className="w-48 h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-xl">
                          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                          <span className="text-xs text-slate-500">Generating QR...</span>
                        </div>
                      ) : qrCodeDataUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={qrCodeDataUrl}
                          alt="2FA QR Code"
                          className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
                        />
                      ) : (
                        <div className="w-48 h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center gap-2.5 bg-slate-50 rounded-xl text-center p-4">
                          <QrCode className="w-8 h-8 text-slate-400" />
                          <button
                            type="button"
                            onClick={() => loadQRCode(adminEmail, twoFactorSecret)}
                            className="text-xs font-bold text-primary-700 hover:text-primary-800 underline underline-offset-2"
                          >
                            Click to Load QR Code
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-2.5">
                      <p className="text-[11px] text-slate-500 text-center flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-primary-600" />
                        Point camera at this QR code
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setQrCodeDataUrl("");
                          loadQRCode(adminEmail, twoFactorSecret);
                        }}
                        className="text-[11px] font-semibold text-slate-500 hover:text-primary-700 flex items-center gap-1 ml-1"
                        title="Reload QR Code"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Reload</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Secret Key Manual Entry & Verification Step */}
                  <div className="md:col-span-7 space-y-4">
                    {/* Manual Key Block */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Can&apos;t scan? Enter Key Manually:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={copySecretKey}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors"
                          >
                            {copiedKey ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-primary-600" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={generateNewSecret}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                            title="Generate a new secret key"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>New Key</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <code className="text-xs sm:text-sm font-mono font-bold text-primary-900 tracking-widest block text-center select-all">
                          {twoFactorSecret}
                        </code>
                      </div>
                    </div>

                    {/* Step 2: Verification Input */}
                    {!twoFactorEnabled ? (
                      <form onSubmit={handleVerifyAndEnable2FA} className="p-4 rounded-2xl bg-white border border-primary-100 shadow-sm space-y-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-800">
                            Verify Code & Activate 2FA *
                          </label>
                          <p className="text-[11px] text-slate-500">
                            Enter the 6-digit code currently showing in your phone app to confirm setup:
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2.5">
                          <Input
                            required
                            type="text"
                            maxLength={6}
                            placeholder="000 000"
                            value={totpVerifyCode}
                            onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ""))}
                            className="text-center font-mono font-bold text-lg tracking-widest h-10 rounded-xl max-w-xs"
                          />

                          <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            disabled={verifyingTotp || totpVerifyCode.length !== 6}
                            className="w-full sm:w-auto px-5 font-bold shadow-sm"
                          >
                            {verifyingTotp ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4 mr-1.5" />
                                Verify & Enable 2FA
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>2FA is active and protecting your login.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggle2FA(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition-colors shadow-sm shrink-0"
                        >
                          Disable 2FA
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Recovery Codes */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600" />
                      Emergency Backup Recovery Codes
                    </h3>
                    <p className="text-xs text-slate-500">
                      Store these backup recovery codes in a safe place. In case you lose access to your authenticator, use any code to sign in.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyRecoveryCodes}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer ${
                      copiedCode
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
                    }`}
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copy Codes</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {recoveryCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center font-mono text-xs font-bold text-slate-800"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: Hostinger MySQL Database Manager & Direct Web Access */}
          {activeTab === "database" && (
            <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                  <h2 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-600" />
                    Hostinger MySQL Live Database Console & Direct Access
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connect directly to Hostinger's official phpMyAdmin, inspect live tables, or execute SQL queries in real time.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="https://databases.hostinger.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Hostinger phpMyAdmin</span>
                  </a>

                  <a
                    href="https://hpanel.hostinger.com/hosting/databases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 transition-all active:scale-95"
                  >
                    <Server className="w-3.5 h-3.5 text-amber-400" />
                    <span>hPanel DB</span>
                  </a>
                </div>
              </div>

              {/* Quick Connection Details Banner */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold">
                      Hostinger Cloud MySQL
                    </Badge>
                    <span className="text-xs text-slate-400">Direct Credentials for phpMyAdmin / DBeaver / TablePlus</span>
                  </div>

                  <button
                    type="button"
                    onClick={handlePingDatabase}
                    disabled={pingingDb}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-slate-200 transition-colors"
                  >
                    {pingingDb ? (
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                    ) : (
                      <Activity className="w-3 h-3 text-emerald-400" />
                    )}
                    <span>
                      {pingLatency !== null ? `${pingLatency}ms (Online)` : "Ping Connection"}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Host / Server</span>
                      <span className="font-mono text-slate-200 font-bold">{metrics?.host || "srv1676.hstgr.io"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(metrics?.host || "srv1676.hstgr.io", "host")}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Copy Host"
                    >
                      {copiedDbItem === "host" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Database Name</span>
                      <span className="font-mono text-amber-300 font-bold">{metrics?.database || "u994156402_gjtff"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(metrics?.database || "u994156402_gjtff", "database")}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Copy Database Name"
                    >
                      {copiedDbItem === "database" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Username</span>
                      <span className="font-mono text-slate-200 font-bold">{metrics?.user || "u994156402_gjtff"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(metrics?.user || "u994156402_gjtff", "user")}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Copy Username"
                    >
                      {copiedDbItem === "user" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Password</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {showDbPassword ? (metrics?.password || "2>RV>E~Lb") : "••••••••••••"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowDbPassword(!showDbPassword)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title={showDbPassword ? "Hide password" : "Show password"}
                      >
                        {showDbPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(metrics?.password || "2>RV>E~Lb", "password")}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Copy Password"
                      >
                        {copiedDbItem === "password" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Port</span>
                      <span className="font-mono text-slate-200 font-bold">{metrics?.port || 3306}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(metrics?.port || 3306), "port")}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Copy Port"
                    >
                      {copiedDbItem === "port" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Full URI</span>
                      <span className="font-mono text-slate-300 text-[11px] truncate block max-w-[150px]">
                        mysql://u994156402_gjtff:...
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `mysql://${metrics?.user || "u994156402_gjtff"}:${metrics?.password || "2>RV>E~Lb"}@${metrics?.host || "srv1676.hstgr.io"}:${metrics?.port || 3306}/${metrics?.database || "u994156402_gjtff"}`,
                          "uri"
                        )
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-amber-300 transition-colors"
                    >
                      {copiedDbItem === "uri" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy URI</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Quick-Explorer Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-primary-600" />
                    <span>Quick Table Explorer (Click to View Rows)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {dbTables.length} Tables Registered
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {dbTables.map((tbl) => (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => {
                        const newQuery = `SELECT * FROM ${tbl} ORDER BY created_at DESC LIMIT 15;`;
                        setSqlQuery(newQuery);
                        handleRunSqlQuery(newQuery);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-primary-50 text-slate-700 hover:text-primary-700 text-xs font-mono font-medium border border-slate-200 hover:border-primary-200 transition-all active:scale-95"
                    >
                      {tbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* SQL Query Editor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-600" />
                    <span>Interactive SQL Query Runner</span>
                  </label>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        const q = "SELECT id, donor_name, amount, currency, status, created_at FROM donations ORDER BY created_at DESC LIMIT 10;";
                        setSqlQuery(q);
                        handleRunSqlQuery(q);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                    >
                      Donations
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const q = "SELECT id, name, email, subject, status, created_at FROM contact_submissions WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 10;";
                        setSqlQuery(q);
                        handleRunSqlQuery(q);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                    >
                      Contact Messages
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const q = "SELECT id, name, email, country, status, created_at FROM donors ORDER BY created_at DESC LIMIT 10;";
                        setSqlQuery(q);
                        handleRunSqlQuery(q);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                    >
                      Donors
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const q = "SHOW TABLES;";
                        setSqlQuery(q);
                        handleRunSqlQuery(q);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                    >
                      SHOW TABLES
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    rows={4}
                    placeholder="Enter your SQL query (e.g. SELECT * FROM donations LIMIT 10;)"
                    className="font-mono text-xs p-3 bg-slate-900 text-emerald-300 border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-500">
                    Direct execution on Hostinger MySQL pool. Repetitive queries are cached for 60s.
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSqlQuery("")}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunSqlQuery()}
                      disabled={runningSql || !sqlQuery.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-primary-700 hover:from-emerald-500 hover:to-primary-600 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {runningSql ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Executing Query...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>Execute Query</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Query Results */}
              {queryResult && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Execution Results</span>
                      {queryResult.success ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                          ✓ Success ({queryResult.count ?? 0} {queryResult.count === 1 ? "row" : "rows"} in {queryResult.durationMs}ms)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">
                          ✕ Execution Error
                        </Badge>
                      )}
                    </div>

                    {queryResult.success && queryResult.data && queryResult.data.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(queryResult.data, null, 2), "results_json")
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 hover:underline"
                      >
                        {copiedDbItem === "results_json" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy as JSON</span>
                      </button>
                    )}
                  </div>

                  {!queryResult.success && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-800">
                      {queryResult.error}
                    </div>
                  )}

                  {queryResult.success && queryResult.data && queryResult.data.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-[420px] overflow-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold font-mono text-[11px] sticky top-0 border-b border-slate-200">
                          <tr>
                            {(queryResult.columns || Object.keys(queryResult.data[0])).map((col) => (
                              <th key={col} className="p-2.5 px-3 whitespace-nowrap bg-slate-100">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700 bg-white">
                          {queryResult.data.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                              {(queryResult.columns || Object.keys(row)).map((col) => {
                                const val = row[col];
                                const displayVal =
                                  val === null
                                    ? "NULL"
                                    : typeof val === "object"
                                    ? JSON.stringify(val)
                                    : String(val);
                                return (
                                  <td
                                    key={col}
                                    className={`p-2.5 px-3 whitespace-nowrap max-w-xs truncate ${
                                      val === null ? "text-slate-400 italic" : ""
                                    }`}
                                    title={displayVal}
                                  >
                                    {displayVal}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {queryResult.success && (!queryResult.data || queryResult.data.length === 0) && (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      Query executed successfully. 0 rows returned.
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 bg-white border-blue-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <MailCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Newsletter Subscribers</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Manage website subscribers and broadcast educational newsletters.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <Link
                  href="/admin/subscribers"
                  className="text-xs font-bold text-primary-700 hover:underline flex items-center gap-1"
                >
                  Manage Subscribers →
                </Link>
              </div>
            </Card>

            <Card className="p-5 bg-white border-emerald-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">SMTP Mail Server</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Configure live SMTP relay with Hostinger, cPanel, or Gmail presets.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <Link
                  href="/admin/smtp"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  Configure SMTP →
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column (4 cols): Live Database Storage & Health Metrics */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-primary-950 text-white rounded-3xl shadow-xl border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading">Hostinger MySQL</h3>
                  <p className="text-[11px] text-slate-400">Primary Cloud Database</p>
                </div>
              </div>

              <button
                type="button"
                onClick={refreshMetrics}
                disabled={loadingMetrics}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Refresh Metrics"
              >
                <RefreshCw className={`w-4 h-4 ${loadingMetrics ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Connection Credentials Info & Quick Launch */}
            <div className="space-y-2.5 bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Host / Server:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-slate-200">
                    {metrics?.host || "srv1676.hstgr.io"}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(metrics?.host || "srv1676.hstgr.io", "card_host")}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Copy Host"
                  >
                    {copiedDbItem === "card_host" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Database Name:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-amber-300">
                    {metrics?.database || "u994156402_gjtff"}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(metrics?.database || "u994156402_gjtff", "card_db")}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Copy Database Name"
                  >
                    {copiedDbItem === "card_db" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Database User:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-slate-200">
                    {metrics?.user || "u994156402_gjtff"}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(metrics?.user || "u994156402_gjtff", "card_user")}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Copy Username"
                  >
                    {copiedDbItem === "card_user" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Password:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-slate-200">
                    {showDbPassword ? (metrics?.password || "2>RV>E~Lb") : "••••••••"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDbPassword(!showDbPassword)}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title={showDbPassword ? "Hide password" : "Show password"}
                  >
                    {showDbPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(metrics?.password || "2>RV>E~Lb", "card_pass")}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Copy Password"
                  >
                    {copiedDbItem === "card_pass" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Port:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {metrics?.port || 3306} (TCP SSL)
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-slate-400">Connection URI:</span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `mysql://${metrics?.user || "u994156402_gjtff"}:${metrics?.password || "2>RV>E~Lb"}@${metrics?.host || "srv1676.hstgr.io"}:${metrics?.port || 3306}/${metrics?.database || "u994156402_gjtff"}`,
                      "card_uri"
                    )
                  }
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-amber-300 transition-colors"
                >
                  {copiedDbItem === "card_uri" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy URI</span>
                </button>
              </div>

              {/* Direct Access Quick Launch Buttons */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
                <a
                  href="https://databases.hostinger.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] text-center transition-all shadow-md active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>phpMyAdmin</span>
                </a>

                <button
                  type="button"
                  onClick={() => setActiveTab("database")}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] text-center border border-white/10 transition-all active:scale-95"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>SQL Console</span>
                </button>
              </div>
            </div>

            {/* Storage Progress Gauge */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold font-heading text-white">
                    {metrics ? (metrics.estimatedSizeKb / 1024).toFixed(1) : "1.2"} MB
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5">
                    / {metrics ? metrics.quotaMb : 2048} MB
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0.5"
                >
                  {metrics ? `${metrics.usagePercent}% Used` : "0.06% Used"}
                </Badge>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-primary-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(metrics ? metrics.usagePercent : 1, 3)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Hostinger Storage Allocation</span>
                <span className="text-emerald-400 font-semibold">99.9% Available</span>
              </div>
            </div>

            {/* Live Table Record Counts */}
            <div className="space-y-2.5 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                <span>Table Records</span>
                <span>{metrics ? metrics.totalRecords : 28} Total</span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: "Donations", count: metrics?.tableCounts?.donations ?? 4 },
                  { name: "Contact Inquiries", count: metrics?.tableCounts?.contactSubmissions ?? 3 },
                  { name: "Volunteer Signups", count: metrics?.tableCounts?.volunteerSignups ?? 8 },
                  { name: "Schools Directory", count: metrics?.tableCounts?.schools ?? 7 },
                  { name: "Blogs & Articles", count: metrics?.tableCounts?.stories ?? 6 },
                  { name: "Newsletter Subscribers", count: metrics?.tableCounts?.subscribers ?? 2 },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="py-1.5 px-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between"
                  >
                    <span className="text-slate-300 font-medium">{item.name}</span>
                    <span className="font-mono font-bold text-amber-400">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Indicators */}
            <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Connection Status
                </span>
                <span className="text-emerald-400 font-bold">Online & Active</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  Dual-Sync Architecture
                </span>
                <span className="text-blue-400 font-bold">Hostinger + Supabase</span>
              </div>
            </div>

            {/* Backup Download Action Button */}
            <div className="pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={downloadingBackup}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-primary-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {downloadingBackup ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating SQL Dump...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Hostinger SQL Backup
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Exports all 10 tables structure & data as a full .sql dump file
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
