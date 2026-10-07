"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  Mail,
  Users,
  School,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Server,
  MailCheck,
  Edit3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Live Visual Editor", href: "/?edit_mode=1", icon: Edit3, external: true },
  { label: "Donations", href: "/admin/donations", icon: Heart },
  { label: "Contact Messages", href: "/admin/contact-messages", icon: Mail },
  { label: "Volunteer Sign-ups", href: "/admin/volunteer-signups", icon: Users },
  { label: "Subscribers", href: "/admin/subscribers", icon: MailCheck },
  { label: "Schools Directory", href: "/admin/schools", icon: School },
  { label: "Blogs", href: "/admin/stories", icon: BookOpen },
  { label: "SMTP Configuration", href: "/admin/smtp", icon: Server },
  { label: "Settings & Backup", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = React.useState<string>("admin@gjtfoundation.com");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // If on login page, render children without sidebar/topbar
  const isLoginPage = pathname === "/admin/login";

  React.useEffect(() => {
    if (isLoginPage) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setAdminEmail(user.email);
      } else {
        router.push("/admin/login");
      }
    });
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Mobile Top bar */}
      <div className="md:hidden bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg">
          <Image
            src="/images/Ghais-Jhuggi-Taleeem-Foundation-Logo.webp"
            alt="GJTF Admin"
            width={120}
            height={32}
            className="h-7 w-auto object-contain"
          />
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-white hover:text-amber-400"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-white p-5 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 border-r border-slate-800/80 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="space-y-5">
          {/* Logo */}
          <div className="pt-1">
            <Link href="/admin" className="block bg-white p-2.5 rounded-xl shadow-md group">
              <Image
                src="/images/Ghais-Jhuggi-Taleeem-Foundation-Logo.webp"
                alt="GJTF Staff Portal"
                width={200}
                height={55}
                className="h-10 w-auto mx-auto object-contain transition-transform group-hover:scale-105"
                priority
              />
            </Link>
            <div className="mt-2 text-center text-[10px] uppercase font-bold tracking-widest text-amber-400">
              Staff Control Panel
            </div>
          </div>

          {/* Nav list */}
          <nav className="space-y-1.5 pt-3 border-t border-slate-800">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary-600 text-white shadow-md font-bold"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar User Profile & Public Site Link */}
        <div className="pt-5 border-t border-slate-800 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between text-xs text-slate-300 hover:text-white px-2.5 py-2 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <ExternalLink className="w-3.5 h-3.5 text-primary-400" /> View Public Site
            </span>
            <span className="text-[10px] bg-primary-900/80 text-primary-200 border border-primary-700 px-1.5 py-0.5 rounded font-bold">
              Live
            </span>
          </Link>

          <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                AD
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold truncate text-white">Staff Member</div>
                <div className="text-[10px] text-slate-400 truncate">{adminEmail}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar on desktop */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            <span>GJTF Staff Portal</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-600">
              Signed in as <strong className="text-slate-900 font-bold">{adminEmail}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs h-8 gap-1.5 border-slate-300 hover:border-red-400 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </Button>
          </div>
        </header>

        {/* Page children */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
