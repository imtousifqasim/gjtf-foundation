"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/app/actions/donorAuth";

export default function DonorForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    const res = await requestPasswordResetAction(email);
    setSubmitting(false);
    setSubmitted(true);
    setMessage(res.message);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200 shadow-2xl text-slate-900 space-y-6">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
          Forgot Password
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your registered donor email and we will send you a secure password reset link.
        </p>
      </div>

      {submitted ? (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {message || "If this email is registered with us, a password reset link has been dispatched to your inbox."}
          </p>
          <div className="pt-2">
            <Link href="/donor/login">
              <Button variant="outline" className="rounded-xl w-full text-xs font-bold">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Donor Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Registered Email Address
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

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Dispatching Reset Link...
              </>
            ) : (
              "Send Reset Link &rarr;"
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
