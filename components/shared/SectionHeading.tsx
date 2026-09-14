import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
  theme?: "light" | "dark";
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
  theme = "light",
}: SectionHeadingProps) {
  const alignStyles = {
    left: "text-left items-start",
    center: "text-center items-center mx-auto",
    right: "text-right items-end ml-auto",
  };

  return (
    <div
      className={cn(
        "flex flex-col max-w-3xl mb-12 sm:mb-16",
        alignStyles[align],
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "text-xs sm:text-sm font-bold uppercase tracking-widest px-3.5 py-1 rounded-full mb-3 inline-block",
            theme === "light"
              ? "bg-primary-50 text-primary-700 border border-primary-200/80 shadow-2xs"
              : "bg-white/10 text-amber-300 backdrop-blur-sm border border-white/20"
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading tracking-tight leading-[1.15]",
          theme === "light" ? "text-slate-900" : "text-white"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-base sm:text-lg leading-relaxed max-w-2xl",
            theme === "light" ? "text-slate-600" : "text-slate-200"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
