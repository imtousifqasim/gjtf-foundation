"use client";

import * as React from "react";
import Link from "next/link";
import { GraduationCap, Sparkles, Building2, MapPin, Users, ExternalLink } from "lucide-react";

export interface UniversityItem {
  id: string;
  name: string;
  shortName: string;
  city: string;
  type: string;
  primaryColor: string;
  secondaryColor: string;
  established: string;
  svgIcon: React.ReactNode;
}

export const UNIVERSITIES: UniversityItem[] = [
  {
    id: "pu",
    name: "University of the Punjab",
    shortName: "Punjab University",
    city: "Lahore",
    type: "MOU Partner & Student Chapter",
    primaryColor: "#800020",
    secondaryColor: "#D4AF37",
    established: "Est. 1882",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#800020" />
        <circle cx="24" cy="24" r="19" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="3 2" />
        <path d="M14 28C17 25 21 25 24 27C27 25 31 25 34 28V19C31 16 27 16 24 18C21 16 17 16 14 19V28Z" fill="#D4AF37" />
        <path d="M24 18V27" stroke="#800020" strokeWidth="1.5" />
        <circle cx="24" cy="13" r="2" fill="#FFFFFF" />
        <text x="24" y="38" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">PU</text>
      </svg>
    ),
  },
  {
    id: "umt",
    name: "University of Management and Technology",
    shortName: "UMT",
    city: "Lahore",
    type: "MOU Partner & Youth Leadership",
    primaryColor: "#8B1538",
    secondaryColor: "#F59E0B",
    established: "Est. 1990",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#8B1538" />
        <circle cx="24" cy="24" r="19" stroke="#F59E0B" strokeWidth="1.5" />
        <path d="M24 10L27 19L36 20L29 26L31 35L24 30L17 35L19 26L12 20L21 19L24 10Z" fill="#F59E0B" />
        <circle cx="24" cy="23" r="4" fill="#8B1538" />
        <text x="24" y="25" textAnchor="middle" fill="#FFFFFF" fontSize="5" fontWeight="900" fontFamily="sans-serif">UMT</text>
      </svg>
    ),
  },
  {
    id: "comsats",
    name: "COMSATS University Islamabad",
    shortName: "COMSATS University",
    city: "Islamabad & Lahore",
    type: "Technology & Student Volunteers",
    primaryColor: "#003366",
    secondaryColor: "#0284C7",
    established: "Est. 1998",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#003366" />
        <circle cx="24" cy="24" r="19" stroke="#38BDF8" strokeWidth="1.5" />
        <path d="M16 16L24 11L32 16V26L24 31L16 26V16Z" stroke="#38BDF8" strokeWidth="2" fill="none" />
        <path d="M24 11V31M16 16L32 26M16 26L32 16" stroke="#38BDF8" strokeWidth="1" opacity="0.6" />
        <text x="24" y="40" textAnchor="middle" fill="#FFFFFF" fontSize="5.5" fontWeight="800" fontFamily="sans-serif">CUI</text>
      </svg>
    ),
  },
  {
    id: "ucp",
    name: "University of Central Punjab",
    shortName: "UCP",
    city: "Lahore",
    type: "Student Volunteer Chapter",
    primaryColor: "#1E3A8A",
    secondaryColor: "#DC2626",
    established: "Est. 2002",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#1E3A8A" />
        <circle cx="24" cy="24" r="19" stroke="#DC2626" strokeWidth="2" />
        <path d="M18 16H30V24C30 27.3 27.3 30 24 30C20.7 30 18 27.3 18 24V16Z" fill="#DC2626" />
        <path d="M21 16V23C21 24.7 22.3 26 24 26C25.7 26 27 24.7 27 23V16H21Z" fill="#FFFFFF" />
        <text x="24" y="39" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="900" fontFamily="sans-serif">UCP</text>
      </svg>
    ),
  },
  {
    id: "superior",
    name: "Superior University",
    shortName: "Superior University",
    city: "Lahore",
    type: "Community Engagement Partner",
    primaryColor: "#DC2626",
    secondaryColor: "#1F2937",
    established: "Est. 2000",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#DC2626" />
        <circle cx="24" cy="24" r="19" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M16 17L24 13L32 17L24 21L16 17Z" fill="#FFFFFF" />
        <path d="M19 22.5V28C19 31 24 33 24 33C24 33 29 31 29 28V22.5L24 25L19 22.5Z" fill="#FEF08A" />
        <text x="24" y="41" textAnchor="middle" fill="#FFFFFF" fontSize="5.5" fontWeight="900" fontFamily="sans-serif">SUPERIOR</text>
      </svg>
    ),
  },
  {
    id: "cust",
    name: "Capital University of Science and Technology",
    shortName: "Capital University (CUST)",
    city: "Islamabad",
    type: "Youth Empowerment Partner",
    primaryColor: "#0F172A",
    secondaryColor: "#EAB308",
    established: "Est. 1998",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#0F172A" />
        <circle cx="24" cy="24" r="19" stroke="#EAB308" strokeWidth="1.5" />
        <path d="M24 13L34 26H14L24 13Z" fill="#EAB308" />
        <circle cx="24" cy="24" r="3" fill="#0F172A" />
        <text x="24" y="38" textAnchor="middle" fill="#FFFFFF" fontSize="5.5" fontWeight="900" fontFamily="sans-serif">CUST</text>
      </svg>
    ),
  },
  {
    id: "iiui",
    name: "International Islamic University Islamabad",
    shortName: "International Islamic University",
    city: "Islamabad",
    type: "Islamic Studies & Community Volunteerism",
    primaryColor: "#15803D",
    secondaryColor: "#CA8A04",
    established: "Est. 1980",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#15803D" />
        <circle cx="24" cy="24" r="19" stroke="#CA8A04" strokeWidth="1.5" />
        {/* Crescent and Dome */}
        <path d="M24 14C19.5 14 16 17.5 16 22H32C32 17.5 28.5 14 24 14Z" fill="#FEF08A" />
        <path d="M20 23H28V31H20V23Z" fill="#FFFFFF" />
        <path d="M24 10V14" stroke="#CA8A04" strokeWidth="1.5" />
        <text x="24" y="39" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="900" fontFamily="sans-serif">IIUI</text>
      </svg>
    ),
  },
  {
    id: "ntu",
    name: "National Textile University Faisalabad",
    shortName: "NTU Faisalabad",
    city: "Faisalabad",
    type: "Vocational & Student Chapter",
    primaryColor: "#1E1B4B",
    secondaryColor: "#D97706",
    established: "Est. 1959",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#1E1B4B" />
        <circle cx="24" cy="24" r="19" stroke="#D97706" strokeWidth="1.5" />
        {/* Loom / Textile Shuttles */}
        <circle cx="24" cy="22" r="7" stroke="#D97706" strokeWidth="2" strokeDasharray="3 1.5" />
        <line x1="14" y1="22" x2="34" y2="22" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="24" y1="12" x2="24" y2="32" stroke="#FFFFFF" strokeWidth="2" />
        <text x="24" y="40" textAnchor="middle" fill="#FDE68A" fontSize="6" fontWeight="900" fontFamily="sans-serif">NTU</text>
      </svg>
    ),
  },
  {
    id: "uaf",
    name: "University of Agriculture Faisalabad",
    shortName: "University of Agriculture",
    city: "Faisalabad",
    type: "Rural Development & Student Chapter",
    primaryColor: "#047857",
    secondaryColor: "#F59E0B",
    established: "Est. 1906",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#047857" />
        <circle cx="24" cy="24" r="19" stroke="#F59E0B" strokeWidth="1.5" />
        {/* Wheat Ear icon */}
        <path d="M24 32V14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 16C21 15 20 18 20 18C22 19 24 18 24 18M24 19C27 18 28 21 28 21C26 22 24 21 24 21M24 23C21 22 20 25 20 25C22 26 24 25 24 25M24 26C27 25 28 28 28 28C26 29 24 28 24 28" stroke="#FEF08A" strokeWidth="1.5" fill="none" />
        <text x="24" y="40" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">UAF</text>
      </svg>
    ),
  },
  {
    id: "gcuf",
    name: "Government College University Faisalabad",
    shortName: "GCU Faisalabad",
    city: "Faisalabad",
    type: "Youth Education Chapter",
    primaryColor: "#4A044E",
    secondaryColor: "#EAB308",
    established: "Est. 1897",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#4A044E" />
        <circle cx="24" cy="24" r="19" stroke="#EAB308" strokeWidth="1.5" />
        {/* Crown & Book */}
        <path d="M16 26L18 16L24 20L30 16L32 26H16Z" fill="#EAB308" />
        <circle cx="24" cy="20" r="1.5" fill="#4A044E" />
        <text x="24" y="38" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="900" fontFamily="sans-serif">GCUF</text>
      </svg>
    ),
  },
  {
    id: "bzu",
    name: "Bahauddin Zakariya University Multan",
    shortName: "Bahauddin Zakariya University",
    city: "Multan",
    type: "South Punjab Volunteer Network",
    primaryColor: "#0369A1",
    secondaryColor: "#38BDF8",
    established: "Est. 1975",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#0369A1" />
        <circle cx="24" cy="24" r="19" stroke="#FDE047" strokeWidth="1.5" />
        {/* Traditional Blue Tomb Dome */}
        <path d="M24 12C20 12 17 17 17 22H31C31 17 28 12 24 12Z" fill="#38BDF8" />
        <path d="M19 23H29V28H19V23Z" fill="#FFFFFF" />
        <text x="24" y="39" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">BZU</text>
      </svg>
    ),
  },
  {
    id: "namal",
    name: "Namal University Mianwali",
    shortName: "Namal University",
    city: "Mianwali",
    type: "Knowledge City & Rural Mentorship",
    primaryColor: "#064E3B",
    secondaryColor: "#B45309",
    established: "Est. 2008",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#064E3B" />
        <circle cx="24" cy="24" r="19" stroke="#FBBF24" strokeWidth="1.5" />
        {/* Mountain Peak & Knowledge Sun */}
        <path d="M15 28L24 16L33 28H15Z" fill="#FBBF24" />
        <circle cx="24" cy="14" r="2.5" fill="#FFFFFF" />
        <text x="24" y="39" textAnchor="middle" fill="#FFFFFF" fontSize="5.5" fontWeight="900" fontFamily="sans-serif">NAMAL</text>
      </svg>
    ),
  },
  {
    id: "aimc",
    name: "Allama Iqbal Medical College",
    shortName: "Allama Iqbal Medical College",
    city: "Lahore",
    type: "Medical Camps & Health Volunteers",
    primaryColor: "#991B1B",
    secondaryColor: "#FFFFFF",
    established: "Est. 1975",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#991B1B" />
        <circle cx="24" cy="24" r="19" stroke="#FFFFFF" strokeWidth="1.5" />
        {/* Medical Cross & Rod */}
        <rect x="21" y="14" width="6" height="18" rx="2" fill="#FFFFFF" />
        <rect x="15" y="20" width="18" height="6" rx="2" fill="#FFFFFF" />
        <circle cx="24" cy="23" r="2" fill="#991B1B" />
        <text x="24" y="40" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="900" fontFamily="sans-serif">AIMC</text>
      </svg>
    ),
  },
  {
    id: "uet",
    name: "University of Engineering and Technology",
    shortName: "UET Lahore",
    city: "Lahore",
    type: "Technical Innovation & Volunteer Chapter",
    primaryColor: "#7F1D1D",
    secondaryColor: "#94A3B8",
    established: "Est. 1921",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#7F1D1D" />
        <circle cx="24" cy="24" r="19" stroke="#CBD5E1" strokeWidth="1.5" />
        {/* Cogwheel & Torch */}
        <circle cx="24" cy="22" r="6" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 1.5" />
        <circle cx="24" cy="22" r="2.5" fill="#CBD5E1" />
        <path d="M24 12V14M24 30V32M14 22H16M32 22H34" stroke="#FFFFFF" strokeWidth="2" />
        <text x="24" y="40" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">UET</text>
      </svg>
    ),
  },
  {
    id: "uok",
    name: "University of Kamalia",
    shortName: "University of Kamalia",
    city: "Kamalia",
    type: "Regional Education & Community Chapter",
    primaryColor: "#0F766E",
    secondaryColor: "#F59E0B",
    established: "Est. 2020",
    svgIcon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#0F766E" />
        <circle cx="24" cy="24" r="19" stroke="#F59E0B" strokeWidth="1.5" />
        {/* Open Book & Rays */}
        <path d="M15 26C18 24 21 24 24 25C27 24 30 24 33 26V18C30 16 27 16 24 17C21 16 18 16 15 18V26Z" fill="#F59E0B" />
        <path d="M24 17V25" stroke="#0F766E" strokeWidth="1.5" />
        <text x="24" y="38" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="900" fontFamily="sans-serif">UOK</text>
      </svg>
    ),
  },
];

export function PartnerUniversitiesMarquee() {
  // Duplicate array for infinite seamless looping ticker
  const marqueeItems = [...UNIVERSITIES, ...UNIVERSITIES];

  return (
    <section className="relative py-16 sm:py-20 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white overflow-hidden border-y border-slate-800 shadow-2xl">
      {/* Ambient background glows */}
      <div className="absolute left-1/4 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 bottom-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 mb-10 sm:mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider shadow-inner">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span>Academic Partnerships &bull; 15+ Universities Attached</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading text-white tracking-tight">
          Attached Universities &amp; Student Chapters
        </h2>

        <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Students, doctors, and volunteers from Pakistan&apos;s leading universities collaborate directly with GJTF to educate nomadic children, conduct medical camps, and drive grassroots change.
        </p>
      </div>

      {/* Infinite Scrolling Marquee Track with Fade Gradient Edges */}
      <div className="relative w-full overflow-hidden select-none group py-4">
        {/* Left & Right Shadow Fade Gradients for professional infinity effect */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 md:w-40 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 md:w-40 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none" />

        {/* Marquee Ticker */}
        <div className="animate-marquee flex items-center gap-4 sm:gap-6">
          {marqueeItems.map((uni, idx) => (
            <div
              key={`${uni.id}-${idx}`}
              className="relative group/card flex-shrink-0"
            >
              {/* University Logo Card */}
              <div
                className="w-44 sm:w-52 p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-emerald-400/80 hover:bg-slate-850 hover:shadow-xl hover:shadow-emerald-950/40 transition-all duration-300 flex items-center gap-3 cursor-pointer group-hover/card:scale-105"
              >
                {/* Logo Badge Container */}
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl p-1 bg-white shadow-md flex items-center justify-center shrink-0 border border-slate-200 transition-transform group-hover/card:rotate-3"
                  style={{ borderColor: uni.primaryColor }}
                >
                  {uni.svgIcon}
                </div>

                {/* Brief Title */}
                <div className="text-left overflow-hidden min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white group-hover/card:text-emerald-400 transition-colors truncate">
                    {uni.shortName}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{uni.city}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Tooltip on Hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/card:flex flex-col items-center z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-200 w-64">
                <div className="bg-slate-950 text-white text-xs p-3.5 rounded-2xl shadow-2xl border border-emerald-500/50 space-y-1.5 text-center backdrop-blur-md">
                  <div className="font-extrabold text-sm text-white font-heading">
                    {uni.name}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-semibold text-[10px] border border-emerald-800">
                    <Building2 className="w-3 h-3" />
                    <span>{uni.type}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800 flex justify-between items-center">
                    <span>Campus: <strong>{uni.city}</strong></span>
                    <span className="text-slate-400">{uni.established}</span>
                  </div>
                </div>
                {/* Tooltip caret */}
                <div className="w-3 h-3 bg-slate-950 border-r border-b border-emerald-500/50 rotate-45 -mt-1.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* University Chapter Callout */}
      <div className="mt-8 text-center relative z-10">
        <Link
          href="/university-chapter"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-4"
        >
          <span>Start a GJTF Student Chapter at your University</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
