"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Loader2 } from "lucide-react";

export interface AdminActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  errorMessage?: string | null;
  onRetry?: () => void;
  onConfirm?: () => Promise<void> | void;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  confirmVariant?: "primary" | "danger" | "emerald";
  disabled?: boolean;
  contentClassName?: string;
  actions?: React.ReactNode;
}

export function AdminActionDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  errorMessage,
  onRetry,
  onConfirm,
  confirmLabel = "Confirm Action",
  cancelLabel = "Cancel",
  isPending = false,
  confirmVariant = "primary",
  disabled = false,
  contentClassName,
  actions,
}: AdminActionDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(val) => !isPending && onOpenChange(val)}
      contentClassName={contentClassName}
    >
      <div className="space-y-5">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 leading-snug">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children}

        {/* Accessible Inline Alert - Inside Modal, directly above action buttons */}
        {errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-1"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-rose-950">Action Failed</strong>
                <span className="text-rose-800 text-xs sm:text-sm leading-relaxed">{errorMessage}</span>
              </div>
            </div>
            {onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled={isPending}
                className="rounded-xl border-rose-300 text-rose-700 bg-white hover:bg-rose-100 hover:text-rose-900 text-xs font-bold shrink-0 self-end sm:self-auto gap-1.5 h-8 px-3"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </Button>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          {actions ? (
            actions
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold px-4 h-9"
              >
                {cancelLabel}
              </Button>
              {onConfirm && (
                <Button
                  type="button"
                  size="sm"
                  onClick={onConfirm}
                  disabled={isPending || disabled}
                  className={`rounded-xl text-xs font-bold gap-2 px-4 h-9 shadow-sm ${
                    confirmVariant === "danger"
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : confirmVariant === "emerald"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-primary-700 hover:bg-primary-800 text-white"
                  }`}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    confirmLabel
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
