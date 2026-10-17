"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Lock,
  Phone,
  Mail,
  Shield,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getDonorDashboardDataAction,
} from "@/app/actions/donorPortal";
import {
  updateDonorProfileAction,
  changeDonorPasswordAction,
  exportMyDonorDataAction,
  requestDonorDeletionAction,
} from "@/app/actions/donorAuth";

export default function DonorProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [donor, setDonor] = React.useState<any>(null);

  // Profile Form state
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [prefersAnonymous, setPrefersAnonymous] = React.useState(false);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [profileMsg, setProfileMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [changingPassword, setChangingPassword] = React.useState(false);
  const [passwordMsg, setPasswordMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Export & Deletion state
  const [exporting, setExporting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await getDonorDashboardDataAction();
        if (res && res.donor) {
          setDonor(res.donor);
          setName(res.donor.name || "");
          setPhone(res.donor.phone || "");
          setPrefersAnonymous(Boolean(res.donor.prefers_anonymous));
        } else if (res && res.unauthorized) {
          router.push("/donor/login");
        }
        setLoading(false);
      } catch (err) {
        router.push("/donor/login");
      }
    }
    load();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    const res = await updateDonorProfileAction({
      name,
      phone,
      prefers_anonymous: prefersAnonymous,
    });

    setSavingProfile(false);
    if (res.success) {
      setProfileMsg({ type: "success", text: res.message });
    } else {
      setProfileMsg({ type: "error", text: res.message });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setChangingPassword(true);
    setPasswordMsg(null);

    const res = await changeDonorPasswordAction({
      currentPassword,
      newPassword,
    });

    setChangingPassword(false);
    if (res.success) {
      setPasswordMsg({ type: "success", text: res.message });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMsg({ type: "error", text: res.message });
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    const res = await exportMyDonorDataAction();
    setExporting(false);

    if (res.success && res.data) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `GJTF_My_Data_${donor.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      "Type 'DELETE' in capital letters to confirm permanent anonymization of your donor profile. Your financial pledge history will remain anonymized for foundation audit regulations."
    );
    if (confirmation !== "DELETE") return;

    setDeleting(true);
    await requestDonorDeletionAction();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
          Profile &amp; Privacy Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your contact information, security credentials, and data privacy options.
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-900">
              Personal Contact Details
            </h2>
            <p className="text-xs text-slate-500">
              Used for official donation receipts and doorstep collection confirmation.
            </p>
          </div>
        </div>

        {profileMsg && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
              profileMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {profileMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Full Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Registered Email (Verified)
              </label>
              <Input
                value={donor.email}
                disabled
                className="h-11 rounded-xl text-sm bg-slate-50 text-slate-500 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone / WhatsApp Number
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567 or +923001234567"
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Country
              </label>
              <Input
                value={donor.country || "Pakistan"}
                disabled
                className="h-11 rounded-xl text-sm bg-slate-50 text-slate-500"
              />
            </div>
          </div>

          {/* Anonymity Checkbox */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="anon-check"
              checked={prefersAnonymous}
              onChange={(e) => setPrefersAnonymous(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <label htmlFor="anon-check" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
              <strong className="block font-bold text-slate-900 mb-0.5">
                Keep My Donations Strictly Anonymous
              </strong>
              Your name will never appear on any public foundation updates, annual donor lists, or reports. Emails will address you as &ldquo;Generous Donor&rdquo;.
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={savingProfile}
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-900">
              Update Password
            </h2>
            <p className="text-xs text-slate-500">
              Keep your account secure with a strong password.
            </p>
          </div>
        </div>

        {passwordMsg && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
              passwordMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {passwordMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Current Password
            </label>
            <Input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-11 rounded-xl text-sm max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                New Password
              </label>
              <Input
                type="password"
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Confirm New Password
              </label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
              className="rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
            >
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Change Password
            </Button>
          </div>
        </form>
      </div>

      {/* Data Privacy & GDPR Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-900">
              Data Privacy &amp; Data Rights
            </h2>
            <p className="text-xs text-slate-500">
              Zero-Trust architecture. You own your data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export My Data */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Export Personal Data</h3>
              <p className="text-slate-500 leading-relaxed">
                Download a machine-readable JSON copy of all your profile information, pledges, and monthly plans.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={exporting}
              onClick={handleExportData}
              className="rounded-xl text-xs font-bold w-fit"
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Download className="w-3.5 h-3.5 mr-1" />}
              Download JSON Export
            </Button>
          </div>

          {/* Delete / Anonymize Account */}
          <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-200 flex flex-col justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-rose-950 mb-1">Delete / Anonymize Account</h3>
              <p className="text-rose-800/80 leading-relaxed">
                Permanently scrub your name, phone, and password from our active databases (Right to be Forgotten).
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={deleting}
              onClick={handleDeleteAccount}
              className="rounded-xl text-xs font-bold border-rose-300 text-rose-800 hover:bg-rose-100 w-fit"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
              Request Account Deletion
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
