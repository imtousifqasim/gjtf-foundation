import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "accent" | "outline" | "success" | "warning";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-blue-50 text-blue-800 border-blue-200 font-bold",
    secondary: "bg-slate-100 text-slate-700 border-slate-200 font-semibold",
    accent: "bg-amber-50 text-amber-900 border-amber-300 font-bold",
    outline: "text-slate-700 border-slate-300 font-semibold bg-white",
    success: "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold",
    warning: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
