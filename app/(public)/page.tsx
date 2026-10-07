import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  BookOpen,
  Users,
  Compass,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Laptop,
  Briefcase,
  Scissors,
  ArrowRight,
  School as SchoolIcon,
  Smile,
  Award,
} from "lucide-react";
import { media } from "@/data/media";
import { schools } from "@/data/schools";
import { stories } from "@/data/stories";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StatsCounter } from "@/components/shared/StatsCounter";
import { SchoolCard } from "@/components/shared/SchoolCard";
import { StoryCard } from "@/components/shared/StoryCard";
import { DonateBanner } from "@/components/shared/DonateBanner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HeroVideoBackground } from "@/components/shared/HeroVideoBackground";
import { StoryVideoCard } from "@/components/shared/StoryVideoCard";

export default function HomePage() {
  const meghaniSchool = schools[0];

  return (
    <div className="space-y-24 md:space-y-32">
      {/* -------------------------------------------------------------
          1. HERO SECTION
          ------------------------------------------------------------- */}
      <section className="relative min-h-[75vh] md:min-h-[82vh] lg:min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Background YouTube Video with Black Overlays and Muted Autoplay starting at 1:40 (100s) */}
        <HeroVideoBackground
          videoId={media.home.heroYouTubeId}
          startTimeSeconds={media.home.heroVideoStartTime}
          posterImage={media.home.heroImage}
        />

        {/* Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center text-white space-y-6 sm:space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-slate-100 text-xs sm:text-sm font-semibold tracking-wider uppercase shadow-lg">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            Jhuggi Taleemi Project • Established 2014
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold font-heading tracking-tight leading-tight sm:leading-snug max-w-3xl mx-auto drop-shadow-md">
            Donate to educate{" "}
            <span className="text-blue-300 font-extrabold inline-block drop-shadow-md">
              less-privileged children
            </span>{" "}
            in Pakistan
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow">
            The largest educational and skill development movement for over{" "}
            <span className="font-semibold text-white underline decoration-blue-400 decoration-2 underline-offset-4">
              20 million nomadic communities
            </span>.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/donate-now" className="w-full sm:w-auto inline-block">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-bold text-base px-7 py-3 rounded-xl shadow-lg shadow-blue-900/30 hover:scale-105 transition-all"
              >
                <Heart className="w-5 h-5 fill-white mr-2" />
                Donate Now
              </Button>
            </Link>

            <Link href="/our-school" className="w-full sm:w-auto inline-block">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-md text-base px-6 py-3 rounded-xl shadow-lg transition-all"
              >
                Explore 24+ School Units
              </Button>
            </Link>
          </div>

          {/* Micro stats floating pills */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-white">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">100% Zakat & Sadqah Verified</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">7,000+ Students</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">24+ School Units</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">11+ Years of Service</span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. ABOUT SECTION (id="about-us")
          ------------------------------------------------------------- */}
      <section id="about-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-block px-3.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200/80 text-xs font-bold uppercase tracking-wider">
              About Ghais Jhuggi Taleem Foundation
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading text-slate-900 tracking-tight leading-tight">
              The largest educational and skill development movement for over 20 million nomadic communities.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Ghais Jhuggi Taleem Foundation (GJTF) is a non-profit organization established in 2014 to provide quality education and skills to the nomadic community in Pakistan. Today, through the Jhuggi Taleemi Project, the foundation is educating thousands of children and paving the way for a brighter future.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/aims-and-objectives" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full sm:w-auto justify-center gap-2 px-6 py-3 font-bold shadow-sm rounded-xl text-sm sm:text-base">
                  Read Aims & Objectives
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link href="/about-gjtf-volunteers" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full sm:w-auto justify-center px-6 py-3 font-semibold rounded-xl border-slate-300 text-slate-800 hover:bg-slate-100/80 text-sm sm:text-base">
                  Our Volunteers
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <Image
                src={media.home.aboutSectionImage}
                alt="GJTF Educator teaching nomadic children in a classroom"
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl border border-warm-200 hidden sm:flex items-center gap-4 max-w-xs">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-base font-bold font-heading text-charcoal-deep">Serving Since 2014</div>
                <div className="text-xs text-charcoal-muted">Guiding nomads from birth to their final journey</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. VISION / MISSION / VALUES — 3-COLUMN CARD GRID
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Vision */}
          <Card className="border-t-4 border-t-primary-600 hover:-translate-y-1.5">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center mb-2">
                <Compass className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-primary-700">
                Positive Change
              </div>
              <CardTitle>Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-charcoal-muted leading-relaxed">
                Educating over 8 million nomads and integrating them into the national mainstream.
              </p>
            </CardContent>
          </Card>

          {/* Mission */}
          <Card className="border-t-4 border-t-accent-600 hover:-translate-y-1.5">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-accent-100 text-accent-700 flex items-center justify-center mb-2">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-accent-700">
                Education / Future
              </div>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-charcoal-muted leading-relaxed">
                Guiding nomads (Jhuggi Nasheen) from birth to their final journey.
              </p>
            </CardContent>
          </Card>

          {/* Values */}
          <Card className="border-t-4 border-t-emerald-600 hover:-translate-y-1.5">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                <Heart className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Core Principles
              </div>
              <CardTitle>Our Values</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-charcoal-muted leading-relaxed font-medium">
                Sincerity, Service, Beauty, Positive Conduct
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* -------------------------------------------------------------
          4. ANIMATED STATS COUNTER SECTION
          ------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-warm-100 to-warm-50 py-20 border-y border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our Measurable Impact"
            title="A Decade of Changing Lives"
            subtitle="Through our Jhuggi Taleemi Project, we are systematically turning marginalized settlements into centers of learning and hope."
          />
          <StatsCounter />
        </div>
      </section>

      {/* -------------------------------------------------------------
          5. OUR MODEL SECTION
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 border border-slate-200/80 shadow-sm">
          <div className="max-w-3xl mb-6 sm:mb-10">
            <div className="inline-block px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider mb-2.5">
              Comprehensive Approach
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-slate-900 tracking-tight">
              Our Model
            </h2>
            <p className="mt-1.5 text-sm sm:text-base md:text-lg text-primary-700 font-semibold">
              Free schooling through Jhuggi Taleemi Project
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            {[
              {
                num: "01",
                title: "Establishing schools within nomadic settlements",
                desc: "Bringing education directly to their doorstep without displacement or travel danger.",
              },
              {
                num: "02",
                title: "Vocational training for youth and women",
                desc: "Equipping mothers and adolescent girls with stitching, tailoring, and practical crafts.",
              },
              {
                num: "03",
                title: "Integrating nomads into the national mainstream",
                desc: "Facilitating civil registration, national identification, and formal curriculum transition.",
              },
              {
                num: "04",
                title: "Breaking the cycle of poverty through education",
                desc: "Replacing hazardous scrap scavenging with literacy, digital knowledge, and dignity.",
              },
              {
                num: "05",
                title: "Aiming to uplift 20 million nomads across Pakistan",
                desc: "A nationwide scalable blueprint operating actively in 24 cities.",
              },
            ].map((step, idx) => (
              <div
                key={step.num}
                className="p-4 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:border-primary-300 hover:shadow-sm transition-all duration-300 space-y-2.5 sm:space-y-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-sm">
                  {step.num}
                </div>
                <h3 className="text-base sm:text-lg font-bold font-heading text-slate-900 leading-snug group-hover:text-primary-800 transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}

            {/* 6. Authentic photo of Jhuggi Taleemi Project students */}
            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 min-h-[180px] sm:min-h-[200px] group">
              <Image
                src={media.home.ourModelImage}
                alt="Jhuggi Taleemi Project students in classroom"
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-end p-4 sm:p-5">
                <span className="text-white text-xs sm:text-sm font-bold font-heading">
                  Real Impact • Transforming 20M Nomadic Lives
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          6. SCHOOLS CTA BANNER
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-primary-900 text-white p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 text-center md:text-left">
            <span className="text-xs uppercase tracking-widest text-accent-400 font-bold">
              Nationwide Campus Network
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
              Ghais Jhuggi Taleem Foundation Schools
            </h2>
            <p className="text-primary-100 text-base sm:text-lg max-w-xl">
              GJTF builds schools within nomadic settlements
            </p>
          </div>
          <Link href="/our-school">
            <Button
              variant="accent"
              size="lg"
              className="font-bold shadow-soft hover:shadow-glow whitespace-nowrap"
            >
              <SchoolIcon className="w-5 h-5 mr-2" />
              Explore Our Schools
            </Button>
          </Link>
        </div>
      </section>


      {/* -------------------------------------------------------------
          8. VOLUNTEER PROGRAM SECTION — 5-CARD BENTO GRID
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Youth In Action"
          title="Our Volunteer Program"
          subtitle="Ghais Jhuggi Taleem Foundation (GJTF) collaborates with various universities through MoUs, allowing students to engage in meaningful community work."
        />

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {/* Card 1: Large Spanning 3 cols */}
          <div className="md:col-span-3 rounded-3xl bg-white border border-warm-200 overflow-hidden shadow-soft p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
              <Image
                src={media.home.volunteerProgram.universityStudents}
                alt="University students volunteering with GJTF"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div>
              <div className="text-xs font-bold text-accent-600 uppercase tracking-wider mb-1">
                Campus Collaboration
              </div>
              <h3 className="text-xl font-bold font-heading text-charcoal-deep">
                Students from partnered universities join our initiatives
              </h3>
            </div>
          </div>

          {/* Card 2: Spanning 3 cols */}
          <div className="md:col-span-3 rounded-3xl bg-white border border-warm-200 overflow-hidden shadow-soft p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
              <Image
                src={media.home.volunteerProgram.teachingMentoring}
                alt="Volunteer mentoring Jhuggi Nasheen children"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div>
              <div className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">
                Mentorship
              </div>
              <h3 className="text-xl font-bold font-heading text-charcoal-deep">
                Assisting in teaching and mentoring Jhuggi Nasheen children.
              </h3>
            </div>
          </div>

          {/* Card 3: Spanning 2 cols */}
          <div className="md:col-span-1 lg:col-span-2 rounded-3xl bg-white border border-warm-200 overflow-hidden shadow-soft p-6 flex flex-col justify-between space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src={media.home.volunteerProgram.workshops}
                alt="Workshops on vocational training"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <h3 className="text-base font-bold font-heading text-charcoal-deep">
              Conducting workshops on vocational training and soft skills.
            </h3>
          </div>

          {/* Card 4: Spanning 2 cols */}
          <div className="md:col-span-1 lg:col-span-2 rounded-3xl bg-white border border-warm-200 overflow-hidden shadow-soft p-6 flex flex-col justify-between space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src={media.home.volunteerProgram.awarenessEvents}
                alt="Interactive awareness events in communities"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <h3 className="text-base font-bold font-heading text-charcoal-deep">
              Organizing awareness sessions and interactive events.
            </h3>
          </div>

          {/* Card 5: Spanning 2 cols */}
          <div className="md:col-span-1 lg:col-span-2 rounded-3xl bg-white border border-warm-200 overflow-hidden shadow-soft p-6 flex flex-col justify-between space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src={media.home.volunteerProgram.youthChange}
                alt="Youth changemakers inspiring action"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <h3 className="text-base font-bold font-heading text-charcoal-deep">
              Encouraging youth to contribute to social change.
            </h3>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 text-center max-w-2xl mx-auto space-y-5">
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
            Through this program, students gain hands-on experience while making a real difference in the lives of nomadic communities.
          </p>
          <div className="pt-3">
            <Link href="/about-gjtf-volunteers" className="inline-block w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto justify-center gap-2 px-8 py-3.5 text-base font-bold shadow-sm rounded-xl hover:shadow">
                Learn More About Volunteers
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          9. COMMUNITY SERVICES SECTION — 4-CARD BENTO GRID
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Beyond The Classroom"
          title="Community Services"
          subtitle="Ghais Jhuggi Taleem Foundation (GJTF) empowers nomadic communities through various skill-based initiatives, helping them achieve economic independence."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Service 1 */}
          <div className="group relative rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                <Image
                  src={media.home.communityServices.vocationalCenters}
                  alt="Vocational training centers"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <span className="absolute top-3.5 right-3.5 px-2.5 py-1 text-[11px] font-bold rounded-full bg-white/95 text-primary-800 shadow-sm backdrop-blur-sm">
                  Vocational Skills
                </span>
              </div>

              {/* Floating icon */}
              <div className="-mt-6 ml-5 relative z-10 w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-600/30 border-2 border-white">
                <Scissors className="w-5 h-5" />
              </div>

              <div className="p-5 pt-3 space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors leading-tight">
                  Vocational Centers
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Providing certified training in stitching, embroidery, handicrafts, and practical trades for mothers and youth.
                </p>
              </div>
            </div>

            <div className="p-5 pt-0">
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-primary-700">
                <span>Certified Courses</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* Service 2 */}
          <div className="group relative rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                <Image
                  src={media.home.communityServices.smallBusiness}
                  alt="Small business entrepreneurship"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <span className="absolute top-3.5 right-3.5 px-2.5 py-1 text-[11px] font-bold rounded-full bg-white/95 text-emerald-800 shadow-sm backdrop-blur-sm">
                  Micro-Enterprise
                </span>
              </div>

              {/* Floating icon */}
              <div className="-mt-6 ml-5 relative z-10 w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 border-2 border-white">
                <Briefcase className="w-5 h-5" />
              </div>

              <div className="p-5 pt-3 space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                  Small Business Support
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Seed grants, micro-tools, and mentorship helping nomadic youth launch and sustain small business enterprises.
                </p>
              </div>
            </div>

            <div className="p-5 pt-0">
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                <span>Financial Independence</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* Service 3 */}
          <div className="group relative rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                <Image
                  src={media.home.communityServices.computerSkills}
                  alt="Digital literacy & tablets"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <span className="absolute top-3.5 right-3.5 px-2.5 py-1 text-[11px] font-bold rounded-full bg-white/95 text-blue-800 shadow-sm backdrop-blur-sm">
                  Digital Literacy
                </span>
              </div>

              {/* Floating icon */}
              <div className="-mt-6 ml-5 relative z-10 w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 border-2 border-white">
                <Laptop className="w-5 h-5" />
              </div>

              <div className="p-5 pt-3 space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                  Computer Skills Training
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Equipping students with tablet navigation, typing, word processing, and digital tools for 21st-century careers.
                </p>
              </div>
            </div>

            <div className="p-5 pt-0">
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
                <span>Modern Tech Lab</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* Service 4 */}
          <div className="group relative rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                <Image
                  src={media.home.communityServices.youthEmpowerment}
                  alt="Youth empowerment and self-sufficiency"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <span className="absolute top-3.5 right-3.5 px-2.5 py-1 text-[11px] font-bold rounded-full bg-white/95 text-indigo-800 shadow-sm backdrop-blur-sm">
                  Youth Leadership
                </span>
              </div>

              {/* Floating icon */}
              <div className="-mt-6 ml-5 relative z-10 w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 border-2 border-white">
                <Users className="w-5 h-5" />
              </div>

              <div className="p-5 pt-3 space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                  Youth Empowerment
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Leadership camps, character workshops, and counseling creating confident changemakers in nomadic communities.
                </p>
              </div>
            </div>

            <div className="p-5 pt-0">
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-700">
                <span>Self-Sufficiency</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 sm:mt-16 text-center space-y-5 max-w-2xl mx-auto">
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            This program enables individuals to break the cycle of poverty and build a secure future for themselves and their families.
          </p>
          <div>
            <Link href="/contact-us" className="inline-block">
              <Button
                variant="outline"
                size="lg"
                className="px-7 py-3 text-sm sm:text-base font-bold rounded-xl border-2 border-primary-600 text-primary-700 bg-white hover:bg-primary-50 shadow-sm transition-all hover:scale-105"
              >
                Contact Us for Partnerships <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          10. JOIN US CTA SECTION (4 BUTTONS)
          ------------------------------------------------------------- */}
      <DonateBanner />

      {/* -------------------------------------------------------------
          11. OUR SCHOOLS PREVIEW SECTION
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200/80 text-xs font-bold uppercase tracking-wider mb-2">
              Featured Landmark Campus
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900">
              Our Schools
            </h2>
          </div>
          <Link href="/our-school" className="inline-block">
            <Button variant="outline" size="sm" className="font-semibold border-slate-300 text-slate-800 hover:bg-slate-50">
              View All 24+ School Units <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {schools.slice(0, 3).map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          12. SUCCESS STORIES SECTION — 4 VIDEO SHOWCASE
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
        <SectionHeading
          eyebrow="Real Impact In Motion"
          title="Success Stories"
          subtitle="Watch firsthand stories of students, community elders, and women whose lives have been transformed through the Jhuggi Taleemi Project."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {media.home.successStoryVideos.map((video) => (
            <StoryVideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>
    </div>
  );
}
