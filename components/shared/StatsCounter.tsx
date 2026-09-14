"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  description?: string;
}

interface StatsCounterProps {
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
    const step = Math.ceil(end / (duration / incrementTime));

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
  stats = DEFAULT_STATS,
  className,
  theme = "light",
}: StatsCounterProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6",
        className
      )}
    >
      {stats.map((stat, idx) => (
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
