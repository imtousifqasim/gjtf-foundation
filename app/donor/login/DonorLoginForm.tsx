"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loginWithPasswordAction,
  requestMagicLinkAction,
  verifyMagicLinkOrOtpAction,
} from "@/app/actions/donorAuth";
import { getSafeRedirectUrl } from "@/lib/auth/security";

export default function DonorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const rawNext = searchParams.get("next") || searchParams.get("redirectTo");
  const safeRedirectTo = getSafeRedirectUrl(rawNext, "/donor/dashboard");

  const [activeTab, setActiveTab] = React.useState<"password" | "magic">("password");

  // Password Login state
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordLoading, setPasswordLoading] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  // Magic Link / OTP state
  const [magicEmail, setMagicEmail] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");
  const [magicSent, setMagicSent] = React.useState(false);
  const [magicLoading, setMagicLoading] = React.useState(false);
  const [magicFeedback, setMagicFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto-verify if token is present in URL
  React.useEffect(() => {
    if (tokenFromUrl && tokenFromUrl.length >= 32) {
      setPasswordLoading(true);
      verifyMagicLinkOrOtpAction({ token: tokenFromUrl }).then((res) => {
        if (res.success) {
          router.push(safeRedirectTo);
          router.refresh();
        } else {
          setPasswordLoading(false);
          setPasswordError(res.message || "Invalid or expired login link.");
        }
      });
    }
  }, [tokenFromUrl, router, safeRedirectTo]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);

    const res = await loginWithPasswordAction({ email, password });
    if (res.success) {
      router.push(safeRedirectTo);
      router.refresh();
    } else {
      setPasswordLoading(false);
      setPasswordError(res.message || "Failed to sign in. Please verify your details.");
    }
  };

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail.trim()) return;

    setMagicLoading(true);
    setMagicFeedback(null);

    const res = await requestMagicLinkAction(magicEmail);
    setMagicLoading(false);
    if (res.success) {
      setMagicSent(true);
      setMagicFeedback({ type: "success", message: res.message });
    } else {
      setMagicFeedback({ type: "error", message: res.message });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    setMagicLoading(true);
    setMagicFeedback(null);

    const res = await verifyMagicLinkOrOtpAction({ otp: otpCode, email: magicEmail });
    if (res.success) {
      router.push(safeRedirectTo);
      router.refresh();
    } else {
      setMagicLoading(false);
      setMagicFeedback({ type: "error", message: res.message });
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200 shadow-2xl text-slate-900 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
          Donor Portal Login
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Access your personal tax receipts, pledges, and impact timeline.
        </p>
      </div>

      {/* Login Mode Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => {
            setActiveTab("password");
            setPasswordError(null);
          }}
          className={`py-2.5 rounded-xl transition-all ${
            activeTab === "password"
              ? "bg-white text-slate-950 shadow-sm"
              : "hover:text-slate-900"
          }`}
        >
          Password Login
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("magic");
            setMagicFeedback(null);
          }}
          className={`py-2.5 rounded-xl transition-all ${
            activeTab === "magic"
              ? "bg-white text-slate-950 shadow-sm"
              : "hover:text-slate-900"
          }`}
        >
          Fast Login (Email OTP)
        </button>
      </div>

      {/* Tab 1: Password Login Form */}
      {activeTab === "password" && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          {passwordError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <Input
                type="email"
                required
                placeholder="donor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <Link
                href="/donor/forgot-password"
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 rounded-xl text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={passwordLoading}
            className="w-full h-11 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md text-sm"
          >
            {passwordLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Verifying Credentials...
              </>
            ) : (
              <>
                Sign In to Dashboard &rarr;
              </>
            )}
          </Button>
        </form>
      )}

      {/* Tab 2: Fast Magic Link & 6-Digit OTP */}
      {activeTab === "magic" && (
        <div className="space-y-4">
          {magicFeedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border ${
                magicFeedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {magicFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span>{magicFeedback.message}</span>
            </div>
          )}

          {!magicSent ? (
            <form onSubmit={handleRequestMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Your Registered Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder="donor@example.com"
                    value={magicEmail}
                    onChange={(e) => setMagicEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={magicLoading}
                className="w-full h-11 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md text-sm"
              >
                {magicLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending Code &amp; Link...
                  </>
                ) : (
                  <>
                    Send Login Code &amp; 1-Click Link &rarr;
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Enter 6-Digit Code (Sent to your email)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <Input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="pl-10 h-12 rounded-xl text-center text-lg font-mono font-bold tracking-widest"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={magicLoading || otpCode.length < 6}
                className="w-full h-11 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md text-sm"
              >
                {magicLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Verifying Code...
                  </>
                ) : (
                  "Confirm & Open Dashboard"
                )}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMagicSent(false)}
                  className="text-xs text-slate-500 hover:text-slate-900 underline"
                >
                  Resend code or change email address
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Footer link to Donate Now */}
      <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        <span>Making your first pledge? </span>
        <Link href="/donate-now" className="font-bold text-emerald-700 hover:underline">
          Donate on the Public Form &rarr;
        </Link>
      </div>
    </div>
  );
}
