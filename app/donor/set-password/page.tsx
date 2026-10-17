"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setPasswordFromWelcomeAction } from "@/app/actions/donorAuth";

function DonorSetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg("Missing or invalid activation token. Please request a new link via Forgot Password.");
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumberOrSymbol) {
      setErrorMsg("Please ensure password satisfies all security requirements.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await setPasswordFromWelcomeAction({
      token,
      password,
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
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          First-Time Account Setup
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
          Welcome to GJTF Foundation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Set a secure password to activate your personal dashboard and access your pledges and donation receipts.
        </p>
      </div>

      {success ? (
        <div className="space-y-4 text-center py-6 animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Account Activated!</h2>
          <p className="text-xs text-slate-600">
            Linking your pledges and redirecting to your private supporter dashboard...
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
              Choose Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <Input
                type="password"
                required
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Confirm Password
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

          {/* Strength Checklist */}
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
              <span>Contains at least one number or special symbol</span>
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
                Activating Account...
              </>
            ) : (
              "Activate Account &amp; Access Dashboard &rarr;"
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link href="/donor/login" className="text-xs text-slate-500 hover:text-slate-900 font-semibold">
              Already have an account? Sign in here
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function DonorSetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
        </div>
      }
    >
      <DonorSetPasswordForm />
    </React.Suspense>
  );
}
