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
} from "lucide-react";
import { updateDonationStatus, deleteDonation } from "@/app/actions/admin";
import {
  setDonationReminderAction,
  getDonationReminderStatusAction,
  cancelDonationReminderAction,
  sendDonationReminderNowAction,
} from "@/app/actions/emails";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
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
  payment_reference: string | null;
}

export default function AdminDonationsPage() {
  const [donations, setDonations] = React.useState<DonationRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("All");
  const [causeFilter, setCauseFilter] = React.useState<string>("All");
  const [selectedDonation, setSelectedDonation] = React.useState<DonationRecord | null>(null);
  const [donationToDelete, setDonationToDelete] = React.useState<string | null>(null);

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
      const res = await fetch("/api/data/donations", { cache: "no-store" });
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

  const filteredDonations = donations.filter((d) => {
    const matchesSearch =
      (d.donor_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.donor_email || "").toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    const matchesCause = causeFilter === "All" || d.cause === causeFilter;

    return matchesSearch && matchesStatus && matchesCause;
  });

  const exportCSV = () => {
    const headers = ["ID,Date,Cause,Frequency,Currency,Amount,Type,Donor Name,Email,Phone,Country,Status"];
    const rows = filteredDonations.map((d) =>
      [
        d.id,
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

  const aedTotal = donations
    .filter((d) => (d.currency || "").toUpperCase() === "AED")
    .reduce((acc, d) => acc + (Number(d.amount) || 0), 0);

  const pkrCount = donations.filter((d) => (d.currency || "").toUpperCase() === "PKR").length;
  const aedCount = donations.filter((d) => (d.currency || "").toUpperCase() === "AED").length;

  const completedCount = donations.filter((d) => d.status === "completed").length;
  const pendingCount = donations.filter((d) => d.status === "pending").length;

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
            Donations &amp; Pledge Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track pledges, issue official receipts on completion, and schedule automated donor reminders.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">AED Pledges</span>
            <span className="text-xs font-bold text-slate-600">AED</span>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-heading text-slate-900">
              AED {aedTotal.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{aedCount} {aedCount === 1 ? "pledge" : "pledges"}</div>
          </div>
        </div>

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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="All">All Statuses</option>
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

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 border-b border-slate-200">
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Date</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Donor</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Cause</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Amount</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Type</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Status &amp; Follow-up</TableHead>
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
                      <div className="font-bold text-sm text-slate-900">
                        {donation.donor_name || "Anonymous Donor"}
                      </div>
                      <div className="text-xs text-slate-500">{donation.donor_email || "—"}</div>
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
                      <span className="text-xs font-semibold text-slate-800">
                        {donation.donation_type}
                      </span>
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
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-slate-900 text-xl font-heading font-extrabold">Pledge Details</DialogTitle>
                <Badge
                  variant={
                    selectedDonation.status === "completed"
                      ? "success"
                      : selectedDonation.status === "pending"
                      ? "warning"
                      : "outline"
                  }
                  className="capitalize"
                >
                  {selectedDonation.status}
                </Badge>
              </div>
              <DialogDescription className="text-slate-500 text-xs mt-1">
                Pledge ID: <code className="font-mono font-bold text-slate-700">{selectedDonation.id}</code> • Logged on{" "}
                {new Date(selectedDonation.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm">
              <div>
                <span className="text-xs text-slate-500 block font-medium">Donor Name</span>
                <span className="font-bold text-slate-900">
                  {selectedDonation.donor_name || "Anonymous Donor"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Email Address</span>
                <span className="font-medium text-slate-900 font-mono text-xs">
                  {selectedDonation.donor_email || "Not provided"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Phone Number</span>
                <span className="font-medium text-slate-900">
                  {selectedDonation.donor_phone || "Not provided"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Donor Country</span>
                <span className="font-medium text-slate-900">{selectedDonation.country}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Cause</span>
                <span className="font-bold text-primary-700">{selectedDonation.cause}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Amount &amp; Currency</span>
                <span className="font-bold font-mono text-primary-700 text-base">
                  {selectedDonation.currency} {selectedDonation.amount.toLocaleString()} (
                  {selectedDonation.frequency})
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Type</span>
                <span className="font-medium text-slate-900">
                  {selectedDonation.donation_type}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Payment Reference</span>
                <span className="font-mono text-xs text-slate-900">
                  {selectedDonation.payment_reference || "Direct pledge / Pending gateway"}
                </span>
              </div>
            </div>

            {/* Completed Receipt Shortcut */}
            {selectedDonation.status === "completed" && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <span className="text-xs text-emerald-800 font-semibold">
                  Official tax-exempt receipt issued for this donation.
                </span>
                <Link
                  href={`/receipt/${encodeURIComponent(selectedDonation.id)}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Receipt
                </Link>
              </div>
            )}

            {/* Change Status Controls & Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Change Pledge Status (Dispatches Branded Email):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant={selectedDonation.status === "completed" ? "primary" : "outline"}
                    onClick={() => handleStatusChange("completed")}
                    className={`rounded-xl text-xs font-semibold gap-1.5 ${
                      selectedDonation.status === "completed"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed (Sends Receipt)
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDonation.status === "pending" ? "primary" : "outline"}
                    onClick={() => handleStatusChange("pending")}
                    className={`rounded-xl text-xs font-semibold gap-1.5 ${
                      selectedDonation.status === "pending"
                        ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Pending (Sends Instructions)
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDonation.status === "failed" ? "primary" : "outline"}
                    onClick={() => handleStatusChange("failed")}
                    className={`rounded-xl text-xs font-semibold gap-1.5 ${
                      selectedDonation.status === "failed"
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Failed
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {selectedDonation.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleOpenReminder(selectedDonation);
                      setSelectedDonation(null);
                    }}
                    className="rounded-xl text-xs font-bold text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100 gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5" /> Set Reminder
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDonationToDelete(selectedDonation.id)}
                  className="rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

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
