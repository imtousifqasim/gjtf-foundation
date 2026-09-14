"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, ArrowRight, Shield, AlertCircle, Loader2, KeyRound, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { verifyRecoveryCodeAction, updateAdminCredentialsAction } from "@/app/actions/security";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const redirectTo = searchParams.get("redirectTo") || "/admin";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    errorParam === "unauthorized" ? "Access denied. Only registered admins can access this area." : null
  );

  // 2FA Recovery Modal state
  const [recoveryOpen, setRecoveryOpen] = React.useState(false);
  const [recoveryTab, setRecoveryTab] = React.useState<"totp" | "backup">("totp");
  const [totpInput, setTotpInput] = React.useState("");
  const [recoveryCode, setRecoveryCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [recoveryLoading, setRecoveryLoading] = React.useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleVerify2FACode = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeToVerify = recoveryTab === "totp" ? totpInput.trim() : recoveryCode.trim();
    if (!codeToVerify) return;

    setRecoveryLoading(true);
    setRecoveryFeedback(null);

    const res = await verifyRecoveryCodeAction(codeToVerify);

    if (res.success) {
      if (newPassword.trim() && res.adminEmail) {
        await updateAdminCredentialsAction({
          email: res.adminEmail,
          password: newPassword.trim(),
        });
      }

      setRecoveryFeedback({
        type: "success",
        message: newPassword.trim()
          ? "Code verified and password updated! Redirecting to Dashboard..."
          : "Security code verified! Redirecting to Dashboard...",
      });

      setTimeout(() => {
        router.push(redirectTo);
      }, 1000);
    } else {
      setRecoveryLoading(false);
      setRecoveryFeedback({ type: "error", message: res.message });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const isConfigured = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-gjtf.supabase.co"
      );

      if (!isConfigured) {
        // In local mock mode, allow direct login
        setTimeout(() => {
          router.push(redirectTo);
        }, 500);
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Failed to sign in.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-block bg-white p-3 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <Image
            src="/images/Ghais-Jhuggi-Taleeem-Foundation-Logo.webp"
            alt="GJTF Logo"
            width={240}
            height={65}
            className="h-14 w-auto mx-auto object-contain"
            priority
          />
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
          GJTF Admin Portal
        </h2>
        <p className="text-sm text-slate-600">
          Secure staff login for managing donations, messages, and schools
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-charcoal-muted" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gjtfoundation.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-charcoal">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setRecoveryOpen(true)}
                  className="text-xs font-semibold text-primary-700 hover:underline"
                >
                  Forgot or 2FA Code?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-charcoal-muted" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-soft hover:shadow-soft-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs font-medium text-charcoal-muted hover:text-primary-700 transition-colors"
          >
            ← Return to Public Website
          </Link>
        </div>
      </div>

      {/* 2FA Security Verification & Password Reset Dialog */}
      <Dialog
        open={recoveryOpen}
        onOpenChange={setRecoveryOpen}
        contentClassName="max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl"
      >
        <div className="space-y-4 text-left">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center border border-primary-200 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold font-heading text-slate-900">
                  2FA Verification & Recovery
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Verify with your 6-digit Authenticator code or Emergency Backup code.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Toggle Tabs: 6-Digit Authenticator vs Backup Code */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setRecoveryTab("totp");
                setRecoveryFeedback(null);
              }}
              className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                recoveryTab === "totp"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-primary-600" />
              <span>6-Digit TOTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRecoveryTab("backup");
                setRecoveryFeedback(null);
              }}
              className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                recoveryTab === "backup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Backup Code</span>
            </button>
          </div>

          {recoveryFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                recoveryFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {recoveryFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{recoveryFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleVerify2FACode} className="space-y-4">
            {recoveryTab === "totp" ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Enter 6-Digit Authenticator Code *
                </label>
                <p className="text-[11px] text-slate-500">
                  Open Google Authenticator, Microsoft Authenticator, or Authy on your phone.
                </p>
                <Input
                  required
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000 000"
                  value={totpInput}
                  onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ""))}
                  className="rounded-xl font-mono text-center font-extrabold text-xl tracking-[0.35em] h-12 border-slate-200 focus:border-primary-500"
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Enter Emergency Backup Code *
                </label>
                <p className="text-[11px] text-slate-500">
                  Enter one of the emergency recovery codes saved from your Admin Settings.
                </p>
                <Input
                  required
                  type="text"
                  placeholder="e.g. GJTF-7821-9941"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  className="rounded-xl font-mono text-center font-bold text-sm tracking-wider h-11 border-slate-200 uppercase"
                  autoFocus
                />
              </div>
            )}

            {/* Optional Password Reset field */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Set New Password <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <Input
                type="password"
                placeholder="Leave blank to keep existing password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl text-xs border-slate-200"
              />
              <p className="text-[10px] text-slate-400">
                If you forgot your password, entering a new one here updates it upon verification.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRecoveryOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={
                  recoveryLoading ||
                  (recoveryTab === "totp" ? totpInput.length !== 6 : !recoveryCode.trim())
                }
              >
                {recoveryLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5 mr-1.5" />
                    Verify & Sign In
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-warm-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" />
        </div>
      }
    >
      <AdminLoginForm />
    </React.Suspense>
  );
}
