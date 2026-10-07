"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Edit3,
  Save,
  RotateCcw,
  CheckCircle,
  Eye,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Link as LinkIcon,
  X,
  Layers,
  ChevronDown,
  Search,
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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SitePageMeta {
  path: string;
  title: string;
  description: string;
  category: "Core" | "Programs" | "Get Involved" | "About";
}

export const ALL_SITE_PAGES: SitePageMeta[] = [
  {
    path: "/",
    title: "Home Page",
    description: "Main landing, video hero background, mission statement and dynamic counters",
    category: "Core",
  },
  {
    path: "/our-school",
    title: "Our Schools Directory",
    description: "Explore all 24+ nationwide school units, campus facilities and capacities",
    category: "Programs",
  },
  {
    path: "/about-gjtf-volunteers",
    title: "About GJTF Volunteers",
    description: "Volunteer department overview, vision, mission and core impact areas",
    category: "Get Involved",
  },
  {
    path: "/university-chapter",
    title: "University Chapter",
    description: "Campus ambassador societies, university MoUs, and youth leadership drives",
    category: "Get Involved",
  },
  {
    path: "/city-chapter-leads",
    title: "City Chapter Leads",
    description: "City-level volunteer leadership movement across Karachi, Lahore, Islamabad",
    category: "Get Involved",
  },
  {
    path: "/general-volunteer",
    title: "General Volunteer",
    description: "Skills-based volunteering, medical drives, teaching sessions and signups",
    category: "Get Involved",
  },
  {
    path: "/aims-and-objectives",
    title: "Aims & Objectives",
    description: "Foundational pillars, 10 core targets, and mission for 20M+ nomadic children",
    category: "About",
  },
  {
    path: "/blogs",
    title: "Blogs & News",
    description: "Educational articles, field updates, media features and transformation stories",
    category: "Core",
  },
  {
    path: "/contact-us",
    title: "Contact Us",
    description: "Head office, regional contact details, map location, and inquiry submission",
    category: "About",
  },
  {
    path: "/donate-now",
    title: "Donate Now",
    description: "Zakat & Sadqah contributions, Meezan Bank account details, and online giving",
    category: "Core",
  },
];

interface PageEditItem {
  page_path: string;
  element_key: string;
  content_text?: string;
  link_url?: string;
}

interface LiveEditorContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
  isAdmin: boolean;
  getSavedValue: (key: string) => { text?: string; url?: string } | undefined;
  registerTextChange: (key: string, text: string) => void;
  registerLinkChange: (key: string, text: string, url: string) => void;
  pendingEdits: Record<string, { text?: string; url?: string }>;
  saveAllEdits: () => Promise<boolean>;
  discardEdits: () => void;
  saving: boolean;
}

const LiveEditorContext = React.createContext<LiveEditorContextType | null>(null);

export function useLiveEditor() {
  const ctx = React.useContext(LiveEditorContext);
  if (!ctx) {
    return {
      isEditMode: false,
      toggleEditMode: () => {},
      isAdmin: false,
      getSavedValue: () => undefined,
      registerTextChange: () => {},
      registerLinkChange: () => {},
      pendingEdits: {},
      saveAllEdits: async () => false,
      discardEdits: () => {},
      saving: false,
    };
  }
  return ctx;
}

export function LiveEditorProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [dbEdits, setDbEdits] = React.useState<Record<string, { text?: string; url?: string }>>({});
  const [pendingEdits, setPendingEdits] = React.useState<Record<string, { text?: string; url?: string }>>({});
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  // Page Switcher Modal State
  const [pageModalOpen, setPageModalOpen] = React.useState(false);
  const [pageSearch, setPageSearch] = React.useState("");

  // Universal Button & Link Edit Popover State
  const [buttonModal, setButtonModal] = React.useState<{
    open: boolean;
    key: string;
    text: string;
    href: string;
  } | null>(null);

  // Check admin session & edit_mode query
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const hasCookie = document.cookie.includes("admin-session=");
      const hasLocal = localStorage.getItem("admin_logged_in") === "true";
      const params = new URLSearchParams(window.location.search);
      const isParamEdit = params.get("edit_mode") === "1";

      if (hasCookie || hasLocal || isParamEdit) {
        setIsAdmin(true);
      }
      if (isParamEdit) {
        setIsEditMode(true);
      }
    }
  }, []);

  // Fetch saved page contents from MySQL on path change
  React.useEffect(() => {
    async function loadPageContents() {
      try {
        const res = await fetch(`/api/admin/page-content?page=${encodeURIComponent(pathname)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setDbEdits((prev) => ({ ...prev, ...json.data }));
          }
        }
      } catch (err) {
        console.error("Failed to load page contents:", err);
      }
    }
    loadPageContents();
  }, [pathname]);

  const getSavedValue = React.useCallback(
    (key: string) => {
      if (pendingEdits[key]) return pendingEdits[key];
      return dbEdits[key];
    },
    [pendingEdits, dbEdits]
  );

  const registerTextChange = React.useCallback((key: string, text: string) => {
    setPendingEdits((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        text,
      },
    }));
  }, []);

  const registerLinkChange = React.useCallback((key: string, text: string, url: string) => {
    setPendingEdits((prev) => ({
      ...prev,
      [key]: {
        text,
        url,
      },
    }));
  }, []);

  const saveAllEdits = React.useCallback(async () => {
    const keys = Object.keys(pendingEdits);
    if (keys.length === 0) return true;

    setSaving(true);
    setFeedback(null);

    const items: PageEditItem[] = keys.map((k) => ({
      page_path: pathname,
      element_key: k,
      content_text: pendingEdits[k].text,
      link_url: pendingEdits[k].url,
    }));

    try {
      const res = await fetch("/api/admin/page-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });

      if (!res.ok) throw new Error("Failed to save changes to database");

      setDbEdits((prev) => ({ ...prev, ...pendingEdits }));
      setPendingEdits({});
      setFeedback("Changes saved live to Hostinger MySQL!");
      setTimeout(() => setFeedback(null), 3500);
      return true;
    } catch (err: any) {
      setFeedback("Error saving: " + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [pendingEdits, pathname]);

  const discardEdits = React.useCallback(() => {
    setPendingEdits({});
  }, []);

  const pendingCount = Object.keys(pendingEdits).length;

  const filteredPages = ALL_SITE_PAGES.filter(
    (p) =>
      p.title.toLowerCase().includes(pageSearch.toLowerCase()) ||
      p.path.toLowerCase().includes(pageSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(pageSearch.toLowerCase())
  );

  return (
    <LiveEditorContext.Provider
      value={{
        isEditMode,
        toggleEditMode: () => setIsEditMode((prev) => !prev),
        isAdmin,
        getSavedValue,
        registerTextChange,
        registerLinkChange,
        pendingEdits,
        saveAllEdits,
        discardEdits,
        saving,
      }}
    >
      {/* Visual Live Editor Top Bar (Shown when Admin is authenticated or in edit mode) */}
      {isAdmin && (
        <aside
          data-editor-ui="true"
          aria-label="GJTF Visual Live Editor Toolbar"
          className="fixed top-0 left-0 right-0 z-[90] bg-slate-950/95 text-white border-b border-blue-500/30 backdrop-blur-md px-4 py-2.5 shadow-2xl transition-all"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="font-bold flex items-center gap-1.5 text-slate-100">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>GJTF Visual Live Editor</span>
              </div>

              {/* Current Page Pill + Switch Page Dropdown Trigger */}
              <div className="flex items-center gap-1.5 ml-1">
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-mono text-slate-300">
                  {pathname}
                </span>

                <button
                  type="button"
                  onClick={() => setPageModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 border border-blue-400/40 text-blue-200 text-[11px] font-bold cursor-pointer transition-all shadow-sm"
                  title="Click to view and switch between all 10 website pages"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-300" />
                  <span>Switch Page ({ALL_SITE_PAGES.length})</span>
                  <ChevronDown className="w-3 h-3 text-blue-300" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {feedback && (
                <span className="text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-950/80 rounded-md border border-emerald-500/30 animate-fade-in text-[11px]">
                  {feedback}
                </span>
              )}

              {/* Mode Toggle Button */}
              <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isEditMode
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                {isEditMode ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Editing Mode ON</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Enable Live Editor</span>
                  </>
                )}
              </button>

              {/* Pending changes badge & save */}
              {isEditMode && (
                <>
                  {pendingCount > 0 && (
                    <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px]">
                      {pendingCount} unsaved
                    </span>
                  )}

                  <Button
                    size="sm"
                    variant="primary"
                    disabled={saving || pendingCount === 0}
                    onClick={saveAllEdits}
                    className="h-7 px-3 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-sm cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3 mr-1" />
                        Save Live
                      </>
                    )}
                  </Button>

                  {pendingCount > 0 && (
                    <button
                      type="button"
                      onClick={discardEdits}
                      className="px-2 py-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Discard pending changes"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}

              <a
                href="/admin/visual-editor"
                className="text-slate-400 hover:text-white underline underline-offset-2 ml-1 text-[11px]"
              >
                Editor Hub →
              </a>
            </div>
          </div>
        </aside>
      )}

      {/* Page Switcher Modal */}
      {pageModalOpen && (
        <div
          data-editor-ui="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
                    All Website Pages
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                      {ALL_SITE_PAGES.length} Pages Available
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Switch to any page below to edit text, headings, and buttons live
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPageModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/40">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search pages by name or URL path..."
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Page List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[50vh]">
              {filteredPages.map((page) => {
                const isCurrent = pathname === page.path;
                return (
                  <div
                    key={page.path}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrent
                        ? "bg-blue-600/15 border-blue-500/40 text-white shadow-sm"
                        : "bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">
                            {page.title}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              Current Page
                            </span>
                          )}
                        </div>
                        <code className="text-[11px] font-mono text-slate-400 block truncate">
                          {page.path}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            pendingCount > 0 &&
                            !confirm("You have unsaved changes on this page. Switch anyway?")
                          ) {
                            return;
                          }
                          setPageModalOpen(false);
                          window.location.href = `${page.path}?edit_mode=1`;
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-blue-600 hover:bg-blue-500 text-white"
                            : "bg-white/10 hover:bg-blue-600 text-white"
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isCurrent ? "Editing Now" : "Open in Live Editor"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
              <span>Click any page to switch immediately while keeping edit mode ON.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageModalOpen(false)}
                className="rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Button & Link Edit Popover Modal */}
      {buttonModal && (
        <div
          data-editor-ui="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Edit Button & Link Target
              </h3>
              <button
                type="button"
                onClick={() => setButtonModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                registerLinkChange(buttonModal.key, buttonModal.text, buttonModal.href);
                setButtonModal(null);
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Button Display Text:</label>
                <input
                  type="text"
                  required
                  value={buttonModal.text}
                  onChange={(e) =>
                    setButtonModal({ ...buttonModal, text: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Button Link Target (URL / Path):</label>
                <input
                  type="text"
                  required
                  placeholder="/donate-now or https://..."
                  value={buttonModal.href}
                  onChange={(e) =>
                    setButtonModal({ ...buttonModal, href: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setButtonModal(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="rounded-xl font-bold">
                  Update Button
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={isAdmin ? "pt-10" : ""}>{children}</div>
    </LiveEditorContext.Provider>
  );
}

// -------------------------------------------------------------
// EditableText Component
// -------------------------------------------------------------
export function EditableText({
  id,
  defaultText,
  as: Tag = "span",
  className = "",
}: {
  id: string;
  defaultText: string;
  as?: any;
  className?: string;
}) {
  const { isEditMode, getSavedValue, registerTextChange } = useLiveEditor();
  const saved = getSavedValue(id);
  const currentText = saved?.text !== undefined ? saved.text : defaultText;

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const newText = e.currentTarget.innerText.trim();
    if (newText !== currentText) {
      registerTextChange(id, newText);
    }
  };

  if (!isEditMode) {
    return <Tag className={className}>{currentText}</Tag>;
  }

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onInput={(e: React.FormEvent<HTMLElement>) => {
        registerTextChange(id, e.currentTarget.innerText);
      }}
      onBlur={handleBlur}
      title="Click to edit text directly"
      className={`${className} outline-none cursor-text transition-all rounded px-0.5 ${
        isEditMode
          ? "hover:ring-2 hover:ring-blue-400 focus:ring-2 focus:ring-blue-500 bg-blue-50/10 focus:bg-blue-50/20"
          : ""
      }`}
    >
      {currentText}
    </Tag>
  );
}

// -------------------------------------------------------------
// EditableButton Component (Supports text and link URL modal edit)
// -------------------------------------------------------------
export function EditableButton({
  id,
  defaultText,
  defaultHref,
  children,
  className = "",
}: {
  id: string;
  defaultText: string;
  defaultHref: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { isEditMode, getSavedValue, registerLinkChange } = useLiveEditor();
  const [modalOpen, setModalOpen] = React.useState(false);

  const saved = getSavedValue(id);
  const text = saved?.text !== undefined ? saved.text : defaultText;
  const href = saved?.url !== undefined ? saved.url : defaultHref;

  const [editText, setEditText] = React.useState(text);
  const [editHref, setEditHref] = React.useState(href);

  React.useEffect(() => {
    setEditText(text);
    setEditHref(href);
  }, [text, href]);

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    registerLinkChange(id, editText, editHref);
    setModalOpen(false);
  };

  if (!isEditMode) {
    return (
      <a href={href} className={className}>
        {children || text}
      </a>
    );
  }

  return (
    <>
      <span className="relative inline-block group">
        <a
          href={href}
          onClick={(e) => {
            e.preventDefault();
            setModalOpen(true);
          }}
          title="Click to edit button text & target link"
          className={`${className} ring-2 ring-blue-400/80 ring-dashed hover:ring-solid cursor-pointer`}
        >
          {children || text}
        </a>

        {/* Small floating pencil badge in edit mode */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(true);
          }}
          className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow cursor-pointer"
        >
          <Edit3 className="w-2.5 h-2.5" />
        </span>
      </span>

      {/* Button & Link Edit Popover / Modal */}
      {modalOpen && (
        <div
          data-editor-ui="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Edit Button & Target Link
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Button Display Text:</label>
                <input
                  type="text"
                  required
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Button Link Target (URL / Path):</label>
                <input
                  type="text"
                  required
                  placeholder="/donate-now or https://..."
                  value={editHref}
                  onChange={(e) => setEditHref(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="rounded-xl font-bold">
                  Update Button
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
