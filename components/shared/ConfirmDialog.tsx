"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  variant?: "danger" | "warning";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Delete Record?",
  description = "Are you sure you want to delete this record? This action cannot be undone and will permanently remove it from the database.",
  confirmLabel = "Delete Permanently",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "danger",
}: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error("Confirm action error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => !loading && onOpenChange(val)}
      contentClassName="max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl"
    >
      <div className="space-y-4 text-left">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              variant === "danger"
                ? "bg-rose-100 text-rose-600 border border-rose-200"
                : "bg-amber-100 text-amber-600 border border-amber-200"
            }`}
          >
            {variant === "danger" ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <DialogTitle className="text-lg font-bold font-heading text-slate-900 leading-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              Please review before proceeding.
            </DialogDescription>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
          {description}
        </p>

        <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-auto sm:w-auto px-4 py-2 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs justify-center"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
            className={`w-auto sm:w-auto px-5 py-2 rounded-xl font-bold text-xs shadow-sm inline-flex items-center justify-center gap-1.5 ${
              variant === "danger"
                ? "bg-rose-600 hover:bg-rose-700 text-white border-transparent"
                : "bg-amber-600 hover:bg-amber-700 text-white border-transparent"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmLabel}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
