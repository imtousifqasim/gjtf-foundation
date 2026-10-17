"use client";

import * as React from "react";
import Link from "next/link";
import {
  Heart,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  FileText,
  Loader2,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Eye,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getDonorDonationsAction,
  getDonorDonationDetailAction,
} from "@/app/actions/donorPortal";

export default function DonorDonationsPage() {
  const [loading, setLoading] = React.useState(true);
  const [donations, setDonations] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [currencyFilter, setCurrencyFilter] = React.useState("All");
  const [typeFilter, setTypeFilter] = React.useState("All");
  const [yearFilter, setYearFilter] = React.useState("All");

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [selectedDonation, setSelectedDonation] = React.useState<any>(null);
  const [statusHistory, setStatusHistory] = React.useState<any[]>([]);
  const [donationProofs, setDonationProofs] = React.useState<any[]>([]);

  const fetchDonations = React.useCallback(async (p: number) => {
    try {
      setLoading(true);
      const res = await getDonorDonationsAction({
        page: p,
        status: statusFilter,
        currency: currencyFilter,
        donationType: typeFilter,
        year: yearFilter,
      });
      if (res && Array.isArray(res.donations)) {
        setDonations(res.donations);
        setTotal(res.total || 0);
        setPage(res.page || 1);
        setTotalPages(res.totalPages || 1);
      } else {
        setDonations([]);
        setTotal(0);
        setPage(1);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching donor donations:", err);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currencyFilter, typeFilter, yearFilter]);

  React.useEffect(() => {
    fetchDonations(1);
  }, [fetchDonations]);

  const handleOpenDetail = async (donationId: string) => {
    try {
      setDetailLoading(true);
      setDetailModalOpen(true);
      setSelectedDonation(null);
      setStatusHistory([]);
      setDonationProofs([]);

      const res = await getDonorDonationDetailAction(donationId);
      setDetailLoading(false);
      if (res && res.success) {
        setSelectedDonation(res.donation);
        setStatusHistory(res.history || []);
        setDonationProofs((res as any).proofs || []);
      }
    } catch (err) {
      console.error("Error opening donation detail:", err);
      setDetailLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Verification
          </span>
        );
    }
  };

  const getProofBadge = (proofStatus?: string, status?: string) => {
    if (status === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Proof Verified
        </span>
      );
    }
    switch (proofStatus) {
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> Under Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Proof Rejected
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Proof Verified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Pending Proof
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            My Donation History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Every contribution pledged and fulfilled for nomadic children across Pakistan.
          </p>
        </div>

        <Link href="/donate-now">
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm">
            <Heart className="w-3.5 h-3.5 mr-1.5 fill-current" />
            Make a New Pledge
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-500 font-semibold mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Currency</label>
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Currencies</option>
            <option value="PKR">PKR (Pakistan)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Category</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Categories</option>
            <option value="General">General Donation</option>
            <option value="Zakat">Zakat</option>
            <option value="Sadqah">Sadqah</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Year</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Retrieving your pledges...</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="py-20 text-center space-y-3 max-w-sm mx-auto">
            <Heart className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Donations Found</h3>
            <p className="text-xs text-slate-500">
              No donation pledges matched your selected filters. You can make a contribution to educate nomadic children anytime.
            </p>
            <Link href="/donate-now">
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold mt-2">
                Make a Donation &rarr;
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Date</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Cause / Commitment</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Payment Proof</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 text-slate-600 whitespace-nowrap">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {d.reference_no || d.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 max-w-xs truncate">
                      {d.cause}
                      {d.frequency === "monthly" && (
                        <span className="ml-1 text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                          Monthly
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {d.donation_type}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                      {d.currency} {Number(d.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(d.status)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getProofBadge(d.proof_status, d.status)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap space-x-1.5">
                      <Link href={`/donor/donations/${d.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] rounded-lg border-emerald-300 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 font-semibold"
                        >
                          <Eye className="w-3 h-3 mr-1" /> View / Proof
                        </Button>
                      </Link>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(d.id)}
                        className="h-7 text-[11px] rounded-lg text-slate-700 border-slate-200"
                      >
                        Timeline
                      </Button>

                      {d.status === "completed" && (
                        <Link href={`/receipt/${d.reference_no || d.id}`} target="_blank">
                          <Button
                            size="sm"
                            className="h-7 text-[11px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                          >
                            <Receipt className="w-3 h-3 mr-1" /> Official Receipt
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {donations.length} of {total} records
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => fetchDonations(page - 1)}
                className="h-8 rounded-lg text-xs"
              >
                Previous
              </Button>
              <span className="px-2 font-bold text-slate-900">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => fetchDonations(page + 1)}
                className="h-8 rounded-lg text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Donation Detail Modal (Status Timeline) */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold font-heading text-slate-900">
                Pledge Status &amp; Timeline
              </h3>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
              </div>
            ) : selectedDonation ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedDonation.reference_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cause:</span>
                    <span className="font-semibold text-slate-800">{selectedDonation.cause}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount:</span>
                    <span className="font-bold text-emerald-800 text-sm">
                      {selectedDonation.currency} {Number(selectedDonation.amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span>{selectedDonation.donation_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span>{getStatusBadge(selectedDonation.status)}</span>
                  </div>
                  {selectedDonation.payment_reference && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Reference:</span>
                      <span className="font-mono text-slate-900">{selectedDonation.payment_reference}</span>
                    </div>
                  )}
                </div>

                {/* Payment Proofs History Section */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Payment Verification &amp; Proofs
                    </h4>
                    <Link href={`/donor/donations/${selectedDonation.id}`}>
                      <span className="text-[11px] font-bold text-emerald-700 hover:underline">
                        Upload / Manage &rarr;
                      </span>
                    </Link>
                  </div>

                  {donationProofs.length === 0 ? (
                    <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/70 text-slate-700 space-y-2">
                      <p className="text-[11px]">
                        No payment proof screenshot has been submitted yet for this pledge.
                      </p>
                      <Link href={`/donor/donations/${selectedDonation.id}`}>
                        <Button size="sm" className="h-7 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl">
                          <Upload className="w-3 h-3 mr-1" /> Upload Payment Screenshot
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {donationProofs.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-slate-800 text-[11px] font-mono flex items-center gap-1.5 truncate">
                              <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{p.filename}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Uploaded: {new Date(p.uploaded_at).toLocaleString()}
                              {p.sender_bank && ` • Bank: ${p.sender_bank}`}
                              {p.transaction_ref && ` • Ref: ${p.transaction_ref}`}
                            </div>
                            {p.reject_reason && (
                              <div className="text-[10px] font-semibold text-rose-600">
                                Reason: {p.reject_reason}
                              </div>
                            )}
                          </div>
                          <div className="shrink-0">
                            {p.status === "approved" ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Verified
                              </span>
                            ) : p.status === "rejected" ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                Rejected
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Under Review
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Timeline */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                    Audit Status History
                  </h4>
                  {statusHistory.length === 0 ? (
                    <p className="text-slate-400 italic">No status transitions recorded.</p>
                  ) : (
                    <div className="space-y-3 border-l-2 border-emerald-500 pl-3">
                      {statusHistory.map((h) => (
                        <div key={h.id} className="relative space-y-0.5">
                          <div className="text-[11px] font-bold text-slate-900 capitalize">
                            Status: {h.new_status}
                          </div>
                          {h.note && <div className="text-slate-600">{h.note}</div>}
                          <div className="text-[10px] text-slate-400">
                            {new Date(h.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link href={`/donor/donations/${selectedDonation.id}`}>
                    <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl border-slate-200">
                      <Eye className="w-3.5 h-3.5 mr-1" /> View Full Proofs &amp; Details
                    </Button>
                  </Link>

                  {selectedDonation.status === "completed" && (
                    <Link href={`/receipt/${selectedDonation.id}`} target="_blank">
                      <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs">
                        <Receipt className="w-3.5 h-3.5 mr-1" />
                        Download Tax Receipt
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-6">Record not found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
