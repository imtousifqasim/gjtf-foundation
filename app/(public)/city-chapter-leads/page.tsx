"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  Briefcase,
  TrendingUp,
  GraduationCap,
  Users,
  Compass,
  Sparkles,
  Gift,
  Coffee,
  Heart,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Trophy,
  BadgePercent,
  Shirt,
  Plane,
  Target,
  Network,
  CheckCircle2,
} from "lucide-react";
import { media } from "@/data/media";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { VolunteerModal } from "@/components/shared/VolunteerModal";

const GOOGLE_FORM_URL = "https://forms.gle/wAMQseyVuw7hXEzM8";

export default function CityChapterLeadsPage() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div className="space-y-16 sm:space-y-20 md:space-y-24 pb-16">
      {/* -------------------------------------------------------------
          1. FEATURED HERO HEADER
          ------------------------------------------------------------- */}
      <section className="relative py-14 sm:py-20 md:py-24 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={media.cityChapterLeads.heroImage}
            alt="GJTF City Chapter Leadership Team"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/95 via-primary-900/90 to-charcoal-deep/85" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-primary-200 text-xs font-bold tracking-wider uppercase border border-white/15 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Executive Leadership Movement
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-heading tracking-tight leading-tight">
            Why Join the City Chapter Team of Ghais Jhuggi Taleem Foundation (GJTF)?
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-primary-100/90 leading-relaxed max-w-2xl mx-auto">
            Becoming part of the City Chapter Team means stepping onto a larger stage of leadership, impact, and growth. Unlike University Chapter roles (focused on a single campus), City Chapter members lead, manage, and empower all university chapters within their city while coordinating directly with the GJTF Central Office.
          </p>

          <p className="text-xs sm:text-sm md:text-base font-semibold text-white bg-white/10 p-3.5 rounded-2xl border border-white/15 max-w-2xl mx-auto backdrop-blur-sm">
            This is more than just volunteering—it’s a transformational leadership journey where you grow as an individual, advance your career, and leave a lasting social legacy.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3.5">
            <a
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <Button
                variant="primary"
                size="lg"
                className="font-bold shadow-soft hover:shadow-glow bg-white text-primary-900 hover:bg-slate-100 hover:text-primary-950 border-white gap-2"
              >
                <span>Apply Now (Google Form)</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setModalOpen(true)}
              className="font-semibold bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              Apply via Website Portal
            </Button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. PERSONAL GROWTH & LEADERSHIP DEVELOPMENT
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Executive Competencies"
          title="Personal Growth & Leadership Development"
          subtitle="Develop high-level managerial acumen while leading city-wide initiatives and mentoring university chapters."
          align="left"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "Lead on a Bigger Scale",
              desc: "Manage multiple University Chapters, mentor student leaders, and oversee city-wide educational initiatives. Learn to guide diverse teams while coordinating across institutions.",
              icon: Compass,
              tag: "Executive Leadership",
            },
            {
              title: "Advanced Project Management",
              desc: "Organize city-level events, fundraising drives, inter-university collaborations, and awareness campaigns. Gain hands-on experience in planning, problem-solving, and execution.",
              icon: Briefcase,
              tag: "Operational Strategy",
            },
            {
              title: "Exclusive Training & Coaching",
              desc: "Access leadership, fundraising, public speaking, and advocacy workshops. Learn directly from senior NGO leaders and professionals.",
              icon: GraduationCap,
              tag: "Professional Masterclasses",
            },
            {
              title: "Certificates & Recognition",
              desc: "Earn an official Certificate of Appreciation from GJTF, signed by central leadership. Recognition extends city-wide, beyond your university.",
              icon: Award,
              tag: "Verified Credentials",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-7 sm:p-8 rounded-3xl bg-white border border-warm-200 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100 font-mono">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-heading text-charcoal-deep">
                  {item.title}
                </h3>
                <p className="text-sm text-charcoal-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. CAREER ADVANCEMENT OPPORTUNITIES
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-warm-100/80 rounded-3xl p-6 sm:p-10 md:p-12 border border-warm-200">
          <SectionHeading
            eyebrow="Professional Trajectory"
            title="Career Advancement Opportunities"
            subtitle="Build an undeniable competitive edge for global scholarships, high-growth internships, and job placements."
            align="left"
            className="mb-8"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Professional Endorsements",
                desc: "Receive strong recommendation letters from GJTF leadership for jobs, internships, and higher studies (local & international).",
                icon: ShieldCheck,
              },
              {
                title: "Networking with Leaders",
                desc: "Connect with city influencers, media representatives, educationists, philanthropists, and NGO leaders. Build a professional network that extends far beyond campus.",
                icon: Network,
              },
              {
                title: "Exclusive Internship Pathways",
                desc: "Get priority access to GJTF internships, research opportunities, and roles with partner organizations.",
                icon: Briefcase,
              },
              {
                title: "Resume & Career Edge",
                desc: 'Showcase "City Chapter Leader – GJTF" on your CV, demonstrating large-scale leadership experience.',
                icon: TrendingUp,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 sm:p-7 rounded-2xl bg-white border border-warm-200/80 shadow-soft space-y-3 hover:-translate-y-0.5 transition-transform"
                >
                  <div className="flex items-center gap-2.5 text-primary-700 font-bold text-xs">
                    <Icon className="w-4 h-4" />
                    <span>ADVANTAGE 0{idx + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold font-heading text-charcoal-deep">
                    {item.title}
                  </h3>
                  <p className="text-sm text-charcoal-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          4. REWARDS & INCENTIVES
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Recognition & Perks"
          title="Rewards & Incentives"
          subtitle="Honors, allowances, exclusive passes, and official GJTF gear to reward exceptional commitment."
          align="left"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Performance Awards",
              desc: "Compete for honors such as City MVP, Best Leader, and Outstanding Coordinator.",
              icon: Trophy,
            },
            {
              title: "Stipends for Senior Roles",
              desc: "Senior city leadership positions (President, Vice Presidents, Ambassadors) may receive stipends or allowances.",
              icon: BadgePercent,
            },
            {
              title: "Event Access & Sponsorships",
              desc: "Enjoy free or discounted passes to city conferences, seminars, and networking events.",
              icon: Gift,
            },
            {
              title: "Official GJTF Merchandise",
              desc: "Represent proudly with branded T-shirts, mugs, badges, and more.",
              icon: Shirt,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-warm-200 shadow-soft space-y-3 hover:-translate-y-1 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-heading text-charcoal-deep">
                  {item.title}
                </h3>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------
          5. SOCIAL & CULTURAL PERKS
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Community Bond"
          title="Social & Cultural Perks"
          subtitle="Build lifelong friendships and represent your city on prominent national platforms."
          align="left"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Inter-University Exposure",
              desc: "Collaborate across campuses to host cultural festivals, educational fairs, and awareness drives.",
              icon: Building2,
            },
            {
              title: "Team Bonding & Trips",
              desc: "Join exclusive team dinners, retreats, and recognition events. Build lasting friendships with passionate changemakers.",
              icon: Coffee,
            },
            {
              title: "National Representation",
              desc: "Top-performing City Chapter leaders get the chance to represent GJTF at national conferences and annual gatherings.",
              icon: Plane,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-7 sm:p-8 rounded-3xl bg-white border border-warm-200 shadow-soft space-y-3 hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-heading text-charcoal-deep">
                  {item.title}
                </h3>
                <p className="text-sm text-charcoal-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------
          6. IMPACT & FULFILMENT
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Real Transformation"
          title="Impact & Fulfilment"
          subtitle="Drive systemic educational change and leave an indelible footprint in underprivileged communities."
          align="left"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              num: "01",
              title: "Transform Lives at Scale",
              desc: "Go beyond a single campus—impact hundreds of students and thousands of underprivileged children.",
              icon: Target,
            },
            {
              num: "02",
              title: "Be the Bridge",
              desc: "Connect your city’s universities with GJTF Central Office to bring education to slum and nomadic communities.",
              icon: Network,
            },
            {
              num: "03",
              title: "Recognition & Legacy",
              desc: "Get featured in GJTF reports, newsletters, and official platforms. Leave behind a strong City Chapter that future leaders can build upon.",
              icon: Award,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-white to-primary-50/40 border border-warm-200 shadow-soft space-y-3 hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold font-mono text-primary-700">
                    {item.num}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-xl font-bold font-heading text-charcoal-deep">
                  {item.title}
                </h3>
                <p className="text-sm text-charcoal-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------
          7. CLOSING CALL TO ACTION
          ------------------------------------------------------------- */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary-950 via-primary-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 md:p-16 text-center space-y-6 shadow-2xl border border-primary-700/50 relative overflow-hidden">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-amber-300 font-semibold text-xs tracking-wider uppercase backdrop-blur-sm border border-white/10">
            Executive Leadership Call
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-white max-w-3xl mx-auto leading-snug">
            Joining the City Chapter Team is more than holding a title—it’s about becoming a city-wide leader, shaping movements, and creating a name that lasts
          </h2>

          <p className="text-base sm:text-lg text-primary-100/90 max-w-2xl mx-auto leading-relaxed">
            If you’re ready to grow personally, advance your career, and deliver education to those who need it most—this is your chance.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-bold shadow-soft hover:shadow-glow bg-white text-primary-950 hover:bg-slate-100 hover:text-primary-950 border-white gap-2"
              >
                <span>Apply Now (Google Form)</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto font-semibold bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              Apply via Website Portal
            </Button>
          </div>
        </div>
      </section>

      {/* Modal Application */}
      <VolunteerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultType="city_chapter"
        title="Apply for City Chapter Lead"
        description="Lead and manage all university chapters within your city while coordinating directly with GJTF Central Office."
      />
    </div>
  );
}
