"use client";

import * as React from "react";
import { X, ZoomIn, ZoomOut, RotateCw, Download, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProofViewerModalProps {
  proofId: string;
  token?: string;
  filename?: string;
  onClose: () => void;
  driveFolderInfo?: { folderPath?: string; filename?: string; webViewLink?: string | null };
  isSuperAdmin?: boolean;
}

export function ProofViewerModal({
  proofId,
  token,
  filename,
  onClose,
  driveFolderInfo,
  isSuperAdmin,
}: ProofViewerModalProps) {
  const [zoom, setZoom] = React.useState<number>(1);
  const [rotation, setRotation] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(true);

  const proofUrl = `/api/proofs/${proofId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white bg-slate-950/60">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-bold text-sm truncate max-w-xs sm:max-w-md">
              {filename || "Payment Proof Screenshot"}
            </span>
            {driveFolderInfo?.folderPath && (
              <span className="hidden sm:inline-block text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                {driveFolderInfo.folderPath}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="h-8 w-8 p-0 bg-slate-800 hover:bg-slate-700 text-white border-slate-700 rounded-lg"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs font-mono text-slate-400 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="h-8 w-8 p-0 bg-slate-800 hover:bg-slate-700 text-white border-slate-700 rounded-lg"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="h-8 w-8 p-0 bg-slate-800 hover:bg-slate-700 text-white border-slate-700 rounded-lg"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-700 rounded-lg"
            >
              Reset
            </Button>

            {isSuperAdmin && driveFolderInfo?.webViewLink && (
              <a
                href={driveFolderInfo.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-2.5 inline-flex items-center gap-1 text-xs bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-medium ml-1"
                title="Open in Google Drive"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Drive</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="relative flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center min-h-[350px] bg-slate-950/40">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofUrl}
            alt="Payment Proof"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: "transform 0.15s ease-out",
            }}
            className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg select-none"
          />
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400">
          Confidential financial verification screenshot • Stored in private directory • Not publicly accessible
        </div>
      </div>
    </div>
  );
}
