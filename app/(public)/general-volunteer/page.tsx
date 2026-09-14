"use client";

import * as React from "react";
import Image from "next/image";
import {
  Heart,
  BookOpen,
  Calendar,
  Gift,
  Camera,
  DollarSign,
  Clock,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { media } from "@/data/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { submitVolunteerSignup } from "@/app/actions/volunteer";

export default function GeneralVolunteerPage() {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState("");
  const [commitment, setCommitment] = React.useState("few_hours_week");
  const [message, setMessage] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const fullMessage = `Time Commitment: ${commitment}\n\nNotes: ${message}`;
    const res = await submitVolunteerSignup({
      type: "general",
      full_name: fullName,
      email,
      phone,
      city,
      message: fullMessage,
    });

    setSubmitting(false);
    if (res.success) {
      setSuccess(true);
    } else {
      setErrorMsg(res.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="space-y-20 md:space-y-28 pb-16">
      {/* Hero */}
      <section className="relative py-12 sm:py-16 md:py-20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={media.generalVolunteer.heroImage}
            alt="Community volunteers serving together"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/95 via-primary-900/85 to-charcoal-deep/80" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center text-white space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-800/40 text-primary-200 text-xs font-semibold tracking-wider uppercase border border-primary-500/30 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary-300" />
            Flexible Community Involvement
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading tracking-tight leading-tight">
            Become a General Volunteer
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-primary-100/90 leading-relaxed max-w-2xl mx-auto">
            You don't need a formal title or a campus affiliation to change a child's life. General Volunteers are teachers, professionals, doctors, homemakers, retirees, and passionate citizens who contribute their time, skills, or resources on a schedule that fits their life.
          </p>

          <a href="#volunteer-form">
            <Button
              variant="primary"
              size="lg"
              className="font-bold shadow-soft hover:shadow-glow mt-2"
            >
              Sign Up as a Volunteer
            </Button>
          </a>
        </div>
      </section>

      {/* Ways to Help */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Diverse Opportunities"
          title="Ways You Can Help"
          subtitle="Choose an area aligned with your talents and availability."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Teaching & Tutoring Support",
              desc: "Help children with foundational literacy, arithmetic, spoken Urdu/English, and basic computer tablets on weekends or mornings.",
              icon: BookOpen,
            },
            {
              title: "Event & Field Logistics",
              desc: "Assist in managing crowd flow, refreshments, and distribution logistics during seasonal clothing drives and medical camps.",
              icon: Calendar,
            },
            {
              title: "In-Kind Goods Collection",
              desc: "Coordinate book drives, stationery kits, warm winter blankets, uniforms, or hygiene kits within your neighborhood.",
              icon: Gift,
            },
            {
              title: "Skills-Based Volunteering",
              desc: "Lend your professional expertise in UI/UX design, videography, copyediting, digital marketing, legal advice, or medical screenings.",
              icon: Camera,
            },
            {
              title: "Fundraising & Donor Circles",
              desc: "Host small donor iftars, introduce corporate CSR teams to GJTF, or run personal birthday charity fundraisers.",
              icon: DollarSign,
            },
            {
              title: "Vocational Mentorship",
              desc: "Mentor older youth and adolescent girls in financial literacy, resume writing, tailoring techniques, or basic business management.",
              icon: Heart,
            },
          ].map((way, idx) => {
            const Icon = way.icon;
            return (
              <Card key={idx} className="p-8 hover:-translate-y-1 transition-transform space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-heading text-charcoal-deep">
                  {way.title}
                </h3>
                <p className="text-sm text-charcoal-muted leading-relaxed">
                  {way.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Time Commitment Options */}
      <section className="bg-warm-100/70 py-20 border-y border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Flexibility First"
            title="Time Commitment Options"
            subtitle="Give whatever time you can afford. Every single hour spent with a slum child creates a lifetime of confidence."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tier: "One-Time Event",
                time: "Single day (3-5 hours)",
                desc: "Join an Eid gift distribution, annual volunteer summit, winter clothing drive, or a single medical health screening camp.",
              },
              {
                tier: "A Few Hours a Week",
                time: "2-4 hours weekly",
                desc: "Spend a Saturday morning teaching children to read, or help manage weekly social media posts or donor queries.",
              },
              {
                tier: "Ongoing / Project-Based",
                time: "Flexible commitment",
                desc: "Lead a specific milestone project such as developing a new tablet learning curriculum or building our annual donor report.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-white border border-warm-200 shadow-soft space-y-3 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold font-heading text-charcoal-deep">
                  {item.tier}
                </h3>
                <div className="text-xs font-bold text-accent-600 uppercase tracking-wider">
                  {item.time}
                </div>
                <p className="text-sm text-charcoal-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Embedded Sign-up Form */}
      <section id="volunteer-form" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-warm-200 shadow-soft">
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-3xl font-bold font-heading text-charcoal-deep">
              Sign Up as a General Volunteer
            </h2>
            <p className="text-sm text-charcoal-muted">
              Fill in your details below and our team will get in touch with available opportunities in your area.
            </p>
          </div>

          {success ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold font-heading text-charcoal-deep">
                Welcome to the Family!
              </h3>
              <p className="text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed">
                Thank you for offering your hands and heart. We have recorded your interest and our volunteer department will contact you soon.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setSuccess(false);
                    setFullName("");
                    setEmail("");
                    setPhone("");
                    setCity("");
                    setMessage("");
                  }}
                  className="px-6 py-2.5 rounded-xl font-bold shadow-soft hover:shadow-glow text-sm inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Another Application</span>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Your Full Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Tariq Mehmood"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="tariq@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Phone / WhatsApp *
                  </label>
                  <Input
                    required
                    placeholder="0303-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Your City *
                  </label>
                  <Input
                    required
                    placeholder="Lahore, Karachi, Faisalabad..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Availability / Preferred Time Commitment *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "one_time", label: "One-Time Event" },
                    { id: "few_hours_week", label: "Few Hours / Week" },
                    { id: "ongoing", label: "Ongoing / Projects" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCommitment(item.id)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                        commitment === item.id
                          ? "bg-primary-50 border-primary-600 text-primary-900 font-bold"
                          : "bg-white border-warm-200 text-charcoal hover:bg-warm-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Area of Interest or Skills You Wish to Contribute
                </label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Teaching Math/Urdu, photography, graphic design, healthcare, logistical coordination..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="pt-4 flex justify-center">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto min-w-[280px] px-8 py-3.5 font-bold shadow-soft hover:shadow-glow rounded-xl inline-flex items-center justify-center gap-2 text-base"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      <span>Submitting Volunteer Profile...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Submit Volunteer Registration</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
