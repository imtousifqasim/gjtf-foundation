"use client";

import * as React from "react";
import Link from "next/link";
import {
  Receipt,
  Download,
  Printer,
  FileText,
  Calendar,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDonorDonationsAction } from "@/app/actions/donorPortal";

export default function DonorReceiptsPage() {
  const [loading, setLoading] = React.useState(true);
  const [completedDonations, setCompletedDonations] = React.useState<any[]>([]);
  const [selectedYear, setSelectedYear] = React.useState("2026");

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getDonorDonationsAction({ status: "completed" });
      setCompletedDonations(res.donations || []);
      setLoading(false);
    }
    load();
  }, []);

  const filteredForYear = completedDonations.filter((d) => {
    if (!d.created_at) return false;
    return new Date(d.created_at).getFullYear().toString() === selectedYear;
  });

  const totalYearPkr = filteredForYear
    .filter((d) => (d.currency || "PKR").toUpperCase() === "PKR")
    .reduce((acc, d) => acc + (Number(d.amount) || 0), 0);

  const totalYearAed = filteredForYear
    .filter((d) => (d.currency || "").toUpperCase() === "AED")
    .reduce((acc, d) => acc + (Number(d.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
            Official Tax Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Download individual receipts or consolidated annual statements for tax exemption purposes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Page
          </Button>
        </div>
      </div>

      {/* Annual Statement Generator Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Annual Giving Certificate
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
              Annual Tax Exemption Statement ({selectedYear})
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Consolidated official statement of all fulfilled Zakat, Sadqah, and general educational contributions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="2026" className="text-slate-900">Tax Year 2026</option>
              <option value="2025" className="text-slate-900">Tax Year 2025</option>
              <option value="2024" className="text-slate-900">Tax Year 2024</option>
            </select>
          </div>
        </div>

        {/* Year Summary Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 block mb-0.5">Total Contributions ({selectedYear})</span>
            <span className="text-lg font-bold font-mono text-emerald-300">
              PKR {totalYearPkr.toLocaleString()}
            </span>
          </div>
          {totalYearAed > 0 && (
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <span className="text-slate-400 block mb-0.5">Overseas Total ({selectedYear})</span>
              <span className="text-lg font-bold font-mono text-blue-300">
                AED {totalYearAed.toLocaleString()}
              </span>
            </div>
          )}
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 block mb-0.5">Eligible Verified Gifts</span>
            <span className="text-lg font-bold font-mono text-white">
              {filteredForYear.length} Verified Receipt(s)
            </span>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Fulfilled Donations &amp; Downloadable Receipts
          </h3>
          <span className="text-xs text-slate-500">
            {completedDonations.length} total receipt(s)
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading your verified receipts...</p>
          </div>
        ) : completedDonations.length === 0 ? (
          <div className="py-20 text-center space-y-3 max-w-sm mx-auto">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">No Verified Receipts Yet</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              When your bank transfer or doorstep cash collection pledge is verified by accounts, your official numbered receipt will appear here.
            </p>
            <Link href="/donor/dashboard">
              <Button size="sm" variant="outline" className="rounded-xl text-xs font-semibold mt-2">
                View Pending Pledges
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Receipt No.</th>
                  <th className="py-3.5 px-4">Date Fulfilled</th>
                  <th className="py-3.5 px-4">Cause</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Official Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {completedDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-900">
                      {d.receipt_no || `RCP-${d.id.slice(-6).toUpperCase()}`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {d.paid_at ? new Date(d.paid_at).toLocaleDateString() : d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      {d.cause}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[11px]">
                        {d.donation_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-800 font-mono text-sm">
                      {d.currency} {Number(d.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <Link href={`/receipt/${d.id}`} target="_blank">
                        <Button
                          size="sm"
                          className="h-8 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          View Receipt &rarr;
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
