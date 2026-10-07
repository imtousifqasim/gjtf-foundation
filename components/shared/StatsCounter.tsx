"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { EditableText } from "@/components/editor/LiveEditorProvider";

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  description?: string;
}

export interface StatsCounterProps {
  stats?: StatItem[];
  className?: string;
  theme?: "light" | "dark";
}

function CounterNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  React.useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = value;
    const duration = 2000;
    const incrementTime = 25;
    const step = Math.max(1, Math.ceil(end / (duration / incrementTime)));

    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const DEFAULT_STATS: StatItem[] = [
  {
    label: "Years",
    value: 11,
    suffix: "+",
    description: "Empowering nomadic families since 2014",
  },
  {
    label: "School Units",
    value: 24,
    suffix: "+",
    description: "Schools established in nomadic settlements",
  },
  {
    label: "Students",
    value: 7000,
    suffix: "+",
    description: "Educating thousands of nomadic children",
  },
  {
    label: "Nomads Uplift Target",
    value: 20,
    suffix: "M+",
    description: "Aiming to uplift 20 million nomads across Pakistan",
  },
];

export function StatsCounter({
  stats,
  className,
  theme = "light",
}: StatsCounterProps) {
  const [currentStats, setCurrentStats] = React.useState<StatItem[]>(stats || DEFAULT_STATS);

  React.useEffect(() => {
    if (stats) {
      setCurrentStats(stats);
      return;
    }
    // Fetch live statistics from Hostinger MySQL
    async function fetchLiveStats() {
      try {
        const res = await fetch("/api/data/stats", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            setCurrentStats([
              {
                label: "Years",
                value: d.yearsOfService || 11,
                suffix: "+",
                description: "Empowering nomadic families since 2014",
              },
              {
                label: "School Units",
                value: d.totalSchools || 24,
                suffix: "+",
                description: "Schools established in nomadic settlements",
              },
              {
                label: "Students",
                value: d.totalStudents || 7000,
                suffix: "+",
                description: "Educating thousands of nomadic children",
              },
              {
                label: "Nomads Uplift Target",
                value: d.nomadsTargetMillion || 20,
                suffix: "M+",
                description: "Aiming to uplift 20 million nomads across Pakistan",
              },
            ]);
          }
        }
      } catch (err) {
        // Fallback to default
      }
    }
    fetchLiveStats();
  }, [stats]);

  return (
    <div
      className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6",
        className
      )}
    >
      {currentStats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: idx * 0.08 }}
          className={cn(
            "p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-center border transition-all duration-300 relative flex flex-col justify-between group",
            theme === "light"
              ? "bg-white/90 backdrop-blur-md border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary-300 hover:-translate-y-0.5"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10 backdrop-blur-md"
          )}
        >
          <div>
            <div
              className={cn(
                "text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading tracking-tight mb-1 sm:mb-1.5",
                theme === "light" ? "text-primary-700 group-hover:text-primary-800 transition-colors" : "text-blue-400"
              )}
            >
              <CounterNumber
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
              />
            </div>
            <div
              className={cn(
                "text-xs sm:text-sm md:text-base font-bold font-heading mb-1",
                theme === "light" ? "text-slate-900" : "text-white"
              )}
            >
              {stat.label}
            </div>
          </div>
          {stat.description && (
            <div
              className={cn(
                "text-[11px] sm:text-xs leading-relaxed mt-1 line-clamp-2",
                theme === "light" ? "text-slate-500" : "text-white/60"
              )}
            >
              {stat.description}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// -------------------------------------------------------------
// Live Floating Hero Stats Pills (Dynamically synchronized with MySQL)
// -------------------------------------------------------------
export function HeroStatsPills() {
  const [stats, setStats] = React.useState({
    totalStudents: 7000,
    totalSchools: 24,
    yearsOfService: 11,
  });

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/data/stats", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setStats({
              totalStudents: json.data.totalStudents || 7000,
              totalSchools: json.data.totalSchools || 24,
              yearsOfService: json.data.yearsOfService || 11,
            });
          }
        }
      } catch (err) {
        // keep fallback
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="pt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-white">
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 shadow-md">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <EditableText id="hero_pill_zakat" defaultText="100% Zakat & Sadqah Verified" className="font-medium" />
      </div>

      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 shadow-md">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-medium">
          <EditableText
            id="hero_pill_students"
            defaultText={`${stats.totalStudents.toLocaleString()}+ Students`}
          />
        </span>
      </div>

      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 shadow-md">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-medium">
          <EditableText
            id="hero_pill_schools"
            defaultText={`${stats.totalSchools}+ School Units`}
          />
        </span>
      </div>

      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 shadow-md">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-medium">
          <EditableText
            id="hero_pill_years"
            defaultText={`${stats.yearsOfService}+ Years of Service`}
          />
        </span>
      </div>
    </div>
  );
}
