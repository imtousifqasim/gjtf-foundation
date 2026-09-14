"use client";

import * as React from "react";
import {
  MapPin,
  Phone,
  Mail,
  Send,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { CONTACT_INFO } from "@/data/navigation";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";
import { media } from "@/data/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { submitContactForm } from "@/app/actions/contact";

export default function ContactUsPage() {
  const { settings } = useSiteSettings();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const charCount = message.length;
  const MAX_CHARS = 180;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const res = await submitContactForm({
      name,
      email,
      subject,
      message,
    });

    setSubmitting(false);
    if (res.success) {
      setSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } else {
      setErrorMsg(res.message || "Failed to submit message. Please try again.");
    }
  };

  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-warm-100 to-warm-50 py-10 sm:py-14 border-b border-warm-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-primary-700" />
            Get In Touch With GJTF
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-charcoal-deep tracking-tight">
            We have a network of Global Supporters
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
            Reach out to our Central Office in Lahore or connect with our regional contact persons across Pakistan.
          </p>
        </div>
      </section>

      {/* Embedded Map */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden border border-warm-200 shadow-soft h-[360px] sm:h-[440px] bg-warm-100 relative">
          <iframe
            src={media.contactUs.mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="GJTF Head Office Location"
          />
        </div>
      </section>

      {/* Offices & Contact Form Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Office Contacts */}
          <div className="lg:col-span-5 space-y-6">
            {/* GJTF Head Office - Lahore */}
            <Card className="p-6 sm:p-8 bg-white border-primary-200/80 shadow-soft space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-heading text-charcoal-deep">
                    {CONTACT_INFO.headOffice.title}
                  </h3>
                  <p className="text-xs text-primary-700 font-semibold">
                    Contact Person: {settings.contact_person || CONTACT_INFO.headOffice.contactPerson}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-sm text-charcoal-muted pt-2 border-t border-warm-100">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-1" />
                  <span>{settings.head_office_address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-primary-600 shrink-0" />
                  <span>Tel: {settings.telephone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-accent-600 shrink-0" />
                  <span>Mobile: {settings.mobile}</span>
                </div>
                {settings.whatsapp && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>WhatsApp: {settings.whatsapp}</span>
                  </div>
                )}
                {settings.toll_free && (
                  <div className="flex items-center gap-2.5 font-semibold text-primary-700">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>Toll-Free Helpline: {settings.toll_free}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-primary-600 shrink-0" />
                  <a href={`mailto:${settings.email}`} className="hover:underline">
                    {settings.email}
                  </a>
                </div>
                {settings.secondary_email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-charcoal-muted shrink-0" />
                    <a href={`mailto:${settings.secondary_email}`} className="hover:underline text-xs">
                      Secondary: {settings.secondary_email}
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Regional Offices */}
            {CONTACT_INFO.regionalOffices.map((office, idx) => (
              <Card key={idx} className="p-6 sm:p-8 bg-white border-warm-200 shadow-soft space-y-3">
                <h4 className="text-lg font-bold font-heading text-charcoal-deep">
                  {office.city}
                </h4>
                <div className="text-xs font-semibold text-accent-700">
                  Contact Person: {office.contactPerson}
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-charcoal-muted pt-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-charcoal-light shrink-0 mt-0.5" />
                    <span>{office.address}</span>
                  </div>
                  {office.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-charcoal-light shrink-0" />
                      <span>Phone: {office.phone}</span>
                    </div>
                  )}
                  {office.tollFree && (
                    <div className="flex items-center gap-2 text-primary-700 font-semibold">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>Toll-free: {office.tollFree}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-charcoal-light shrink-0" />
                    <a href={`mailto:${office.email}`} className="hover:underline">
                      {office.email}
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-warm-200 shadow-soft space-y-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold font-heading text-charcoal-deep">
                  For specific queries, please fill out the form below
                </h3>
                <p className="text-sm text-charcoal-muted mt-1">
                  Our team typically responds within 24–48 business hours.
                </p>
              </div>

              {success ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-2xl font-bold font-heading text-charcoal-deep">
                    Message Sent Successfully!
                  </h4>
                  <p className="text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out to Ghais Jhuggi Taleem Foundation. Our support desk will review your message and reply to your email.
                  </p>
                  <Button variant="outline" onClick={() => setSuccess(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Your Name *
                    </label>
                    <Input
                      required
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Your Email *
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Subject *
                    </label>
                    <Input
                      required
                      placeholder="e.g. School sponsorship, volunteering query, Zakat verification..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-charcoal">
                        Your Message *
                      </label>
                      <span className={`text-xs ${charCount > MAX_CHARS ? 'text-red-600 font-bold' : 'text-charcoal-muted'}`}>
                        {charCount} / {MAX_CHARS}
                      </span>
                    </div>
                    <Textarea
                      required
                      maxLength={MAX_CHARS}
                      rows={4}
                      placeholder="Please write your message here (maximum 180 characters)..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full font-bold shadow-soft hover:shadow-soft-lg"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
