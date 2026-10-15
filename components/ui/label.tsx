import * as React from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className = "", children, ...props }: LabelProps) {
  return (
    <label className={`text-xs font-bold text-slate-700 block ${className}`} {...props}>
      {children}
    </label>
  );
}
