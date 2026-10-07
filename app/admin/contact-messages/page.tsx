"use client";

import * as React from "react";
import {
  Mail,
  Search,
  CheckCircle2,
  Archive,
  Reply,
  Eye,
  Clock,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateContactStatus, deleteContactMessage } from "@/app/actions/admin";
import { Trash2 } from "lucide-react";
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
  subject: string;
  message: string;
  status: "new" | "read" | "archived";
}

const INITIAL_MESSAGES: ContactRecord[] = [
  {
    id: "msg-1",
    created_at: "2025-02-14T11:00:00Z",
    name: "Zubair Khan",
    email: "zubair.k@example.com",
    subject: "Sponsorship for Karachi Campus",
    message: "Our corporate foundation would like to sponsor a full classroom unit at the Meghani Family Campus in Karachi. Please connect us with your central coordinator.",
    status: "new",
  },
  {
    id: "msg-2",
    created_at: "2025-02-13T14:30:00Z",
    name: "Dr. Naila Raza",
    email: "naila.raza@hospital.org.pk",
    subject: "Medical Camp Collaboration",
    message: "We have a team of 10 young doctors eager to host a weekend eye and general screening camp at your Model Town settlement school in Lahore.",
    status: "new",
  },
  {
    id: "msg-3",
    created_at: "2025-02-12T09:10:00Z",
    name: "Hamza Rauf",
    email: "hamza@example.com",
    subject: "Book drive in DHA Lahore",
    message: "We collected 350 illustrated Urdu and English primary books. Where can our volunteer vehicle drop off the cartons?",
    status: "read",
  },
];

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = React.useState<ContactRecord[]>(INITIAL_MESSAGES);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("All");
  const [selectedMessage, setSelectedMessage] = React.useState<ContactRecord | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/data/contact-messages", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setMessages(json.data);
          }
        }
      } catch (err) {
        console.error("Hostinger MySQL load error:", err);
      }
    }
    loadData();
  }, []);

  const handleStatusChange = async (newStatus: "new" | "read" | "archived") => {
    if (!selectedMessage) return;
    await updateContactStatus(selectedMessage.id, newStatus);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === selectedMessage.id ? { ...m, status: newStatus } : m
      )
    );
    setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  const [messageToDelete, setMessageToDelete] = React.useState<string | null>(null);

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    await deleteContactMessage(messageToDelete);
    setMessages((prev) => prev.filter((m) => m.id !== messageToDelete));
    if (selectedMessage?.id === messageToDelete) {
      setSelectedMessage(null);
    }
    setMessageToDelete(null);
  };

  const filtered = messages.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Contact Submissions
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Inquiries and partnership requests submitted through the public website.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <Input
            placeholder="Search by sender name, email, or subject..."
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
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
              <TableHead className="font-bold text-slate-700">Sender</TableHead>
              <TableHead className="font-bold text-slate-700">Subject</TableHead>
              <TableHead className="font-bold text-slate-700">Received</TableHead>
              <TableHead className="font-bold text-slate-700">Status</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((msg) => (
                <TableRow
                  key={msg.id}
                  className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  onClick={() => setSelectedMessage(msg)}
                >
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
                          : msg.status === "read"
                          ? "secondary"
                          : "outline"
                      }
                      className="capitalize font-semibold text-xs"
                    >
                      {msg.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMessage(msg)}
                        className="h-8 px-2.5 text-xs font-semibold text-primary-700 border-slate-200 hover:bg-primary-50"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMessageToDelete(msg.id)}
                        className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Delete Message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  No contact messages found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
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
                  variant={selectedMessage.status === "new" ? "default" : "secondary"}
                  className="capitalize text-xs font-semibold px-2.5 py-0.5"
                >
                  {selectedMessage.status}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                From <strong className="text-slate-800 font-semibold">{selectedMessage.name}</strong> (
                <a href={`mailto:${selectedMessage.email}`} className="text-primary-600 hover:underline">
                  {selectedMessage.email}
                </a>
                ) • {new Date(selectedMessage.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
              {selectedMessage.message}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMessageToDelete(selectedMessage.id)}
                className="text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5 self-start sm:self-auto rounded-xl px-3"
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
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mark as Read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("archived")}
                  className="text-xs font-semibold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 px-3 py-2"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-500" /> Archive
                </Button>
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                    selectedMessage.subject
                  )}`}
                  className="inline-block"
                >
                  <Button size="sm" variant="primary" className="text-xs font-bold rounded-xl shadow-sm gap-1.5 px-4 py-2">
                    <Reply className="w-3.5 h-3.5" /> Reply via Email
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Modern Custom Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(messageToDelete)}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
        title="Delete Contact Message?"
        description="Are you sure you want to permanently delete this message submission? This action cannot be undone."
        onConfirm={confirmDeleteMessage}
      />
    </div>
  );
}
