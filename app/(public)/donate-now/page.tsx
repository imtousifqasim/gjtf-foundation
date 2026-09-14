"use client";

import * as React from "react";
import Image from "next/image";
import {
  Heart,
  CreditCard,
  Building,
  Phone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/data/countries";
import { CONTACT_INFO } from "@/data/navigation";
import { media } from "@/data/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { submitDonation, DonationInput } from "@/app/actions/donations";
import { formatCurrency } from "@/lib/utils";

const CAUSES = [
  { id: "General Education", label: "General Education", desc: "Support foundational schooling & literacy" },
  { id: "Educate a Child", label: "Educate a Child", desc: "Full tuition, books, uniform & meals" },
  { id: "Support a Classroom", label: "Support a Classroom", desc: "Sponsor a full 30-student learning unit" },
  { id: "Support a Child: KG to Matric", label: "Support a Child: KG to Matric", desc: "Comprehensive 10-year academic sponsorship" },
] as const;

const PRESET_AMOUNTS: Record<"PKR" | "AED", number[]> = {
  PKR: [2000, 5000, 10000, 15000, 20000],
  AED: [50, 150, 300, 500, 1000],
};

export default function DonateNowPage() {
  const [cause, setCause] = React.useState<DonationInput["cause"]>("Educate a Child");
  const [frequency, setFrequency] = React.useState<"once" | "monthly">("once");
  const [currency, setCurrency] = React.useState<"PKR" | "AED">("PKR");
  const [selectedAmount, setSelectedAmount] = React.useState<number>(5000);
  const [customAmount, setCustomAmount] = React.useState<string>("");
  const [isCustom, setIsCustom] = React.useState(false);
  const [donationType, setDonationType] = React.useState<"General" | "Zakat" | "Sadqah">("General");
  const [country, setCountry] = React.useState<string>(DEFAULT_COUNTRY);

  // Donor Details
  const [donorName, setDonorName] = React.useState("");
  const [donorEmail, setDonorEmail] = React.useState("");
  const [donorPhone, setDonorPhone] = React.useState("");
  const [donorMessage, setDonorMessage] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [submittedId, setSubmittedId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Calculate actual numeric amount
  const finalAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;

  // Dynamic duration label
  const durationLabel = React.useMemo(() => {
    if (currency === "PKR") {
      if (finalAmount <= 2000) return "1 month";
      if (finalAmount <= 5000) return "2.5 months";
      if (finalAmount <= 10000) return "5 months";
      if (finalAmount <= 15000) return "8 months";
      if (finalAmount <= 20000) return "1 academic year";
      return "extended schooling duration";
    } else {
      if (finalAmount <= 50) return "1 month";
      if (finalAmount <= 150) return "3 months";
      return "1 academic year";
    }
  }, [finalAmount, currency]);

  // Dynamic student impact count (formula from prompt pattern: "Your donation will impact the life of X students per year")
  const studentsImpacted = React.useMemo(() => {
    if (currency === "PKR") {
      return Math.max(1, Math.round((finalAmount / 2000) * (frequency === "monthly" ? 12 : 1)));
    } else {
      return Math.max(1, Math.round((finalAmount / 50) * (frequency === "monthly" ? 12 : 1)));
    }
  }, [finalAmount, currency, frequency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount < 100) {
      setErrorMsg("Please enter a donation amount of at least 100.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await submitDonation({
      cause,
      frequency,
      currency,
      amount: finalAmount,
      donation_type: donationType,
      country,
      donor_name: donorName,
      donor_email: donorEmail,
      donor_phone: donorPhone,
      message: donorMessage,
    });

    setSubmitting(false);
    if (res.success) {
      setSubmittedId(res.donationId || "dn_verified");
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
            Donate to educate less-privileged children in Pakistan
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-primary-100/90 leading-relaxed max-w-2xl mx-auto">
            The largest educational and skill development movement for over 20 million nomadic communities. Today, through the Jhuggi Taleemi Project, the foundation is educating thousands of children and paving the way for a brighter future.
          </p>
        </div>
      </section>

      {/* Main Donation Container */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {submittedId ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-warm-200 shadow-xl text-center space-y-6 animate-in fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h2 className="text-3xl font-extrabold font-heading text-charcoal-deep">
              JazakAllah Khair! Your Donation Pledge is Registered
            </h2>

            <p className="text-base text-charcoal-muted max-w-xl mx-auto leading-relaxed">
              Thank you for standing with nomadic children. Your reference code is{" "}
              <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded-md">
                {submittedId}
              </span>
              . An electronic pledge receipt has been logged.
            </p>

            <div className="p-6 rounded-2xl bg-warm-50 border border-warm-200 max-w-md mx-auto text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Selected Cause:</span>
                <span className="font-bold text-charcoal-deep">{cause}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Amount:</span>
                <span className="font-bold text-primary-700">
                  {currency} {finalAmount.toLocaleString()} ({frequency})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Category:</span>
                <span className="font-bold text-charcoal-deep">{donationType}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#bank-details">
                <Button variant="accent" size="lg" className="font-bold">
                  View Direct Bank Transfer Details
                </Button>
              </a>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setSubmittedId(null);
                  setDonorName("");
                  setDonorEmail("");
                  setDonorPhone("");
                }}
              >
                Make Another Donation
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

            {/* STEP 1: Please select an option (exact 4 causes) */}
            <div className="space-y-3">
              <label className="block text-sm font-bold uppercase tracking-wider text-charcoal-deep">
                Step 1: Please select an option *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CAUSES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCause(c.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      cause === c.id
                        ? "border-primary-600 bg-primary-50/80 ring-2 ring-primary-500 shadow-sm"
                        : "border-warm-200 hover:border-warm-300 bg-white"
                    }`}
                  >
                    <div className="font-bold font-heading text-charcoal-deep text-base">
                      {c.label}
                    </div>
                    <div className="text-xs text-charcoal-muted mt-0.5">{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2 & 3: Frequency and Currency Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Frequency Toggle */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                  Step 2: Frequency *
                </label>
                <div className="grid grid-cols-2 gap-2 bg-warm-100 p-1.5 rounded-2xl border border-warm-200">
                  <button
                    type="button"
                    onClick={() => setFrequency("once")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                      frequency === "once"
                        ? "bg-white text-primary-800 shadow-sm"
                        : "text-charcoal-muted hover:text-charcoal"
                    }`}
                  >
                    GIVE ONCE
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency("monthly")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                      frequency === "monthly"
                        ? "bg-white text-primary-800 shadow-sm"
                        : "text-charcoal-muted hover:text-charcoal"
                    }`}
                  >
                    MONTHLY
                  </button>
                </div>
              </div>

              {/* Currency Toggle */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                  Step 3: Currency *
                </label>
                <div className="grid grid-cols-2 gap-2 bg-warm-100 p-1.5 rounded-2xl border border-warm-200">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency("PKR");
                      setSelectedAmount(5000);
                      setIsCustom(false);
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                      currency === "PKR"
                        ? "bg-white text-primary-800 shadow-sm"
                        : "text-charcoal-muted hover:text-charcoal"
                    }`}
                  >
                    PKR (Pakistani Rupee)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency("AED");
                      setSelectedAmount(150);
                      setIsCustom(false);
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                      currency === "AED"
                        ? "bg-white text-primary-800 shadow-sm"
                        : "text-charcoal-muted hover:text-charcoal"
                    }`}
                  >
                    AED (Dirham)
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 4: Amount Chips */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                Step 4: Amount *
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {PRESET_AMOUNTS[currency].map((amt) => {
                  const isSelected = !isCustom && selectedAmount === amt;
                  const label = currency === "PKR" ? `RS${amt.toLocaleString()}` : `AED ${amt}`;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setIsCustom(false);
                      }}
                      className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center border ${
                        isSelected
                          ? "bg-accent-600 text-white border-accent-600 shadow-soft ring-2 ring-accent-400"
                          : "bg-white text-charcoal border-warm-300 hover:border-accent-400"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}

                {/* OTHER chip */}
                <button
                  type="button"
                  onClick={() => setIsCustom(true)}
                  className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center border ${
                    isCustom
                      ? "bg-accent-600 text-white border-accent-600 shadow-soft ring-2 ring-accent-400"
                      : "bg-white text-charcoal border-warm-300 hover:border-accent-400"
                  }`}
                >
                  OTHER
                </button>
              </div>

              {/* Custom Amount Input when "OTHER" selected */}
              {isCustom && (
                <div className="mt-3 max-w-xs">
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-sm font-bold text-charcoal-muted">
                      {currency}
                    </span>
                    <Input
                      type="number"
                      min="100"
                      placeholder="Enter custom amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-14 h-12 font-bold text-lg"
                    />
                  </div>
                </div>
              )}

              {/* Line label under amount (exact verbatim requirement) */}
              <div className="text-xs font-semibold text-primary-800 pt-1">
                Child's education for {durationLabel}
              </div>

              {/* Dynamic impact text (exact verbatim pattern) */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Your donation will impact the life of <strong>{studentsImpacted} students</strong> per year.
                </span>
              </div>
            </div>

            {/* STEP 5: Donation Type Radio */}
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
                    className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all border ${
                      donationType === type
                        ? "bg-primary-50 border-primary-600 text-primary-900 ring-2 ring-primary-500"
                        : "bg-white border-warm-200 text-charcoal hover:bg-warm-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 6: Country Dropdown (Full 200+ list from prompt) */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                Step 6: Country *
              </label>
              <div className="relative">
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
            </div>

            {/* STEP 7: Donor Details & Order Summary */}
            <div className="space-y-4 pt-4 border-t border-warm-200">
              <h3 className="text-lg font-bold font-heading text-charcoal-deep">
                Donor Contact & Order Summary
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Your Name (Optional for anonymous pledges)
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
                    onChange={(e) => setDonorEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Phone Number (For doorstep collection or WhatsApp confirmation)
                </label>
                <Input
                  placeholder="0300-1234567"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                />
              </div>

              {/* Order Summary Pill */}
              <div className="p-4 rounded-2xl bg-warm-100 border border-warm-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div>
                  <span className="text-charcoal-muted">Donation Summary: </span>
                  <span className="font-bold text-charcoal-deep">
                    {currency} {finalAmount.toLocaleString()} ({frequency}) for {cause} [{donationType}]
                  </span>
                </div>
                <div className="text-xs text-primary-800 font-semibold">
                  Donor Country: {country}
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
                      Recording Donation Pledge...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 fill-white mr-2" />
                      Complete Your Donation — {currency} {finalAmount.toLocaleString()}
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-charcoal-muted pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SSL Encrypted • Tax Exempted • 100% Directed to Nomadic Education</span>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Other Ways to Donate (3-Card Section verbatim) */}
      <section id="other-ways" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="mb-10 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider mb-2">
            Alternative Channels
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-charcoal-deep">
            Other Ways to Donate
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 1. Give Online */}
          <Card className="p-8 space-y-4 hover:-translate-y-1 transition-transform border-t-4 border-t-primary-600">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-charcoal-deep">
              Give Online
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Make a one-time or recurring online donation using credit/debit card, digital banking, or online wallets.
            </p>
          </Card>

          {/* 2. Donate by Cheque */}
          <Card className="p-8 space-y-4 hover:-translate-y-1 transition-transform border-t-4 border-t-accent-600">
            <div className="w-12 h-12 rounded-2xl bg-accent-100 text-accent-700 flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-charcoal-deep">
              Donate by Cheque
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Call us at <strong className="text-accent-700">0800-00823</strong> to have your cheque or cash collected from your doorstep.
            </p>
          </Card>

          {/* 3. Bank Transfer */}
          <Card className="p-8 space-y-4 hover:-translate-y-1 transition-transform border-t-4 border-t-emerald-600">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-charcoal-deep">
              Bank Transfer
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Transfer your Zakat and Sadqah in our selected banks.
            </p>
          </Card>
        </div>

        {/* Bank Details Table / Accordion */}
        <div id="bank-details" className="mt-12 bg-white rounded-3xl p-8 sm:p-10 border border-warm-200 shadow-soft max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6 text-primary-700" />
            <h3 className="text-xl font-bold font-heading text-charcoal-deep">
              Official GJTF Bank Account Details
            </h3>
          </div>

          <div className="divide-y divide-warm-100 text-sm">
            <div className="py-3 flex justify-between">
              <span className="text-charcoal-muted font-medium">Bank Name</span>
              <span className="font-bold text-charcoal-deep">{CONTACT_INFO.bankDetails.bankName}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-charcoal-muted font-medium">Account Title</span>
              <span className="font-bold text-charcoal-deep">{CONTACT_INFO.bankDetails.accountTitle}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-charcoal-muted font-medium">Account Number</span>
              <span className="font-mono font-bold text-primary-700">{CONTACT_INFO.bankDetails.accountNumber}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-charcoal-muted font-medium">IBAN</span>
              <span className="font-mono font-bold text-primary-700">{CONTACT_INFO.bankDetails.iban}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-charcoal-muted font-medium">Branch</span>
              <span className="font-medium text-charcoal-deep">{CONTACT_INFO.bankDetails.branch}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-charcoal-muted font-medium">Swift Code</span>
              <span className="font-mono font-bold text-charcoal-deep">{CONTACT_INFO.bankDetails.swiftCode}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
