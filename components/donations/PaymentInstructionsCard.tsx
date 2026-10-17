"use client";

import * as React from "react";
import { Building, Copy, Check, Phone, AlertCircle, ShieldCheck } from "lucide-react";
import { BankAccountRecord, DEFAULT_BANK_ISLAMI } from "@/lib/types/bankAccount";

interface PaymentInstructionsCardProps {
  referenceNo: string;
  amountPkr: number;
  bankAccount?: BankAccountRecord | null;
  cause?: string;
  frequency?: string;
}

export function PaymentInstructionsCard({
  referenceNo,
  amountPkr,
  bankAccount,
  cause,
  frequency,
}: PaymentInstructionsCardProps) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const bank = bankAccount || DEFAULT_BANK_ISLAMI;

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-warm-200 shadow-soft overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-800 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-700/60 text-primary-200 text-xs font-semibold tracking-wide uppercase border border-primary-500/30">
              <Building className="w-3.5 h-3.5 text-primary-300" />
              Official Bank Transfer
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold font-heading mt-2">
              Bank Payment Instructions
            </h2>
            <p className="text-primary-100/90 text-xs sm:text-sm mt-1">
              Transfer <strong>PKR {amountPkr.toLocaleString()}</strong> using online banking, ATM, or counter deposit.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-right sm:text-right">
            <span className="text-[11px] uppercase tracking-wider text-primary-200 font-bold block">
              Pledge Reference
            </span>
            <div className="flex items-center gap-2 mt-1 justify-end">
              <span className="font-mono text-lg sm:text-xl font-extrabold text-white">
                {referenceNo}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(referenceNo, "ref")}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="Copy Reference"
              >
                {copiedKey === "ref" ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details Grid */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* CRITICAL NOTICE: Remarks */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
            <strong className="block font-bold mb-0.5">Critical Transfer Remark:</strong>
            Please write reference number <code className="bg-amber-100 text-amber-950 font-bold px-1.5 py-0.5 rounded font-mono">{referenceNo}</code> in your banking app&apos;s <strong>Description / Purpose / Remarks</strong> field so our system matches your transaction immediately.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Account Title */}
          <div className="p-4 rounded-2xl bg-warm-50 border border-warm-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-charcoal-muted uppercase font-bold tracking-wider block">
                Account Title
              </span>
              <span className="font-bold text-sm sm:text-base text-charcoal-deep block mt-0.5">
                {bank.account_title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(bank.account_title, "title")}
              className="p-2 rounded-xl text-primary-700 hover:bg-primary-50 transition-colors"
              title="Copy Account Title"
            >
              {copiedKey === "title" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Bank & Branch */}
          <div className="p-4 rounded-2xl bg-warm-50 border border-warm-200">
            <span className="text-xs text-charcoal-muted uppercase font-bold tracking-wider block">
              Bank &amp; Branch
            </span>
            <span className="font-bold text-sm sm:text-base text-charcoal-deep block mt-0.5">
              {bank.bank_name}
            </span>
            <span className="text-xs text-charcoal-muted block mt-0.5">
              {bank.branch}
            </span>
          </div>

          {/* Account Number */}
          <div className="p-4 rounded-2xl bg-warm-50 border border-warm-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-charcoal-muted uppercase font-bold tracking-wider block">
                Account Number
              </span>
              <span className="font-mono font-extrabold text-base sm:text-lg text-primary-800 block mt-0.5 tracking-wide">
                {bank.account_number}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(bank.account_number, "acc")}
              className="p-2 rounded-xl text-primary-700 hover:bg-primary-50 transition-colors"
              title="Copy Account Number"
            >
              {copiedKey === "acc" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* IBAN */}
          <div className="p-4 rounded-2xl bg-warm-50 border border-warm-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-charcoal-muted uppercase font-bold tracking-wider block">
                IBAN (Raast &amp; International)
              </span>
              <span className="font-mono font-extrabold text-sm sm:text-base text-primary-800 block mt-0.5 tracking-wider">
                {bank.iban}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(bank.iban, "iban")}
              className="p-2 rounded-xl text-primary-700 hover:bg-primary-50 transition-colors"
              title="Copy IBAN"
            >
              {copiedKey === "iban" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Doorstep Collection Option */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-700">
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-primary-700 flex-shrink-0" />
            <span>
              Prefer doorstep cash or cheque collection? Call our official helpline:{" "}
              <strong className="text-primary-800 font-bold">0800-00823</strong> /{" "}
              <strong className="text-primary-800 font-bold">04235236622</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">9 AM - 6 PM PKT</span>
        </div>
      </div>
    </div>
  );
}
