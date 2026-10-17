"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart,
  Building,
  Phone,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Loader2,
  Copy,
  Check,
  Plus,
  Minus,
  Info,
} from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/data/countries";
import { media } from "@/data/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { submitDonation, DonationInput } from "@/app/actions/donations";
import { validateEmail, validatePhoneNumber } from "@/lib/validation";
import { ValidationFeedback } from "@/components/shared/ValidationFeedback";
import { calculateImpact, DEFAULT_PRICING } from "@/lib/pricing/impact";
import siteConfig from "@/lib/siteConfig";

const CAUSES = [
  {
    id: "General Education",
    label: "General Education",
    desc: "Custom pooled amount supporting literacy across all nomadic communities",
  },
  {
    id: "Educate a Child",
    label: "Educate a Child",
    desc: "PKR 5,000/child/month — covers tuition, books, uniform & warm meals",
  },
  {
    id: "Support a Classroom",
    label: "Support a Classroom",
    desc: "30 students learning unit — PKR 150,000/month",
  },
  {
    id: "Support a Child: KG to Matric",
    label: "Support a Child: KG to Matric",
    desc: "Long-term 10-year sponsorship (120 months) — pause or cancel anytime",
  },
] as const;

// Business rule: 1 child = PKR 5,000
const PRESET_CHILDREN = [1, 2, 5, 10, 30, 50];

export default function DonateNowPage() {
  const router = useRouter();
  const [cause, setCause] = React.useState<DonationInput["cause"]>("Educate a Child");
  const [frequency, setFrequency] = React.useState<"monthly" | "once">("monthly");
  const currency = "PKR";

  // Child-months & amount state (stay in sync)
  const [childrenCount, setChildrenCount] = React.useState<number>(1);
  const [amount, setAmount] = React.useState<number>(5000);
  const [isCustomAmount, setIsCustomAmount] = React.useState<boolean>(false);
  const [customInputStr, setCustomInputStr] = React.useState<string>("5000");

  const [donationType, setDonationType] = React.useState<"General" | "Zakat" | "Sadqah">("General");
  const [country, setCountry] = React.useState<string>(DEFAULT_COUNTRY);
  const [paymentMethod, setPaymentMethod] = React.useState<"bank_transfer" | "doorstep">("bank_transfer");

  // Donor Contact Info
  const [donorName, setDonorName] = React.useState("");
  const [donorEmail, setDonorEmail] = React.useState("");
  const [donorPhone, setDonorPhone] = React.useState("");
  const [donorMessage, setDonorMessage] = React.useState("");

  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = React.useState<string | null>(null);
  const [phoneError, setPhoneError] = React.useState<string | null>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [submittedData, setSubmittedData] = React.useState<any | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Copy buttons state
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // Idempotency key for preventing double clicks
  const [idempotencyKey] = React.useState(() => "idemp_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36));

  // Sync effect when cause changes
  React.useEffect(() => {
    if (cause === "Support a Classroom") {
      setChildrenCount(30);
      updateAmountFromChildren(30);
    } else if (cause === "Support a Child: KG to Matric") {
      setChildrenCount(1);
      updateAmountFromChildren(1);
    }
  }, [cause]);

  // Sync helpers (PKR only)
  function updateAmountFromChildren(numChildren: number) {
    const pkr = Math.round(numChildren * DEFAULT_PRICING.costPerChildMonthPkr);
    setAmount(pkr);
    setCustomInputStr(String(pkr));
    setIsCustomAmount(false);
  }

  function handleSelectPreset(numChildren: number) {
    setChildrenCount(numChildren);
    updateAmountFromChildren(numChildren);
  }

  function handleAmountInputChange(val: string) {
    setCustomInputStr(val);
    const num = Number(val) || 0;
    setAmount(num);
    setIsCustomAmount(true);

    const calcChildren = Math.round((num / DEFAULT_PRICING.costPerChildMonthPkr) * 10) / 10;
    setChildrenCount(Math.max(0.1, calcChildren));
  }

  function handleChildrenInputChange(val: string) {
    const count = Math.max(0.1, Number(val) || 0.1);
    setChildrenCount(count);
    updateAmountFromChildren(count);
  }

  // Calculate live impact
  const impact = calculateImpact(amount, frequency);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleEmailChange = (val: string) => {
    setDonorEmail(val);
    if (!val.trim()) {
      setEmailError(null);
      setEmailSuggestion(null);
      return;
    }
    const res = validateEmail(val);
    if (!res.valid) {
      setEmailError(res.error || null);
      setEmailSuggestion(res.suggestion || null);
    } else {
      setEmailError(null);
      setEmailSuggestion(null);
    }
  };

  const handlePhoneChange = (val: string) => {
    setDonorPhone(val);
    if (!val.trim()) {
      setPhoneError(null);
      return;
    }
    const res = validatePhoneNumber(val);
    if (!res.valid) {
      setPhoneError(res.error || null);
    } else {
      setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount < 500) {
      setErrorMsg("Please enter a donation amount of at least PKR 500.");
      return;
    }

    if (donorEmail.trim()) {
      const emailRes = validateEmail(donorEmail);
      if (!emailRes.valid) {
        setEmailError(emailRes.error || "Please enter a valid email address");
        setEmailSuggestion(emailRes.suggestion || null);
        return;
      }
    }

    if (donorPhone.trim()) {
      const phoneRes = validatePhoneNumber(donorPhone);
      if (!phoneRes.valid) {
        setPhoneError(phoneRes.error || "Please enter a valid phone number");
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await submitDonation({
      cause,
      frequency,
      currency,
      amount,
      children_count: childrenCount,
      pledge_basis: "pkr_fixed",
      payment_method: paymentMethod,
      donation_type: donationType,
      country,
      donor_name: donorName,
      donor_email: donorEmail,
      donor_phone: donorPhone,
      message: donorMessage,
      idempotency_key: idempotencyKey,
    });

    setSubmitting(false);
    if (res.success) {
      if (res.redirectUrl) {
        router.push(res.redirectUrl);
        return;
      }
      if (res.donorLoggedIn) {
        router.push("/donor/dashboard?pledge_success=" + encodeURIComponent(res.referenceNo));
        return;
      }
      setSubmittedData({
        referenceNo: res.referenceNo,
        amount,
        currency,
        cause,
        frequency,
        donationType,
        impact: res.impact || impact,
        fxLockNotice: res.fxLockNotice,
        bankAccount: res.bankAccount || siteConfig.bankAccount,
        redirectUrl: res.redirectUrl,
        isGuest: true,
      });
    } else {
      setErrorMsg(res.message || "An error occurred while submitting your pledge.");
    }
  };

  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* Hero Banner */}
      <section className="relative py-12 sm:py-16 md:py-20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={media.donateNow.heroBanner}
            alt="Children in school smiling"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/95 via-primary-900/90 to-charcoal-deep/80" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center text-white space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-800/40 text-primary-200 text-xs font-semibold tracking-wider uppercase border border-primary-500/30 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary-300" />
            100% Shariah Compliant Zakat & Sadqah
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading tracking-tight leading-tight">
            Educate a Nomadic Child in Pakistan
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-primary-100/90 leading-relaxed max-w-2xl mx-auto">
            Educating <strong>one child for one month costs PKR 5,000</strong> (including tuition, books, uniform, daily nutrition, and teacher pay). Every rupee directly lights a lamp of hope.
          </p>
        </div>
      </section>

      {/* Main Donation Container */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {submittedData ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-warm-200 shadow-xl text-center space-y-6 animate-in fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-charcoal-deep">
              JazakAllah Khair! Your Donation Pledge is Recorded
            </h2>

            <p className="text-sm sm:text-base text-charcoal-muted max-w-xl mx-auto leading-relaxed">
              Thank you for standing with nomadic children. Your official reference number is:
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-2xl">
              <span className="font-mono text-xl sm:text-2xl font-extrabold text-primary-800">
                {submittedData.referenceNo}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(submittedData.referenceNo, "ref")}
                className="text-primary-700 hover:text-primary-900 p-1"
                title="Copy Reference"
              >
                {copiedField === "ref" ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Impact Banner */}
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 max-w-lg mx-auto text-sm space-y-1">
              <div className="font-bold text-base flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                {submittedData.impact.headline}
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {submittedData.impact.summary}
              </p>
              {submittedData.fxLockNotice && (
                <div className="text-[11px] text-emerald-900/80 pt-2 border-t border-emerald-200/60 font-medium">
                  {submittedData.fxLockNotice}
                </div>
              )}
            </div>

            {/* Bank Islami Transfer Box */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white max-w-lg mx-auto text-left space-y-4 shadow-lg border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Official Bank Transfer Account
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  Bank Islami
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Account Title:</span>
                  <span className="font-bold text-slate-100">{submittedData.bankAccount.account_title || siteConfig.bankAccount.accountTitle}</span>
                </div>

                <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Account Number:</span>
                    <span className="font-mono font-bold text-sm text-white">
                      {submittedData.bankAccount.account_number || siteConfig.bankAccount.accountNumber}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                    onClick={() => handleCopy(submittedData.bankAccount.account_number || siteConfig.bankAccount.accountNumber, "acc")}
                  >
                    {copiedField === "acc" ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    Copy
                  </Button>
                </div>

                <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block text-[10px]">IBAN:</span>
                    <span className="font-mono font-bold text-xs text-white">
                      {submittedData.bankAccount.iban || siteConfig.bankAccount.iban}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                    onClick={() => handleCopy(submittedData.bankAccount.iban || siteConfig.bankAccount.iban, "iban")}
                  >
                    {copiedField === "iban" ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    Copy
                  </Button>
                </div>

                <div className="pt-2 text-[11px] text-amber-300 leading-relaxed bg-amber-950/40 p-2.5 rounded-xl border border-amber-900/40">
                  ⚠️ <strong>Important:</strong> Please write reference <strong>#{submittedData.referenceNo}</strong> in your transfer remarks so your pledge is automatically verified.
                </div>
              </div>
            </div>

            {/* Guest instructions per Issue 2 requirement */}
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 text-xs sm:text-sm font-medium max-w-lg mx-auto space-y-1">
              <p className="font-bold">✉️ Check your email to set your password and view your dashboard</p>
              <p className="text-[11px] text-emerald-800">
                We have sent an activation link to your inbox. Once verified, all your pledges will appear in your private donor space.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              {submittedData.redirectUrl && (
                <a href={submittedData.redirectUrl}>
                  <Button className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6">
                    Upload Payment Proof &rarr;
                  </Button>
                </a>
              )}
              <a href="/donor/login">
                <Button variant="outline" className="font-bold rounded-xl px-6">
                  Donor Login &rarr;
                </Button>
              </a>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setSubmittedData(null);
                  setDonorName("");
                  setDonorEmail("");
                  setDonorPhone("");
                }}
              >
                Make Another Pledge
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-warm-200 shadow-soft space-y-8"
          >
            {errorMsg && (
              <div className="p-4 text-sm text-red-700 bg-red-50 rounded-2xl border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* STEP 1: What to support */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold uppercase tracking-wider text-charcoal-deep">
                  Step 1: What to support *
                </label>
                <span className="text-xs text-primary-700 font-semibold">
                  Unit: PKR 5,000 / child-month
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CAUSES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCause(c.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${cause === c.id
                        ? "border-primary-600 bg-primary-50/80 ring-2 ring-primary-500 shadow-sm"
                        : "border-warm-200 hover:border-warm-300 bg-white"
                      }`}
                  >
                    <div className="font-bold font-heading text-charcoal-deep text-base">
                      {c.label}
                    </div>
                    <div className="text-xs text-charcoal-muted mt-1 leading-relaxed">{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2 & 3: Frequency and Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Frequency Toggle (Monthly recommended) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                    Step 2: Frequency *
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-warm-100 p-1.5 rounded-2xl border border-warm-200">
                  <button
                    type="button"
                    onClick={() => setFrequency("monthly")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${frequency === "monthly"
                        ? "bg-white text-primary-800 shadow-sm"
                        : "text-charcoal-muted hover:text-charcoal"
                      }`}
                  >
                    MONTHLY
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency("once")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${frequency === "once"
                        ? "bg-white text-primary-800 shadow-sm"
                        : "text-charcoal-muted hover:text-charcoal"
                      }`}
                  >
                    GIVE ONCE
                  </button>
                </div>
              </div>

              {/* Currency Display (PKR Only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                    Step 3: Currency *
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded-full">
                    PKR Only
                  </span>
                </div>
                <div className="bg-warm-100 p-3 rounded-2xl border border-warm-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span className="font-bold text-charcoal-deep text-sm">
                      PKR (Pakistani Rupee)
                    </span>
                  </div>
                  <span className="text-xs text-charcoal-muted font-medium">
                    All pledges processed in PKR
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 4: Amount & Synced Number of Children */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                  Step 4: Number of Children & Amount *
                </label>
                <span className="text-xs text-charcoal-muted">
                  PKR 5,000 / child / month
                </span>
              </div>

              {/* Preset Buttons for Children */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {PRESET_CHILDREN.map((cnt) => {
                  const pkrCost = cnt * DEFAULT_PRICING.costPerChildMonthPkr;
                  const isSelected = !isCustomAmount && childrenCount === cnt;

                  return (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleSelectPreset(cnt)}
                      className={`p-3 rounded-2xl text-center border transition-all ${isSelected
                          ? "bg-accent-600 text-white border-accent-600 shadow-soft ring-2 ring-accent-400"
                          : "bg-white text-charcoal border-warm-300 hover:border-accent-400"
                        }`}
                    >
                      <div className="font-bold text-sm">
                        {cnt === 30 ? "Classroom (30)" : `${cnt} Child${cnt > 1 ? "ren" : ""}`}
                      </div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? "text-white/90" : "text-charcoal-muted"}`}>
                        PKR {pkrCost.toLocaleString()}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Synced Inputs Row: Children Stepper & Amount Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Number of Children Stepper */}
                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-charcoal">
                    Sponsor Number of Children:
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl shrink-0"
                      onClick={() => {
                        const next = Math.max(0.5, childrenCount - 1);
                        setChildrenCount(next);
                        updateAmountFromChildren(next);
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={childrenCount}
                      onChange={(e) => handleChildrenInputChange(e.target.value)}
                      className="h-12 text-center font-bold text-lg rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl shrink-0"
                      onClick={() => {
                        const next = childrenCount + 1;
                        setChildrenCount(next);
                        updateAmountFromChildren(next);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-charcoal">
                    Total Amount (PKR):
                  </span>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-sm font-bold text-charcoal-muted">
                      PKR
                    </span>
                    <Input
                      type="number"
                      min="500"
                      value={customInputStr}
                      onChange={(e) => handleAmountInputChange(e.target.value)}
                      className="pl-16 h-12 font-bold text-lg rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Live Truthful Impact Display */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-base">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{impact.headline}</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {impact.summary}
                </p>
              </div>
            </div>

            {/* STEP 5: Donation Type (General, Zakat, Sadqah) */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                Step 5: Donation Type *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["General", "Zakat", "Sadqah"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDonationType(type)}
                    className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all border ${donationType === type
                        ? "bg-primary-50 border-primary-600 text-primary-900 ring-2 ring-primary-500"
                        : "bg-white border-warm-200 text-charcoal hover:bg-warm-50"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 6: Country */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                Step 6: Country *
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-12 rounded-2xl border border-warm-300 bg-white px-4 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* STEP 7: Payment Method */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                Step 7: Payment Method *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`p-4 rounded-2xl border text-left transition-all ${paymentMethod === "bank_transfer"
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500"
                      : "border-warm-200 hover:border-warm-300 bg-white"
                    }`}
                >
                  <div className="font-bold text-sm text-charcoal-deep flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-700" />
                    Direct Bank Transfer (Bank Islami)
                  </div>
                  <div className="text-xs text-charcoal-muted mt-1">
                    Transfer online or at any ATM/branch. IBAN &amp; reference details provided.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("doorstep")}
                  className={`p-4 rounded-2xl border text-left transition-all ${paymentMethod === "doorstep"
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500"
                      : "border-warm-200 hover:border-warm-300 bg-white"
                    }`}
                >
                  <div className="font-bold text-sm text-charcoal-deep flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-700" />
                    Doorstep Cash / Cheque Collection
                  </div>
                  <div className="text-xs text-charcoal-muted mt-1">
                    Call helpline {siteConfig.phone1.display} for official rider pickup at your doorstep.
                  </div>
                </button>
              </div>
            </div>

            {/* STEP 8: Donor Contact & Order Summary */}
            <div className="space-y-4 pt-4 border-t border-warm-200">
              <h3 className="text-lg font-bold font-heading text-charcoal-deep">
                Step 8: Contact &amp; Final Summary
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Your Full Name (Optional for anonymous pledges)
                  </label>
                  <Input
                    placeholder="e.g. Asad Ullah"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Email Address (For donation tax receipt)
                  </label>
                  <Input
                    type="email"
                    placeholder="donor@example.com"
                    value={donorEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={emailError ? "border-red-400 focus-visible:ring-red-400" : ""}
                  />
                  <ValidationFeedback
                    error={emailError}
                    suggestion={emailSuggestion}
                    onApplySuggestion={(sug) => {
                      setDonorEmail(sug);
                      setEmailError(null);
                      setEmailSuggestion(null);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Phone / WhatsApp Number (For doorstep pickup &amp; confirmations)
                </label>
                <Input
                  placeholder="03033934771 or +923033934771"
                  value={donorPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={phoneError ? "border-red-400 focus-visible:ring-red-400" : ""}
                />
                <ValidationFeedback error={phoneError} />
              </div>

              {/* Order Summary Pill */}
              <div className="p-4 rounded-2xl bg-warm-100 border border-warm-200 space-y-1.5 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-bold text-charcoal-deep">
                  <span>
                    You give {currency} {amount.toLocaleString()} {frequency === "monthly" ? "every month" : "once"}:
                  </span>
                  <span className="text-primary-700">
                    {impact.headline}
                  </span>
                </div>
                <div className="text-xs text-charcoal-muted">
                  Cause: <strong>{cause}</strong> &bull; Type: <strong>{donationType}</strong> &bull; Country: <strong>{country}</strong>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="accent"
                  size="xl"
                  className="w-full font-bold shadow-soft hover:shadow-glow text-base sm:text-lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Registering Your Pledge...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 fill-white mr-2" />
                      Complete Your Pledge — {currency} {amount.toLocaleString()}
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-charcoal-muted pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Transparent NGO • 100% Directed to Nomadic Education • Tax Exempted</span>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Official Bank Account Details (Single Account: Bank Islami) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div id="bank-details" className="bg-white rounded-3xl p-6 sm:p-10 border border-warm-200 shadow-soft space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-charcoal-deep">
                  Official NGO Bank Account Details
                </h3>
                <p className="text-xs text-charcoal-muted">
                  Use for online banking, ATM transfer, or branch deposit
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              Verified Single Account
            </span>
          </div>

          <div className="divide-y divide-warm-100 text-sm">
            <div className="py-3 flex justify-between items-center">
              <span className="text-charcoal-muted font-medium">Bank Name</span>
              <span className="font-bold text-charcoal-deep">{siteConfig.bankAccount.bankName}</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-charcoal-muted font-medium">Account Title</span>
              <span className="font-bold text-charcoal-deep">{siteConfig.bankAccount.accountTitle}</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-charcoal-muted font-medium">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary-700">{siteConfig.bankAccount.accountNumber}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleCopy(siteConfig.bankAccount.accountNumber, "acc_tbl")}
                >
                  {copiedField === "acc_tbl" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-charcoal-muted font-medium">IBAN</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary-700">{siteConfig.bankAccount.iban}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleCopy(siteConfig.bankAccount.iban, "iban_tbl")}
                >
                  {copiedField === "iban_tbl" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-charcoal-muted font-medium">Branch</span>
              <span className="font-medium text-charcoal-deep">{siteConfig.bankAccount.branch}</span>
            </div>
            {siteConfig.bankAccount.swift && siteConfig.bankAccount.swift.trim() !== "" && (
              <div className="py-3 flex justify-between items-center">
                <span className="text-charcoal-muted font-medium">SWIFT / BIC</span>
                <span className="font-mono font-bold text-charcoal-deep">{siteConfig.bankAccount.swift}</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <strong className="block font-semibold">⚠️ Transfer Remarks Instruction:</strong>
            <p>
              Please write your <strong>Pledge Reference Number (GJTF-YYYY-NNNNNN)</strong> in the transaction remarks or narration. This enables our finance team to match your transfer instantly and issue your official tax receipt.
            </p>
          </div>
        </div>
      </section>

      {/* Ways to Donate Cards (Bank Transfer & Doorstep - Give Online hidden until gateway is enabled) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-100 text-accent-800 text-xs font-bold tracking-wider uppercase">
            Ways to Contribute
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-charcoal-deep">
            How Your Donation Reaches the Children
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 1. Direct Bank Transfer */}
          <Card className="p-8 space-y-4 hover:-translate-y-1 transition-transform border-t-4 border-t-emerald-600">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-heading text-charcoal-deep">
              Bank Transfer (Bank Islami)
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Transfer your Zakat and Sadqah directly to our official Bank Islami account via your mobile banking app, ATM, or counter deposit.
            </p>
          </Card>

          {/* 2. Doorstep Collection */}
          <Card className="p-8 space-y-4 hover:-translate-y-1 transition-transform border-t-4 border-t-accent-600">
            <div className="w-12 h-12 rounded-2xl bg-accent-100 text-accent-700 flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-heading text-charcoal-deep">
              Doorstep Cash &amp; Cheque Pickup
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Call our official hotline at <strong className="text-accent-700">{siteConfig.phone1.display}</strong> or WhatsApp <strong className="text-accent-700">{siteConfig.phone2.display}</strong> to have our authorized rider collect your cash or crossed cheque with a stamped receipt.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
