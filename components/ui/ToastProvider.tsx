"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  dismissToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success", duration: number = 5000) => {
      const id = "toast_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
      const newToast: ToastItem = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const toast = React.useMemo(
    () => ({
      success: (msg: string, dur?: number) => showToast(msg, "success", dur),
      error: (msg: string, dur?: number) => showToast(msg, "error", dur),
      info: (msg: string, dur?: number) => showToast(msg, "info", dur),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, toast, dismissToast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
            aria-live="polite"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                role={t.type === "error" ? "alert" : "status"}
                aria-live={t.type === "error" ? "assertive" : "polite"}
                className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border text-sm font-semibold flex items-start gap-3 transition-all transform duration-200 animate-in fade-in slide-in-from-top-3 ${
                  t.type === "success"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20"
                    : t.type === "error"
                    ? "bg-rose-600 text-white border-rose-500 shadow-rose-900/20"
                    : "bg-slate-900 text-white border-slate-800 shadow-slate-950/20"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {t.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-100" />
                  ) : t.type === "error" ? (
                    <AlertCircle className="w-5 h-5 text-rose-100" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-200" />
                  )}
                </div>
                <div className="flex-1 leading-snug break-words">{t.message}</div>
                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  className="shrink-0 -mr-1 -mt-1 p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback for components outside ToastProvider
    return {
      showToast: (msg: string, type: ToastType = "info") => {
        if (typeof window !== "undefined") {
          console.log(`[Toast ${type}]: ${msg}`);
        }
      },
      toast: {
        success: (msg: string) => console.log(`[Toast success]: ${msg}`),
        error: (msg: string) => console.error(`[Toast error]: ${msg}`),
        info: (msg: string) => console.log(`[Toast info]: ${msg}`),
      },
      dismissToast: () => {},
    };
  }
  return ctx;
}
