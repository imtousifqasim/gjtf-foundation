"use client";

import * as React from "react";
import {
  Mail,
  Search,
  CheckCircle2,
  Archive,
  Reply,
  Eye,
  Trash2,
  Settings,
  Send,
  Loader2,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
  XCircle,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import {
  updateContactStatus,
  deleteContactMessage,
  deleteContactMessagesBulk,
  sendContactMessageReplyAction,
  getContactMessageThreadAction,
  getContactMessagesSettingsAction,
  saveContactMessagesSettingsAction,
  clearAllContactMessagesAction,
} from "@/app/actions/admin";
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

interface ContactRecord {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  replied_at?: string | null;
  replied_by?: string | null;
}

interface MessageReply {
  id: string;
  admin_id: string;
  subject: string;
  body: string;
  status: "sent" | "failed";
  error?: string | null;
  created_at: string;
  sent_at?: string | null;
}

const CANNED_RESPONSES = [
  {
    title: "General Acknowledgment",
    text: "Dear Supporter,\n\nThank you for reaching out to Ghais Jhuggi Taleem Foundation (GJTF). We have received your inquiry and our team is actively reviewing it. We will follow up with detailed information shortly.\n\nWarm regards,\nGJTF Team",
  },
  {
    title: "CSR & Partnership Inquiry",
    text: "Dear Partner,\n\nThank you for your interest in partnering with GJTF to support education for nomadic children. We welcome corporate partnerships, school adoption initiatives, and digital classroom sponsorships. Our executive team would be delighted to schedule a brief introductory call.\n\nPlease let us know your preferred date and time.",
  },
  {
    title: "School Visit & Direct Engagement",
    text: "Hello,\n\nWe appreciate your interest in visiting our mobile schools in nomadic settlements. We welcome supporters, researchers, and volunteers for scheduled campus visits.\n\nPlease share your preferred dates and group size so we can arrange local coordination with our field campus lead.",
  },
];

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = React.useState<ContactRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("All");

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = React.useState(false);

  // Single Delete
  const [messageToDelete, setMessageToDelete] = React.useState<string | null>(null);

  // Detail Modal & Thread View
  const [selectedMessage, setSelectedMessage] = React.useState<ContactRecord | null>(null);
  const [threadReplies, setThreadReplies] = React.useState<MessageReply[]>([]);
  const [loadingThread, setLoadingThread] = React.useState(false);

  // In-App Reply Modal
  const [replyOpen, setReplyOpen] = React.useState(false);
  const [replyTarget, setReplyTarget] = React.useState<ContactRecord | null>(null);
  const [replySubject, setReplySubject] = React.useState("");
  const [replyBody, setReplyBody] = React.useState("");
  const [replySending, setReplySending] = React.useState(false);
  const [replyInlineError, setReplyInlineError] = React.useState<string | null>(null);

  // Settings & Retention Modal
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = React.useState(false);
  const [retentionDays, setRetentionDays] = React.useState(30);
  const [deleteOnlyReplied, setDeleteOnlyReplied] = React.useState(false);
  const [lastCleanup, setLastCleanup] = React.useState<{ at: string | null; count: number }>({ at: null, count: 0 });
  const [savingSettings, setSavingSettings] = React.useState(false);

  // Clear All Modal
  const [clearAllOpen, setClearAllOpen] = React.useState(false);
  const [clearConfirmInput, setClearConfirmInput] = React.useState("");
  const [clearingAll, setClearingAll] = React.useState(false);

  // Root Toast State (z-[99999])
  const [toast, setToast] = React.useState<{ text: string; type: "success" | "error" } | null>(null);
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data/contact-messages", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setMessages(json.data);
        }
      } else {
        showToast("Failed to load contact messages. Please verify credentials.", "error");
      }
    } catch (err: any) {
      console.error("Load contact submissions error:", err);
      showToast(err.message || "Failed to query Hostinger MySQL", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Retention Settings on opening modal
  const openSettingsModal = async () => {
    setSettingsOpen(true);
    try {
      const res = await getContactMessagesSettingsAction();
      if (res.success && res.settings) {
        setAutoDeleteEnabled(res.settings.auto_delete_enabled);
        setRetentionDays(res.settings.retention_days);
        setDeleteOnlyReplied(res.settings.delete_only_replied);
        setLastCleanup({
          at: res.settings.last_cleanup_at,
          count: res.settings.last_cleanup_count,
        });
      }
    } catch {}
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await saveContactMessagesSettingsAction({
        auto_delete_enabled: autoDeleteEnabled,
        retention_days: retentionDays,
        delete_only_replied: deleteOnlyReplied,
      });
      if (res.success) {
        showToast("Retention settings saved successfully.", "success");
        setSettingsOpen(false);
      } else {
        showToast(res.error || "Failed to save settings", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save settings", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleClearAll = async () => {
    if (clearConfirmInput !== "DELETE") {
      showToast("You must type DELETE to confirm clearing messages.", "error");
      return;
    }
    setClearingAll(true);
    try {
      const res = await clearAllContactMessagesAction(clearConfirmInput);
      if (res.success) {
        showToast(res.message || "All contact messages cleared.", "success");
        setClearAllOpen(false);
        setClearConfirmInput("");
        loadData();
      } else {
        showToast(res.error || "Failed to clear messages", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error clearing messages", "error");
    } finally {
      setClearingAll(false);
    }
  };

  // Open Message Detail & Load Thread Replies
  const handleOpenDetail = async (msg: ContactRecord) => {
    setSelectedMessage(msg);
    setLoadingThread(true);
    try {
      const res = await getContactMessageThreadAction(msg.id);
      if (res.success && res.replies) {
        setThreadReplies(res.replies);
      } else {
        setThreadReplies([]);
      }
    } catch {
      setThreadReplies([]);
    } finally {
      setLoadingThread(false);
    }
  };

  // Open In-App Reply Dialog
  const handleOpenReplyDialog = (msg: ContactRecord) => {
    setReplyTarget(msg);
    setReplySubject(`Re: ${msg.subject}`);
    setReplyBody(`Dear ${msg.name},\n\nThank you for reaching out to Ghais Jhuggi Taleem Foundation.\n\n`);
    setReplyInlineError(null);
    setReplyOpen(true);
  };

  // Send In-App Reply
  const handleSendReply = async () => {
    if (!replyTarget || !replyBody.trim()) return;
    setReplySending(true);
    setReplyInlineError(null);

    try {
      const res = await sendContactMessageReplyAction({
        messageId: replyTarget.id,
        subject: replySubject.trim(),
        message: replyBody.trim(),
      });

      if (res.success) {
        showToast(res.message || "Reply sent successfully!", "success");
        setReplyOpen(false);

        // Update local status in list
        setMessages((prev) =>
          prev.map((m) => (m.id === replyTarget.id ? { ...m, status: "replied" } : m))
        );

        if (selectedMessage?.id === replyTarget.id) {
          setSelectedMessage((prev) => (prev ? { ...prev, status: "replied" } : null));
          handleOpenDetail(replyTarget);
        }
      } else {
        // Issue 4 & 5: Inline error inside modal, preserves draft!
        setReplyInlineError(res.error || "Failed to dispatch email reply.");
      }
    } catch (err: any) {
      setReplyInlineError(err.message || "An unexpected error occurred.");
    } finally {
      setReplySending(false);
    }
  };

  // Status Change
  const handleStatusChange = async (newStatus: "new" | "read" | "replied" | "archived") => {
    if (!selectedMessage) return;
    const res = await updateContactStatus(selectedMessage.id, newStatus);
    if (res.success) {
      setMessages((prev) =>
        prev.map((m) => (m.id === selectedMessage.id ? { ...m, status: newStatus } : m))
      );
      setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
      showToast(`Status updated to ${newStatus}.`, "success");
    } else {
      showToast(res.error || "Failed to update status", "error");
    }
  };

  // Single Authoritative Delete
  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      const res = await deleteContactMessage(messageToDelete);
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m.id !== messageToDelete));
        setSelectedIds((prev) => prev.filter((id) => id !== messageToDelete));
        if (selectedMessage?.id === messageToDelete) {
          setSelectedMessage(null);
        }
        showToast("Contact submission deleted.", "success");
      } else {
        showToast(res.error || "Failed to delete submission.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error deleting submission.", "error");
    } finally {
      setMessageToDelete(null);
    }
  };

  // Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await deleteContactMessagesBulk(selectedIds);
      if (res.success) {
        setMessages((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
        showToast(`Deleted ${res.count || selectedIds.length} contact submissions.`, "success");
        setSelectedIds([]);
      } else {
        showToast(res.error || "Bulk delete failed.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Bulk delete failed.", "error");
    } finally {
      setBulkDeleting(false);
      setBulkDeleteConfirmOpen(false);
    }
  };

  // Select all / toggle row
  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((m) => m.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filtered = messages.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = messages.length;
  const newCount = messages.filter((m) => m.status === "new").length;
  const repliedCount = messages.filter((m) => m.status === "replied").length;
  const readCount = messages.filter((m) => m.status === "read").length;

  return (
    <div className="space-y-6">
      {/* Root Portal-Level Toast Notification (z-[99999] Tokens) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-[99999] p-4 rounded-2xl shadow-2xl border text-sm font-semibold flex items-center gap-3 transition-all animate-in slide-in-from-top-3 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-950/20"
              : "bg-rose-600 text-white border-rose-500 shadow-rose-950/20"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
              Contact Submissions
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary-100 text-primary-800">
              Live DB
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Manage inquiries, send official in-app email replies, and configure automated retention.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={openSettingsModal}
            className="text-xs font-bold rounded-xl gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            Retention &amp; Auto-Delete
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs font-bold rounded-xl gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Inquiries</span>
          <div className="mt-2 text-2xl font-black font-heading text-slate-900">{totalCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unread</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Needs Review</span>
          </div>
          <div className="mt-2 text-2xl font-black font-heading text-amber-700">{newCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Replied In-App</span>
          <div className="mt-2 text-2xl font-black font-heading text-emerald-700">{repliedCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Marked as Read</span>
          <div className="mt-2 text-2xl font-black font-heading text-slate-700">{readCount}</div>
        </div>
      </div>

      {/* Filter and Bulk Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <Input
              placeholder="Search by sender, email address, or subject line..."
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
            <option value="new">New / Unread</option>
            <option value="replied">Replied</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in">
            <span className="text-xs font-bold text-slate-700">
              {selectedIds.length} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDeleteConfirmOpen(true)}
              className="h-9 px-3 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 gap-1.5"
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
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
              <TableHead className="w-12 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="p-1 text-slate-500 hover:text-slate-800 focus:outline-none"
                  title="Select All"
                >
                  {filtered.length > 0 && selectedIds.length === filtered.length ? (
                    <CheckSquare className="w-4 h-4 text-primary-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </TableHead>
              <TableHead className="font-bold text-slate-700">Sender</TableHead>
              <TableHead className="font-bold text-slate-700">Subject</TableHead>
              <TableHead className="font-bold text-slate-700">Received</TableHead>
              <TableHead className="font-bold text-slate-700">Status</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((msg) => {
                const isSelected = selectedIds.includes(msg.id);
                return (
                  <TableRow
                    key={msg.id}
                    className={`cursor-pointer hover:bg-slate-50/80 transition-colors ${
                      isSelected ? "bg-primary-50/40" : ""
                    }`}
                    onClick={() => handleOpenDetail(msg)}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleSelectRow(msg.id)}
                        className="p-1 focus:outline-none"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{msg.name}</div>
                      <div className="text-xs text-slate-500">{msg.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800 max-w-xs truncate">
                        {msg.subject}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          msg.status === "new"
                            ? "default"
                            : msg.status === "replied"
                            ? "outline"
                            : msg.status === "read"
                            ? "secondary"
                            : "outline"
                        }
                        className={`capitalize font-semibold text-xs ${
                          msg.status === "replied"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : msg.status === "new"
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : ""
                        }`}
                      >
                        {msg.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReplyDialog(msg)}
                          className="h-8 px-2.5 text-xs font-bold text-primary-700 border-primary-200 hover:bg-primary-50"
                        >
                          <Reply className="w-3.5 h-3.5 mr-1" /> Reply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(msg)}
                          className="h-8 px-2 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMessageToDelete(msg.id)}
                          className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  {loading ? "Loading inquiries..." : "No contact submissions found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 1. Detail Modal with Full Conversation Thread History */}
      <Dialog
        open={Boolean(selectedMessage)}
        onOpenChange={(open) => !open && setSelectedMessage(null)}
      >
        {selectedMessage && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="text-xl font-heading font-extrabold text-slate-900 leading-snug">
                  {selectedMessage.subject}
                </DialogTitle>
                <Badge
                  variant={selectedMessage.status === "replied" ? "outline" : "default"}
                  className={`capitalize text-xs font-semibold px-2.5 py-0.5 ${
                    selectedMessage.status === "replied"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                      : ""
                  }`}
                >
                  {selectedMessage.status}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                From <strong className="text-slate-800 font-semibold">{selectedMessage.name}</strong> ({selectedMessage.email}) • {new Date(selectedMessage.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            {/* Original Inquiry Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Original Inquiry</div>
              {selectedMessage.message}
            </div>

            {/* In-App Reply Thread View (Issue 4) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Reply className="w-3.5 h-3.5 text-primary-600" />
                  Staff Reply History ({threadReplies.length})
                </h3>
              </div>

              {loadingThread ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                  Loading thread replies...
                </div>
              ) : threadReplies.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {threadReplies.map((reply) => (
                    <div
                      key={reply.id}
                      className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs text-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>
                          Replied by <strong>{reply.admin_id}</strong>
                        </span>
                        <span>{new Date(reply.created_at).toLocaleString()}</span>
                      </div>
                      <div className="font-semibold text-slate-900">{reply.subject}</div>
                      <div className="whitespace-pre-wrap text-slate-700">{reply.body}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No staff replies recorded yet for this inquiry.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMessageToDelete(selectedMessage.id)}
                className="text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1.5 self-start sm:self-auto rounded-xl px-3"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Message
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("read")}
                  className="text-xs font-semibold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 px-3 py-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mark Read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("archived")}
                  className="text-xs font-semibold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 px-3 py-2"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-500" /> Archive
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleOpenReplyDialog(selectedMessage)}
                  className="text-xs font-bold rounded-xl shadow-sm gap-1.5 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white"
                >
                  <Reply className="w-3.5 h-3.5" /> Reply In-App
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* 2. In-App Reply Dialog (Replacing mailto: entirely per Issue 4) */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        {replyTarget && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-extrabold text-slate-900">
                Reply to {replyTarget.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Dispatches a branded official email from <strong>admin@gjtfoundation.com</strong> with your reply and context.
              </DialogDescription>
            </DialogHeader>

            {/* Inline Error Alert (Issue 4 & 5 - never closes dialog, keeps draft) */}
            {replyInlineError && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <strong className="block font-semibold">Reply Dispatch Failed:</strong>
                  <span>{replyInlineError}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSendReply}
                  disabled={replySending}
                  className="text-[11px] h-7 px-2 border-rose-300 text-rose-800 hover:bg-rose-100 shrink-0"
                >
                  Retry
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {/* To: Read-only */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Recipient To (Read-only)
                </label>
                <Input
                  disabled
                  value={`${replyTarget.name} <${replyTarget.email}>`}
                  className="bg-slate-50 text-slate-600 text-xs border-slate-200 h-9"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Subject Line *
                </label>
                <Input
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Subject line..."
                  className="text-xs border-slate-200 h-9"
                />
              </div>

              {/* Canned Template Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Message Body *
                  </label>
                  <select
                    onChange={(e) => {
                      const template = CANNED_RESPONSES.find((c) => c.title === e.target.value);
                      if (template) setReplyBody(template.text);
                    }}
                    defaultValue=""
                    className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700"
                  >
                    <option value="" disabled>Insert Canned Response...</option>
                    {CANNED_RESPONSES.map((c) => (
                      <option key={c.title} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={8}
                  placeholder="Type your official reply here..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>

              {/* Original Inquiry Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px] space-y-1">
                <span className="font-bold text-slate-700 block">Original message will be quoted at the bottom:</span>
                <p className="line-clamp-2 italic text-slate-600">"{replyTarget.message}"</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReplyOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendReply}
                disabled={replySending || !replyBody.trim() || !replySubject.trim()}
                className="rounded-xl text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white gap-2 shadow-sm"
              >
                {replySending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send In-App Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* 3. Retention & Auto-Delete Settings Dialog (Mirroring Email Logs) */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <div className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-extrabold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-600" />
              Contact Message Retention &amp; Auto-Delete
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure automatic cleanup retention rules executed nightly via Vercel Cron.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Enable Auto-Delete Retention</span>
                <span className="text-[11px] text-slate-500">
                  Automatically delete old contact inquiries on a nightly schedule.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoDeleteEnabled}
                onChange={(e) => setAutoDeleteEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Retention Duration
              </label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full h-10 rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-800"
              >
                <option value={7}>Keep for 7 Days</option>
                <option value={15}>Keep for 15 Days</option>
                <option value={30}>Keep for 30 Days (Recommended)</option>
                <option value={90}>Keep for 90 Days</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Delete Only Replied Messages</span>
                <span className="text-[11px] text-slate-500">
                  If enabled, new or unread messages will never be auto-deleted.
                </span>
              </div>
              <input
                type="checkbox"
                checked={deleteOnlyReplied}
                onChange={(e) => setDeleteOnlyReplied(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
            </div>

            {lastCleanup.at && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Last automated cleanup run:</span>
                <span className="font-bold text-slate-900">
                  {new Date(lastCleanup.at).toLocaleDateString()} ({lastCleanup.count} removed)
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSettingsOpen(false);
                  setClearAllOpen(true);
                }}
                className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear All Messages...
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="rounded-xl text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white"
                >
                  {savingSettings ? "Saving..." : "Save Retention Settings"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* 4. Clear All Confirmation Dialog with Strict "DELETE" Text Prompt */}
      <Dialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-extrabold text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Clear All Contact Messages?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              This action will mark all active contact submissions as deleted. This operation is logged in security audit logs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              Type <span className="font-mono text-rose-600 font-extrabold">DELETE</span> to confirm:
            </label>
            <Input
              value={clearConfirmInput}
              onChange={(e) => setClearConfirmInput(e.target.value.toUpperCase())}
              placeholder="DELETE"
              className="font-mono text-center tracking-widest uppercase border-rose-300"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setClearAllOpen(false);
                setClearConfirmInput("");
              }}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleClearAll}
              disabled={clearingAll || clearConfirmInput !== "DELETE"}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {clearingAll ? "Clearing..." : "Permanently Clear All"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(messageToDelete)}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
        title="Delete Contact Message?"
        description="Are you sure you want to remove this contact submission? It will be soft-deleted and removed from all active lists."
        onConfirm={confirmDeleteMessage}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title={`Delete ${selectedIds.length} Contact Messages?`}
        description={`Are you sure you want to delete ${selectedIds.length} selected message(s)? This action cannot be undone.`}
        onConfirm={handleConfirmBulkDelete}
      />
    </div>
  );
}
