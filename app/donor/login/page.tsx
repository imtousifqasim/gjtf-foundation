import * as React from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedDonor } from "@/lib/auth/donor";
import { getSafeRedirectUrl } from "@/lib/auth/security";
import DonorLoginForm from "./DonorLoginForm";

export const dynamic = "force-dynamic";

export default async function DonorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; redirectTo?: string }>;
}) {
  // Issue 1: If donor is already logged in, redirect server-side immediately without flashing login form
  const donor = await getAuthenticatedDonor();
  const params = await searchParams;

  if (donor) {
    const rawTarget = params.next || params.redirectTo;
    const safeTarget = getSafeRedirectUrl(rawTarget, "/donor/dashboard");
    redirect(safeTarget);
  }

  return (
    <React.Suspense
      fallback={
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
        </div>
      }
    >
      <DonorLoginForm />
    </React.Suspense>
  );
}
