"use client";

import * as React from "react";
import {
  Mail,
  Search,
  Trash2,
  Send,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteSubscriber, sendBroadcastNewsletter } from "@/app/actions/newsletter";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface SubscriberRecord {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = React.useState<SubscriberRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("All");

  const [subscriberToDelete, setSubscriberToDelete] = React.useState<string | null>(null);

  // Broadcast Modal
  const [broadcastOpen, setBroadcastOpen] = React.useState(false);
  const [broadcastSubject, setBroadcastSubject] = React.useState("");
  const [broadcastTitle, setBroadcastTitle] = React.useState("");
  const [broadcastContent, setBroadcastContent] = React.useState("");
  const [testOnly, setTestOnly] = React.useState(false);
  const [testEmail, setTestEmail] = React.useState("");
  const [sendingBroadcast, setSendingBroadcast] = React.useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSubscribers(data as any);
      }
    } catch (err) {
      console.error("Fetch subscribers error:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSubscribers();
  }, []);

  const confirmDelete = async () => {
    if (!subscriberToDelete) return;
    const res = await deleteSubscriber(subscriberToDelete);
    if (res.success) {
      setSubscribers((prev) => prev.filter((s) => s.id !== subscriberToDelete));
    }
    setSubscriberToDelete(null);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastTitle.trim() || !broadcastContent.trim()) return;

    setSendingBroadcast(true);
    setBroadcastFeedback(null);

    const res = await sendBroadcastNewsletter({
      subject: broadcastSubject,
      title: broadcastTitle,
      content: broadcastContent,
      testOnly,
      testEmail: testEmail || undefined,
    });

    setSendingBroadcast(false);

    if (res.success) {
      setBroadcastFeedback({
        type: "success",
        message: res.message || "Broadcast email sent successfully!",
      });
      if (!testOnly) {
        setTimeout(() => {
          setBroadcastOpen(false);
          setBroadcastSubject("");
          setBroadcastTitle("");
          setBroadcastContent("");
          setBroadcastFeedback(null);
        }, 2500);
      }
    } else {
      setBroadcastFeedback({
        type: "error",
        message: res.message || "Failed to dispatch email. Please check your SMTP settings.",
      });
    }
  };

  const filtered = subscribers.filter((s) => {
    const matchesSearch = s.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
                Newsletter Subscribers
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Manage website subscribers and send promotional emails or campaign updates.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Button
            onClick={() => setBroadcastOpen(true)}
            variant="primary"
            size="md"
            className="w-auto shrink-0 font-bold rounded-xl shadow-soft hover:shadow-glow inline-flex items-center gap-2 px-5 py-2.5"
          >
            <Send className="w-4 h-4" />
            <span>Send Broadcast Email</span>
          </Button>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-slate-200"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Users className="w-4 h-4 text-primary-600" />
          <span>Total: {subscribers.length} Subscribers</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Subscriber Email</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider">Subscribed Date</TableHead>
              <TableHead className="text-right font-bold text-slate-700 text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  Loading subscribers list...
                </TableCell>
              </TableRow>
            ) : filtered.length > 0 ? (
              filtered.map((sub) => (
                <TableRow key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="font-semibold text-slate-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{sub.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={sub.status === "active" ? "success" : "outline"}
                      className="capitalize text-xs font-semibold px-2.5 py-0.5"
                    >
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {new Date(sub.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSubscriberToDelete(sub.id)}
                      className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg"
                      title="Remove Subscriber"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                  No subscribers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Broadcast / Promotional Email Dialog */}
      <Dialog
        open={broadcastOpen}
        onOpenChange={setBroadcastOpen}
        contentClassName="max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl"
      >
        <div className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold font-heading text-slate-900">
                  Send Broadcast Newsletter
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Compose an educational update, event invitation, or promotional announcement to all active subscribers.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {broadcastFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-sm flex items-start gap-2.5 ${
                broadcastFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {broadcastFeedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{broadcastFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Subject *
              </label>
              <Input
                required
                placeholder="e.g. Big News from Jallo Pind Campus • March 2026 Update"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Headline / Title inside Email *
              </label>
              <Input
                required
                placeholder="e.g. Transforming 20 Million Lives: Highlights & New Openings"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Message Body *
              </label>
              <Textarea
                required
                rows={6}
                placeholder="Write your email announcement here..."
                value={broadcastContent}
                onChange={(e) => setBroadcastContent(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-primary-600 font-sans leading-relaxed"
              />
            </div>

            {/* Test Checkbox */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={testOnly}
                  onChange={(e) => setTestOnly(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span>Send test preview email only (Do not send to all subscribers)</span>
              </label>
              {testOnly && (
                <Input
                  type="email"
                  required={testOnly}
                  placeholder="Enter your personal/test email..."
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="rounded-lg h-8 text-xs bg-white"
                />
              )}
            </div>

            <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBroadcastOpen(false)}
                disabled={sendingBroadcast}
                className="w-auto sm:w-auto rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs px-5 py-2.5 justify-center"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={sendingBroadcast}
                className="w-auto sm:w-auto rounded-xl font-bold text-xs shadow-soft hover:shadow-glow px-6 py-2.5 inline-flex items-center justify-center gap-1.5"
              >
                {sendingBroadcast ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{testOnly ? "Send Test Email" : `Send to ${subscribers.length} Subscribers`}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* Modern Custom Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(subscriberToDelete)}
        onOpenChange={(open) => !open && setSubscriberToDelete(null)}
        title="Delete Newsletter Subscriber?"
        description="Are you sure you want to remove this email address from the subscribers list? They will no longer receive broadcast announcements."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
