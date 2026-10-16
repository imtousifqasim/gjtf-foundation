"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Shield,
  Loader2,
  Calendar,
  Heart,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminDonorsAction } from "@/app/actions/adminDonors";

export default function AdminDonorsPage() {
  const [loading, setLoading] = React.useState(true);
  const [donors, setDonors] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [unmaskData, setUnmaskData] = React.useState(false);

  const fetchDonors = React.useCallback(async (p: number) => {
    setLoading(true);
    const res = await getAdminDonorsAction({
      page: p,
      search,
      status: statusFilter,
    });
    setDonors(res.donors);
    setTotal(res.total);
    setPage(res.page);
    setTotalPages(res.totalPages || 1);
    setLoading(false);
  }, [search, statusFilter]);

  React.useEffect(() => {
    fetchDonors(1);
  }, [fetchDonors]);

  // Least-privilege masking function (Section 14.3)
  const maskEmail = (email: string) => {
    if (unmaskData || !email) return email;
    const [local, domain] = email.split("@");
    if (!domain) return email;
    return `${local.slice(0, 1)}***@${domain}`;
  };

  const maskPhone = (phone: string | null) => {
    if (unmaskData || !phone) return phone || "—";
    if (phone.length < 7) return phone;
    return `${phone.slice(0, 5)} *** *** ${phone.slice(-3)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Donor Accounts &amp; Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered and automatic supporters contributing to GJTF educational units.
          </p>
        </div>

        {/* Privacy Unmask Toggle */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setUnmaskData(!unmaskData)}
            className={`rounded-xl text-xs font-bold gap-1.5 ${
              unmaskData ? "border-amber-400 bg-amber-50 text-amber-900" : "border-slate-200 text-slate-600"
            }`}
          >
            {unmaskData ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
            {unmaskData ? "Mask PII (Audited)" : "Reveal PII (Audited)"}
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <Input
            placeholder="Search by donor name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Donors Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Retrieving donor directory...</p>
          </div>
        ) : donors.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No donors found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Donor Details</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4 text-right">PKR Given</th>
                  <th className="py-3.5 px-4 text-right">AED Given</th>
                  <th className="py-3.5 px-4 text-center">Fulfillments</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {donors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {d.name || "Anonymous Donor"}
                        {d.prefers_anonymous ? (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-normal">
                            Anon
                          </span>
                        ) : null}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        {maskEmail(d.email)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {maskPhone(d.phone)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-800 font-mono">
                      PKR {Number(d.total_pkr).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-blue-800 font-mono">
                      AED {Number(d.total_aed).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-700">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold">
                        {d.completed_donations_count}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          d.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <Link href={`/admin/donors/${d.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-bold rounded-xl hover:bg-slate-100"
                        >
                          View Profile &rarr;
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {donors.length} of {total} donors
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => fetchDonors(page - 1)}
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
                onClick={() => fetchDonors(page + 1)}
                className="h-8 rounded-lg text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
