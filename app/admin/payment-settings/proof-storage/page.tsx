"use client";

import * as React from "react";
import Link from "next/link";
import {
  Folder,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Lock,
  Eye,
  Calendar,
  FileCheck,
  Clock,
  ArrowLeft,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getProofStorageSettingsAction,
  updateProofStorageSettingsAction,
  testStorageHealthAction,
} from "@/app/actions/admin";

export default function ProofStorageSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [testing, setTesting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [data, setData] = React.useState<any>(null);
  const [toast, setToast] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form State
  const [retentionDays, setRetentionDays] = React.useState<number>(90);
  const [maxFileSizeBytes, setMaxFileSizeBytes] = React.useState<number>(5242880);
  const [maxActiveProofs, setMaxActiveProofs] = React.useState<number>(3);
  const [allowGuestUploads, setAllowGuestUploads] = React.useState<boolean>(true);
  const [encryptionEnabled, setEncryptionEnabled] = React.useState<boolean>(false);
  const [filenameMode, setFilenameMode] = React.useState<"reference" | "random">("reference");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProofStorageSettingsAction();
      if (res.success && res.settings) {
        setData(res);
        setRetentionDays(res.settings.retention_days ?? 90);
        setMaxFileSizeBytes(res.settings.max_file_size_bytes ?? 5242880);
        setMaxActiveProofs(res.settings.max_active_proofs_per_pledge ?? 3);
        setAllowGuestUploads(Boolean(res.settings.allow_guest_uploads));
        setEncryptionEnabled(Boolean(res.settings.encryption_enabled));
        setFilenameMode(res.settings.filename_mode || "reference");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load storage settings", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleTestStorage = async () => {
    setTesting(true);
    try {
      const res = await testStorageHealthAction();
      if (res.success && res.health.healthy) {
        showToast(
          res.health.hasPublicPermissions
            ? "Storage tested with WARNING: Root folder has public permissions!"
            : "Storage connection tested successfully! All ancestry checks passed.",
          res.health.hasPublicPermissions ? "error" : "success"
        );
      } else {
        showToast(res.health?.error || "Storage health test failed.", "error");
      }
      await loadSettings();
    } catch (err: any) {
      showToast(err.message || "Failed to test storage.", "error");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProofStorageSettingsAction({
        retention_days: retentionDays,
        max_file_size_bytes: maxFileSizeBytes,
        max_active_proofs_per_pledge: maxActiveProofs,
        allow_guest_uploads: allowGuestUploads,
        encryption_enabled: encryptionEnabled,
        filename_mode: filenameMode,
      });

      if (res.success) {
        showToast("Storage settings updated successfully.", "success");
        await loadSettings();
      } else {
        showToast(res.error || "Failed to update settings.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error saving settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Connecting to Google Drive driver...</p>
      </div>
    );
  }

  const health = data?.health;
  const stats = data?.stats;
  const quota = health?.quota;

  const quotaPercent =
    quota && quota.totalBytes > 0
      ? Math.round((quota.usedBytes / quota.totalBytes) * 100)
      : null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-3 transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-red-600 text-white border-red-500"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/donations"
              className="text-xs font-bold text-primary-700 hover:text-primary-900 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Review Queue
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading flex items-center gap-2.5">
            <HardDrive className="w-7 h-7 text-primary-700" />
            Payment Proofs &amp; Google Drive Storage
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Zero-filesystem storage with OAuth 2.0 refresh authentication and automated Year/Month folders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestStorage}
            disabled={testing}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 h-9 font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Testing Drive..." : "Test Storage Connection"}
          </Button>
        </div>
      </div>

      {/* Public Permission Critical Warning */}
      {health?.hasPublicPermissions && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-950 text-xs sm:text-sm flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black text-sm block text-rose-900 uppercase tracking-wider">
              CRITICAL SECURITY WARNING: Root Google Drive Folder is Public!
            </span>
            <span className="text-rose-800 text-xs leading-relaxed block">
              The Google Drive folder has an active &quot;anyone with the link&quot; permission. Payment receipts contain sensitive personal banking screenshots. Open your dedicated Google Drive account immediately, click <strong>Share &gt; General access</strong>, and change it to <strong>Restricted</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Quota > 80% Warning */}
      {quotaPercent !== null && quotaPercent >= 80 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-amber-900">
              Google Drive Storage Near Capacity ({quotaPercent}%)
            </span>
            <span className="text-amber-800 text-xs block mt-0.5">
              Your Google Drive quota is at {quotaPercent}%. Please run retention cleanup or upgrade storage in the dedicated Google account.
            </span>
          </div>
        </div>
      )}

      {/* Metrics Row: Storage Health, Quota, Proofs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Health Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Storage Health
            </span>
            <Badge
              variant={health?.healthy ? "success" : "destructive"}
              className="text-xs font-bold capitalize"
            >
              {health?.healthy ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <div>
            <div className="text-xl font-black font-heading text-slate-900">
              {health?.healthy ? "Operational" : "Degraded"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Driver: <code className="font-mono font-bold text-slate-700">google-drive (v3)</code>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Ancestry Lock:</span>
              <strong className="text-emerald-700 font-semibold">Active (Descendant only)</strong>
            </div>
            <div className="flex justify-between">
              <span>Public Sharing:</span>
              <strong className={health?.hasPublicPermissions ? "text-rose-700 font-bold" : "text-emerald-700 font-semibold"}>
                {health?.hasPublicPermissions ? "Detected (Unsafe)" : "Private (Enforced)"}
              </strong>
            </div>
          </div>
        </div>

        {/* Quota Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Drive Quota
            </span>
            {quotaPercent !== null && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                quotaPercent >= 80 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
              }`}>
                {quotaPercent}% Used
              </span>
            )}
          </div>
          <div>
            <div className="text-xl font-black font-heading text-slate-900">
              {quota ? formatBytes(quota.usedBytes) : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Total Limit: {quota ? formatBytes(quota.totalBytes) : "15 GB standard"}
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                quotaPercent && quotaPercent >= 80 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(quotaPercent || 5, 100)}%` }}
            />
          </div>
        </div>

        {/* Proofs Ingestion Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Proof Records
            </span>
            <span className="text-xs font-bold bg-primary-50 text-primary-800 px-2 py-0.5 rounded">
              {stats?.totalProofs || 0} Total
            </span>
          </div>
          <div>
            <div className="text-xl font-black font-heading text-slate-900">
              {formatBytes(stats?.totalSizeBytes || 0)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {stats?.submittedProofs || 0} Awaiting review • {stats?.approvedProofs || 0} Approved
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Last Upload: </span>
            <strong className="text-slate-700">
              {data?.lastUpload?.uploaded_at
                ? new Date(data.lastUpload.uploaded_at).toLocaleString()
                : "No uploads yet"}
            </strong>
          </div>
        </div>
      </div>

      {/* Automatic Year/Month Folder Structure Preview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary-700" />
            Automatic Chronological Year &amp; Month Structure
          </h2>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
            Asia/Karachi Timezone
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Google Drive does not support virtual path prefixes. All uploads are sorted automatically into real Year and Month folders based on the upload timestamp converted to Pakistan Standard Time (PKT).
        </p>

        <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs space-y-1.5 shadow-inner">
          <div className="text-slate-400"># Current Active Upload Destination:</div>
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <span>ROOT_FOLDER /</span>
            <span className="bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              {data?.folderPreview || "2026/10-October"}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">(Lazy created on demand)</span>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold font-heading text-slate-900">Storage &amp; Retention Rules</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Set file size ceilings, retention time windows, and optional cryptographic encryption at rest.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Retention Setting */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Proof File Retention *
            </label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 font-semibold text-xs text-slate-800"
            >
              <option value={30}>30 Days after confirmation</option>
              <option value={90}>90 Days after confirmation (Default)</option>
              <option value={180}>180 Days after confirmation</option>
              <option value={365}>365 Days (1 Year)</option>
              <option value={0}>Never Delete (Keep permanently)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              The daily cron permanently deletes expired screenshot files from Google Drive while retaining minimal audit logs.
            </p>
          </div>

          {/* Max File Size */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Maximum Raw File Size *
            </label>
            <select
              value={maxFileSizeBytes}
              onChange={(e) => setMaxFileSizeBytes(Number(e.target.value))}
              className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 font-semibold text-xs text-slate-800"
            >
              <option value={2097152}>2 MB (Strict)</option>
              <option value={5242880}>5 MB (Recommended)</option>
              <option value={10485760}>10 MB (Large)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Client canvas compression resizes images to ~200 KB before upload to stay well under Vercel&apos;s 4.5 MB body limit.
            </p>
          </div>

          {/* Max Active Proofs per Pledge */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Max Active Proofs Per Pledge *
            </label>
            <select
              value={maxActiveProofs}
              onChange={(e) => setMaxActiveProofs(Number(e.target.value))}
              className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 font-semibold text-xs text-slate-800"
            >
              <option value={1}>1 Proof File Max</option>
              <option value={3}>Up to 3 Files (Default)</option>
              <option value={5}>Up to 5 Files</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Protects Google Drive from spam or excessive file creation on a single pledge.
            </p>
          </div>

          {/* Filename Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Drive Filename Pattern *
            </label>
            <select
              value={filenameMode}
              onChange={(e) => setFilenameMode(e.target.value as any)}
              className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 font-semibold text-xs text-slate-800"
            >
              <option value="reference">Reference Mode: GJTF-YYYY-NNNNNN_proof-1_timestamp.webp</option>
              <option value="random">Random Mode: {`{uuid}`}.webp</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Reference mode allows human admins to browse and search files directly in Google Drive without opening the app.
            </p>
          </div>
        </div>

        {/* Guest Uploads Toggle */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-bold text-xs text-slate-900 block">
              Allow Guest Uploads with Single-Pledge Tokens
            </span>
            <span className="text-[11px] text-slate-500">
              Guests can upload payment screenshots immediately via a signed 7-day token without registering an account.
            </span>
          </div>
          <input
            type="checkbox"
            checked={allowGuestUploads}
            onChange={(e) => setAllowGuestUploads(e.target.checked)}
            className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
          />
        </div>

        {/* Encryption at Rest Toggle with Trade-off Notice */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary-700" />
                Envelope Encryption at Rest (AES-256-GCM)
              </span>
              <span className="text-[11px] text-slate-500">
                Encrypt files using wrapped data keys before pushing to Google Drive.
              </span>
            </div>
            <input
              type="checkbox"
              checked={encryptionEnabled}
              onChange={(e) => setEncryptionEnabled(e.target.checked)}
              className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
            />
          </div>

          {/* Trade-off Explanation Box */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <Info className="w-4 h-4 text-blue-700 shrink-0" />
              Important Security Trade-Off Explained:
            </div>
            <ul className="list-disc pl-5 text-[11px] space-y-1 text-blue-900/90 leading-relaxed">
              <li>
                <strong>When Encryption is OFF (Default &amp; Recommended for Drive browsing):</strong> Admins can open and view screenshots directly inside the Google Drive web and mobile apps. Security is guaranteed by dedicating the Google account to proofs only and never sharing access publicly.
              </li>
              <li>
                <strong>When Encryption is ON:</strong> Files in Google Drive are stored as scrambled <code>.bin</code> ciphertext. Screenshots cannot be previewed in Google Drive and can <strong>only</strong> be viewed inside the foundation&apos;s admin panel.
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="rounded-xl text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-6 h-10 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Settings...
              </>
            ) : (
              "Save Storage Configuration"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
