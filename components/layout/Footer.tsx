"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Send,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  ArrowRight,
} from "lucide-react";
import { CONTACT_INFO, SOCIAL_LINKS } from "@/data/navigation";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";

import { subscribeNewsletter } from "@/app/actions/newsletter";
import { Loader2 } from "lucide-react";

export function Footer() {
  const { settings } = useSiteSettings();
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [subscribed, setSubscribed] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubmitting(true);
    const res = await subscribeNewsletter(newsletterEmail);
    setSubmitting(false);
    if (res.success) {
      setSubscribed(true);
      setFeedbackMessage(res.message);
      setNewsletterEmail("");
    } else {
      setFeedbackMessage(res.message);
    }
  };

  return (
    <footer className="bg-charcoal-deep text-white/80 pt-16 pb-8 border-t border-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Newsletter Card */}
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-950 rounded-3xl p-8 md:p-12 mb-16 border border-primary-700/50 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-2">
              <span className="text-accent-400 font-semibold text-xs tracking-wider uppercase">
                Stay Connected With Our Mission
              </span>
              <h3 className="text-2xl md:text-3xl font-bold font-heading text-white tracking-tight">
                Become a part of our vibrant community, Subscribe to our mailing list!
              </h3>
              <p className="text-primary-100/80 text-sm md:text-base leading-relaxed">
                Receive inspiring stories of slum children whose lives are transformed, updates from our 2,033+ school units, and invitations to volunteer gatherings.
              </p>
            </div>

            <div className="lg:col-span-5">
              {subscribed ? (
                <div className="bg-primary-700/60 border border-primary-500/40 rounded-2xl p-4 text-center text-primary-100 font-medium text-sm leading-relaxed">
                  ✓ {feedbackMessage || "Thank you for joining our community! We are honored to have you."}
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-1.5 sm:p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-inner focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/20">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="flex-1 bg-transparent text-white placeholder:text-white/60 px-4 py-2.5 sm:py-2 text-sm focus:outline-none"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={submitting}
                      className="h-11 sm:h-auto px-6 py-2.5 font-bold whitespace-nowrap rounded-xl shadow-sm bg-primary-600 hover:bg-primary-500 text-white w-full sm:w-auto justify-center"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          Subscribing...
                        </>
                      ) : (
                        <>
                          Subscribe <Send className="w-3.5 h-3.5 ml-1.5" />
                        </>
                      )}
                    </Button>
                  </div>
                  {feedbackMessage && !subscribed && (
                    <p className="text-xs text-rose-300 px-2">{feedbackMessage}</p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-charcoal-muted/30">
          {/* Col 1: About Foundation */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-block bg-white p-2.5 rounded-2xl shadow-md group">
              <Image
                src="/images/Ghais-Jhuggi-Taleeem-Foundation-Logo.webp"
                alt="Ghais Jhuggi Taleem Foundation"
                width={220}
                height={55}
                className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="text-sm text-white/70 leading-relaxed">
              The largest educational and skill development movement for over 20 million nomadic communities (&quot;Jhuggi Nasheen&quot;) in Pakistan. Established in 2014 to provide quality education and dignity.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link href="/donate-now">
                <Button variant="primary" size="sm" className="font-bold gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm">
                  <Heart className="w-3.5 h-3.5 fill-white mr-1" />
                  Donate Now
                </Button>
              </Link>
              <Link href="/about-gjtf-volunteers">
                <Button variant="secondary" size="sm" className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border-slate-700 rounded-lg">
                  Volunteer
                </Button>
              </Link>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-semibold font-heading text-sm uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#about-us" className="hover:text-white transition-colors flex items-center gap-1.5 text-white/70 hover:text-white">
                  <ArrowRight className="w-3 h-3 text-primary-400" /> About GJTF
                </Link>
              </li>
              <li>
                <Link href="/aims-and-objectives" className="hover:text-white transition-colors flex items-center gap-1.5 text-white/70 hover:text-white">
                  <ArrowRight className="w-3 h-3 text-primary-400" /> Aims & Objectives
                </Link>
              </li>
              <li>
                <Link href="/our-school" className="hover:text-white transition-colors flex items-center gap-1.5 text-white/70 hover:text-white">
                  <ArrowRight className="w-3 h-3 text-primary-400" /> Our Schools (2,033)
                </Link>
              </li>
              <li>
                <Link href="/news-stories" className="hover:text-white transition-colors flex items-center gap-1.5 text-white/70 hover:text-white">
                  <ArrowRight className="w-3 h-3 text-primary-400" /> Success Stories
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="hover:text-white transition-colors flex items-center gap-1.5 text-white/70 hover:text-white">
                  <ArrowRight className="w-3 h-3 text-primary-400" /> Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Programs */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-white font-semibold font-heading text-sm uppercase tracking-wider">
              Our Initiatives
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about-gjtf-volunteers" className="hover:text-white transition-colors flex items-center gap-1.5 text-white/70 hover:text-white">
                  <ArrowRight className="w-3 h-3 text-primary-400" /> GJTF Volunteers Dept
                </Link>
              </li>
              <li>
                <Link href="/city-chapter-leads" className="hover:text-white transition-colors flex items-center gap-1.5 text-white/70 hover:text-white">
                  <ArrowRight className="w-3 h-3 text-primary-400" /> City Chapter Leads
                </Link>
              </li>
              <li>
                <Link href="/university-chapter" className="hover:text-white transition-colors flex items-center gap-1.5 text-white/70 hover:text-white">
                  <ArrowRight className="w-3 h-3 text-primary-400" /> University Chapters
                </Link>
              </li>
              <li>
                <Link href="/general-volunteer" className="hover:text-white transition-colors flex items-center gap-1.5 text-white/70 hover:text-white">
                  <ArrowRight className="w-3 h-3 text-primary-400" /> General Volunteers
                </Link>
              </li>
              <li>
                <Link href="/donate-now" className="hover:text-white transition-colors flex items-center gap-1.5 text-white/70 hover:text-white">
                  <ArrowRight className="w-3 h-3 text-primary-400" /> Zakat & Sadqah
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Us Block */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-white font-semibold font-heading text-sm uppercase tracking-wider">
              Head Office Contact
            </h4>
            <div className="space-y-3 text-xs sm:text-sm text-white/80">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white/90 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="leading-snug">{settings.head_office_address}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white/90">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span>Phone: {settings.telephone}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white/90">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span>Mobile: {settings.mobile}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white/90">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <a href={`mailto:${settings.email}`} className="hover:underline text-white/90 hover:text-white">
                  {settings.email}
                </a>
              </div>
              {settings.toll_free && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-primary-400 font-bold text-[10px]">
                    TF
                  </div>
                  <span className="text-white/90">Toll-Free: {settings.toll_free}</span>
                </div>
              )}
            </div>

            {/* Social Icons */}
            <div className="pt-2 flex items-center gap-2.5 flex-wrap">
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 w-8 rounded-full bg-charcoal flex items-center justify-center text-white/80 hover:bg-primary-600 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 w-8 rounded-full bg-charcoal flex items-center justify-center text-white/80 hover:bg-primary-600 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.youtube_url && (
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 w-8 rounded-full bg-charcoal flex items-center justify-center text-white/80 hover:bg-primary-600 hover:text-white transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {settings.twitter_url && (
                <a
                  href={settings.twitter_url}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 w-8 rounded-full bg-charcoal flex items-center justify-center text-white/80 hover:bg-primary-600 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {settings.linkedin_url && (
                <a
                  href={settings.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 w-8 rounded-full bg-charcoal flex items-center justify-center text-white/80 hover:bg-primary-600 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar (Exact) */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <div>
            © 2026 Ghais Jhuggi Taleem Foundation. All Rights Reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/aims-and-objectives" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact-us" className="hover:text-white transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
