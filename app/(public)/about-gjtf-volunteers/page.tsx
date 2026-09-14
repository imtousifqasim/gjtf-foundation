"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Stethoscope,
  BookOpen,
  Calendar,
  Award,
  Briefcase,
  TrendingUp,
  GraduationCap,
  Users,
  Compass,
  Sparkles,
  Camera,
  Search,
  Globe,
  Smile,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  PhoneCall,
} from "lucide-react";
import { media } from "@/data/media";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VolunteerModal } from "@/components/shared/VolunteerModal";

export default function AboutVolunteersPage() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div className="space-y-16 md:space-y-24 py-8 md:py-12">
      {/* -------------------------------------------------------------
          1. HERO SECTION
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <span className="inline-block px-3.5 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider">
              GJTF Volunteers Department
            </span>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-charcoal-deep tracking-tight leading-tight">
              About GJTF Volunteers
            </h1>

            <div className="space-y-3 text-xs sm:text-sm md:text-base text-charcoal-muted leading-relaxed">
              <p>
                <strong className="text-charcoal-deep font-semibold">GJTF Volunteers</strong> is the volunteer department of the <strong className="text-charcoal-deep font-semibold">Ghais Jhuggi Taleem Foundation (GJTF)</strong> — a movement dedicated to transforming the lives of slum and nomadic children across Pakistan.
              </p>
              <p>
                We believe that every individual has the power to create change. Through GJTF Volunteers, students, professionals, and community members come together to serve with passion, lead with purpose, and build a future where education, health, and empowerment are accessible to all.
              </p>
              <p>
                Whether you are a medical student, teacher, engineer, creative artist, researcher, or simply someone with a big heart, this is your platform to make a lasting impact.
              </p>
              <p className="font-semibold text-primary-800 bg-primary-50/80 p-3.5 rounded-2xl border border-primary-100">
                This is more than just volunteering—it’s a transformational leadership journey where you grow as an individual, advance your career, and leave a lasting social legacy.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setModalOpen(true)}
                className="font-bold shadow-soft hover:shadow-glow"
              >
                <Heart className="w-5 h-5 fill-white mr-2" />
                Join Us Today – Become a Volunteer
              </Button>
              <Link href="/city-chapter-leads">
                <Button variant="outline" size="lg">
                  City Chapter Leads
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <Image
                src={media.generalVolunteer.mentoringField}
                alt="GJTF Volunteers in action"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                <div className="text-xl font-bold font-heading">Passionate Changemakers</div>
                <p className="text-xs text-white/80">
                  Uniting university youth and professionals across 24 cities in Pakistan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. OUR VISION & OUR MISSION
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Vision */}
          <Card className="border-t-4 border-t-primary-600 p-8 sm:p-10 space-y-4 bg-white shadow-soft rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center shadow-sm">
              <Compass className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-700">
              Positive Change
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-charcoal-deep">
              Our Vision
            </h2>
            <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
              To cultivate a powerful nationwide volunteer movement that unites people from all walks of life to educate, heal, and empower underprivileged communities of Pakistan.
            </p>
          </Card>

          {/* Mission */}
          <Card className="border-t-4 border-t-primary-600 p-8 sm:p-10 space-y-4 bg-white shadow-soft rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-700">
              Education / Future
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-charcoal-deep">
              Our Mission
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-charcoal-deep">
              We exist to provide structured opportunities where volunteers can:
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-charcoal-muted">
              {[
                "Educate and mentor children in Jhuggi Model Schools.",
                "Improve health and well-being through medical camps and awareness.",
                "Engage communities in social, cultural, and environmental campaigns.",
                "Empower youth through skills, research, and innovation.",
                "Mobilize resources so no child is left behind in their education.",
              ].map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. WHAT YOU CAN DO AS A VOLUNTEER (TABS)
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Specialized Tracks"
          title="What You Can Do as a Volunteer"
          subtitle="Whether you bring medical training or creative and academic expertise, find the role where your passion meets purpose."
        />

        <Tabs defaultValue="medical" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger value="medical" className="gap-2">
                <Stethoscope className="w-4 h-4" /> Medical Students & Health Volunteers
              </TabsTrigger>
              <TabsTrigger value="non-medical" className="gap-2">
                <BookOpen className="w-4 h-4" /> Non-Medical Students & Professionals
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Medical Track */}
          <TabsContent value="medical">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Free Medical Camps",
                  desc: "Lead free medical camps in underserved areas.",
                },
                {
                  title: "Hygiene & Nutrition Awareness",
                  desc: "Conduct awareness sessions on hygiene, nutrition, and first aid.",
                },
                {
                  title: "Basic Health Check-ups",
                  desc: "Provide basic health check-ups for children and families.",
                },
                {
                  title: "Healthcare Collaborations",
                  desc: "Collaborate with hospitals and clinics for treatment and referral drives.",
                },
                {
                  title: "Blood Donation Drives",
                  desc: "Organize blood donation and mental health awareness campaigns.",
                },
              ].map((item, idx) => (
                <Card key={idx} className="p-6 bg-white hover:-translate-y-1 transition-transform border border-slate-200/80 shadow-soft rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold font-heading text-charcoal-deep mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                    {item.desc}
                  </p>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Non-Medical Track */}
          <TabsContent value="non-medical">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Teaching Academic Subjects",
                  desc: "Teach subjects such as English, Mathematics, Science, and IT.",
                },
                {
                  title: "Skill-Sharing Workshops",
                  desc: "Run skill-sharing workshops in art, IT, entrepreneurship, and communication.",
                },
                {
                  title: "Research-Based Projects",
                  desc: "Lead research-based projects on slum education and social development.",
                },
                {
                  title: "Digital Awareness Campaigns",
                  desc: "Create digital awareness campaigns through photography, videography, and social media content.",
                },
                {
                  title: "Fundraising & Charity Drives",
                  desc: "Organize fundraising activities, charity events, and donor drives.",
                },
                {
                  title: "Innovation Labs",
                  desc: "Participate in innovation labs and competitions for community problem-solving.",
                },
              ].map((item, idx) => (
                <Card key={idx} className="p-6 bg-white hover:-translate-y-1 transition-transform border border-slate-200/80 shadow-soft rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-3">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold font-heading text-charcoal-deep mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                    {item.desc}
                  </p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* -------------------------------------------------------------
          4. JOINT VOLUNTEER ACTIVITIES
          ------------------------------------------------------------- */}
      <section className="bg-warm-100/70 py-16 md:py-20 border-y border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Community Gatherings"
            title="Joint Volunteer Activities"
            subtitle="Engaging initiatives bringing our nationwide volunteer body together across campuses and cities."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                title: "Awareness Events & Seminars",
                desc: "Awareness events and seminars at universities and city chapters.",
                icon: Calendar,
              },
              {
                title: "National Days Celebrations",
                desc: "Celebrations of national & international days with children and communities.",
                icon: Smile,
              },
              {
                title: "Conferences Across Pakistan",
                desc: "Donor and Volunteer Conferences across Pakistan.",
                icon: Users,
              },
              {
                title: "Direct Field Outreach",
                desc: "Field visits and direct outreach in slum and nomadic communities.",
                icon: Compass,
              },
              {
                title: "Annual Volunteer Summit",
                desc: "Annual Volunteer Summit with awards and recognition.",
                icon: Award,
              },
            ].map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white border border-warm-200/80 shadow-soft flex flex-col justify-between space-y-3 hover:-translate-y-1 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-heading text-charcoal-deep mb-1">
                      {activity.title}
                    </h3>
                    <p className="text-xs text-charcoal-muted leading-relaxed">
                      {activity.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          5. WHY JOIN GJTF VOLUNTEERS? (PHOTO SHOWCASE + 11 BENEFITS)
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <SectionHeading
          eyebrow="Your Growth & Impact"
          title="Why Join GJTF Volunteers?"
          subtitle="Explore the tangible career, personal, and social advantages of stepping into a leadership journey with us."
        />

        {/* Featured Visual Banner with the Downloaded Community Photo */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group">
          <div className="relative h-64 sm:h-80 md:h-96 w-full">
            <Image
              src="/images/why-join-gjtf-volunteers.jpg"
              alt="GJTF Volunteers Community and Events"
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 1280px) 100vw, 1200px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep/90 via-charcoal-deep/40 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Nationwide Movement • 24+ Cities in Pakistan
              </span>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-heading text-white">
                Transforming Lives & Shaping Future Leaders
              </h3>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                Join a dynamic family of medical students, teachers, engineers, artists, and passionate changemakers working on the frontlines of education and healthcare.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => setModalOpen(true)}
              className="font-bold shrink-0 shadow-lg bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Heart className="w-4 h-4 mr-2 fill-white" />
              Apply Now
            </Button>
          </div>
        </div>

        {/* 11-Item Benefit Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-4">
          {[
            {
              num: "01",
              title: "Certificates & Recognition",
              desc: "Verified volunteer certificates, experience letters, and awards.",
              icon: Award,
            },
            {
              num: "02",
              title: "Internship Opportunities",
              desc: "Priority access to GJTF internship programs.",
              icon: Briefcase,
            },
            {
              num: "03",
              title: "Skill Development",
              desc: "Gain practical experience in teaching, leadership, project management, and healthcare.",
              icon: TrendingUp,
            },
            {
              num: "04",
              title: "Career Boost",
              desc: "Strong addition to your CV/LinkedIn profile.",
              icon: GraduationCap,
            },
            {
              num: "05",
              title: "Workshops & Trainings",
              desc: "Free sessions on professional development, social leadership, and community impact.",
              icon: BookOpen,
            },
            {
              num: "06",
              title: "Networking",
              desc: "Connect with students, professionals, and social leaders nationwide.",
              icon: Users,
            },
            {
              num: "07",
              title: "Leadership Roles",
              desc: "Opportunity to lead city chapters, university societies, and campaigns.",
              icon: Compass,
            },
            {
              num: "08",
              title: "Media & Creative Opportunities",
              desc: "Build portfolios in content creation, design, videography, and journalism.",
              icon: Camera,
            },
            {
              num: "09",
              title: "Research & Innovation",
              desc: "Collaborate on projects and publications related to education and health.",
              icon: Search,
            },
            {
              num: "10",
              title: "Scholarships & Opportunities",
              desc: "Active volunteers will be nominated for national and international programs.",
              icon: Globe,
            },
            {
              num: "11",
              title: "Personal Satisfaction",
              desc: "Experience the joy of transforming young lives and giving back to society.",
              icon: Heart,
            },
          ].map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.num}
                className="p-6 rounded-3xl bg-white border border-warm-200 shadow-soft hover:-translate-y-1 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold text-primary-700 font-mono bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
                    #{benefit.num}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-charcoal-deep mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-charcoal-muted leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------
          6. HOW WE WORK (4-COLUMN STRUCTURE)
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Organizational Hierarchy"
          title="How We Work"
          subtitle="A structured, nationwide framework designed for decentralized execution and maximum local community impact."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "National Team",
              desc: "Oversees programs and strategy across all operating domains.",
              icon: ShieldCheck,
            },
            {
              step: "02",
              title: "City Chapters",
              desc: "Active volunteer hubs in major cities coordinating regional drives.",
              icon: Building2,
            },
            {
              step: "03",
              title: "University Chapters",
              desc: "Student-led societies under GJTF mobilizing student communities.",
              icon: GraduationCap,
            },
            {
              step: "04",
              title: "Volunteer Roles",
              desc: "Teaching, medical, events, fundraising, research, media, and outreach teams.",
              icon: Users,
            },
          ].map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.step}
                className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-white to-warm-50 border border-warm-200/80 shadow-soft space-y-4 hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-extrabold font-heading text-primary-700">
                    {tier.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-charcoal-deep mb-1">
                    {tier.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                    {tier.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------------
          7. CLOSING CTA: BE THE CHANGE
          ------------------------------------------------------------- */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 text-white rounded-3xl p-8 sm:p-12 md:p-16 text-center space-y-6 shadow-2xl relative overflow-hidden border border-primary-700/50">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-amber-300 font-semibold text-xs tracking-wider uppercase backdrop-blur-sm border border-white/10">
            Make A Lasting Social Legacy
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading text-white">
            Be the Change
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-primary-100/90 max-w-2xl mx-auto leading-relaxed">
            At GJTF Volunteers, every hour you give, every skill you share, and every effort you make contributes to a brighter future for children who deserve hope. Together, we can rewrite their story.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto font-bold shadow-soft hover:shadow-glow bg-white text-primary-900 hover:bg-slate-100 hover:text-primary-950 border-white"
            >
              <Heart className="w-5 h-5 fill-primary-700 text-primary-700 mr-2" />
              Join Us Today – Become a Volunteer
            </Button>
            <Link href="/contact-us" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto font-semibold bg-white/10 text-white hover:bg-white/20 border-white/20"
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Application Modal */}
      <VolunteerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultType="general"
        title="Apply to Join GJTF Volunteers"
      />
    </div>
  );
}
