import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Compass,
  GraduationCap,
  Target,
  School,
  Tablet,
  HeartHandshake,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Heart,
  Globe,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLiveStatsDb } from "@/lib/db/mysql";

export const dynamic = "force-dynamic";

export default async function AimsAndObjectivesPage() {
  let stats: any = {
    totalSchools: 7,
    totalStudents: 1081,
    yearsOfService: 11,
    totalVolunteers: 10000,
    nomadsTargetMillion: 20,
  };

  try {
    const liveStats = await getLiveStatsDb();
    if (liveStats) stats = liveStats;
  } catch (err) {
    // fallback
  }

  return (
    <div className="space-y-16 md:space-y-24 pb-16">
      {/* -------------------------------------------------------------
          1. HERO SECTION: AIMS AND OBJECTIVES
          ------------------------------------------------------------- */}
      <section className="relative py-16 sm:py-20 md:py-28 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/aims-objectives-hero.jpg"
            alt="Aims and Objectives of GJTF"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/95 via-primary-900/90 to-charcoal-deep/85" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-primary-200 text-xs font-bold tracking-wider uppercase border border-white/15 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Our National Duty
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight text-white">
            Aims and Objectives
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-primary-100/95 leading-relaxed max-w-3xl mx-auto font-normal">
            To make civil society, charitable institutions and other segments aware of the educational problems of slum children, so that this gap can be filled through collective efforts. This mission is not just an educational service but a national duty.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
            <Link href="/donate-now">
              <Button
                variant="primary"
                size="lg"
                className="font-bold shadow-soft hover:shadow-glow bg-white text-primary-950 hover:bg-slate-100 border-white gap-2"
              >
                <Heart className="w-4 h-4 text-primary-700 fill-primary-700" />
                <span>Support Our Cause</span>
              </Button>
            </Link>
            <Link href="/contact-us">
              <Button
                variant="secondary"
                size="lg"
                className="font-semibold bg-white/10 text-white hover:bg-white/20 border-white/20"
              >
                <span>Partner With Us</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. LIVE IMPACT METRICS: 4 CORE FOUNDATION STATS
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1: Years of Service */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900">
              {stats.yearsOfService}+
            </div>
            <div className="text-sm font-bold text-slate-800">Years of Service</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Empowering nomadic families and slum communities continuously since 2014.
            </p>
          </div>

          {/* Stat 2: School Units */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900">
              {stats.totalSchools}+
            </div>
            <div className="text-sm font-bold text-slate-800">School Units</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Weatherproof campuses established right inside nomadic settlements.
            </p>
          </div>

          {/* Stat 3: Enrolled Students */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900">
              {stats.totalStudents.toLocaleString()}+
            </div>
            <div className="text-sm font-bold text-slate-800">Students Enrolled</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Educating thousands of nomadic children with free books, uniforms, and meals.
            </p>
          </div>

          {/* Stat 4: Active Volunteers */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900">
              10,000+
            </div>
            <div className="text-sm font-bold text-slate-800">Active Volunteers</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mobilizing passionate youth and university student chapters nationwide.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. VISION & CORE OBJECTIVES (2-COLUMN CARDS)
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vision */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-soft overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow">
            <div className="relative h-64 sm:h-72 w-full">
              <Image
                src="/images/aims-vision.jpg"
                alt="GJTF 50-Year Vision"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary-900/80 text-white text-xs font-bold backdrop-blur-md">
                  <Compass className="w-3.5 h-3.5 text-amber-300" />
                  50-Year Vision
                </span>
              </div>
            </div>

            <div className="p-7 sm:p-8 space-y-3">
              <h2 className="text-2xl font-bold font-heading text-charcoal-deep">
                Vision
              </h2>
              <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
                In fifty years, more than eight million nomadic communities will be equipped with knowledge and skills and included in the national mainstream. Insha Allah
              </p>
            </div>
          </div>

          {/* Objectives and Objectives */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-soft overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow">
            <div className="relative h-64 sm:h-72 w-full">
              <Image
                src="/images/aims-core-objectives.jpg"
                alt="Objectives and Objectives of GJTF"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary-900/80 text-white text-xs font-bold backdrop-blur-md">
                  <Target className="w-3.5 h-3.5 text-amber-300" />
                  National Building
                </span>
              </div>
            </div>

            <div className="p-7 sm:p-8 space-y-3">
              <h2 className="text-2xl font-bold font-heading text-charcoal-deep">
                Objectives and Objectives
              </h2>
              <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
                To build a nation by eliminating the communication gap between civil society and the most deprived sections of humanity, especially the approximately 25 million nomadic community living in Pakistan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          4. EDUCATION LANDSCAPE SECTION
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-primary-950 to-charcoal-deep text-white overflow-hidden shadow-2xl border border-primary-800/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-primary-200 text-xs font-bold tracking-wider uppercase border border-white/15">
                <GraduationCap className="w-4 h-4 text-amber-300" />
                Educational Philosophy
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-white tracking-tight">
                Education
              </h2>

              <p className="text-sm sm:text-base text-primary-100/90 leading-relaxed font-normal">
                Education is the guarantor of the progress and prosperity of nations in the world. Nations express their goals of life through educational philosophy. Unfortunately, the education sector in Pakistan is in decline. According to a UNICEF report (excluding the more than 20 million nomadic community), 27 million children are out of school.
              </p>
            </div>

            <div className="lg:col-span-6 p-4 sm:p-8 lg:p-10">
              <div className="relative h-72 sm:h-80 md:h-96 w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                <Image
                  src="/images/aims-education.jpg"
                  alt="Education for Nomadic Children"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          5. CORE SERVICES & INITIATIVES (3-COLUMN CARDS)
          ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Services */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-soft overflow-hidden flex flex-col justify-between hover:-translate-y-1 transition-all">
            <div className="relative h-56 w-full">
              <Image
                src="/images/aims-services.jpg"
                alt="Tent Schools and Sewing Centers"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-900/80 text-white text-xs font-bold backdrop-blur-md">
                  <School className="w-3.5 h-3.5 text-amber-300" />
                  Slum Education
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold font-heading text-charcoal-deep mb-2">
                  Services
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                  Ghais Jhuggi Education Foundation Pakistan has done its services by setting up tents in slums and providing education in slums. Education has taken away the burden of making sackcloth and ashes from the young nomadic children and girls and given them a dignified job. Sewing centers have been established for girls, as a result of which the takers have become givers. Alhamdulillah
                </p>
              </div>
            </div>
          </div>

          {/* Digital devices for Education */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-soft overflow-hidden flex flex-col justify-between hover:-translate-y-1 transition-all">
            <div className="relative h-56 w-full">
              <Image
                src="/images/aims-digital-devices.jpg"
                alt="Digital devices for slum students"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-900/80 text-white text-xs font-bold backdrop-blur-md">
                  <Tablet className="w-3.5 h-3.5 text-amber-300" />
                  Modern E-Learning
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold font-heading text-charcoal-deep mb-2">
                  Digital devices for Education
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                  Considering the demands of modern times, slum students were provided with tablets for their education in Faisalabad, Lahore, Karachi and Sheikhupura.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {["Faisalabad", "Lahore", "Karachi", "Sheikhupura"].map((city) => (
                  <span
                    key={city}
                    className="px-2.5 py-0.5 rounded-lg bg-primary-50 text-primary-800 text-[11px] font-semibold border border-primary-100"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Community Services */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-soft overflow-hidden flex flex-col justify-between hover:-translate-y-1 transition-all">
            <div className="relative h-56 w-full">
              <Image
                src="/images/aims-community-services.jpg"
                alt="Community Services and Seasonal Assistance"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-900/80 text-white text-xs font-bold backdrop-blur-md">
                  <Gift className="w-3.5 h-3.5 text-amber-300" />
                  Welfare & Dignity
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold font-heading text-charcoal-deep mb-2">
                  Community Services
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                  Warm and cold clothes, uniforms, gifts on the occasion of weddings and Eids, participation in celebrations, meals, etc. are arranged depending on the season.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
