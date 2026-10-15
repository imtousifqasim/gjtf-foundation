"use client";

import * as React from "react";
import {
  Users,
  Search,
  CheckCircle2,
  Archive,
  Phone,
  Mail,
  Building,
  Eye,
  Trash2,
  Send,
  Loader2,
  XCircle,
  FileText,
  UserCheck,
} from "lucide-react";
import { updateVolunteerStatus, deleteVolunteerSignup } from "@/app/actions/admin";
import { sendVolunteerReplyAction } from "@/app/actions/emails";
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

interface VolunteerRecord {
  id: string;
  created_at: string;
  type: "general" | "university_chapter" | "city_chapter";
  full_name: string;
  email: string;
  phone: string;
  city: string;
  university: string | null;
  message: string | null;
  status: "new" | "contacted" | "archived";
}

export default function AdminVolunteerSignupsPage() {
  const [signups, setSignups] = React.useState<VolunteerRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("All");
  const [selectedVolunteer, setSelectedVolunteer] = React.useState<VolunteerRecord | null>(null);

  // Reply Modal State
  const [replyVolunteer, setReplyVolunteer] = React.useState<VolunteerRecord | null>(null);
  const [replySubject, setReplySubject] = React.useState("");
  const [replyMessage, setReplyMessage] = React.useState("");
  const [sendingReply, setSendingReply] = React.useState(false);

  // Status notes modal (optional note on accept/reject)
  const [statusAction, setStatusAction] = React.useState<{
    id: string;
    newStatus: "new" | "contacted" | "archived";
  } | null>(null);
  const [statusNote, setStatusNote] = React.useState("");

  // Delete modal state
  const [volunteerToDelete, setVolunteerToDelete] = React.useState<string | null>(null);

  // Toast
  const [toast, setToast] = React.useState<{ text: string; type: "success" | "error" } | null>(null);
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data/volunteer-signups", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setSignups(json.data);
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

  const handleStatusChange = async (newStatus: "new" | "contacted" | "archived", note?: string) => {
    if (!selectedVolunteer) return;
    try {
      const res = await updateVolunteerStatus(selectedVolunteer.id, newStatus, note);
      if (res.success) {
        setSignups((prev) =>
          prev.map((v) => (v.id === selectedVolunteer.id ? { ...v, status: newStatus } : v))
        );
        setSelectedVolunteer((prev) => (prev ? { ...prev, status: newStatus } : null));
        if (newStatus === "contacted") {
          showToast(`Application accepted! Welcome email sent to ${selectedVolunteer.email}.`, "success");
        } else if (newStatus === "archived") {
          showToast(`Application archived. Rejection notification sent to ${selectedVolunteer.email}.`, "success");
        } else {
          showToast("Status updated.", "success");
        }
      }
    } catch (err: any) {
      showToast(err.message || "Status update failed", "error");
    } finally {
      setStatusAction(null);
      setStatusNote("");
    }
  };

  const confirmDeleteVolunteer = async () => {
    if (!volunteerToDelete) return;
    try {
      await deleteVolunteerSignup(volunteerToDelete, true);
      setSignups((prev) => prev.filter((v) => v.id !== volunteerToDelete));
      if (selectedVolunteer?.id === volunteerToDelete) {
        setSelectedVolunteer(null);
      }
      showToast("Volunteer application deleted and notification email sent.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete application", "error");
    } finally {
      setVolunteerToDelete(null);
    }
  };

  // Open Reply Modal
  const handleOpenReply = (vol: VolunteerRecord) => {
    setReplyVolunteer(vol);
    setReplySubject(`GJTF Volunteer Application - ${vol.full_name}`);
    setReplyMessage(
      `Dear ${vol.full_name},\n\nThank you for reaching out regarding your volunteer application with Ghais Jhuggi Taleem Foundation.\n\n`
    );
  };

  // Send Reply
  const handleSendReply = async () => {
    if (!replyVolunteer || !replyMessage.trim()) return;
    setSendingReply(true);
    try {
      const res = await sendVolunteerReplyAction({
        recipientName: replyVolunteer.full_name,
        recipientEmail: replyVolunteer.email,
        subject: replySubject,
        message: replyMessage,
      });

      if (res.success) {
        showToast(res.message, "success");
        setReplyVolunteer(null);
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to dispatch email reply", "error");
    } finally {
      setSendingReply(false);
    }
  };

  const filtered = signups.filter((v) => {
    const matchesSearch =
      v.full_name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "All" || v.type === typeFilter;
    return matchesSearch && matchesType;
  });

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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-primary-700" />
            Volunteer Applications &amp; Onboarding
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review applicant submissions from all 4 portals, send automated acceptance/rejections, and dispatch replies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 h-9"
          >
            Refresh List
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <Input
            placeholder="Search by volunteer name, city, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-sm border-slate-200 text-slate-900"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 px-3 py-1.5 rounded-xl border border-slate-200 text-sm bg-white font-medium text-slate-800"
        >
          <option value="All">All Chapters &amp; Roles</option>
          <option value="general">General Volunteer</option>
          <option value="university_chapter">University Chapter</option>
          <option value="city_chapter">City Chapter Lead</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 border-b border-slate-200">
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Applicant</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Role / Chapter</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Location</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600">Applied Date</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-600 text-center">Status</TableHead>
              <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-slate-600 pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600 mb-2" />
                  Loading volunteer submissions...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  No volunteer sign-ups found matching your query.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => (
                <TableRow key={v.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                  <TableCell>
                    <div className="font-bold text-slate-900 text-sm">{v.full_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{v.email}</span>
                      <span>•</span>
                      <span>{v.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 capitalize">
                      {v.type.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-slate-800">{v.city}</div>
                    {v.university && (
                      <div className="text-xs text-slate-500 truncate max-w-[180px]">{v.university}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(v.created_at).toLocaleDateString("en-PK", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                        v.status === "new"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : v.status === "contacted"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {v.status === "contacted" ? "Accepted / Active" : v.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVolunteer(v)}
                        className="h-8 px-2.5 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold gap-1"
                        title="View Details & Actions"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReply(v)}
                        className="h-8 px-2.5 text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100 rounded-lg text-xs font-bold gap-1"
                        title="Reply via Email"
                      >
                        <Mail className="w-3.5 h-3.5" /> Reply
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVolunteerToDelete(v.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
                        title="Delete Application"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={Boolean(selectedVolunteer)}
        onOpenChange={(open) => !open && setSelectedVolunteer(null)}
      >
        {selectedVolunteer && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="text-xl font-heading font-extrabold text-slate-900 leading-snug">
                  {selectedVolunteer.full_name}
                </DialogTitle>
                <Badge
                  variant={
                    selectedVolunteer.status === "contacted"
                      ? "default"
                      : selectedVolunteer.status === "new"
                      ? "secondary"
                      : "outline"
                  }
                  className="capitalize text-xs font-semibold px-2.5 py-0.5"
                >
                  {selectedVolunteer.status === "contacted" ? "Accepted / Active" : selectedVolunteer.status}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Applied for <strong className="text-slate-800 font-semibold">{selectedVolunteer.type.replace(/_/g, " ")}</strong> on{" "}
                {new Date(selectedVolunteer.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm">
              <div>
                <span className="text-xs text-slate-500 block font-medium">Phone / WhatsApp</span>
                <span className="font-bold text-slate-900">{selectedVolunteer.phone}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Email</span>
                <span className="font-semibold text-slate-900">{selectedVolunteer.email}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">City</span>
                <span className="font-medium text-slate-900">{selectedVolunteer.city}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Institution / University</span>
                <span className="font-medium text-slate-900">
                  {selectedVolunteer.university || "Not applicable"}
                </span>
              </div>
            </div>

            {selectedVolunteer.message && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Statement / Application Notes:
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedVolunteer.message}
                </div>
              </div>
            )}

            {/* Email Dispatch Notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Accepting or archiving will automatically send a branded notification email to <strong>{selectedVolunteer.email}</strong>.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVolunteerToDelete(selectedVolunteer.id)}
                className="text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5 self-start sm:self-auto rounded-xl px-3"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Application
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("contacted")}
                  className="text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 px-3.5 py-2 shadow-sm"
                >
                  <UserCheck className="w-4 h-4" /> Accept Application
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("archived")}
                  className="text-xs font-semibold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 px-3 py-2"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-500" /> Reject / Archive
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleOpenReply(selectedVolunteer);
                    setSelectedVolunteer(null);
                  }}
                  className="text-xs font-bold rounded-xl border-blue-300 text-blue-700 bg-blue-50/70 hover:bg-blue-100 gap-1.5 px-3 py-2"
                >
                  <Mail className="w-3.5 h-3.5" /> Reply Email
                </Button>

                <a href={`tel:${selectedVolunteer.phone}`} className="inline-block">
                  <Button size="sm" variant="outline" className="text-xs font-semibold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 px-3 py-2">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={Boolean(replyVolunteer)} onOpenChange={(open) => !open && setReplyVolunteer(null)}>
        {replyVolunteer && (
          <div className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-extrabold text-slate-900">
                Reply to {replyVolunteer.full_name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Dispatches a formatted official response email to <strong className="text-slate-800">{replyVolunteer.email}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Email Subject
                </label>
                <Input
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Subject line..."
                  className="border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Message Content
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={6}
                  placeholder="Type your message here..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReplyVolunteer(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendReply}
                disabled={sendingReply || !replyMessage.trim()}
                className="rounded-xl text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white gap-2"
              >
                {sendingReply ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending Email...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Email Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(volunteerToDelete)}
        onOpenChange={(open) => !open && setVolunteerToDelete(null)}
        title="Delete Volunteer Application?"
        description="Are you sure you want to delete this application? A polite notification will be emailed to the applicant."
        onConfirm={confirmDeleteVolunteer}
      />
    </div>
  );
}
