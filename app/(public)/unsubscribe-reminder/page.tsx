import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Unsubscribe From Reminders | GJTF Foundation",
  description: "Manage your reminder preferences for Ghais Jhuggi Taleem Foundation pledges.",
};

export default async function UnsubscribeReminderPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;
  const isSuccess = success === "true";

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-slate-900">
              Reminders Stopped
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              You have successfully opted out of automated reminder notifications for this donation pledge. 
              No further emails will be sent for this pledge.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-slate-900">
              Notice
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {error === "missing_token"
                ? "The unsubscribe link appears incomplete or invalid."
                : "This reminder schedule may have already been cancelled or completed."}
            </p>
          </>
        )}

        <div className="pt-4 border-t border-slate-100">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
