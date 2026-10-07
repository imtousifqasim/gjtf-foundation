"use client";

import * as React from "react";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateDonationStatus, deleteDonation } from "@/app/actions/admin";
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

const INITIAL_RECORDS: DonationRecord[] = [
  {
    id: "dn-101",
    created_at: "2025-02-14T10:30:00Z",
    cause: "Support a Classroom",
    frequency: "monthly",
    currency: "PKR",
    amount: 20000,
    donation_type: "Zakat",
    country: "Pakistan",
    donor_name: "Farhan Malik",
    donor_email: "farhan@example.com",
    donor_phone: "0300-1122334",
    status: "completed",
    payment_reference: "MEZN-99382",
  },
  {
    id: "dn-102",
    created_at: "2025-02-14T08:15:00Z",
    cause: "Educate a Child",
    frequency: "once",
    currency: "PKR",
    amount: 5000,
    donation_type: "Sadqah",
    country: "Pakistan",
    donor_name: "Ayesha Siddiqui",
    donor_email: "ayesha@example.com",
    donor_phone: "0321-9988776",
    status: "pending",
    payment_reference: null,
  },
  {
    id: "dn-103",
    created_at: "2025-02-13T16:45:00Z",
    cause: "General Education",
    frequency: "monthly",
    currency: "AED",
    amount: 300,
    donation_type: "General",
    country: "United Arab Emirates",
    donor_name: "Tariq Mahmood",
    donor_email: "tariq.dxb@example.com",
    donor_phone: "+971-50-1234567",
    status: "completed",
    payment_reference: "STRIPE-AED-204",
  },
  {
    id: "dn-104",
    created_at: "2025-02-12T11:20:00Z",
    cause: "Support a Child: KG to Matric",
    frequency: "once",
    currency: "PKR",
    amount: 15000,
    donation_type: "Zakat",
    country: "United Kingdom",
    donor_name: "Dr. Bilal Tariq",
    donor_email: "bilal.t@example.co.uk",
    donor_phone: "+44-7700-900123",
    status: "completed",
    payment_reference: "BK-TRANSFER-91",
  },
];

export default function AdminDonationsPage() {
  const [donations, setDonations] = React.useState<DonationRecord[]>(INITIAL_RECORDS);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("All");
  const [causeFilter, setCauseFilter] = React.useState<string>("All");
  const [selectedDonation, setSelectedDonation] = React.useState<DonationRecord | null>(null);
  const [donationToDelete, setDonationToDelete] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/data/donations", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setDonations(json.data);
          }
        }
      } catch (err) {
        console.error("Hostinger MySQL load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStatusChange = async (newStatus: "pending" | "completed" | "failed") => {
    if (!selectedDonation) return;
    const res = await updateDonationStatus(selectedDonation.id, newStatus);
    setDonations((prev) =>
      prev.map((d) =>
        d.id === selectedDonation.id ? { ...d, status: newStatus } : d
      )
    );
    setSelectedDonation((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  const handleDelete = async () => {
    if (!donationToDelete) return;
    const res = await deleteDonation(donationToDelete);
    if (res.success) {
      setDonations((prev) => prev.filter((d) => d.id !== donationToDelete));
      if (selectedDonation?.id === donationToDelete) {
        setSelectedDonation(null);
      }
    }
    setDonationToDelete(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Donations Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track, verify, update, and export all online and bank donation pledges.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={exportCSV}
          className="gap-2 px-5 py-2.5 font-bold self-start sm:self-auto shadow-sm rounded-xl hover:shadow"
        >
          <Download className="w-4 h-4" /> Export CSV ({filteredDonations.length})
        </Button>
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
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Cause</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDonations.length > 0 ? (
              filteredDonations.map((donation) => (
                <TableRow
                  key={donation.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelectedDonation(donation)}
                >
                  <TableCell className="text-xs font-medium text-slate-500">
                    {new Date(donation.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm text-slate-900">
                      {donation.donor_name || "Anonymous Donor"}
                    </div>
                    <div className="text-xs text-slate-500">{donation.donor_email || "—"}</div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">
                    {donation.cause}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-sm text-primary-700">
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
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDonation(donation);
                      }}
                      className="h-8 px-2 hover:bg-slate-100 text-primary-700"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDonationToDelete(donation.id);
                      }}
                      className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      title="Delete Donation Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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

      {/* Donation Detail Dialog */}
      <Dialog
        open={Boolean(selectedDonation)}
        onOpenChange={(open) => !open && setSelectedDonation(null)}
      >
        {selectedDonation && (
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-slate-900">Pledge Details</DialogTitle>
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
              <DialogDescription className="text-slate-500">
                Pledge ID: <code className="font-mono text-slate-700">{selectedDonation.id}</code> • Logged on{" "}
                {new Date(selectedDonation.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Donor Name</span>
                <span className="font-bold text-slate-900">
                  {selectedDonation.donor_name || "Anonymous Donor"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Email Address</span>
                <span className="font-medium text-slate-900">
                  {selectedDonation.donor_email || "Not provided"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Phone Number</span>
                <span className="font-medium text-slate-900">
                  {selectedDonation.donor_phone || "Not provided"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Donor Country</span>
                <span className="font-medium text-slate-900">{selectedDonation.country}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Cause</span>
                <span className="font-bold text-primary-700">{selectedDonation.cause}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Amount & Currency</span>
                <span className="font-bold font-mono text-primary-700">
                  {selectedDonation.currency} {selectedDonation.amount.toLocaleString()} (
                  {selectedDonation.frequency})
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Type</span>
                <span className="font-medium text-slate-900">
                  {selectedDonation.donation_type}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Payment Reference</span>
                <span className="font-mono text-xs text-slate-900">
                  {selectedDonation.payment_reference || "Direct pledge / Pending gateway"}
                </span>
              </div>
            </div>

            {/* Change Status Controls & Delete Option */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Change Pledge Status:
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
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
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
                    <Clock className="w-3.5 h-3.5" /> Pending
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

              <div className="pt-2 sm:pt-0 sm:self-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDonationToDelete(selectedDonation.id)}
                  className="rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Pledge
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Modern Custom Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(donationToDelete)}
        onOpenChange={(open) => !open && setDonationToDelete(null)}
        title="Delete Donation Record?"
        description="Are you sure you want to permanently delete this donation pledge? This will remove all associated donor information and records from the database."
        onConfirm={handleDelete}
      />
    </div>
  );
}
