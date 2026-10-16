import * as React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getSafeRedirectUrl } from "@/lib/auth/security";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; redirectTo?: string }>;
}) {
  // Issue 1: If admin is already logged in, redirect server-side immediately without flashing login form
  const session = await getAdminSession();
  const params = await searchParams;

  if (session) {
    const rawTarget = params.next || params.redirectTo;
    const safeTarget = getSafeRedirectUrl(rawTarget, "/admin");
    redirect(safeTarget);
  }

  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-warm-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700" />
        </div>
      }
    >
      <AdminLoginForm />
    </React.Suspense>
  );
}
