"use client";

import * as React from "react";
import Link from "next/link";
import {
  Edit3,
  ExternalLink,
  Sparkles,
  Layers,
  CheckCircle2,
  Globe,
  Home,
  School,
  Users,
  GraduationCap,
  Compass,
  Heart,
  Target,
  BookOpen,
  Phone,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PageItem {
  title: string;
  path: string;
  category: "Core" | "Programs" | "Get Involved" | "About";
  description: string;
  icon: any;
}

const PAGES: PageItem[] = [
  {
    title: "Home Page",
    path: "/",
    category: "Core",
    description: "Main landing, video hero background, mission statement, dynamic counters, and featured campus.",
    icon: Home,
  },
  {
    title: "Our Schools Directory",
    path: "/our-school",
    category: "Programs",
    description: "Explore all 24+ nationwide school units, campus facilities, capacities, and photo galleries.",
    icon: School,
  },
  {
    title: "About GJTF Volunteers",
    path: "/about-gjtf-volunteers",
    category: "Get Involved",
    description: "Volunteer department overview, vision, mission, impact areas, and department leadership.",
    icon: Users,
  },
  {
    title: "University Chapter",
    path: "/university-chapter",
    category: "Get Involved",
    description: "University MoUs, campus ambassador societies, youth drives, and student chapter signups.",
    icon: GraduationCap,
  },
  {
    title: "City Chapter Leads",
    path: "/city-chapter-leads",
    category: "Get Involved",
    description: "City-level volunteer leadership movement across Karachi, Lahore, Islamabad, and nationwide.",
    icon: Compass,
  },
  {
    title: "General Volunteer",
    path: "/general-volunteer",
    category: "Get Involved",
    description: "Skills-based volunteering, medical drives, teaching sessions, and volunteer registration.",
    icon: Heart,
  },
  {
    title: "Aims and Objectives",
    path: "/aims-and-objectives",
    category: "About",
    description: "Foundational pillars, 10 core targets, constitutional mission for educating 20M+ nomadic children.",
    icon: Target,
  },
  {
    title: "Blogs & News",
    path: "/blogs",
    category: "Core",
    description: "Articles, educational updates, student spotlight stories, media appearances, and video features.",
    icon: BookOpen,
  },
  {
    title: "Contact Us",
    path: "/contact-us",
    category: "About",
    description: "Head office in Lahore, regional offices in Rawalpindi, inquiry submission form, and phone contacts.",
    icon: Phone,
  },
  {
    title: "Donate Now",
    path: "/donate-now",
    category: "Core",
    description: "Zakat & Sadqah contributions, Meezan Bank account details, donor tax compliance, and online giving.",
    icon: Sparkles,
  },
];

export default function VisualEditorAdminPage() {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<string>("all");

  const filteredPages = PAGES.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.path.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-bold uppercase tracking-wider mb-2">
            <Edit3 className="w-3.5 h-3.5" />
            Live In-Line Page Editor Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
            Live Site Visual Editor
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Select any page below to launch the live in-line visual editor. Click on headings or paragraphs to edit text directly with a blinking cursor, customize button text and links, and save changes straight into Hostinger MySQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/?edit_mode=1" target="_blank">
            <Button variant="primary" size="md" className="font-bold shadow-md shadow-blue-600/20 rounded-xl gap-2">
              <Sparkles className="w-4 h-4" />
              Launch Home Editor
            </Button>
          </Link>
          <Link href="/" target="_blank">
            <Button variant="outline" size="md" className="rounded-xl gap-2 font-medium">
              <Globe className="w-4 h-4" />
              View Site
            </Button>
          </Link>
        </div>
      </div>

      {/* Guide Banner */}
      <Card className="p-5 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-md border-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 text-blue-300 font-bold text-sm">
              1
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Click & Edit Inline</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Click any text element to place a blinking cursor. Backspace, retype, or edit inline exactly like Word or Google Docs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300 font-bold text-sm">
              2
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Edit Buttons & Links</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Click any button to open the link editor popup. Change the button label or the target destination URL in seconds.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300 font-bold text-sm">
              3
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Save Live to Hostinger</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Hit &quot;Save Live&quot; in the editor toolbar. All changes persist in your Hostinger MySQL database instantly.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pages by name or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["all", "Core", "Programs", "Get Involved", "About"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === cat
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "all" ? "All Pages" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPages.map((page) => {
          const Icon = page.icon;
          return (
            <Card
              key={page.path}
              className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {page.category}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900 group-hover:text-blue-600 transition-colors">
                    {page.title}
                  </h3>
                  <code className="text-[11px] font-mono text-slate-500 block mt-0.5">
                    {page.path}
                  </code>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {page.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                <Link
                  href={`${page.path}?edit_mode=1`}
                  target="_blank"
                  className="flex-1 inline-block"
                >
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs font-bold rounded-xl justify-center gap-1.5 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Open in Live Editor
                  </Button>
                </Link>

                <Link
                  href={page.path}
                  target="_blank"
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  title="View Public Page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
