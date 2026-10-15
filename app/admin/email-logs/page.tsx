"use client";

import * as React from "react";
import {
  Send,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Download,
  Settings,
  Calendar,
  AlertTriangle,
  RotateCw,
  FileText,
  Mail,
  Loader2,
} from "lucide-react";
import {
  getEmailLogsAction,
  getEmailLogDetailAction,
  retryEmailAction,
  deleteEmailLogAction,
  bulkDeleteEmailLogsAction,
  clearAllEmailLogsAction,
  getEmailSettingsAction,
  saveEmailSettingsAction,
} from "@/app/actions/emails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function AdminEmailLogsPage() {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const pageSize = 25;

  // Filters
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  // Selection
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [retryingId, setRetryingId] = React.useState<string | null>(null);

  // Detail Modal
  const [viewLogId, setViewLogId] = React.useState<string | null>(null);
  const [viewLogData, setViewLogData] = React.useState<any | null>(null);
  const [viewTab, setViewTab] = React.useState<"html" | "text" | "details">("html");
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  // Settings Modal
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [autoDelete, setAutoDelete] = React.useState(false);
  const [retentionDays, setRetentionDays] = React.useState(30);
  const [savingSettings, setSavingSettings] = React.useState(false);

  // Confirmation Modals
  const [logToDelete, setLogToDelete] = React.useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = React.useState(false);
  const [confirmClearAll, setConfirmClearAll] = React.useState(false);

  // Notification message
  const [toastMessage, setToastMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmailLogsAction({
        search,
        type: typeFilter,
        status: statusFilter,
        startDate,
        endDate,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setLogs(res.logs || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error("Error loading email logs:", err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, startDate, endDate, page]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Load Settings on initial mount
  React.useEffect(() => {
    async function loadSettings() {
      const res = await getEmailSettingsAction();
      setAutoDelete(res.auto_delete_enabled);
      setRetentionDays(res.retention_days);
    }
    loadSettings();
  }, []);

  // View Log Detail
  const handleOpenView = async (id: string) => {
    setViewLogId(id);
    setViewTab("html");
    setLoadingDetail(true);
    try {
      const detail = await getEmailLogDetailAction(id);
      setViewLogData(detail);
    } catch (err) {
      console.error("Error loading email detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Retry failed email
  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await retryEmailAction(id);
      if (res.success) {
        showToast(res.message, "success");
        await loadLogs();
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to retry email", "error");
    } finally {
      setRetryingId(null);
    }
  };

  // Delete single log
  const handleConfirmDelete = async () => {
    if (!logToDelete) return;
    try {
      const res = await deleteEmailLogAction(logToDelete);
      if (res.success) {
        showToast("Email log record deleted.", "success");
        setSelectedIds((prev) => prev.filter((i) => i !== logToDelete));
        await loadLogs();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to delete log", "error");
    } finally {
      setLogToDelete(null);
    }
  };

  // Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await bulkDeleteEmailLogsAction(selectedIds);
      if (res.success) {
        showToast(`Successfully deleted ${res.count} email logs.`, "success");
        setSelectedIds([]);
        await loadLogs();
      }
    } catch (err: any) {
      showToast(err.message || "Bulk delete failed", "error");
    } finally {
      setConfirmBulkDelete(false);
    }
  };

  // Clear all
  const handleConfirmClearAll = async () => {
    try {
      const res = await clearAllEmailLogsAction();
      if (res.success) {
        showToast("All email logs have been cleared.", "success");
        setSelectedIds([]);
        await loadLogs();
      }
    } catch (err: any) {
      showToast(err.message || "Clear all failed", "error");
    } finally {
      setConfirmClearAll(false);
    }
  };

  // Save Cleanup Settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await saveEmailSettingsAction({
        auto_delete_enabled: autoDelete,
        retention_days: Number(retentionDays),
      });
      if (res.success) {
        showToast("Email cleanup settings saved.", "success");
        setSettingsOpen(false);
      } else {
        showToast(res.message || "Failed to save settings", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error saving settings", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["ID,Date,Recipient Name,Recipient Email,Type,Subject,Status,Error"];
    const rows = logs.map((l) => [
      l.id,
      new Date(l.created_at).toISOString(),
      `"${(l.recipient_name || "").replace(/"/g, '""')}"`,
      `"${(l.recipient_email || "").replace(/"/g, '""')}"`,
      l.email_type,
      `"${(l.subject || "").replace(/"/g, '""')}"`,
      l.status,
      `"${(l.error_message || "").replace(/"/g, '""')}"`,
    ].join(","));

    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `gjtf_email_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper badge color
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "volunteer_signup":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "volunteer_accepted":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "volunteer_rejected":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "volunteer_reply":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "donation_received":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "donation_completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 font-bold";
      case "donation_pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "donation_failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "donation_reminder":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const sentCount = logs.filter((l) => l.status === "sent").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-3 transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-red-600 text-white border-red-500"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight flex items-center gap-3">
            <Send className="w-7 h-7 text-primary-700" />
            Email Logs &amp; Delivery System
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete audit trail of all automated volunteer, donor, receipt, and reminder emails.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
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
            onClick={() => setSettingsOpen(true)}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 h-9"
          >
            <Settings className="w-4 h-4" /> Cleanup Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 h-9"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Recorded</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{totalCount.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-0.5">Logs in system</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Successfully Sent</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">{sentCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">On current page</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-red-600">Failed / Retries</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-700 mt-1">{failedCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Requiring attention</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-primary-700">Auto-Cleanup</div>
          <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${autoDelete ? "bg-emerald-500" : "bg-slate-300"}`} />
            {autoDelete ? `${retentionDays} Days Retention` : "Disabled"}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Vercel Cron scheduled</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <Input
            placeholder="Search by recipient name, email, or subject..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 h-10 text-sm border-slate-200 text-slate-900"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 py-1.5 rounded-xl border border-slate-200 text-sm bg-white font-medium text-slate-800"
        >
          <option value="All">All Email Types</option>
          <option value="volunteer_signup">Volunteer Sign-up</option>
          <option value="volunteer_accepted">Volunteer Accepted</option>
          <option value="volunteer_rejected">Volunteer Rejected</option>
          <option value="volunteer_reply">Volunteer Reply</option>
          <option value="donation_received">Donation Received</option>
          <option value="donation_completed">Donation Completed (Receipt)</option>
          <option value="donation_pending">Donation Pending</option>
          <option value="donation_failed">Donation Failed</option>
          <option value="donation_reminder">Donation Reminder</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 py-1.5 rounded-xl border border-slate-200 text-sm bg-white font-medium text-slate-800"
        >
          <option value="All">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="text-xs font-bold text-slate-700">{selectedIds.length} selected</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmBulkDelete(true)}
              className="h-9 px-3 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 border-b border-slate-200">
              <TableHead className="w-12 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={logs.length > 0 && selectedIds.length === logs.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(logs.map((l) => l.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
              </TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Recipient</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Type</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Subject</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 text-center">Status</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Date &amp; Time</TableHead>
              <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-slate-600 pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600 mb-2" />
                  Loading email records...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  No email logs found matching the filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const isSelected = selectedIds.includes(log.id);
                return (
                  <TableRow
                    key={log.id}
                    className={`hover:bg-slate-50/80 transition-colors border-b border-slate-100 ${
                      isSelected ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => [...prev, log.id]);
                          } else {
                            setSelectedIds((prev) => prev.filter((i) => i !== log.id));
                          }
                        }}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900 text-sm leading-tight">
                        {log.recipient_name || "Recipient"}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {log.recipient_email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${getTypeBadgeClass(
                          log.email_type
                        )}`}
                      >
                        {log.email_type.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-xs sm:text-sm font-medium text-slate-800 truncate" title={log.subject}>
                        {log.subject}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {log.status === "sent" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sent
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 cursor-pointer"
                          title={log.error_message || "Delivery failed"}
                        >
                          <XCircle className="w-3.5 h-3.5 text-red-600" /> Failed
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("en-PK", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenView(log.id)}
                          className="h-8 px-2.5 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold gap-1"
                          title="View Email Preview"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>

                        {log.status === "failed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={retryingId === log.id}
                            onClick={() => handleRetry(log.id)}
                            className="h-8 px-2.5 text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 rounded-lg text-xs font-bold gap-1"
                            title="Retry Sending Email"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${retryingId === log.id ? "animate-spin" : ""}`} />
                            Retry
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLogToDelete(log.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Showing{" "}
            <strong>
              {totalCount === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)}
            </strong>{" "}
            of <strong>{totalCount}</strong> logs
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-lg text-xs font-semibold"
            >
              Previous
            </Button>
            <span className="text-xs font-bold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-3 rounded-lg text-xs font-semibold"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Modal (Email Preview) */}
      <Dialog open={Boolean(viewLogId)} onOpenChange={(open) => !open && setViewLogId(null)}>
        {viewLogData && (
          <div className="space-y-4 max-h-[85vh] flex flex-col">
            <DialogHeader className="shrink-0">
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="text-xl font-heading font-extrabold text-slate-900 leading-snug">
                  {viewLogData.subject}
                </DialogTitle>
                <Badge
                  variant={viewLogData.status === "sent" ? "default" : "destructive"}
                  className="capitalize text-xs font-semibold px-2.5 py-0.5"
                >
                  {viewLogData.status}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                To: <strong className="text-slate-800">{viewLogData.recipient_email}</strong> ({viewLogData.recipient_name || "N/A"}) • Dispatched on{" "}
                {new Date(viewLogData.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewTab("html")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewTab === "html" ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Rendered HTML Preview
              </button>
              <button
                type="button"
                onClick={() => setViewTab("text")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewTab === "text" ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Plain Text View
              </button>
              <button
                type="button"
                onClick={() => setViewTab("details")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewTab === "details" ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Technical Meta &amp; Logs
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto min-h-[350px] border border-slate-200 rounded-2xl p-2 bg-slate-50">
              {viewTab === "html" ? (
                <iframe
                  title="Email HTML Preview"
                  srcDoc={viewLogData.body_html}
                  className="w-full h-[520px] rounded-xl bg-white border-0 shadow-inner"
                  sandbox="allow-same-origin"
                />
              ) : viewTab === "text" ? (
                <div className="p-4 bg-white rounded-xl font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {viewLogData.body_text || "No plain text provided."}
                </div>
              ) : (
                <div className="p-4 bg-white rounded-xl space-y-4 text-xs font-mono text-slate-800">
                  <div>
                    <span className="font-bold text-slate-500 block">Record ID:</span>
                    <span>{viewLogData.id}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Email Type:</span>
                    <span className="font-bold text-primary-700">{viewLogData.email_type}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Recipient Email:</span>
                    <span>{viewLogData.recipient_email}</span>
                  </div>
                  {viewLogData.error_message && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-sans">
                      <strong className="block mb-1 font-bold">Failure Log / Reason:</strong>
                      {viewLogData.error_message}
                    </div>
                  )}
                  {viewLogData.metadata && (
                    <div>
                      <span className="font-bold text-slate-500 block">Attached Metadata:</span>
                      <pre className="p-3 bg-slate-100 rounded-lg text-[11px] overflow-x-auto">
                        {JSON.stringify(viewLogData.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between gap-3 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLogToDelete(viewLogData.id);
                  setViewLogId(null);
                }}
                className="text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Record
              </Button>

              <div className="flex items-center gap-2">
                {viewLogData.status === "failed" && (
                  <Button
                    size="sm"
                    onClick={() => handleRetry(viewLogData.id)}
                    disabled={retryingId === viewLogData.id}
                    className="text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-sm"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${retryingId === viewLogData.id ? "animate-spin" : ""}`} />
                    Retry Now
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewLogId(null)}
                  className="text-xs font-semibold rounded-xl"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <div className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-extrabold text-slate-900">
              Email Logs &amp; Auto-Cleanup Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Configure automatic purge schedules to keep your Hostinger MySQL database lightweight and performant.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <strong className="text-sm text-slate-900 block font-heading font-bold">
                  Enable Scheduled Auto-Delete
                </strong>
                <p className="text-xs text-slate-500">
                  Automatically delete email logs older than the chosen retention window via Vercel Cron.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoDelete}
                onChange={(e) => setAutoDelete(e.target.checked)}
                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
              />
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-200">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Retention Period
              </label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white font-medium text-slate-800"
              >
                <option value={7}>7 Days (Recommended for light storage)</option>
                <option value={15}>15 Days</option>
                <option value={30}>30 Days (Standard Monthly Audit)</option>
                <option value={90}>90 Days (Quarterly Audit)</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-4">
            <div>
              <strong className="text-xs font-bold text-red-900 block">Dangerous Action: Purge All Logs</strong>
              <p className="text-[11px] text-red-700">Permanently truncates the entire email_logs table.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmClearAll(true)}
              className="text-xs font-bold border-red-300 text-red-700 bg-white hover:bg-red-100 rounded-xl"
            >
              Clear All Logs
            </Button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="rounded-xl text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white"
            >
              {savingSettings ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={Boolean(logToDelete)}
        onOpenChange={(open) => !open && setLogToDelete(null)}
        title="Delete Email Record?"
        description="Are you sure you want to permanently delete this email log entry? This action cannot be undone."
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Delete ${selectedIds.length} Email Records?`}
        description="Are you sure you want to permanently delete all selected email log records?"
        onConfirm={handleConfirmBulkDelete}
      />

      <ConfirmDialog
        open={confirmClearAll}
        onOpenChange={setConfirmClearAll}
        title="Permanently Clear All Email Logs?"
        description="Warning: This will delete ALL logged emails from the database immediately. Proceed with caution."
        onConfirm={handleConfirmClearAll}
      />
    </div>
  );
}
