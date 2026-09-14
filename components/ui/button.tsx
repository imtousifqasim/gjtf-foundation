import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "link" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold tracking-tight whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm hover:shadow border border-primary-600 font-bold",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 shadow-sm font-semibold",
      accent:
        "bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900 shadow-sm hover:shadow border border-primary-700 font-bold",
      outline:
        "border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 active:bg-slate-100 font-semibold shadow-sm",
      danger:
        "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-rose-600 shadow-sm font-bold",
      ghost:
        "text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 font-medium border border-transparent",
      link:
        "text-primary-600 underline-offset-4 hover:underline p-0 h-auto font-semibold shadow-none border-0",
    };

    const sizeStyles = {
      sm: "h-9 px-4 text-xs rounded-xl gap-1.5 font-semibold",
      md: "h-10 px-5 text-sm rounded-xl gap-2 font-bold",
      lg: "h-11 md:h-12 px-6 text-sm md:text-base rounded-xl gap-2.5 font-bold",
      xl: "h-12 md:h-14 px-7 md:px-8 text-base md:text-lg rounded-2xl gap-3 font-bold",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

