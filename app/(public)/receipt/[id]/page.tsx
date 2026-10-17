import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { query, getSiteSettingsDb } from "@/lib/db/mysql";
import { formatCurrencyAmount } from "@/lib/email/templates/donationTemplates";
import siteConfig from "@/lib/siteConfig";
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
    description: `Official donation receipt for Ghais Jhuggi Taleem Foundation.`,
  };
}

export default async function DonationReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id).trim();

  const [rows, settings] = await Promise.all([
    query<any[]>(
      `SELECT d.*, r.receipt_no, r.access_token as receipt_token, r.issued_at
       FROM donations d
       LEFT JOIN receipts r ON d.id = r.donation_id
       WHERE d.id = ? OR d.reference_no = ?
       LIMIT 1`,
      [decodedId, decodedId]
    ),
    getSiteSettingsDb(),
  ]);

  if (!rows || rows.length === 0) {
    notFound();
  }

  const donation = rows[0];
  const donorName = donation.donor_name && donation.donor_name.trim() ? donation.donor_name : "Anonymous Supporter";
  const formattedAmt = formatCurrencyAmount(donation.amount, donation.currency);
  const receiptDate = new Date(donation.paid_at || donation.confirmed_at || donation.created_at || Date.now()).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const receiptNo = donation.receipt_no || `GJTF-REC-${String(donation.reference_no || donation.id || "").replace(/^GJTF-/, "").toUpperCase()}`;

  const showChairman = settings ? settings.show_chairman_in_receipts !== false && settings.show_chairman_in_receipts !== (0 as any) : true;
  const showPhone = settings ? settings.show_phone_in_receipts !== false && settings.show_phone_in_receipts !== (0 as any) : true;
  const showWhatsapp = settings ? settings.show_whatsapp_in_receipts !== false && settings.show_whatsapp_in_receipts !== (0 as any) : true;
  const showEmail = settings ? settings.show_email_in_receipts !== false && settings.show_email_in_receipts !== (0 as any) : true;
  const showAddress = settings ? settings.show_address_in_receipts !== false && settings.show_address_in_receipts !== (0 as any) : true;

  const chairmanName = settings?.chairman_name || "Mubashir Hussain Chand";
  const chairmanTitle = settings?.chairman_title || "Chairman, Ghais Jhuggi Taleem Foundation";
  const phoneDisplay = settings?.telephone || settings?.mobile || siteConfig.phone1.display;
  const whatsappDisplay = settings?.whatsapp || siteConfig.phone2.display;
  const emailDisplay = settings?.email || siteConfig.email.address;
  const addressDisplay = settings?.head_office_address || siteConfig.address;

  return (
    <>
      {/* Scoped Print Styles: Guarantees that only the receipt card prints, hiding all website layout elements */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              /* Strictly hide site header, top utility bar, footer, and any navigation elements */
              header,
              footer,
              nav,
              aside,
              .print\\:hidden,
              [role="navigation"],
              #site-header,
              #site-footer {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
              }

              /* Reset page canvas so ONLY the receipt card occupies the paper */
              html, body {
                background: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                min-height: auto !important;
                height: auto !important;
              }

              main {
                padding: 0 !important;
                margin: 0 !important;
              }

              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }

              .receipt-wrapper {
                padding: 0 !important;
                margin: 0 !important;
                min-height: auto !important;
                background: transparent !important;
              }

              .receipt-card {
                box-shadow: none !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              /* Enforce exact colors and background graphics for printing */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `,
        }}
      />

      <div className="receipt-wrapper min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
        <div className="max-w-3xl mx-auto space-y-6 print:space-y-0 print:max-w-none">
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
          <div className="receipt-card bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          {/* Header with High-Contrast White Logo Card Container */}
          <div className="bg-gradient-to-r from-[#0b1536] via-[#1e3a8a] to-[#0b1536] text-white p-8 sm:p-10 border-b-4 border-blue-600 print:bg-slate-900 print:text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div>
                <div className="bg-white rounded-2xl p-2.5 sm:p-3 inline-block shadow-md">
                  <Image
                    src="/images/Ghais-Jhuggi-Taleeem-Foundation-Logo.webp"
                    alt="Ghais Jhuggi Taleem Foundation"
                    width={220}
                    height={58}
                    className="h-10 sm:h-12 w-auto object-contain"
                    priority
                  />
                </div>
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
                <span className="text-xs text-slate-500 block font-medium">Educational Impact:</span>
                <span className="font-bold text-emerald-800">
                  {donation.children_equivalent ? `${donation.children_equivalent} child-month(s) of schooling` : `${Math.max(1, Math.round(Number(donation.amount) / 5000))} child-month(s) of schooling`}
                </span>
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
                <span className="text-xs text-slate-500 block font-medium">Official Reference No:</span>
                <span className="font-mono font-bold text-slate-900">{donation.reference_no || `#${donation.id}`}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Official Depository Bank:</span>
                <span className="font-medium text-slate-800">Bank Islami (Allama Iqbal Town, Lahore)</span>
              </div>
            </div>

            {/* Official Foundation Acknowledgment Note (No tax references) */}
            <div className="border-t border-slate-200 pt-6 space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Official Foundation Certification:</strong> Ghais Jhuggi Taleem Foundation (GJTF) is a registered charitable 
                trust and non-profit foundation operating nationwide across Pakistan, dedicated to providing free, high-quality education 
                and welfare to deserving children across nomadic (jhuggi) settlements.
              </p>
              <p>
                Thank you for empowering vulnerable children with quality education, notebooks, weatherproof classrooms, and hot meals.
              </p>
            </div>

            {/* Signatures & Seal */}
            <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div>
                <div className="font-bold text-slate-900 text-sm">Ghais Jhuggi Taleem Foundation</div>
                <div className="text-xs text-slate-500 mt-0.5 space-y-0.5">
                  <div>{siteConfig.status} {showAddress ? `• ${addressDisplay}` : ""}</div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-0.5">
                    {showPhone && <span>Phone: {phoneDisplay}</span>}
                    {showPhone && showWhatsapp && <span>|</span>}
                    {showWhatsapp && <span>WhatsApp: {whatsappDisplay}</span>}
                    {showEmail && <span>| Email: {emailDisplay}</span>}
                    <span>• Web: gjtfoundation.com</span>
                  </div>
                </div>
              </div>
              {showChairman && (
                <div className="text-center sm:text-right">
                  <div className="inline-block border-b-2 border-slate-800 pb-1 px-6 font-serif italic text-slate-900 font-bold text-sm">
                    {chairmanName}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                    {chairmanTitle}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
    </>
  );
}
