import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { query } from "@/lib/db/mysql";
import { formatCurrencyAmount } from "@/lib/email/templates/donationTemplates";
import ReceiptPrintButton from "./ReceiptPrintButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Donation Receipt #${id} | GJTF Foundation`,
    description: `Official tax-exempt donation receipt for Ghais Jhuggi Taleem Foundation.`,
  };
}

export default async function DonationReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const [donations]: any = await query(
    "SELECT * FROM donations WHERE id = ? LIMIT 1",
    [decodedId]
  );

  if (!donations || donations.length === 0) {
    notFound();
  }

  const donation = donations[0];
  const donorName = donation.donor_name && donation.donor_name.trim() ? donation.donor_name : "Anonymous Supporter";
  const formattedAmt = formatCurrencyAmount(donation.amount, donation.currency);
  const receiptDate = new Date(donation.created_at || Date.now()).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const receiptNo = `GJTF-REC-${donation.id.slice(-8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation & Print Controls (Hidden on print) */}
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 hover:text-primary-700 transition-colors flex items-center gap-1.5"
          >
            &larr; Back to gjtfoundation.com
          </Link>
          <ReceiptPrintButton receiptNo={receiptNo} />
        </div>

        {/* Printable Official Receipt Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0b1536] via-[#1e3a8a] to-[#0b1536] text-white p-8 sm:p-10 border-b-4 border-blue-600 print:bg-slate-900 print:text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div>
                <Image
                  src="/images/Ghais-Jhuggi-Taleeem-Foundation-Logo.webp"
                  alt="Ghais Jhuggi Taleem Foundation"
                  width={240}
                  height={65}
                  className="h-12 w-auto object-contain mx-auto sm:mx-0"
                  priority
                />
                <p className="text-xs text-blue-200 font-medium mt-2">
                  Jhuggi Taleemi Project • Established 2014
                </p>
              </div>
              <div className="sm:text-right">
                <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Official Donation Receipt
                </span>
                <div className="font-mono text-sm font-bold text-white tracking-wide">
                  {receiptNo}
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Date: {receiptDate}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 sm:p-10 space-y-8">
            {/* Amount Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Total Amount Received
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-950 mt-0.5">
                  {formattedAmt}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider">
                  Payment Status: {donation.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Donation Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm">
              <div>
                <span className="text-xs text-slate-500 block font-medium">Donor Name:</span>
                <span className="font-bold text-slate-900 text-base">{donorName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Allocated Cause / Project:</span>
                <span className="font-semibold text-primary-700 text-base">{donation.cause}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Donation Type / Category:</span>
                <span className="font-medium text-slate-800">{donation.donation_type || "General Education"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Pledge Frequency:</span>
                <span className="font-medium text-slate-800 capitalize">{donation.frequency || "One-Time"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Pledge Reference ID:</span>
                <span className="font-mono font-medium text-slate-800">#{donation.id}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Country / Origin:</span>
                <span className="font-medium text-slate-800">{donation.country || "Pakistan"}</span>
              </div>
            </div>

            {/* Tax / NGO Certification Note */}
            <div className="border-t border-slate-200 pt-6 space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Tax Exemption Note:</strong> Ghais Jhuggi Taleem Foundation (GJTF) is a registered non-profit organization 
                operating nationwide across Pakistan dedicated to the educational upliftment of over 20 million nomadic community members. 
                Donations made are eligible for tax exemption under applicable non-profit laws.
              </p>
              <p>
                Thank you for empowering vulnerable children with quality education, notebooks, weatherproof classrooms, and hot meals.
              </p>
            </div>

            {/* Signatures & Seal */}
            <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div>
                <div className="font-bold text-slate-900 text-sm">Ghais Jhuggi Taleem Foundation</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Registered Non-Profit NGO • Head Office Lahore, Pakistan<br/>
                  UAN / Toll-Free: 0800-00823 • Web: www.gjtfoundation.com
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="inline-block border-b-2 border-slate-800 pb-1 px-6 font-serif italic text-slate-900 font-bold text-sm">
                  Tousif Qasim
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Authorized Signatory
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
