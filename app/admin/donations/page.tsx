"use client";

import * as React from "react";
import Link from "next/link";
import {
  Heart,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Trash2,
  Loader2,
  Bell,
  Calendar,
  Send,
  ExternalLink,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Image as ImageIcon,
  Folder,
  Copy,
  Check,
} from "lucide-react";
import {
  updateDonationStatus,
  deleteDonation,
  getDonationProofsAdminAction,
  confirmDonationWithProofAction,
  rejectPaymentProofAdminAction,
  deletePaymentProofAdminAction,
  getActiveBankAccountsAction,
} from "@/app/actions/admin";
import {
  setDonationReminderAction,
  getDonationReminderStatusAction,
  cancelDonationReminderAction,
  sendDonationReminderNowAction,
} from "@/app/actions/emails";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProofViewerModal } from "@/components/donations/ProofViewerModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface DonationRecord {
  id: string;
  reference_no?: string | null;
  created_at: string;
  cause: string;
  frequency: string;
  currency: string;
  amount: number;
  donation_type: string;
  country: string;
  donor_name: string | null;
  donor_email: string | null;
  donor_phone: string | null;
  status: "pending" | "completed" | "failed";
  proof_status?: "none" | "submitted" | "approved" | "rejected";
  bank_transaction_ref?: string | null;
  bank_account_id?: string | null;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
  paid_at?: string | null;
  payment_reference: string | null;
}

export default function AdminDonationsPage() {
  const [donations, setDonations] = React.useState<DonationRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("All");
  const [proofFilter, setProofFilter] = React.useState<string>("All");
  const [causeFilter, setCauseFilter] = React.useState<string>("All");
  const [selectedDonation, setSelectedDonation] = React.useState<DonationRecord | null>(null);
  const [donationToDelete, setDonationToDelete] = React.useState<string | null>(null);

  // Proof & Verification State
  const [proofsList, setProofsList] = React.useState<any[]>([]);
  const [proofsLoading, setProofsLoading] = React.useState(false);
  const [duplicateWarnings, setDuplicateWarnings] = React.useState<any[]>([]);
  const [viewerProof, setViewerProof] = React.useState<any | null>(null);

  // Verification Confirm Modal State
  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [confirmAmount, setConfirmAmount] = React.useState<number>(0);
  const [confirmBankAccountId, setConfirmBankAccountId] = React.useState<string>("");
  const [confirmBankRef, setConfirmBankRef] = React.useState<string>("");
  const [confirmDate, setConfirmDate] = React.useState<string>("");
  const [confirmAdminNote, setConfirmAdminNote] = React.useState<string>("");
  const [isConfirming, setIsConfirming] = React.useState(false);

  // Reject Proof Modal State
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState<string>("");
  const [selectedRejectProofId, setSelectedRejectProofId] = React.useState<string | null>(null);
  const [isRejecting, setIsRejecting] = React.useState(false);

  // Bank Accounts
  const [bankAccounts, setBankAccounts] = React.useState<any[]>([]);
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Reminder Modal State
  const [reminderPledge, setReminderPledge] = React.useState<DonationRecord | null>(null);
  const [existingReminder, setExistingReminder] = React.useState<any | null>(null);
  const [quickDays, setQuickDays] = React.useState<number>(3);
  const [customDateTime, setCustomDateTime] = React.useState<string>("");
  const [useCustomDate, setUseCustomDate] = React.useState(false);
  const [repeatDays, setRepeatDays] = React.useState<number>(0);
  const [maxReminders, setMaxReminders] = React.useState<number>(1);
  const [customReminderMsg, setCustomReminderMsg] = React.useState<string>("");
  const [savingReminder, setSavingReminder] = React.useState(false);
  const [sendingReminderNow, setSendingReminderNow] = React.useState(false);

  // Toast State
  const [toast, setToast] = React.useState<{ text: string; type: "success" | "error" } | null>(null);
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data/donations", {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setDonations(json.data);
        }
      }
    } catch (err) {
      console.error("Hostinger MySQL load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Load proofs and bank accounts whenever selectedDonation changes
  React.useEffect(() => {
    if (selectedDonation) {
      setProofsLoading(true);
      getDonationProofsAdminAction(selectedDonation.id).then((res) => {
        if (res.success) {
          setProofsList(res.proofs || []);
          setDuplicateWarnings(res.duplicates || []);
        } else {
          setProofsList([]);
          setDuplicateWarnings([]);
        }
        setProofsLoading(false);
      });

      if (bankAccounts.length === 0) {
        getActiveBankAccountsAction().then((res) => {
          if (res.success && res.accounts.length > 0) {
            setBankAccounts(res.accounts);
          }
        });
      }
    } else {
      setProofsList([]);
      setDuplicateWarnings([]);
    }
  }, [selectedDonation, bankAccounts.length]);

  const handleOpenConfirmModal = (donation: DonationRecord) => {
    setConfirmAmount(donation.amount);
    const defaultAcc = bankAccounts.find((b: any) => b.is_active) || bankAccounts[0];
    setConfirmBankAccountId(donation.bank_account_id || defaultAcc?.id || "");
    const latestProof = proofsList[0];
    setConfirmBankRef(donation.bank_transaction_ref || latestProof?.transaction_ref || "");
    setConfirmDate(new Date().toISOString().split("T")[0]);
    setConfirmAdminNote("");
    setConfirmModalOpen(true);
  };

  const handleExecuteConfirm = async () => {
    if (!selectedDonation) return;

    const defaultAcc = bankAccounts.find((b: any) => b.is_active) || bankAccounts[0];
    const finalBankAccId = confirmBankAccountId || defaultAcc?.id || "bank-islami-primary";
    const autoRef = confirmBankRef.trim() || `SYS-INV-${selectedDonation.reference_no || selectedDonation.id.slice(0, 8).toUpperCase()}`;

    setIsConfirming(true);
    const res = await confirmDonationWithProofAction({
      donationId: selectedDonation.id,
      receivedAmount: confirmAmount,
      bankAccountId: finalBankAccId,
      bankTransactionRef: autoRef,
      confirmationDate: confirmDate,
      adminNote: confirmAdminNote.trim() || undefined,
    });
    setIsConfirming(false);

    if (res.success) {
      showToast(`Donation confirmed! Official receipt ${res.receiptNo ? `#${res.receiptNo}` : ""} generated and emailed to donor.`, "success");
      setConfirmModalOpen(false);
      setDonations((prev) =>
        prev.map((d) =>
          d.id === selectedDonation.id
            ? {
                ...d,
                status: "completed",
                proof_status: "approved",
                bank_transaction_ref: autoRef,
                bank_account_id: finalBankAccId,
                confirmed_at: new Date().toISOString(),
              }
            : d
        )
      );
      setSelectedDonation((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
              proof_status: "approved",
              bank_transaction_ref: autoRef,
              bank_account_id: finalBankAccId,
              confirmed_at: new Date().toISOString(),
            }
          : null
      );
      getDonationProofsAdminAction(selectedDonation.id).then((r) => {
        if (r.success) setProofsList(r.proofs || []);
      });
    } else {
      showToast(res.error || "Failed to confirm donation", "error");
    }
  };

  const handleOpenRejectModal = (proofId?: string) => {
    setSelectedRejectProofId(proofId || null);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleExecuteReject = async () => {
    if (!selectedDonation) return;
    if (!rejectReason.trim()) {
      showToast("Please provide a reason for rejection.", "error");
      return;
    }

    setIsRejecting(true);
    const res = await rejectPaymentProofAdminAction({
      donationId: selectedDonation.id,
      proofId: selectedRejectProofId || undefined,
      reason: rejectReason.trim(),
    });
    setIsRejecting(false);

    if (res.success) {
      showToast("Proof rejected and donor notified with re-upload link.", "success");
      setRejectModalOpen(false);
      setDonations((prev) =>
        prev.map((d) =>
          d.id === selectedDonation.id ? { ...d, proof_status: "rejected" } : d
        )
      );
      setSelectedDonation((prev) =>
        prev ? { ...prev, proof_status: "rejected" } : null
      );
      getDonationProofsAdminAction(selectedDonation.id).then((r) => {
        if (r.success) setProofsList(r.proofs || []);
      });
    } else {
      showToast(res.error || "Failed to reject proof", "error");
    }
  };

  const handleDeleteProof = async (proofId: string) => {
    if (!confirm("Are you sure you want to permanently delete this proof file from Google Drive?")) return;
    const res = await deletePaymentProofAdminAction(proofId);
    if (res.success) {
      showToast("Proof permanently removed from Google Drive.", "success");
      setProofsList((prev) => prev.filter((p) => p.id !== proofId));
      if (selectedDonation) {
        getDonationProofsAdminAction(selectedDonation.id).then((r) => {
          if (r.success) {
            setProofsList(r.proofs || []);
            if ((r.proofs || []).length === 0) {
              setDonations((prev) =>
                prev.map((d) => (d.id === selectedDonation.id ? { ...d, proof_status: "none" } : d))
              );
              setSelectedDonation((prev) => (prev ? { ...prev, proof_status: "none" } : null));
            }
          }
        });
      }
    } else {
      showToast(res.error || "Failed to delete proof", "error");
    }
  };

  const handleStatusChange = async (newStatus: "pending" | "completed" | "failed") => {
    if (!selectedDonation) return;
    const res = await updateDonationStatus(selectedDonation.id, newStatus);
    if (res.success) {
      setDonations((prev) =>
        prev.map((d) => (d.id === selectedDonation.id ? { ...d, status: newStatus } : d))
      );
      setSelectedDonation((prev) => (prev ? { ...prev, status: newStatus } : null));

      if (newStatus === "completed") {
        showToast(`Status updated to Completed! Official receipt emailed to ${selectedDonation.donor_email || "donor"}.`, "success");
      } else if (newStatus === "pending") {
        showToast(`Status updated to Pending! Bank transfer instructions emailed.`, "success");
      } else if (newStatus === "failed") {
        showToast(`Status updated to Failed. Notification emailed.`, "error");
      }
    } else {
      showToast(res.error || "Failed to update status", "error");
    }
  };

  const handleDelete = async () => {
    if (!donationToDelete) return;
    const res = await deleteDonation(donationToDelete);
    if (res.success) {
      setDonations((prev) => prev.filter((d) => d.id !== donationToDelete));
      if (selectedDonation?.id === donationToDelete) {
        setSelectedDonation(null);
      }
      showToast("Donation record deleted.", "success");
    }
    setDonationToDelete(null);
  };

  // Open Reminder Modal
  const handleOpenReminder = async (donation: DonationRecord) => {
    setReminderPledge(donation);
    setQuickDays(3);
    setUseCustomDate(false);
    setRepeatDays(0);
    setMaxReminders(1);
    setCustomReminderMsg("");

    // Set default custom date to 3 days from now
    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    setCustomDateTime(d.toISOString().slice(0, 16));

    try {
      const existing = await getDonationReminderStatusAction(donation.id);
      setExistingReminder(existing);
      if (existing) {
        if (existing.custom_message) setCustomReminderMsg(existing.custom_message);
        if (existing.repeat_interval_days) setRepeatDays(existing.repeat_interval_days);
        if (existing.max_reminders) setMaxReminders(existing.max_reminders);
      }
    } catch {
      setExistingReminder(null);
    }
  };

  // Save Reminder Schedule
  const handleSaveReminder = async () => {
    if (!reminderPledge) return;
    setSavingReminder(true);
    try {
      let targetDateStr: string;
      if (useCustomDate && customDateTime) {
        targetDateStr = new Date(customDateTime).toISOString().slice(0, 19).replace("T", " ");
      } else {
        const targetMs = Date.now() + quickDays * 24 * 60 * 60 * 1000;
        targetDateStr = new Date(targetMs).toISOString().slice(0, 19).replace("T", " ");
      }

      const res = await setDonationReminderAction({
        pledgeId: reminderPledge.id,
        scheduledAt: targetDateStr,
        repeatIntervalDays: repeatDays,
        maxReminders: maxReminders,
        customMessage: customReminderMsg.trim() || null,
      });

      if (res.success) {
        showToast("Reminder schedule active! Vercel Cron will dispatch at due time.", "success");
        setReminderPledge(null);
      } else {
        showToast(res.message || "Failed to set reminder", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error scheduling reminder", "error");
    } finally {
      setSavingReminder(false);
    }
  };

  // Send Reminder Now
  const handleSendReminderNow = async () => {
    if (!reminderPledge) return;
    setSendingReminderNow(true);
    try {
      const res = await sendDonationReminderNowAction(reminderPledge.id);
      if (res.success) {
        showToast(res.message, "success");
        setReminderPledge(null);
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to dispatch reminder", "error");
    } finally {
      setSendingReminderNow(false);
    }
  };

  // Cancel Reminder
  const handleCancelReminder = async () => {
    if (!reminderPledge) return;
    try {
      const res = await cancelDonationReminderAction(reminderPledge.id);
      if (res.success) {
        showToast("Reminder cancelled.", "success");
        setReminderPledge(null);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to cancel reminder", "error");
    }
  };

  const filteredDonations = React.useMemo(() => {
    return donations
      .filter((d) => {
        const matchesSearch =
          (d.donor_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (d.donor_email || "").toLowerCase().includes(search.toLowerCase()) ||
          (d.reference_no || "").toLowerCase().includes(search.toLowerCase()) ||
          d.id.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "All" || d.status === statusFilter;
        const matchesProof =
          proofFilter === "All" ||
          (proofFilter === "submitted" && d.proof_status === "submitted") ||
          (proofFilter === "approved" && d.proof_status === "approved") ||
          (proofFilter === "rejected" && d.proof_status === "rejected") ||
          (proofFilter === "none" && (!d.proof_status || d.proof_status === "none"));
        const matchesCause = causeFilter === "All" || d.cause === causeFilter;

        return matchesSearch && matchesStatus && matchesProof && matchesCause;
      })
      .sort((a, b) => {
        // Queue requirement: When filtering for proofs to review, sort oldest first!
        if (proofFilter === "submitted") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [donations, search, statusFilter, proofFilter, causeFilter]);

  const exportCSV = () => {
    const headers = ["ID,Reference,Date,Cause,Frequency,Currency,Amount,Type,Donor Name,Email,Phone,Country,Status,Proof Status"];
    const rows = filteredDonations.map((d) =>
      [
        d.id,
        d.reference_no || "",
        new Date(d.created_at).toISOString(),
        `"${(d.cause || "").replace(/"/g, '""')}"`,
        d.frequency,
        d.currency,
        d.amount,
        d.donation_type,
        `"${(d.donor_name || "").replace(/"/g, '""')}"`,
        d.donor_email || "",
        d.donor_phone || "",
        `"${(d.country || "").replace(/"/g, '""')}"`,
        d.status,
        d.proof_status || "none",
      ].join(",")
    );
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `gjtf_donations_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const pkrTotal = donations
    .filter((d) => (d.currency || "").toUpperCase() === "PKR")
    .reduce((acc, d) => acc + (Number(d.amount) || 0), 0);

  const pkrCount = donations.filter((d) => (d.currency || "").toUpperCase() === "PKR").length;
  const completedCount = donations.filter((d) => d.status === "completed").length;
  const pendingCount = donations.filter((d) => d.status === "pending").length;
  const proofSubmittedCount = donations.filter((d) => d.proof_status === "submitted").length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-3 transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-red-600 text-white border-red-500"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight flex items-center gap-3">
            <Heart className="w-7 h-7 text-primary-700" />
            Donations &amp; Proof Verification
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review payment proofs, confirm bank credits with Bank Islami statement, and issue official receipts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/payment-settings/proof-storage">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 h-9"
            >
              <Folder className="w-4 h-4 text-primary-600" /> Drive Storage Settings
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 h-9"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 h-9"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total PKR */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">PKR Pledges</span>
            <span className="text-xs font-bold text-slate-600">PKR</span>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-heading text-slate-900">
              Rs. {pkrTotal.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{pkrCount} {pkrCount === 1 ? "pledge" : "pledges"}</div>
          </div>
        </div>

        {/* Proofs to Review Queue Card */}
        <div
          onClick={() => {
            setProofFilter(proofFilter === "submitted" ? "All" : "submitted");
            setStatusFilter("All");
          }}
          className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            proofFilter === "submitted"
              ? "bg-amber-50 border-amber-400 ring-2 ring-amber-300"
              : "bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30"
          }`}
          title="Click to toggle Review Queue"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Proofs Submitted
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-200/80 text-amber-900">
              Queue
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-heading text-amber-900 flex items-center gap-2">
              {proofSubmittedCount}
              {proofSubmittedCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping inline-block" />
              )}
            </div>
            <div className="text-xs text-amber-800/80 mt-0.5 font-medium">
              {proofFilter === "submitted" ? "Active: Sorted oldest first" : "Click to view queue"}
            </div>
          </div>
        </div>

        {/* Verified & Received */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Verified &amp; Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-heading text-emerald-700">
              {completedCount} Completed
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Receipts dispatched</div>
          </div>
        </div>

        {/* Awaiting Proof */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Awaiting Proof</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-heading text-amber-700">
              {pendingCount} Pending
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Reminders eligible</div>
          </div>
        </div>
      </div>

      {/* Filter Bar with Quick Chips */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Quick View:</span>
          <button
            type="button"
            onClick={() => {
              setProofFilter("All");
              setStatusFilter("All");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              proofFilter === "All" && statusFilter === "All"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Pledges
          </button>
          <button
            type="button"
            onClick={() => {
              setProofFilter("submitted");
              setStatusFilter("All");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              proofFilter === "submitted"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-100/70 text-amber-800 hover:bg-amber-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Review Queue ({proofSubmittedCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setProofFilter("All");
              setStatusFilter("pending");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "pending" && proofFilter === "All"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setProofFilter("All");
              setStatusFilter("completed");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "completed" && proofFilter === "All"
                ? "bg-emerald-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <Input
              placeholder="Search by donor name, email, or pledge ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 text-sm border-slate-200 text-slate-900"
            />
          </div>

          <select
            value={proofFilter}
            onChange={(e) => setProofFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Proof Statuses</option>
            <option value="submitted">Proof Submitted (Review Queue)</option>
            <option value="approved">Proof Approved</option>
            <option value="rejected">Proof Rejected</option>
            <option value="none">No Proof Uploaded</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Donation Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={causeFilter}
            onChange={(e) => setCauseFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Causes</option>
            <option value="General Education">General Education</option>
            <option value="Educate a Child">Educate a Child</option>
            <option value="Support a Classroom">Support a Classroom</option>
            <option value="Support a Child: KG to Matric">Support a Child: KG to Matric</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 border-b border-slate-200">
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Date</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Donor &amp; Ref</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Cause</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Amount</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Proof Status</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Status</TableHead>
              <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-slate-600 pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600 mb-2" />
                  Loading donations...
                </TableCell>
              </TableRow>
            ) : filteredDonations.length > 0 ? (
              filteredDonations.map((donation) => {
                const isPending = donation.status === "pending";
                const isOver7DaysPending =
                  isPending &&
                  Date.now() - new Date(donation.created_at).getTime() > 7 * 24 * 60 * 60 * 1000;

                return (
                  <TableRow
                    key={donation.id}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                    onClick={() => setSelectedDonation(donation)}
                  >
                    <TableCell className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      {new Date(donation.created_at).toLocaleDateString("en-PK", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>{donation.donor_name || "Anonymous Donor"}</span>
                        {donation.reference_no && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded border border-slate-200">
                            #{donation.reference_no}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{donation.donor_email || "—"}</div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-700 max-w-[160px] truncate" title={donation.cause}>
                      {donation.cause}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-sm text-primary-700 whitespace-nowrap">
                      {donation.currency} {donation.amount.toLocaleString()}{" "}
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({donation.frequency})
                      </span>
                    </TableCell>
                    <TableCell>
                      {donation.proof_status === "submitted" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-700" /> Proof Submitted
                        </span>
                      ) : donation.proof_status === "approved" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Verified
                        </span>
                      ) : donation.proof_status === "rejected" ? (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                          Rejected
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant={
                            donation.status === "completed"
                              ? "success"
                              : donation.status === "pending"
                              ? "warning"
                              : "outline"
                          }
                          className="text-[10px] capitalize"
                        >
                          {donation.status}
                        </Badge>
                        {isOver7DaysPending && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Pending &gt; 7 Days
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap space-x-1 pr-6" onClick={(e) => e.stopPropagation()}>
                      {donation.proof_status === "submitted" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDonation(donation)}
                          className="h-8 px-2.5 text-xs font-bold text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 rounded-lg gap-1 shadow-xs"
                          title="Review Uploaded Proof"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Review
                        </Button>
                      )}

                      {isPending && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReminder(donation)}
                          className="h-8 px-2.5 text-xs font-bold text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100 rounded-lg gap-1"
                          title="Schedule / Send Donor Reminder"
                        >
                          <Bell className="w-3.5 h-3.5" /> Reminder
                        </Button>
                      )}

                      {donation.status === "completed" && (
                        <Link
                          href={`/receipt/${encodeURIComponent(donation.id)}`}
                          target="_blank"
                          className="inline-block"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs font-bold text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg gap-1"
                            title="Printable Online Receipt"
                          >
                            <FileText className="w-3.5 h-3.5" /> Receipt
                          </Button>
                        </Link>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDonation(donation)}
                        className="h-8 px-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDonationToDelete(donation.id)}
                        className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                        title="Delete Donation Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  No donation pledges found matching the filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={Boolean(selectedDonation)}
        onOpenChange={(open) => !open && setSelectedDonation(null)}
      >
        {selectedDonation && (
          <div className="space-y-5 max-h-[85vh] overflow-y-auto pr-1">
            <DialogHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <DialogTitle className="text-slate-900 text-xl font-heading font-extrabold flex items-center gap-2">
                    Pledge Details
                    {selectedDonation.reference_no && (
                      <span className="font-mono text-sm text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                        #{selectedDonation.reference_no}
                      </span>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 text-xs mt-0.5">
                    ID: <code className="font-mono text-slate-700">{selectedDonation.id}</code> • Recorded on{" "}
                    {new Date(selectedDonation.created_at).toLocaleString()}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={
                      selectedDonation.status === "completed"
                        ? "success"
                        : selectedDonation.status === "pending"
                        ? "warning"
                        : "outline"
                    }
                    className="capitalize font-bold text-xs"
                  >
                    {selectedDonation.status}
                  </Badge>
                  {selectedDonation.proof_status === "submitted" && (
                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-bold gap-1 animate-pulse">
                      <Clock className="w-3 h-3 text-amber-700" /> Proof Submitted
                    </Badge>
                  )}
                  {selectedDonation.proof_status === "approved" && (
                    <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs font-bold gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Proof Approved
                    </Badge>
                  )}
                  {selectedDonation.proof_status === "rejected" && (
                    <Badge className="bg-rose-100 text-rose-900 border-rose-300 text-xs font-bold">
                      Proof Rejected
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* MANDATORY Verification Reminder Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-extrabold block text-amber-900">
                  Bank Credit Verification Notice
                </span>
                <span className="text-amber-800 text-xs leading-relaxed block">
                  A screenshot or slip is <strong>not proof of payment</strong>. Confirm this donation only after directly seeing and matching the credited funds in your Bank Islami online banking portal or official statement.
                </span>
              </div>
            </div>

            {/* Confirmed Transaction Record if Completed */}
            {selectedDonation.status === "completed" && (
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified Bank Credit
                  </span>
                  <Link
                    href={`/receipt/${encodeURIComponent(selectedDonation.id)}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Official Receipt
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Bank Account</span>
                    <span className="font-semibold text-slate-900">
                      {bankAccounts.find((b) => b.id === selectedDonation.bank_account_id)?.bank_name || "Bank Islami"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Bank Transaction Ref</span>
                    <span className="font-mono font-bold text-slate-900 text-[11px]">
                      {selectedDonation.bank_transaction_ref || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Confirmed By</span>
                    <span className="font-medium text-slate-900 font-mono text-[11px]">
                      {selectedDonation.confirmed_by || "Admin"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Confirmed At</span>
                    <span className="font-medium text-slate-900">
                      {selectedDonation.confirmed_at ? new Date(selectedDonation.confirmed_at).toLocaleString() : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Pledge Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Donor Name</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedDonation.donor_name || "Anonymous"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Email Address</span>
                <span className="font-medium text-slate-900 font-mono">
                  {selectedDonation.donor_email || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Phone</span>
                <span className="font-medium text-slate-900">
                  {selectedDonation.donor_phone || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Country</span>
                <span className="font-medium text-slate-900">{selectedDonation.country}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Cause</span>
                <span className="font-bold text-primary-700">{selectedDonation.cause}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Amount &amp; Frequency</span>
                <span className="font-bold font-mono text-primary-700 text-sm">
                  {selectedDonation.currency} {selectedDonation.amount.toLocaleString()}{" "}
                  <span className="font-normal text-[10px] text-slate-500">({selectedDonation.frequency})</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Type</span>
                <span className="font-medium text-slate-900">{selectedDonation.donation_type}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Payment Remarks Ref</span>
                <span className="font-mono font-bold text-slate-900 text-[11px]">
                  #{selectedDonation.reference_no || selectedDonation.id}
                </span>
              </div>
            </div>

            {/* Payment Proofs Inspection Section */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary-600" />
                  Uploaded Payment Proofs ({proofsList.length})
                </h3>
                {selectedDonation.proof_status === "submitted" && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Awaiting Verification
                  </span>
                )}
              </div>

              {proofsLoading ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary-600 mb-1" />
                  <span className="text-xs">Loading uploaded screenshots...</span>
                </div>
              ) : proofsList.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                  <p className="text-xs font-semibold text-slate-700">No payment proof uploaded yet</p>
                  <p className="text-[11px] text-slate-500">
                    The donor has not yet uploaded a transfer receipt. You can schedule a reminder email.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {proofsList.map((proof) => {
                    const dupMatch = duplicateWarnings.find((w) => w.proofId === proof.id);

                    return (
                      <div
                        key={proof.id}
                        className={`p-4 rounded-2xl border bg-white transition-all space-y-3 ${
                          dupMatch
                            ? "border-amber-400 bg-amber-50/20 shadow-sm"
                            : "border-slate-200 shadow-xs"
                        }`}
                      >
                        {/* Duplicate Alert Banner */}
                        {dupMatch && (
                          <div className="p-2.5 bg-amber-100 border border-amber-300 rounded-xl text-amber-950 text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>
                              <strong>Warning: Duplicate Screenshot!</strong> Identical file previously uploaded in pledge{" "}
                              <strong>#{dupMatch.otherRefNo}</strong>.
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Image Thumbnail with zoom overlay */}
                          <div
                            onClick={() => setViewerProof(proof)}
                            className="relative w-full sm:w-36 h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer group shadow-xs"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/proofs/${proof.id}`}
                              alt="Payment Proof Screenshot"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <Eye className="w-4 h-4" /> Full View
                            </div>
                          </div>

                          {/* Details and Drive Metadata */}
                          <div className="flex-1 space-y-2 text-xs">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-bold text-slate-900 text-sm truncate max-w-xs">
                                {proof.filename}
                              </span>
                              <Badge
                                variant={
                                  proof.status === "approved"
                                    ? "success"
                                    : proof.status === "submitted"
                                    ? "warning"
                                    : "outline"
                                }
                                className="capitalize text-[10px]"
                              >
                                {proof.status}
                              </Badge>
                            </div>

                            {/* Donor-Supplied Fields */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                              <div>
                                <span className="text-[10px] text-slate-500 block">Sender Bank</span>
                                <span className="font-medium text-slate-900">{proof.sender_bank || "Not specified"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block">Payment Date &amp; Time</span>
                                <span className="font-medium text-slate-900">
                                  {proof.paid_at ? new Date(proof.paid_at).toLocaleString() : "Not specified"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block">Transaction Reference</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono font-bold text-slate-900 text-[11px]">
                                    {proof.transaction_ref || "None"}
                                  </span>
                                  {proof.transaction_ref && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(proof.transaction_ref, proof.id + "_ref")}
                                      className="text-slate-500 hover:text-slate-800"
                                      title="Copy Transaction Ref"
                                    >
                                      {copiedText === proof.id + "_ref" ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block">Amount Paid</span>
                                <span className="font-mono font-bold text-slate-900">
                                  {proof.paid_amount_minor
                                    ? `PKR ${(Number(proof.paid_amount_minor) / 100).toLocaleString()}`
                                    : "Not specified"}
                                </span>
                              </div>
                              {proof.note && (
                                <div className="col-span-2 pt-1 border-t border-slate-200/60">
                                  <span className="text-[10px] text-slate-500 block">Donor Note:</span>
                                  <p className="text-slate-800 text-[11px] italic">{proof.note}</p>
                                </div>
                              )}
                            </div>

                            {/* Google Drive Location & Integrity */}
                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 flex-wrap gap-2">
                              <span className="flex items-center gap-1 font-mono">
                                <Folder className="w-3.5 h-3.5 text-primary-700" /> {proof.folder_path}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                SHA-256: {proof.sha256.slice(0, 12)}...
                              </span>
                            </div>

                            {proof.reject_reason && (
                              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-[11px]">
                                <strong>Rejection Reason:</strong> {proof.reject_reason}
                              </div>
                            )}

                            {/* Actions per proof */}
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewerProof(proof)}
                                className="h-7 text-xs font-semibold rounded-lg gap-1 border-slate-200"
                              >
                                <Eye className="w-3.5 h-3.5" /> Full Size &amp; Rotate
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteProof(proof.id)}
                                className="h-7 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                                title="Permanently delete from Google Drive"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete File
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Verification Actions Bar */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">
                    Verification Decision
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Confirm payment after matching bank statement, or reject proof with donor notice.
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedDonation.proof_status === "submitted" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenRejectModal()}
                      className="rounded-xl text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50 gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject Proof
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => handleOpenConfirmModal(selectedDonation)}
                    className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Bank Credit &amp; Send Receipt
                  </Button>
                </div>
              </div>

              {/* Status Change Controls & Reminders */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
                  <Button
                    size="sm"
                    variant={selectedDonation.status === "pending" ? "primary" : "outline"}
                    onClick={() => handleStatusChange("pending")}
                    className={`rounded-xl text-xs font-semibold h-8 ${
                      selectedDonation.status === "pending"
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDonation.status === "failed" ? "primary" : "outline"}
                    onClick={() => handleStatusChange("failed")}
                    className={`rounded-xl text-xs font-semibold h-8 ${
                      selectedDonation.status === "failed"
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Failed
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedDonation.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleOpenReminder(selectedDonation);
                        setSelectedDonation(null);
                      }}
                      className="rounded-xl text-xs font-bold text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100 gap-1.5 h-8"
                    >
                      <Bell className="w-3.5 h-3.5" /> Set Reminder
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDonationToDelete(selectedDonation.id)}
                    className="rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 gap-1.5 h-8"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Confirm Donation Verification Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={(open) => !open && setConfirmModalOpen(false)}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              Confirm Payment &amp; Issue Receipt
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pledge: <strong className="text-slate-800">#{selectedDonation?.reference_no || selectedDonation?.id}</strong> ({selectedDonation?.donor_name || "Anonymous"})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            {/* Warning if amount changed */}
            {selectedDonation && confirmAmount !== selectedDonation.amount && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Amount Notice:</strong> Received amount (PKR {confirmAmount.toLocaleString()}) does not match pledged amount (PKR {selectedDonation.amount.toLocaleString()}).
                </span>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Receiving Bank Account *
              </label>
              <select
                value={confirmBankAccountId}
                onChange={(e) => setConfirmBankAccountId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 font-semibold text-slate-800"
              >
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bank_name} — {acc.account_number} ({acc.account_title})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Received Amount (PKR) *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={confirmAmount}
                  onChange={(e) => setConfirmAmount(Number(e.target.value) || 0)}
                  className="h-10 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Confirmation Date *
                </label>
                <Input
                  type="date"
                  value={confirmDate}
                  onChange={(e) => setConfirmDate(e.target.value)}
                  className="h-10 text-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Bank Transaction Reference (Optional)
                </label>
                <span className="text-[10px] text-emerald-600 font-semibold">Auto-generated if empty</span>
              </div>
              <Input
                placeholder="Optional: e.g. TRX-20261017-987654 or leave blank for system invoice ref"
                value={confirmBankRef}
                onChange={(e) => setConfirmBankRef(e.target.value)}
                className="h-10 font-mono text-sm text-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                No bank slip required. If left empty, our system automatically generates an official invoice reference, creates the receipt, and emails it to the donor.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Optional Admin Note
              </label>
              <textarea
                rows={2}
                placeholder="Internal verification notes (optional)..."
                value={confirmAdminNote}
                onChange={(e) => setConfirmAdminNote(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteConfirm}
              disabled={isConfirming}
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 shadow-sm"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirm &amp; Issue Receipt
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Reject Payment Proof Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={(open) => !open && setRejectModalOpen(false)}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-extrabold text-slate-900 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-rose-600" />
              Reject Payment Proof
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              The donor will receive a respectful notification with this reason and a secure re-upload link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Quick Rejection Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Screenshot is blurry or illegible. Please upload a clear copy.",
                  "Funds not found in bank statement for this date and amount.",
                  "Transaction reference does not match our bank records.",
                  "Duplicate screenshot previously submitted for another donation.",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className="p-1.5 px-2.5 rounded-lg border border-slate-200 text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-700 text-left transition-all"
                  >
                    {preset.slice(0, 36)}...
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                placeholder="Explain clearly what is needed so the donor can re-upload..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteReject}
              disabled={isRejecting}
              className="rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white gap-1.5 shadow-sm"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> Reject Proof &amp; Email Donor
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* In-App Fullscreen & Rotate Proof Viewer */}
      {viewerProof && (
        <ProofViewerModal
          proofId={viewerProof.id}
          filename={viewerProof.filename}
          driveFolderInfo={{
            folderPath: viewerProof.folder_path,
            filename: viewerProof.filename,
          }}
          onClose={() => setViewerProof(null)}
          isSuperAdmin={true}
        />
      )}

      {/* Reminder Scheduling Modal */}
      <Dialog open={Boolean(reminderPledge)} onOpenChange={(open) => !open && setReminderPledge(null)}>
        {reminderPledge && (
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-heading font-extrabold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  Donor Pledge Reminder
                </DialogTitle>
                <Badge variant="outline" className="text-xs font-semibold">
                  {reminderPledge.currency} {reminderPledge.amount.toLocaleString()}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Recipient: <strong className="text-slate-800">{reminderPledge.donor_email || "No email available"}</strong> ({reminderPledge.donor_name || "Donor"})
              </DialogDescription>
            </DialogHeader>

            {/* Existing reminder status if already configured */}
            {existingReminder && existingReminder.status === "active" && (
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
                <div className="font-bold flex items-center justify-between">
                  <span>Current Reminder Schedule: ACTIVE</span>
                  <span className="font-mono text-[11px]">{existingReminder.sent_count} of {existingReminder.max_reminders} sent</span>
                </div>
                <div>
                  Next dispatch: <strong>{new Date(existingReminder.scheduled_at).toLocaleString()}</strong>
                  {existingReminder.repeat_interval_days > 0 && ` (Repeats every ${existingReminder.repeat_interval_days} days)`}
                </div>
                {existingReminder.last_sent_at && (
                  <div className="text-slate-500 text-[11px]">Last sent: {new Date(existingReminder.last_sent_at).toLocaleString()}</div>
                )}
              </div>
            )}

            {/* Quick Option vs Custom Option */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  When should the reminder be sent?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 3, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setQuickDays(days);
                        setUseCustomDate(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        !useCustomDate && quickDays === days
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      In {days} {days === 1 ? "Day" : "Days"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date & Time Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Or Specific Custom Date &amp; Time
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomDate(!useCustomDate)}
                    className="text-xs font-bold text-purple-700 hover:underline"
                  >
                    {useCustomDate ? "Use Quick Presets" : "Pick Date/Time"}
                  </button>
                </div>
                {useCustomDate && (
                  <Input
                    type="datetime-local"
                    value={customDateTime}
                    onChange={(e) => setCustomDateTime(e.target.value)}
                    className="border-slate-200 text-sm font-medium"
                  />
                )}
              </div>

              {/* Repeating Reminder Settings */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Repeat Interval</label>
                  <select
                    value={repeatDays}
                    onChange={(e) => setRepeatDays(Number(e.target.value))}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium"
                  >
                    <option value={0}>One-Time (No repeat)</option>
                    <option value={2}>Every 2 Days</option>
                    <option value={3}>Every 3 Days</option>
                    <option value={5}>Every 5 Days</option>
                    <option value={7}>Every 7 Days</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Max Reminders</label>
                  <select
                    value={maxReminders}
                    onChange={(e) => setMaxReminders(Number(e.target.value))}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium"
                  >
                    <option value={1}>1 Reminder Max</option>
                    <option value={2}>Up to 2 Reminders</option>
                    <option value={3}>Up to 3 Reminders</option>
                    <option value={5}>Up to 5 Reminders</option>
                  </select>
                </div>
              </div>

              {/* Optional Custom Message */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Optional Custom Message from Admin
                </label>
                <textarea
                  value={customReminderMsg}
                  onChange={(e) => setCustomReminderMsg(e.target.value)}
                  placeholder="e.g. As-Salamu Alaykum! We are preparing educational kits for the Faisalabad slum unit..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                {existingReminder && existingReminder.status === "active" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelReminder}
                    className="text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                  >
                    Cancel Scheduled Reminder
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendReminderNow}
                  disabled={sendingReminderNow}
                  className="rounded-xl text-xs font-bold border-purple-300 text-purple-700 hover:bg-purple-50 gap-1.5"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingReminderNow ? "animate-spin" : ""}`} />
                  Send Reminder Now
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveReminder}
                  disabled={savingReminder}
                  className="rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-sm"
                >
                  {savingReminder ? "Saving..." : "Save Schedule"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(donationToDelete)}
        onOpenChange={(open) => !open && setDonationToDelete(null)}
        title="Delete Donation Record?"
        description="Are you sure you want to permanently delete this donation pledge? This will remove all associated donor information."
        onConfirm={handleDelete}
      />
    </div>
  );
}
