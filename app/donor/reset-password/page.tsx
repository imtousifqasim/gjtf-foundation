"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordWithTokenAction } from "@/app/actions/donorAuth";

function DonorResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Real-time strength checks
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg("Missing or invalid reset token. Please request a new password reset link.");
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumberOrSymbol) {
      setErrorMsg("Please satisfy all password security requirements.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await resetPasswordWithTokenAction({
      token,
      newPassword,
    });

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/donor/dashboard");
      }, 1500);
    } else {
      setSubmitting(false);
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200 shadow-2xl text-slate-900 space-y-6">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
          Choose a New Password
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Create a secure password for your GJTF Supporter Portal account.
        </p>
      </div>

      {success ? (
        <div className="space-y-4 text-center py-6 animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Password Reset Complete!</h2>
          <p className="text-xs text-slate-600">
            Logging you in and redirecting to your private dashboard...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <Input
                type="password"
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 h-11 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <Input
                type="password"
                required
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-11 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Password Strength Checklist */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
            <div className={`flex items-center gap-2 ${hasMinLength ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
              <span>{hasMinLength ? "✓" : "○"}</span>
              <span>Minimum 8 characters</span>
            </div>
            <div className={`flex items-center gap-2 ${hasLetter ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
              <span>{hasLetter ? "✓" : "○"}</span>
              <span>Contains at least one letter</span>
            </div>
            <div className={`flex items-center gap-2 ${hasNumberOrSymbol ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
              <span>{hasNumberOrSymbol ? "✓" : "○"}</span>
              <span>Contains at least one number or special character</span>
            </div>
            {confirmPassword.length > 0 && (
              <div className={`flex items-center gap-2 ${passwordsMatch ? "text-emerald-700 font-bold" : "text-rose-600"}`}>
                <span>{passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting || !hasMinLength || !passwordsMatch}
            className="w-full h-11 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Updating Password...
              </>
            ) : (
              "Save Password &amp; Open Dashboard &rarr;"
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link
              href="/donor/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Donor Login</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function DonorResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
        </div>
      }
    >
      <DonorResetPasswordForm />
    </React.Suspense>
  );
}
