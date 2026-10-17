import * as React from "react";
import Link from "next/link";
import { FileQuestion, Home, Heart, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full inline-block">
            Page Not Found (404)
          </span>
          <h1 className="text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
            Record or Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            The page, receipt, or donation reference you requested does not exist or may have been moved. If you are looking for an official receipt, please check your reference number or sign in to your donor portal.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-10 px-5 gap-1.5 shadow-sm"
            >
              <Home className="w-3.5 h-3.5" />
              Return Home
            </Button>
          </Link>

          <Link href="/donor/login" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-700 font-bold text-xs h-10 px-5 gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              Donor Login
            </Button>
          </Link>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <Link href="/donate-now" className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 fill-current" /> Make a Donation for Nomadic Children &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
