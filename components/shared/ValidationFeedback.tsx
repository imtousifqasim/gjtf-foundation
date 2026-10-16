import * as React from "react";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

interface ValidationFeedbackProps {
  error?: string | null;
  suggestion?: string | null;
  onApplySuggestion?: (suggested: string) => void;
  successText?: string | null;
  className?: string;
}

export function ValidationFeedback({
  error,
  suggestion,
  onApplySuggestion,
  successText,
  className = "",
}: ValidationFeedbackProps) {
  if (suggestion && onApplySuggestion) {
    return (
      <div className={`mt-1.5 flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs shadow-sm animate-in fade-in duration-200 ${className}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">
            Did you mean <strong className="font-bold underline">{suggestion}</strong>?
          </span>
        </div>
        <button
          type="button"
          onClick={() => onApplySuggestion(suggestion)}
          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors shadow-xs"
        >
          Fix Typo
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`mt-1.5 flex items-start gap-1.5 text-xs text-rose-600 font-medium animate-in fade-in duration-200 ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
        <span className="leading-tight">{error}</span>
      </div>
    );
  }

  if (successText) {
    return (
      <div className={`mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 font-medium animate-in fade-in duration-200 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>{successText}</span>
      </div>
    );
  }

  return null;
}
