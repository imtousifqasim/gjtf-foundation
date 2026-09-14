"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  Heart,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  ExternalLink,
} from "lucide-react";
import { MAIN_NAV, SOCIAL_LINKS, CONTACT_INFO } from "@/data/navigation";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { settings } = useSiteSettings();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const toggleDropdown = (label: string) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  return (
    <>
      {/* Top Utility Bar */}
      <div className="bg-[#0b1536] text-white text-xs py-2 px-4 sm:px-8 border-b border-white/10 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>{settings.telephone} | {settings.mobile}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-200">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>{settings.email}</span>
            </span>
            <span className="bg-white/10 text-white font-medium px-2.5 py-0.5 rounded-full text-[11px] border border-white/15">
              Toll-Free: {settings.toll_free}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href={settings.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
              {settings.twitter_url && (
                <a
                  href={settings.twitter_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-3.5 h-3.5" />
                </a>
              )}
              {settings.linkedin_url && (
                <a
                  href={settings.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            <span className="h-3 w-px bg-white/20" />
            <Link
              href="/donate-now"
              className="font-semibold text-white hover:text-blue-200 flex items-center gap-1.5 transition-colors"
            >
              <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              Support a Child
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-200",
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-md"
            : "bg-white border-b border-slate-200"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group py-0.5">
            <Image
              src="/images/Ghais-Jhuggi-Taleeem-Foundation-Logo.webp"
              alt="Ghais Jhuggi Taleem Foundation"
              width={260}
              height={70}
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              priority
            />
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {MAIN_NAV.map((item) => {
              const hasDropdown = Boolean(item.children && item.children.length > 0);
              const isActive = pathname === item.href;

              if (hasDropdown) {
                return (
                  <div
                    key={item.label}
                    className="relative group"
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors",
                        openDropdown === item.label || pathname.startsWith(item.href)
                          ? "text-primary-700 bg-primary-50"
                          : "text-charcoal hover:text-primary-700 hover:bg-warm-100/70"
                      )}
                    >
                      {item.label}
                      <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                    </button>

                    {/* Dropdown Menu */}
                    <div
                      className={cn(
                        "absolute left-0 top-full pt-2 w-72 transition-all duration-200 z-50",
                        openDropdown === item.label
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 -translate-y-2 pointer-events-none"
                      )}
                    >
                      <div className="bg-white rounded-2xl shadow-xl border border-warm-200 p-2 space-y-1">
                        {item.children?.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className={cn(
                              "block px-3.5 py-2.5 rounded-xl transition-all",
                              pathname === sub.href
                                ? "bg-primary-50 text-primary-800 font-bold"
                                : "hover:bg-warm-100 text-charcoal"
                            )}
                          >
                            <div className="text-sm font-semibold leading-tight">{sub.label}</div>
                            {sub.description && (
                              <div className="text-xs text-charcoal-muted mt-0.5 line-clamp-1">
                                {sub.description}
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors",
                    isActive
                      ? "text-primary-700 bg-primary-50 font-bold"
                      : "text-charcoal hover:text-primary-700 hover:bg-warm-100/70"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Donate Button */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/donate-now" className="inline-block">
              <Button
                variant="primary"
                size="md"
                className="gap-2 px-5 py-2 font-bold shadow-sm hover:shadow"
              >
                <Heart className="w-4 h-4 fill-white" />
                Donate Now
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button & Donate Pill */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/donate-now"
              className="sm:hidden relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white text-xs font-extrabold shadow-md shadow-primary-700/25 border border-primary-400/30 hover:shadow-lg hover:shadow-primary-700/30 transition-all active:scale-95 group overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <Heart className="w-3.5 h-3.5 fill-white text-white transition-transform group-hover:scale-110" />
              <span className="tracking-wide font-bold">Donate</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-primary-700 hover:bg-primary-50/70 border border-slate-200/60 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-in Overlay Drawer */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay starting right at the bottom edge of header (top-16) */}
            <div
              className="lg:hidden fixed inset-0 top-16 bg-slate-950/40 backdrop-blur-[2px] z-40 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="lg:hidden fixed top-16 left-0 right-0 w-full bg-white border-b border-slate-200 shadow-2xl px-4 pt-2.5 pb-5 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto z-50">
              {MAIN_NAV.map((item) => {
                const hasDropdown = Boolean(item.children && item.children.length > 0);
                const isExpanded = openDropdown === item.label;

                if (hasDropdown) {
                  return (
                    <div key={item.label} className="border-b border-slate-100 pb-1">
                      <button
                        type="button"
                        onClick={() => toggleDropdown(item.label)}
                        className="w-full flex items-center justify-between py-2.5 px-3 text-sm font-semibold text-slate-800 hover:text-primary-700 rounded-xl hover:bg-slate-50 transition-colors text-left"
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-slate-400 transition-transform",
                            isExpanded && "rotate-180 text-primary-700"
                          )}
                        />
                      </button>
                      {isExpanded && (
                        <div className="mt-1 pl-3 pr-2 pb-2 space-y-1 bg-slate-50/80 border border-slate-200/60 rounded-xl p-2">
                          {item.children?.map((sub) => (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block py-2 px-3 text-xs font-medium rounded-lg text-slate-600 hover:text-primary-800 hover:bg-white transition-colors"
                            >
                              <div className="font-semibold">{sub.label}</div>
                              {sub.description && (
                                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                  {sub.description}
                                </div>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block py-2.5 px-3 text-sm font-semibold rounded-xl transition-colors",
                      pathname === item.href
                        ? "bg-primary-50 text-primary-800 font-bold border border-primary-200/50"
                        : "text-slate-700 hover:text-primary-700 hover:bg-slate-50"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-slate-200/70">
                <Link href="/donate-now" className="w-full block" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="lg" className="w-full font-bold shadow-soft hover:shadow-glow rounded-xl flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4 fill-white" />
                    Donate to Educate a Child
                  </Button>
                </Link>
              </div>

              {/* Social & Contact info inside mobile menu */}
              <div className="pt-2">
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-800">GJTF Head Office - Lahore</p>
                  <p>Ph: {CONTACT_INFO.headOffice.telephone} | Mob: {CONTACT_INFO.headOffice.mobile}</p>
                  <p className="text-primary-700 font-medium">Toll-Free: {CONTACT_INFO.headOffice.tollFree}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </header>
    </>
  );
}
