"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitVolunteerSignup } from "@/app/actions/volunteer";
import { CheckCircle2, Sparkles, Loader2 } from "lucide-react";

interface VolunteerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "general" | "university_chapter" | "city_chapter";
  title?: string;
  description?: string;
}

export function VolunteerModal({
  open,
  onOpenChange,
  defaultType = "general",
  title = "Join GJTF Volunteers",
  description = "Fill out this quick form to become part of Pakistan's largest youth movement for nomadic education.",
}: VolunteerModalProps) {
  const [type, setType] = React.useState<"general" | "university_chapter" | "city_chapter">(defaultType);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState("");
  const [university, setUniversity] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setType(defaultType);
  }, [defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const res = await submitVolunteerSignup({
      type,
      full_name: fullName,
      email,
      phone,
      city,
      university: university || undefined,
      message: message || undefined,
    });

    setSubmitting(false);
    if (res.success) {
      setSuccess(true);
    } else {
      setErrorMsg(res.message || "Failed to submit. Please try again.");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (success) {
      setTimeout(() => {
        setSuccess(false);
        setFullName("");
        setEmail("");
        setPhone("");
        setCity("");
        setUniversity("");
        setMessage("");
      }, 300);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      contentClassName="max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl"
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-500" />
          {title}
        </DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {success ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-extrabold font-heading text-slate-900">
              Application Received!
            </h3>
            <p className="text-xs text-primary-700 font-semibold uppercase tracking-wider">
              Ghais Jhuggi Taleem Foundation
            </p>
          </div>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            Thank you for stepping forward! A GJTF volunteer coordinator will review your profile and contact you via phone or WhatsApp shortly.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleClose}
              className="px-8 py-2.5 rounded-xl font-bold shadow-soft hover:shadow-glow text-sm inline-flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done</span>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Volunteer Role Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "general", label: "General" },
                { id: "university_chapter", label: "University Chapter" },
                { id: "city_chapter", label: "City Chapter Lead" },
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setType(role.id as any)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                    type === role.id
                      ? "bg-primary-600 border-primary-600 text-white font-bold shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <Input
                required
                placeholder="e.g. Fatima Khan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-primary-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address *
              </label>
              <Input
                type="email"
                required
                placeholder="fatima@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-primary-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone / WhatsApp Number *
              </label>
              <Input
                required
                placeholder="0300-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-primary-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City *
              </label>
              <Input
                required
                placeholder="Lahore, Karachi, Islamabad..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-primary-600"
              />
            </div>
          </div>

          {(type === "university_chapter" || type === "city_chapter") && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                University / Institution Name
              </label>
              <Input
                placeholder="e.g. LUMS, IBA, NUST, Punjab University..."
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-primary-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Why would you like to join GJTF? (Optional)
            </label>
            <Textarea
              rows={3}
              placeholder="Tell us about your background, skills, or what motivates you..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl border-slate-200 focus:border-primary-600"
            />
          </div>

          <div className="pt-4 flex flex-row items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-sm transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg transition-all active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
