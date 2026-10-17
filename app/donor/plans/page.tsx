"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarClock,
  Calendar,
  CheckCircle2,
  PauseCircle,
  XCircle,
  PlayCircle,
  Edit2,
  Loader2,
  Heart,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getDonorDashboardDataAction,
  updateMonthlyPlanAction,
} from "@/app/actions/donorPortal";

export default function DonorPlansPage() {
  const [loading, setLoading] = React.useState(true);
  const [plans, setPlans] = React.useState<any[]>([]);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Edit Amount Modal
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState<any>(null);
  const [newAmount, setNewAmount] = React.useState<string>("");

  const loadPlans = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDonorDashboardDataAction();
      setPlans(res.plans || []);
    } catch {}
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handlePause = async (planId: string) => {
    if (!confirm("Are you sure you want to pause your monthly sponsorship for 30 days?")) return;
    setActionLoading(planId);
    setFeedback(null);
    const res = await updateMonthlyPlanAction({ planId, action: "pause" });
    setActionLoading(null);
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      loadPlans();
    } else {
      setFeedback({ type: "error", message: res.message });
    }
  };

  const handleResume = async (planId: string) => {
    setActionLoading(planId);
    setFeedback(null);
    const res = await updateMonthlyPlanAction({ planId, action: "resume" });
    setActionLoading(null);
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      loadPlans();
    } else {
      setFeedback({ type: "error", message: res.message });
    }
  };

  const handleCancel = async (planId: string) => {
    if (!confirm("Are you sure you want to cancel this monthly commitment? You can always create a new one anytime.")) return;
    setActionLoading(planId);
    setFeedback(null);
    const res = await updateMonthlyPlanAction({ planId, action: "cancel" });
    setActionLoading(null);
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      loadPlans();
    } else {
      setFeedback({ type: "error", message: res.message });
    }
  };

  const handleOpenEditAmount = (plan: any) => {
    setEditingPlan(plan);
    setNewAmount(String(plan.amount));
    setEditModalOpen(true);
  };

  const handleSaveAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    const amt = Number(newAmount);
    if (!amt || amt < 500) {
      alert("Minimum amount is 500.");
      return;
    }

    setActionLoading(editingPlan.id);
    const res = await updateMonthlyPlanAction({
      planId: editingPlan.id,
      action: "change_amount",
      newAmount: amt,
    });
    setActionLoading(null);
    setEditModalOpen(false);

    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      loadPlans();
    } else {
      setFeedback({ type: "error", message: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Monthly Education Sponsorships
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Continuous monthly gifts that sustain classrooms and student kits every month.
          </p>
        </div>

        <Link href="/donate-now">
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm">
            <Heart className="w-3.5 h-3.5 mr-1.5 fill-current" />
            Start a Monthly Sponsorship
          </Button>
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
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Plans List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading your commitments...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <CalendarClock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Active Monthly Plans</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not currently have any monthly education commitments. Starting a recurring gift provides ongoing school books, uniforms, and warm meals to slum children.
          </p>
          <div className="pt-2">
            <Link href="/donate-now">
              <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl">
                Sponsor Monthly from PKR 5,000 &rarr;
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-sm transition-all ${
                plan.status === "active"
                  ? "border-emerald-200/80 ring-1 ring-emerald-500/10"
                  : plan.status === "paused"
                  ? "border-amber-200 bg-amber-50/20"
                  : "border-slate-200 opacity-75"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        plan.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : plan.status === "paused"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {plan.status === "active"
                        ? "Active Recurring Commitment"
                        : plan.status === "paused"
                        ? `Paused until ${plan.pause_until || "further notice"}`
                        : "Cancelled"}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {plan.donation_type}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    {plan.cause}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>
                      Billing Day: <strong>Day {plan.billing_day}</strong> of every month
                    </span>
                    <span>&bull;</span>
                    <span>
                      Next Due Date:{" "}
                      <strong className="text-slate-900">{plan.next_due_date}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Cycles Completed:{" "}
                      <strong className="text-emerald-700">{plan.cycles_completed} month(s)</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                    {plan.currency} {Number(plan.amount).toLocaleString()}{" "}
                    <span className="text-xs text-slate-500 font-sans font-normal">/ month</span>
                  </div>

                  {plan.status !== "cancelled" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditAmount(plan)}
                        className="h-8 rounded-xl text-xs font-semibold"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        Change Amount
                      </Button>

                      {plan.status === "active" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === plan.id}
                          onClick={() => handlePause(plan.id)}
                          className="h-8 rounded-xl text-xs font-semibold text-amber-800 hover:bg-amber-50 border-amber-200"
                        >
                          <PauseCircle className="w-3.5 h-3.5 mr-1" />
                          Pause 30 Days
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={actionLoading === plan.id}
                          onClick={() => handleResume(plan.id)}
                          className="h-8 rounded-xl text-xs font-semibold bg-emerald-700 text-white"
                        >
                          <PlayCircle className="w-3.5 h-3.5 mr-1" />
                          Resume Plan
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCancel(plan.id)}
                        className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Amount Modal */}
      {editModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-heading text-slate-900">
                Update Monthly Amount
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Your new commitment amount will automatically take effect from your next billing cycle on <strong>{editingPlan.next_due_date}</strong>.
            </p>

            <form onSubmit={handleSaveAmount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Monthly Commitment ({editingPlan.currency})
                </label>
                <Input
                  type="number"
                  min="500"
                  step="100"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="h-11 rounded-xl text-base font-bold font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading === editingPlan.id}
                  className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  Save New Amount
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
