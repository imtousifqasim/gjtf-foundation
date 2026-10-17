"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  CalendarClock,
  Receipt,
  UserCheck,
  LogOut,
  Menu,
  X,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutDonorAction } from "@/app/actions/donorAuth";
import siteConfig from "@/lib/siteConfig";

const DONOR_NAV = [
  { label: "Dashboard", href: "/donor/dashboard", icon: LayoutDashboard },
  { label: "My Donations", href: "/donor/donations", icon: Heart },
  { label: "Monthly Plans", href: "/donor/plans", icon: CalendarClock },
  { label: "Donation Receipts", href: "/donor/receipts", icon: Receipt },
  { label: "Profile & Privacy", href: "/donor/profile", icon: UserCheck },
];

export function DonorLayoutClient({
  children,
  donorName,
}: {
  children: React.ReactNode;
  donorName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutDonorAction();
    } catch {}
    router.push("/donor/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-3">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href="/donor/dashboard" className="bg-white px-3 py-1.5 rounded-xl flex items-center shadow-sm">
                <Image
                  src="/images/Ghais-Jhuggi-Taleeem-Foundation-Logo.webp"
                  alt="GJTF Foundation"
                  width={140}
                  height={38}
                  className="h-8 w-auto object-contain"
                />
              </Link>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Donor Space
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {DONOR_NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/donor/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Quick Actions */}
            <div className="flex items-center gap-3">
              <Link href="/donate-now" className="hidden sm:inline-block">
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm"
                >
                  <Heart className="w-3.5 h-3.5 mr-1 text-slate-950 fill-current" />
                  Donate Again
                </Button>
              </Link>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title="Sign out of donor portal"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white rounded-xl focus:outline-none"
                aria-label="Open navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-t border-slate-800 px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
            {DONOR_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <Link href="/donate-now" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs">
                  Donate Again &rarr;
                </Button>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2 text-rose-400 hover:bg-rose-950/40 rounded-xl text-xs font-semibold w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Ghais Jhuggi Taleem Foundation</span>
            <span>&bull;</span>
            <span>100% Shariah Compliant Zakat &amp; Sadqah</span>
          </div>

          <div className="flex items-center gap-4">
            <a href={siteConfig.phone1.telLink} className="flex items-center gap-1.5 hover:text-emerald-700 font-medium">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              Helpline: {siteConfig.phone1.display}
            </a>
            <span>&bull;</span>
            <Link href="/privacy-policy" className="hover:text-emerald-700">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
