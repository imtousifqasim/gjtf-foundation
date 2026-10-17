"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log exception to console for observability
    console.error("[GJTF Runtime Exception Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
            Unexpected Client Issue
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We encountered a temporary issue while loading this view. You can reload the component or navigate back to the home page.
          </p>
          {error?.digest && (
            <p className="text-[11px] font-mono text-slate-400">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-10 px-5 gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-700 font-bold text-xs h-10 px-5 gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              Return Home
            </Button>
          </Link>
        </div>

        <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
          Need assistance?{" "}
          <Link href="/contact-us" className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1">
            <Mail className="w-3 h-3" /> Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
