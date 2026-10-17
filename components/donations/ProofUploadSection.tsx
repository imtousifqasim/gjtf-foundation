"use client";

import * as React from "react";
import Link from "next/link";
import {
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProofViewerModal } from "./ProofViewerModal";

export interface ProofItem {
  id: string;
  filename: string;
  status: "submitted" | "approved" | "rejected" | "deleted";
  uploaded_at: string;
  reject_reason?: string | null;
  transaction_ref?: string | null;
  sender_bank?: string | null;
  paid_amount_minor?: number | null;
}

interface ProofUploadSectionProps {
  donationId: string;
  referenceNo: string;
  token?: string;
  proofStatus: "none" | "submitted" | "approved" | "rejected";
  existingProofs?: ProofItem[];
  rejectionReason?: string | null;
  onProofUploaded?: () => void;
}

export function ProofUploadSection({
  donationId,
  referenceNo,
  token,
  proofStatus: initialProofStatus,
  existingProofs: initialExistingProofs = [],
  rejectionReason,
  onProofUploaded,
}: ProofUploadSectionProps) {
  const [proofStatus, setProofStatus] = React.useState(initialProofStatus);
  const [proofs, setProofs] = React.useState<ProofItem[]>(initialExistingProofs);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Optional fields
  const [transactionRef, setTransactionRef] = React.useState("");
  const [senderBank, setSenderBank] = React.useState("");
  const [paidAt, setPaidAt] = React.useState("");
  const [paidAmount, setPaidAmount] = React.useState("");
  const [note, setNote] = React.useState("");

  // Upload state
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Active viewing modal
  const [viewingProofId, setViewingProofId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Clean preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Client-side image compression and resizing (fast target ~100-200KB, max 1200px)
  async function compressImageClient(file: File): Promise<Blob> {
    if (file.type === "application/pdf") {
      return file;
    }

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "medium";
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            "image/webp",
            0.78
          );
        } else {
          resolve(file);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    });
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Max 5 MB check
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File size exceeds 5 MB. Please select a smaller image or compressed screenshot.");
      return;
    }

    const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!acceptedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic|pdf)$/i)) {
      setErrorMsg("Please select a JPEG, PNG, WebP, HEIC, or PDF file.");
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please select a payment screenshot or transfer receipt to upload.");
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setUploadProgress(20);

    let progressTimer: any = null;

    try {
      setUploadProgress(40);
      const compressedBlob = await compressImageClient(selectedFile);
      setUploadProgress(60);

      const formData = new FormData();
      formData.append("file", compressedBlob, selectedFile.name);
      formData.append("donationRef", referenceNo);
      if (token) formData.append("token", token);
      if (transactionRef) formData.append("transactionRef", transactionRef);
      if (senderBank) formData.append("senderBank", senderBank);
      if (paidAt) formData.append("paidAt", paidAt);
      if (paidAmount) formData.append("paidAmount", paidAmount);
      if (note) formData.append("note", note);

      progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }, 150);

      const res = await fetch("/api/donations/proof-upload", {
        method: "POST",
        body: formData,
      });

      if (progressTimer) clearInterval(progressTimer);
      setUploadProgress(95);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to upload payment proof.");
      }

      setUploadProgress(100);
      setSuccessMsg("Payment screenshot uploaded successfully! Our accounts team is reviewing it.");
      setProofStatus("submitted");

      // Append new proof item
      const newProof: ProofItem = {
        id: data.proofId,
        filename: data.filename,
        status: "submitted",
        uploaded_at: new Date().toISOString(),
        transaction_ref: transactionRef || null,
        sender_bank: senderBank || null,
        paid_amount_minor: paidAmount ? Math.round(Number(paidAmount) * 100) : null,
      };

      setProofs((prev) => [newProof, ...prev]);
      setSelectedFile(null);
      setPreviewUrl(null);
      setTransactionRef("");
      setSenderBank("");
      setPaidAt("");
      setPaidAmount("");
      setNote("");

      if (onProofUploaded) onProofUploaded();
    } catch (err: any) {
      if (progressTimer) clearInterval(progressTimer);
      setErrorMsg(err.message || "Network error while uploading payment proof. Please try again.");
    } finally {
      if (progressTimer) clearInterval(progressTimer);
      setUploading(false);
    }
  };

  const handleDeleteProof = async (proofId: string) => {
    if (!confirm("Are you sure you want to delete this payment proof screenshot?")) return;

    setDeletingId(proofId);
    try {
      const url = `/api/proofs/${proofId}/delete${token ? `?token=${encodeURIComponent(token)}` : ""}`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();

      if (res.ok && data.success) {
        const nextProofs = proofs.filter((p) => p.id !== proofId);
        setProofs(nextProofs);
        if (nextProofs.length === 0) {
          setProofStatus("none");
        }
      } else {
        alert(data.message || "Failed to delete proof.");
      }
    } catch (err) {
      alert("Error deleting payment proof.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-warm-200 shadow-soft p-6 sm:p-8 space-y-6">
      {/* Section Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-warm-200 pb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold font-heading text-charcoal-deep">
            Payment Proof Verification
          </h3>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-0.5">
            Upload your transfer slip or banking app screenshot for bank statement reconciliation.
          </p>
        </div>

        <div>
          {proofStatus === "none" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Waiting for proof
            </span>
          )}
          {proofStatus === "submitted" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              Proof Submitted • Awaiting Review
            </span>
          )}
          {proofStatus === "approved" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Payment Confirmed
            </span>
          )}
          {proofStatus === "rejected" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-800 text-xs font-bold uppercase tracking-wider border border-red-200">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              Proof Rejected • Re-Upload Needed
            </span>
          )}
        </div>
      </div>

      {/* Confirmation State Banner */}
      {proofStatus === "approved" && (
        <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="text-base sm:text-lg font-bold text-emerald-950">
            Payment Verified &amp; Completed!
          </h4>
          <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
            Your transfer has been matched with our bank credit. Your official tax-exempt donation receipt is ready.
          </p>
          <div className="pt-2">
            <Link href={`/receipt/${encodeURIComponent(referenceNo)}`}>
              <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl px-5 text-xs sm:text-sm">
                View Official Receipt &rarr;
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Rejection Alert Banner */}
      {proofStatus === "rejected" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-red-900 leading-relaxed">
            <strong className="block font-bold">Verification Note from Accounts Team:</strong>
            <p className="mt-0.5 italic text-red-800 font-medium">
              &quot;{rejectionReason || "The payment screenshot could not be reconciled with our bank records. Please provide a clear screenshot showing the transaction ID and timestamp."}&quot;
            </p>
            <p className="mt-2 text-xs font-semibold text-red-700">
              Please upload a new screenshot below to re-submit for verification.
            </p>
          </div>
        </div>
      )}

      {/* Existing Uploaded Proofs List */}
      {proofs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
            Uploaded Screenshots ({proofs.length}/3)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {proofs.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-warm-50 border border-warm-200 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-primary-100/60 text-primary-800 flex items-center justify-center flex-shrink-0">
                    {p.filename.endsWith(".pdf") ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-bold text-charcoal-deep truncate block" title={p.filename}>
                      {p.filename}
                    </span>
                    <span className="text-[11px] text-charcoal-muted block">
                      {new Date(p.uploaded_at).toLocaleDateString("en-PK", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingProofId(p.id)}
                    className="h-8 px-2.5 rounded-lg text-xs bg-white text-primary-800 border-warm-300 hover:bg-primary-50"
                    title="View screenshot"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    View
                  </Button>

                  {p.status !== "approved" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={deletingId === p.id}
                      onClick={() => handleDeleteProof(p.id)}
                      className="h-8 w-8 p-0 rounded-lg text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      title="Delete screenshot"
                    >
                      {deletingId === p.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Form (Active when less than 3 proofs and not approved) */}
      {proofStatus !== "approved" && proofs.length < 3 && (
        <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
          <div className="border-t border-warm-200 pt-4">
            <h4 className="text-sm font-bold text-charcoal-deep mb-2">
              {proofs.length === 0 ? "Upload Payment Screenshot" : "Upload Additional / Replacement Screenshot"}
            </h4>

            {errorMsg && (
              <div className="p-3 text-xs sm:text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 mb-3">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 text-xs sm:text-sm text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 mb-3">
                {successMsg}
              </div>
            )}

            {/* Dropzone File Input */}
            <div className="relative border-2 border-dashed border-warm-300 hover:border-primary-500 rounded-2xl p-6 text-center transition-colors bg-warm-50/50">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,.heic,application/pdf"
                onChange={handleFileSelect}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {previewUrl ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Selected Preview"
                    className="max-h-48 mx-auto rounded-xl object-contain shadow-sm border border-warm-200"
                  />
                  <p className="text-xs font-bold text-charcoal-deep truncate">
                    {selectedFile?.name} ({(selectedFile ? selectedFile.size / 1024 : 0).toFixed(0)} KB)
                  </p>
                  <p className="text-[11px] text-primary-700 underline font-semibold">
                    Click or drag another image to change
                  </p>
                </div>
              ) : selectedFile ? (
                <div className="space-y-1">
                  <FileText className="w-10 h-10 text-primary-700 mx-auto" />
                  <p className="text-xs font-bold text-charcoal-deep">{selectedFile.name}</p>
                  <p className="text-[11px] text-charcoal-muted">PDF document ready for upload</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-charcoal-deep">
                      Choose screenshot or drag &amp; drop here
                    </span>
                    <p className="text-xs text-charcoal-muted mt-0.5">
                      JPEG, PNG, WebP, HEIC or PDF up to 5 MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Donor Information (Accordion / Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-charcoal-muted mb-1">
                Bank Transaction Reference / ID (Optional)
              </label>
              <Input
                placeholder="e.g. 2026101614320987"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                disabled={uploading}
                className="rounded-xl text-xs h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-muted mb-1">
                Sender Bank (Optional)
              </label>
              <Input
                placeholder="e.g. Meezan Bank, HBL, JazzCash"
                value={senderBank}
                onChange={(e) => setSenderBank(e.target.value)}
                disabled={uploading}
                className="rounded-xl text-xs h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-muted mb-1">
                Payment Date &amp; Time (Optional)
              </label>
              <Input
                type="datetime-local"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                disabled={uploading}
                className="rounded-xl text-xs h-9"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-muted mb-1">
                Amount Paid in PKR (Optional)
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                disabled={uploading}
                className="rounded-xl text-xs h-9"
              />
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-charcoal-muted font-medium">
                <span>
                  {uploadProgress < 40
                    ? "Compressing screenshot..."
                    : uploadProgress < 95
                    ? "Uploading screenshot to secure storage..."
                    : "Finalizing..."}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-warm-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary-700 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full bg-primary-700 hover:bg-primary-600 text-white font-bold rounded-xl py-3 text-sm flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading Screenshot...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Submit Payment Screenshot
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Transparency & Privacy Notice */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Privacy Charter:</strong> Your payment proof is accessed exclusively by authorized finance officers to reconcile with our bank statement. Files are stored in a private Google Drive directory and permanently deleted after retention (90 days). Learn more in our{" "}
          <Link href="/privacy-policy" className="text-primary-700 underline font-semibold">
            Privacy Policy
          </Link>.
        </p>
      </div>

      {/* Proof Modal Viewer */}
      {viewingProofId && (
        <ProofViewerModal
          proofId={viewingProofId}
          token={token}
          onClose={() => setViewingProofId(null)}
        />
      )}
    </div>
  );
}
