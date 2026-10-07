"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  School as SchoolIcon,
  Search,
  Filter,
  MapPin,
  BookOpen,
  Users,
  Compass,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { schools, School } from "@/data/schools";
import { SchoolCard } from "@/components/shared/SchoolCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function OurSchoolPage() {
  const [schoolsList, setSchoolsList] = React.useState<School[]>(schools);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedProvince, setSelectedProvince] = React.useState<string>("All");
  const [selectedType, setSelectedType] = React.useState<string>("All");

  React.useEffect(() => {
    async function fetchLiveSchools() {
      try {
        const res = await fetch("/api/data/schools", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const data = json.data;
          if (data && data.length > 0) {
            const mapped: School[] = data.map((s: any) => ({
              id: s.id,
              slug: s.slug,
              name: s.name,
              campusType: (s.campus_type || "Primary") as any,
              shift: (s.shift || "Morning") as any,
              city: s.city || "",
              province: (s.province || "Punjab") as any,
              areaSqFt: s.area_sq_ft || 0,
              classrooms: s.classrooms || 0,
              studentCapacity: s.student_capacity || 0,
              currentStudents: s.current_students || 0,
              establishedYear: s.established_year || 2024,
              description: s.description || "",
              facilities: Array.isArray(s.facilities) ? s.facilities : [],
              cardImage: s.card_image || "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=900",
              heroImage: s.hero_image || s.card_image || "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1800",
              galleryImages: Array.isArray(s.gallery_images) ? s.gallery_images : [],
              featured: Boolean(s.featured),
              coordinates: { lat: 31.5204, lng: 74.3587 },
            }));
            setSchoolsList(mapped);
          }
        }
      } catch (err) {
        // Fallback to static schools
      }
    }
    fetchLiveSchools();
  }, []);

  const filteredSchools = schoolsList.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.province.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvince =
      selectedProvince === "All" || school.province === selectedProvince;

    const matchesType =
      selectedType === "All" || school.campusType === selectedType;

    return matchesSearch && matchesProvince && matchesType;
  });

  return (
    <div className="space-y-20 md:space-y-28 pb-16">
      {/* Hero */}
      <section className="relative py-12 sm:py-16 md:py-20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1920&auto=format&fit=crop"
            alt="GJTF School Campus Building"
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
            Landmark Educational Hubs
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading tracking-tight leading-tight">
            Our Schools
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-primary-100/90 leading-relaxed max-w-2xl mx-auto">
            All GJTF Schools are landmarks in their communities. Our school buildings are well-equipped with airy and well lit classrooms, an administrative block, playground, library, computer and science labs to provide students with a stimulating learning environment.
          </p>

          <div className="pt-2">
            <a href="#directory">
              <Button variant="primary" size="lg" className="font-bold shadow-soft hover:shadow-glow">
                Explore School Directory
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Network Stat Banner & Pakistan Regional Map */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-950 rounded-3xl p-8 sm:p-12 md:p-16 text-white shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs uppercase tracking-widest text-accent-400 font-bold">
                Nationwide Footprint
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading text-white leading-tight">
                We have a network of 2,033 school units across Pakistan
              </h2>
              <p className="text-primary-100/90 text-base sm:text-lg leading-relaxed">
                Operating actively in 24 cities across Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, and Islamabad Capital Territory, transforming nomadic squatter settlements into centers of literacy.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="text-2xl font-bold text-accent-400">24</div>
                  <div className="text-xs text-primary-200">Cities Reached</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="text-2xl font-bold text-accent-400">2,033</div>
                  <div className="text-xs text-primary-200">School Units</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 col-span-2 sm:col-span-1">
                  <div className="text-2xl font-bold text-accent-400">5,500+</div>
                  <div className="text-xs text-primary-200">Slum Students</div>
                </div>
              </div>
            </div>

            {/* Interactive SVG Pakistan Map Presentation */}
            <div className="lg:col-span-5 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm text-center space-y-4">
              <div className="text-xs font-semibold text-primary-200 uppercase tracking-wider">
                Geographic Presence
              </div>
              <svg
                viewBox="0 0 500 400"
                className="w-full h-56 mx-auto drop-shadow-md"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Simplified Pakistan Provinces stylized SVG outline */}
                <path
                  d="M160 70 L240 50 L320 80 L350 140 L330 180 L290 220 L270 290 L240 370 L190 350 L160 300 L110 260 L80 210 L110 140 Z"
                  fill="#147D60"
                  fillOpacity="0.4"
                  stroke="#63b6a0"
                  strokeWidth="2"
                />
                {/* Lahore Marker */}
                <g className="cursor-pointer group">
                  <circle cx="285" cy="205" r="7" fill="#f78112" />
                  <circle cx="285" cy="205" r="14" fill="#f78112" fillOpacity="0.3" className="animate-ping" />
                  <text x="298" y="210" fill="#ffffff" fontSize="13" fontWeight="bold">Lahore (HQ)</text>
                </g>
                {/* Karachi Marker */}
                <g className="cursor-pointer group">
                  <circle cx="195" cy="345" r="7" fill="#f78112" />
                  <text x="140" y="365" fill="#ffffff" fontSize="13" fontWeight="bold">Karachi</text>
                </g>
                {/* Islamabad Marker */}
                <g className="cursor-pointer group">
                  <circle cx="270" cy="140" r="6" fill="#ffdcaa" />
                  <text x="280" y="145" fill="#ffffff" fontSize="12" fontWeight="semibold">Islamabad</text>
                </g>
                {/* Faisalabad Marker */}
                <g className="cursor-pointer group">
                  <circle cx="260" cy="215" r="6" fill="#ffdcaa" />
                  <text x="180" y="225" fill="#ffffff" fontSize="11">Faisalabad</text>
                </g>
              </svg>
              <p className="text-xs text-primary-200/80">
                Hover or select a city below to inspect school campuses
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* School Specs: 2-Column Comparison Cards (Verbatim) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Architectural Standards"
          title="Campus Specifications"
          subtitle="Engineered for dignity, safety, climate resilience, and modern pedagogical excellence."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Primary School */}
          <div className="rounded-3xl bg-white border border-warm-200 p-8 sm:p-10 shadow-soft space-y-6 hover:shadow-soft-lg transition-all border-t-4 border-t-primary-600">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider">
                Foundational Learning
              </span>
              <span className="text-sm font-semibold text-charcoal-muted">Grades 1 – 5</span>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-bold font-heading text-charcoal-deep">
                GJTF Primary School
              </h3>
              <p className="text-xs text-charcoal-muted mt-1">
                Optimized for early childhood learning, play-based activities, and mother counseling.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-warm-50 border border-warm-200/80 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold font-heading text-primary-700">~6,500</div>
                <div className="text-xs text-charcoal-muted">sq ft area</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold font-heading text-primary-700">6</div>
                <div className="text-xs text-charcoal-muted">classrooms</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold font-heading text-primary-700">30</div>
                <div className="text-xs text-charcoal-muted">per class</div>
              </div>
            </div>

            <ul className="space-y-2.5 text-sm text-charcoal-muted">
              {[
                "Airy & Well-Lit Classrooms designed for cross-ventilation",
                "Administrative Block & Teacher Preparation Room",
                "Enclosed Playground for safe outdoor activities",
                "Reading Library with Urdu & English illustrated books",
                "Sanitation facilities with clean drinking water filtration",
              ].map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Secondary School */}
          <div className="rounded-3xl bg-white border border-warm-200 p-8 sm:p-10 shadow-soft space-y-6 hover:shadow-soft-lg transition-all border-t-4 border-t-accent-600">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1 rounded-full bg-accent-100 text-accent-800 text-xs font-bold uppercase tracking-wider">
                Matriculation Pathways
              </span>
              <span className="text-sm font-semibold text-charcoal-muted">Grades 6 – 10</span>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-bold font-heading text-charcoal-deep">
                GJTF Secondary School
              </h3>
              <p className="text-xs text-charcoal-muted mt-1">
                Built to support Board examinations, science demonstrations, and career readiness.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-warm-50 border border-warm-200/80 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold font-heading text-accent-700">~9,000</div>
                <div className="text-xs text-charcoal-muted">sq ft area</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold font-heading text-accent-700">5</div>
                <div className="text-xs text-charcoal-muted">classrooms</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold font-heading text-accent-700">36</div>
                <div className="text-xs text-charcoal-muted">per class</div>
              </div>
            </div>

            <ul className="space-y-2.5 text-sm text-charcoal-muted">
              {[
                "Larger instructional halls suited for mature student cohorts",
                "Equipped Computer Lab with high-speed internet & tablets",
                "Physics, Chemistry & Biology demonstration lab equipment",
                "Career Guidance and Technical Apprenticeship cell",
                "Sports facilities for cricket, football, and team athletics",
              ].map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-600 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Schools Directory (Searchable & Filterable) */}
      <section id="directory" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider mb-2">
                Search & Filter
              </div>
              <h2 className="text-3xl font-bold font-heading text-charcoal-deep">
                Schools Directory
              </h2>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-charcoal-muted" />
                <Input
                  placeholder="Search by name, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="h-11 rounded-2xl border border-warm-300 bg-white px-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="All">All Provinces</option>
                <option value="Sindh">Sindh</option>
                <option value="Punjab">Punjab</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-11 rounded-2xl border border-warm-300 bg-white px-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="All">All Types</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
              </select>
            </div>
          </div>

          {filteredSchools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSchools.map((school) => (
                <SchoolCard key={school.id} school={school} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-warm-200 space-y-3">
              <SchoolIcon className="w-12 h-12 text-charcoal-muted mx-auto" />
              <h3 className="text-lg font-bold text-charcoal-deep">No schools found</h3>
              <p className="text-sm text-charcoal-muted">
                Try adjusting your search query or filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedProvince("All");
                  setSelectedType("All");
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
