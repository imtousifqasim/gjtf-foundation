"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserCheck,
  Mail,
  Phone,
  Globe,
  Heart,
  CalendarClock,
  Clock,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldAlert,
  Loader2,
  FileText,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAdminDonorDetailAction,
  adminTriggerPasswordResetAction,
  adminToggleDonorBlockAction,
} from "@/app/actions/adminDonors";

export default function AdminDonorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const donorId = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadDetails = React.useCallback(async () => {
    setLoading(true);
    const res = await getAdminDonorDetailAction(donorId);
    if (res.success) {
      setData(res);
    }
    setLoading(false);
  }, [donorId]);

  React.useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleTriggerReset = async () => {
    if (!confirm(`Are you sure you want to dispatch a password reset link to ${data.donor.email}?`)) return;
    setActionLoading(true);
    setFeedback(null);
    const res = await adminTriggerPasswordResetAction(donorId);
    setActionLoading(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      loadDetails();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  const handleToggleBlock = async () => {
    const newStatus = data.donor.status === "active" ? "blocked" : "active";
    if (!confirm(`Are you sure you want to change this donor's status to ${newStatus}?`)) return;
    setActionLoading(true);
    setFeedback(null);
    const res = await adminToggleDonorBlockAction(donorId, newStatus);
    setActionLoading(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      loadDetails();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Loading donor profile &amp; audit history...</p>
      </div>
    );
  }

  if (!data || !data.donor) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Donor Not Found</h2>
        <Link href="/admin/donors">
          <Button variant="outline" className="rounded-xl text-xs font-bold">
            &larr; Back to Donors Directory
          </Button>
        </Link>
      </div>
    );
  }

  const { donor, donations, plans, emailLogs } = data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/donors"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Donors List</span>
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Donor Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  donor.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}
              >
                {donor.status}
              </span>
              {donor.prefers_anonymous && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  Anonymous Supporter
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              {donor.name || "Anonymous Donor"}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              ID: {donor.id} &bull; Registered: {new Date(donor.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              disabled={actionLoading}
              onClick={handleTriggerReset}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              Dispatch Password Reset Link
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={actionLoading}
              onClick={handleToggleBlock}
              className={`rounded-xl text-xs font-bold gap-1.5 ${
                donor.status === "active"
                  ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {donor.status === "active" ? "Block Account" : "Unblock Account"}
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-slate-400 font-semibold block">Email Address</span>
            <div className="font-mono text-slate-900 font-bold">{donor.email}</div>
            <div className="text-[11px] text-emerald-700">
              {donor.email_verified_at ? "✓ Email Verified" : "○ Unverified Intent"}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-slate-400 font-semibold block">Phone / WhatsApp</span>
            <div className="font-mono text-slate-900 font-bold">{donor.phone || "Not provided"}</div>
            <div className="text-[11px] text-slate-500">Country: {donor.country || "Pakistan"}</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-slate-400 font-semibold block">Activity Records</span>
            <div className="font-bold text-slate-900">{donations.length} total pledge(s)</div>
            <div className="text-[11px] text-slate-500">
              Last Login: {donor.last_login_at ? new Date(donor.last_login_at).toLocaleDateString() : "Never"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Pledges, Monthly Plans, Communication Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Pledges */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary-600" />
              Donation Pledges ({donations.length})
            </h3>
          </div>

          {donations.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-4">No pledges logged.</p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 text-xs">
              {donations.map((d: any) => (
                <div
                  key={d.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900 text-[11px]">
                      {d.reference_no || d.id}
                    </div>
                    <div className="text-slate-700 font-semibold">{d.cause}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(d.created_at).toLocaleString()} &bull; {d.donation_type}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-800 font-mono text-sm">
                      {d.currency} {Number(d.amount).toLocaleString()}
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        d.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : d.status === "failed"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Plans & Email Communications */}
        <div className="space-y-6">
          {/* Monthly Commitment Plans */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CalendarClock className="w-4 h-4 text-emerald-600" />
              Monthly Commitments ({plans.length})
            </h3>

            {plans.length === 0 ? (
              <p className="text-slate-400 text-xs italic py-2">No recurring plans active.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {plans.map((p: any) => (
                  <div key={p.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{p.cause}</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {p.currency} {Number(p.amount).toLocaleString()} / mo
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Status: <strong className="capitalize">{p.status}</strong> &bull; Billing Day {p.billing_day} &bull; Next: {p.next_due_date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Communications Log */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Mail className="w-4 h-4 text-slate-600" />
              Recent Automated Emails ({emailLogs.length})
            </h3>

            {emailLogs.length === 0 ? (
              <p className="text-slate-400 text-xs italic py-2">No email records found.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                {emailLogs.map((log: any) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center gap-2">
                    <div className="truncate">
                      <span className="font-semibold text-slate-800 block truncate">{log.subject}</span>
                      <span className="text-[10px] text-slate-400">
                        {log.email_type} &bull; {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        log.status === "sent" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
