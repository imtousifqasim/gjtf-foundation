"use client";

import * as React from "react";
import Image from "next/image";
import {
  GraduationCap,
  Users,
  Award,
  Calendar,
  Sparkles,
  Camera,
  DollarSign,
  Briefcase,
  CheckCircle,
} from "lucide-react";
import { media } from "@/data/media";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { VolunteerModal } from "@/components/shared/VolunteerModal";

export default function UniversityChapterPage() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div className="space-y-20 md:space-y-28 pb-16">
      {/* Hero */}
      <section className="relative py-12 sm:py-16 md:py-20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={media.universityChapter.heroImage}
            alt="University students on campus"
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
            Campus Student Societies
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading tracking-tight leading-tight">
            Join the University Chapter of GJTF
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-primary-100/90 leading-relaxed max-w-2xl mx-auto">
            University Chapter members run GJTF activities within a single university or campus. From organizing on-campus awareness drives and charity stalls to leading weekend teaching volunteer batches, our student leaders bridge academia with grassroots impact while reporting directly up to their City Chapter Lead.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setModalOpen(true)}
              className="font-bold shadow-soft hover:shadow-glow"
            >
              Apply to Start or Join a Chapter
            </Button>
          </div>
        </div>
      </section>

      {/* Roles Available */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Campus Executive Board"
          title="Roles Available in Your Campus Chapter"
          subtitle="Positions are open each academic year for dynamic undergraduate and postgraduate student changemakers."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              role: "Chapter President",
              desc: "Leads the executive cabinet, represents GJTF before university administration, and liaises with the City Chapter Lead.",
              icon: GraduationCap,
            },
            {
              role: "Vice President",
              desc: "Oversees internal operations, volunteer recruitment drives, and inter-departmental collaboration on campus.",
              icon: Users,
            },
            {
              role: "Event Head",
              desc: "Plans and coordinates awareness seminars, charity galas, bake sales, sports galas, and on-campus volunteer stalls.",
              icon: Calendar,
            },
            {
              role: "Media & PR Head",
              desc: "Manages social media coverage, photography, graphic design, campus newsletters, and influencer shoutouts.",
              icon: Camera,
            },
            {
              role: "Treasurer & Finance Head",
              desc: "Maintains financial transparency, tracks donation collection receipts, and coordinates with GJTF central audit.",
              icon: DollarSign,
            },
            {
              role: "General Volunteer Members",
              desc: "Active student contributors who assist in teaching drives, medical camps, logistic support, and event execution.",
              icon: Sparkles,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className="p-8 hover:-translate-y-1 transition-transform space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-heading text-charcoal-deep">
                  {item.role}
                </h3>
                <p className="text-sm text-charcoal-muted leading-relaxed">
                  {item.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-warm-100/70 py-20 border-y border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Why Lead On Campus?"
            title="Benefits of Leading a University Chapter"
            subtitle="Gain verifiable leadership credentials that set you apart in postgraduate applications and global job markets."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Official Certificates",
                desc: "Verified leadership and volunteer certificates bearing the foundation's official stamp.",
                icon: Award,
              },
              {
                title: "LinkedIn Recommendations",
                desc: "Personalized endorsements on LinkedIn from GJTF central leadership highlighting your contributions.",
                icon: Briefcase,
              },
              {
                title: "Campus Experience",
                desc: "Practical experience running a registered university student society with real budgets and events.",
                icon: GraduationCap,
              },
              {
                title: "City-Wide Networking",
                desc: "Direct connection with City Chapter leaders, corporate CSR heads, and prominent NGO executives.",
                icon: Users,
              },
            ].map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white border border-warm-200 shadow-soft space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-charcoal-deep">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-charcoal-muted leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to Start */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold font-heading text-charcoal-deep">
            Ready to Start a Chapter at Your University?
          </h2>
          <p className="text-charcoal-muted text-base leading-relaxed">
            Gather a team of 3-5 enthusiastic students from your campus and apply today. We provide full society registration guidance, official banners, and ongoing central mentorship.
          </p>
        </div>

        <Button
          variant="accent"
          size="xl"
          onClick={() => setModalOpen(true)}
          className="font-bold shadow-soft hover:shadow-glow"
        >
          Apply to Start a University Chapter
        </Button>
      </section>

      <VolunteerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultType="university_chapter"
        title="Apply for University Chapter"
        description="Represent GJTF at your university campus. Help organize campus awareness drives, stalls, and volunteer teams."
      />
    </div>
  );
}
