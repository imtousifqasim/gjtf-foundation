import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedDonor } from "@/lib/auth/donor";
import { getSafeRedirectUrl } from "@/lib/auth/security";
import { DonorLayoutClient } from "@/components/donor/DonorLayoutClient";
import siteConfig from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

const DONOR_AUTH_PAGES = [
  "/donor/login",
  "/donor/forgot-password",
  "/donor/reset-password",
  "/donor/set-password",
  "/donor/verify-email",
  "/donor/verify",
];

export default async function DonorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const pathname = reqHeaders.get("x-pathname") || "";

  const isAuthPage = DONOR_AUTH_PAGES.some((p) => pathname.startsWith(p));

  // If in public auth pages, render centered auth wrapper
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-10 px-4 sm:px-6">
        <div className="max-w-md mx-auto w-full text-center mb-6">
          <Link href="/" className="inline-block bg-white p-3 rounded-2xl shadow-xl">
            <Image
              src="/images/Ghais-Jhuggi-Taleeem-Foundation-Logo.webp"
              alt="GJTF Foundation"
              width={160}
              height={44}
              priority
              className="h-9 w-auto object-contain"
            />
          </Link>
          <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mt-4">
            Official Supporter Portal
          </p>
        </div>

        <main className="max-w-md mx-auto w-full">{children}</main>

        <footer className="text-center text-xs text-slate-500 mt-10 space-y-2">
          <p>&copy; {new Date().getFullYear()} Ghais Jhuggi Taleem Foundation (GJTF). All rights reserved.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Public Website
            </Link>
            <span>&bull;</span>
            <Link href="/privacy-policy" className="hover:text-emerald-400 transition-colors">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <a href={siteConfig.phone1.telLink} className="hover:text-emerald-400 transition-colors">
              Helpline: {siteConfig.phone1.display}
            </a>
          </div>
        </footer>
      </div>
    );
  }

  // Defence-in-depth: Verify server-side donor session before generating protected donor content
  const donor = await getAuthenticatedDonor();
  if (!donor) {
    const safeNext = getSafeRedirectUrl(pathname, "/donor/dashboard");
    redirect(`/donor/login?next=${encodeURIComponent(safeNext)}`);
  }

  return (
    <DonorLayoutClient donorName={donor.name || undefined}>
      {children}
    </DonorLayoutClient>
  );
}
