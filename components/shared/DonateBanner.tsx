import * as React from "react";
import Link from "next/link";
import { Heart, Users, DollarSign, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DonateBanner() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white">
      {/* Subtle background ornamentation */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-accent-300 font-semibold text-xs sm:text-sm tracking-wider uppercase backdrop-blur-sm">
          Be Part of Pakistan's Educational Movement
        </span>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight text-white leading-tight">
          Join Ghais Jhuggi Taleem Foundation
        </h2>

        <p className="text-base sm:text-lg text-primary-100/90 max-w-3xl mx-auto leading-relaxed">
          Join GJTF and be a part of Pakistan's largest educational movement for nomads. Together, we can change lives!
        </p>

        {/* 4 Action Buttons from Prompt */}
        <div className="pt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3.5 max-w-4xl mx-auto">
          <Link href="/donate-now" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto justify-center px-6 py-3 rounded-xl font-bold bg-white text-primary-900 hover:bg-slate-100 shadow-sm transition-all hover:scale-105"
            >
              <Heart className="w-4 h-4 fill-red-500 text-red-500 mr-2" />
              Donate to make a difference
            </Button>
          </Link>

          <Link href="/about-gjtf-volunteers" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto justify-center px-6 py-3 rounded-xl font-semibold bg-white/15 text-white hover:bg-white/25 border border-white/30 backdrop-blur-sm transition-all hover:scale-105"
            >
              <Users className="w-4 h-4 text-blue-300 mr-2" />
              Volunteer to transform lives
            </Button>
          </Link>

          <Link href="/donate-now" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto justify-center px-6 py-3 rounded-xl font-semibold bg-white/15 text-white hover:bg-white/25 border border-white/30 backdrop-blur-sm transition-all hover:scale-105"
            >
              <DollarSign className="w-4 h-4 text-emerald-300 mr-2" />
              Raise funds for GJTF
            </Button>
          </Link>

          <Link href="/donate-now#other-ways" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto justify-center px-6 py-3 rounded-xl font-semibold bg-white/15 text-white hover:bg-white/25 border border-white/30 backdrop-blur-sm transition-all hover:scale-105"
            >
              <HelpCircle className="w-4 h-4 text-blue-300 mr-2" />
              Other ways to donate
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
