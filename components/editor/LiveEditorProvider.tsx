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
  autoSaveSingle: (key: string, text?: string, url?: string) => Promise<boolean>;
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
      autoSaveSingle: async () => false,
      pendingEdits: {},
      saveAllEdits: async () => false,
      discardEdits: () => {},
      saving: false,
    };
  }
  return ctx;
}

// -------------------------------------------------------------
// Deterministic Stable Element ID Generator (No Date.now() ever!)
// -------------------------------------------------------------
export function getStableElementId(el: HTMLElement, normPath: string): string {
  // 1. Explicit clean attribute
  const existing = el.getAttribute("data-live-id") || el.getAttribute("data-editable-id");
  if (existing && !existing.includes("_179") && !existing.includes("_178")) {
    return existing;
  }

  // 2. Semantic ID on the element
  if (el.id && !el.id.startsWith("radix-") && !el.id.startsWith(":r")) {
    const key = `${normPath}::${el.id}`;
    el.setAttribute("data-live-id", key);
    return key;
  }

  // 3. Section or container context
  const section = el.closest("header")
    ? "hdr"
    : el.closest("footer")
    ? "ftr"
    : el.closest("nav")
    ? "nav"
    : el.closest("section")?.id
    ? el.closest("section")!.id
    : "sec";

  const tag = el.tagName.toLowerCase();

  // Find index of this tag among siblings or container
  const container = el.closest("section, header, footer, nav, main, article, aside") || document.body;
  const sameTagElements = Array.from(container.querySelectorAll(tag));
  const idx = Math.max(0, sameTagElements.indexOf(el));

  // Generate text snippet (first 15 clean alphanumeric chars of original text)
  const rawText = el.getAttribute("data-default-text") || el.innerText || "";
  const snippet = rawText
    .trim()
    .slice(0, 20)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 15);

  const cleanPath = normPath === "/" ? "home" : normPath.replace(/^\//, "").replace(/\//g, "_");
  const stableId = `${cleanPath}::${section}::${tag}_${idx}${snippet ? `::${snippet}` : ""}`;

  el.setAttribute("data-live-id", stableId);
  if (!el.getAttribute("data-default-text")) {
    el.setAttribute("data-default-text", rawText.trim());
  }
  return stableId;
}

// -------------------------------------------------------------
// Global DOM Indexing Helper (Indexes Header, Main & Footer)
// -------------------------------------------------------------
function initPageElementKeys(normPath: string) {
  if (typeof document === "undefined") return;

  const elements = document.body.querySelectorAll<HTMLElement>(
    "h1, h2, h3, h4, h5, h6, p, li, blockquote, label, [data-editable-id], [data-live-id], a, button, span"
  );

  elements.forEach((el) => {
    if (el.closest("[data-editor-ui='true']")) return;

    // For spans, only index if they contain direct text and no block children
    if (el.tagName.toLowerCase() === "span") {
      const hasDirectText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim().length > 0
      );
      if (!hasDirectText) return;
    }

    getStableElementId(el, normPath);
  });
}

// -------------------------------------------------------------
// Global DOM Sync Helper
// -------------------------------------------------------------
function applyDbEditsToDom(edits: Record<string, { text?: string; url?: string }>, normPath: string) {
  if (typeof document === "undefined" || !edits) return;

  initPageElementKeys(normPath);

  Object.entries(edits).forEach(([key, val]) => {
    if (!val) return;

    let el: HTMLElement | null = null;
    try {
      el = document.querySelector<HTMLElement>(`[data-live-id="${CSS.escape(key)}"]`);
    } catch {
      // ignore selector syntax errors
    }

    if (!el) {
      const allWithAttr = document.querySelectorAll<HTMLElement>("[data-live-id]");
      for (const candidate of allWithAttr) {
        const attr = candidate.getAttribute("data-live-id");
        if (attr === key) {
          el = candidate;
          break;
        }
      }
    }

    // Prefix match fallback (e.g., home::about::h2_0)
    if (!el && key.includes("::")) {
      const parts = key.split("::");
      if (parts.length >= 3) {
        const prefix = `${parts[0]}::${parts[1]}::${parts[2]}`;
        const allWithAttr = document.querySelectorAll<HTMLElement>("[data-live-id]");
        for (const candidate of allWithAttr) {
          const attr = candidate.getAttribute("data-live-id") || "";
          if (attr.startsWith(prefix)) {
            el = candidate;
            break;
          }
        }
      }
    }

    if (el && document.activeElement !== el) {
      if (val.text !== undefined && val.text !== null && val.text !== "") {
        if (el.innerText !== val.text) {
          // If element has icon SVG, preserve icon if it's a simple button/badge
          const icon = el.querySelector("svg");
          if (icon && el.children.length === 1) {
            const textNodes = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE);
            if (textNodes.length > 0) {
              textNodes[textNodes.length - 1].textContent = " " + val.text.trim();
            } else {
              el.innerText = val.text;
            }
          } else {
            el.innerText = val.text;
          }
        }
      }
      if (val.url) {
        if (el.tagName.toLowerCase() === "a") {
          el.setAttribute("href", val.url);
        } else {
          const parentA = el.closest("a");
          if (parentA) parentA.setAttribute("href", val.url);
        }
      }
    }
  });
}

export function LiveEditorProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normPath = React.useMemo(() => pathname.replace(/\/$/, "") || "/", [pathname]);

  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [dbEdits, setDbEdits] = React.useState<Record<string, { text?: string; url?: string }>>({});
  const [pendingEdits, setPendingEdits] = React.useState<Record<string, { text?: string; url?: string }>>({});
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  // Page Switcher Modal State
  const [pageModalOpen, setPageModalOpen] = React.useState(false);
  const [pageSearch, setPageSearch] = React.useState("");

  // Button & Link Edit Popover State
  const [buttonModal, setButtonModal] = React.useState<{
    open: boolean;
    key: string;
    text: string;
    href: string;
    element: HTMLElement | null;
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

  // Update body attribute for global edit mode styles
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.setAttribute("data-editor-active", isEditMode ? "true" : "false");
    }
  }, [isEditMode]);

  // Index DOM elements and fetch saved page contents from MySQL on path change
  React.useEffect(() => {
    initPageElementKeys(normPath);

    async function loadPageContents() {
      try {
        const res = await fetch(`/api/admin/page-content?page=${encodeURIComponent(normPath)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setDbEdits((prev) => ({ ...prev, ...json.data }));
            applyDbEditsToDom(json.data, normPath);
          }
        }
      } catch (err) {
        console.error("Failed to load page contents:", err);
      }
    }
    loadPageContents();
  }, [normPath]);

  // Apply edits whenever dbEdits changes
  React.useEffect(() => {
    applyDbEditsToDom(dbEdits, normPath);
  }, [dbEdits, normPath]);

  // Observer to re-apply edits when dynamic React components (Framer Motion, Swiper, Tabs) mount
  React.useEffect(() => {
    if (typeof document === "undefined") return;

    let timeout: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        initPageElementKeys(normPath);
        if (Object.keys(dbEdits).length > 0) {
          applyDbEditsToDom(dbEdits, normPath);
        }
      }, 100);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [normPath, dbEdits]);

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

  // -------------------------------------------------------------
  // Instant Auto-Save Single Element (Saves automatically on blur)
  // -------------------------------------------------------------
  const autoSaveSingle = React.useCallback(
    async (key: string, text?: string, url?: string) => {
      if (!key) return false;
      const current = pendingEdits[key] || dbEdits[key] || {};
      const newText = text !== undefined ? text : current.text;
      const newUrl = url !== undefined ? url : current.url;

      try {
        const res = await fetch("/api/admin/page-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([
            {
              page_path: normPath,
              element_key: key,
              content_text: newText,
              link_url: newUrl,
            },
          ]),
        });

        if (res.ok) {
          setDbEdits((prev) => ({
            ...prev,
            [key]: { text: newText, url: newUrl },
          }));
          setPendingEdits((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          setFeedback("✓ Auto-saved live to hosting!");
          setTimeout(() => setFeedback(null), 3000);
          return true;
        }
      } catch (err: any) {
        console.error("Auto-save error:", err);
      }
      return false;
    },
    [normPath, pendingEdits, dbEdits]
  );

  const saveAllEdits = React.useCallback(async () => {
    const keys = Object.keys(pendingEdits);
    if (keys.length === 0) return true;

    setSaving(true);
    setFeedback(null);

    const items: PageEditItem[] = keys.map((k) => ({
      page_path: normPath,
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

      const merged = { ...dbEdits, ...pendingEdits };
      setDbEdits(merged);
      setPendingEdits({});
      applyDbEditsToDom(merged, normPath);

      setFeedback("✓ Saved live to website & Hostinger MySQL!");
      setTimeout(() => setFeedback(null), 4000);
      return true;
    } catch (err: any) {
      setFeedback("Error saving: " + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [pendingEdits, normPath, dbEdits]);

  const discardEdits = React.useCallback(() => {
    setPendingEdits({});
    applyDbEditsToDom(dbEdits, normPath);
  }, [dbEdits, normPath]);

  const pendingCount = Object.keys(pendingEdits).length;

  const filteredPages = ALL_SITE_PAGES.filter(
    (p) =>
      p.title.toLowerCase().includes(pageSearch.toLowerCase()) ||
      p.path.toLowerCase().includes(pageSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(pageSearch.toLowerCase())
  );

  // -------------------------------------------------------------
  // Universal In-Line Direct Click-to-Edit Engine
  // -------------------------------------------------------------
  React.useEffect(() => {
    if (!isEditMode) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore editor UI elements
      if (target.closest("[data-editor-ui='true']")) return;

      // 1. If clicking specifically on a link edit trigger badge
      const isLinkTrigger = target.closest("[data-link-edit-trigger='true']");
      if (isLinkTrigger) {
        e.preventDefault();
        e.stopPropagation();
        const parentBtnOrLink = isLinkTrigger.closest("a, button") as HTMLElement | null;
        if (parentBtnOrLink) {
          const btnKey = getStableElementId(parentBtnOrLink, normPath);
          const currentSaved = getSavedValue(btnKey);
          let existingHref = currentSaved?.url || parentBtnOrLink.getAttribute("href") || "";
          let existingText = currentSaved?.text || parentBtnOrLink.innerText?.trim() || "";

          setButtonModal({
            open: true,
            key: btnKey,
            text: existingText,
            href: existingHref || "/",
            element: parentBtnOrLink,
          });
        }
        return;
      }

      // 2. Target the most specific text-bearing element under the cursor
      const textElem = target.closest(
        "h1, h2, h3, h4, h5, h6, p, li, blockquote, label, span, strong, em, b, small, a, button"
      ) as HTMLElement | null;

      if (textElem && !textElem.closest("[data-editor-ui='true']")) {
        // Prevent default navigation so clicking a link/button doesn't leave the page
        const isAnchorOrButton = textElem.tagName.toLowerCase() === "a" || textElem.tagName.toLowerCase() === "button" || textElem.closest("a, button");
        if (isAnchorOrButton) {
          e.preventDefault();
        }

        const hasText = (textElem.innerText || "").trim().length > 0;
        if (hasText) {
          textElem.setAttribute("contenteditable", "true");
          textElem.setAttribute("suppressContentEditableWarning", "true");
          textElem.setAttribute("spellcheck", "false");
          textElem.focus();

          const elemKey = getStableElementId(textElem, normPath);

          const handleInput = () => {
            registerTextChange(elemKey, textElem.innerText);
          };

          const handleBlur = () => {
            const currentText = textElem.innerText.trim();
            registerTextChange(elemKey, currentText);
            // Automatic instant save to hosting on blur
            autoSaveSingle(elemKey, currentText);
          };

          textElem.addEventListener("input", handleInput);
          textElem.addEventListener("blur", handleBlur, { once: true });
        }
      }
    };

    // Double-click on any button or link opens the URL edit modal
    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest("[data-editor-ui='true']")) return;

      const btnOrLink = target.closest("a, button") as HTMLElement | null;
      if (btnOrLink) {
        e.preventDefault();
        e.stopPropagation();
        const btnKey = getStableElementId(btnOrLink, normPath);
        const currentSaved = getSavedValue(btnKey);
        const existingHref = currentSaved?.url || btnOrLink.getAttribute("href") || "/";
        const existingText = currentSaved?.text || btnOrLink.innerText?.trim() || "";

        setButtonModal({
          open: true,
          key: btnKey,
          text: existingText,
          href: existingHref,
          element: btnOrLink,
        });
      }
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("dblclick", handleDblClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("dblclick", handleDblClick, true);
    };
  }, [isEditMode, normPath, getSavedValue, registerTextChange, autoSaveSingle]);

  return (
    <LiveEditorContext.Provider
      value={{
        isEditMode,
        toggleEditMode: () => setIsEditMode((prev) => !prev),
        isAdmin,
        getSavedValue,
        registerTextChange,
        registerLinkChange,
        autoSaveSingle,
        pendingEdits,
        saveAllEdits,
        discardEdits,
        saving,
      }}
    >
      {/* Global CSS for seamless inline editing, text selection, and hover guides */}
      <style jsx global>{`
        [data-editor-active="true"] * {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        [data-editor-active="true"] [data-editor-ui="true"],
        [data-editor-active="true"] [data-editor-ui="true"] * {
          user-select: none !important;
        }
        [data-editor-active="true"] h1:hover,
        [data-editor-active="true"] h2:hover,
        [data-editor-active="true"] h3:hover,
        [data-editor-active="true"] p:hover,
        [data-editor-active="true"] span:hover,
        [data-editor-active="true"] li:hover {
          outline: 2px dashed #3b82f6 !important;
          outline-offset: 3px !important;
          cursor: text !important;
          border-radius: 4px !important;
        }
        [data-editor-active="true"] a:hover,
        [data-editor-active="true"] button:hover {
          outline: 2px dashed #10b981 !important;
          outline-offset: 3px !important;
          cursor: pointer !important;
          border-radius: 6px !important;
          position: relative;
        }
        [data-editor-active="true"] [contenteditable="true"] {
          outline: 2px solid #2563eb !important;
          outline-offset: 3px !important;
          background-color: rgba(59, 130, 246, 0.08) !important;
          border-radius: 4px !important;
          cursor: text !important;
        }
      `}</style>

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
                <span>GJTF Live Editor</span>
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
                  title="Click to view and switch between all website pages"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-300" />
                  <span>Switch Page ({ALL_SITE_PAGES.length})</span>
                  <ChevronDown className="w-3 h-3 text-blue-300" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {feedback && (
                <span className="text-emerald-400 font-semibold px-2.5 py-1 bg-emerald-950/90 rounded-md border border-emerald-500/40 animate-fade-in text-[11px] flex items-center gap-1 shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5" />
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
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  Edit Button & Target Link
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Update button text and target link URL
                </p>
              </div>
              <button
                type="button"
                onClick={() => setButtonModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Existing Link Indicator */}
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Existing Link:</span>
              <span className="font-mono font-bold text-blue-700 truncate max-w-[200px]">
                {buttonModal.href || "None (empty)"}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                registerLinkChange(buttonModal.key, buttonModal.text, buttonModal.href);
                // Auto-save immediately to hosting
                autoSaveSingle(buttonModal.key, buttonModal.text, buttonModal.href);

                // Update the DOM element directly in real time
                if (buttonModal.element) {
                  buttonModal.element.innerText = buttonModal.text;
                  const anchor =
                    buttonModal.element.tagName.toLowerCase() === "a"
                      ? buttonModal.element
                      : buttonModal.element.closest("a");
                  if (anchor) {
                    anchor.setAttribute("href", buttonModal.href);
                  }
                }
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

              {/* Quick Link Shortcut Chips */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-semibold text-slate-500">
                  Quick Page Link Shortcuts:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Home", url: "/" },
                    { label: "Our Schools", url: "/our-school" },
                    { label: "Volunteers", url: "/about-gjtf-volunteers" },
                    { label: "University", url: "/university-chapter" },
                    { label: "City Leads", url: "/city-chapter-leads" },
                    { label: "Blogs", url: "/blogs" },
                    { label: "Donate Now", url: "/donate-now" },
                    { label: "Contact Us", url: "/contact-us" },
                  ].map((shortcut) => (
                    <button
                      key={shortcut.url}
                      type="button"
                      onClick={() => setButtonModal({ ...buttonModal, href: shortcut.url })}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                        buttonModal.href === shortcut.url
                          ? "bg-blue-600 text-white font-bold"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
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
                  Update Button & Link
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
// EditableText Component (Explicit high-priority editable text block)
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
  const { isEditMode, getSavedValue, registerTextChange, autoSaveSingle } = useLiveEditor();
  const saved = getSavedValue(id);
  const currentText = saved?.text !== undefined ? saved.text : defaultText;
  const elementRef = React.useRef<HTMLElement>(null);

  // Sync ref with current text if not actively focused
  React.useEffect(() => {
    if (elementRef.current && document.activeElement !== elementRef.current) {
      if (elementRef.current.innerText !== currentText) {
        elementRef.current.innerText = currentText;
      }
    }
  }, [currentText]);

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    registerTextChange(id, e.currentTarget.innerText);
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const text = e.currentTarget.innerText.trim();
    registerTextChange(id, text);
    autoSaveSingle(id, text);
  };

  return (
    <Tag
      ref={elementRef}
      data-live-id={id}
      contentEditable={isEditMode}
      suppressContentEditableWarning
      spellCheck={false}
      onInput={isEditMode ? handleInput : undefined}
      onBlur={isEditMode ? handleBlur : undefined}
      title={isEditMode ? "Click to edit text directly" : undefined}
      className={`${className} ${
        isEditMode
          ? "outline-none cursor-text select-text transition-all rounded px-0.5"
          : ""
      }`}
    >
      {currentText}
    </Tag>
  );
}

// -------------------------------------------------------------
// EditableButton Component (Explicit high-priority editable button/link)
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
  const { isEditMode, getSavedValue, registerLinkChange, autoSaveSingle } = useLiveEditor();
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
    autoSaveSingle(id, editText, editHref);
    setModalOpen(false);
  };

  // Helper to render child while applying edited text if children has text inside
  let renderedContent = children || text;
  if (saved?.text && React.isValidElement(children)) {
    const childProps = (children as any).props || {};
    if (Array.isArray(childProps.children)) {
      const newChildren = childProps.children.map((c: any) => {
        if (typeof c === "string") return ` ${text}`;
        return c;
      });
      renderedContent = React.cloneElement(children as any, {}, ...newChildren);
    } else if (typeof childProps.children === "string") {
      renderedContent = React.cloneElement(children as any, {}, text);
    }
  }

  if (!isEditMode) {
    return (
      <a data-live-id={id} href={href} className={className}>
        {renderedContent}
      </a>
    );
  }

  return (
    <>
      <span className="relative inline-block group">
        <a
          data-live-id={id}
          href={href}
          onClick={(e) => {
            // In edit mode, allow typing text; double click or icon opens URL modal
            e.preventDefault();
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            setModalOpen(true);
          }}
          title="Click to edit text, double-click to edit link URL"
          className={`${className} ring-2 ring-emerald-400/80 ring-dashed hover:ring-solid cursor-text`}
        >
          {renderedContent}
        </a>

        {/* Small floating link pencil badge */}
        <span
          data-link-edit-trigger="true"
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(true);
          }}
          title="Click to edit link URL & destination"
          className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-[10px] shadow cursor-pointer transition-transform hover:scale-110 z-10"
        >
          <LinkIcon className="w-2.5 h-2.5" />
        </span>
      </span>

      {/* Button & Link Edit Popover / Modal */}
      {modalOpen && (
        <div
          data-editor-ui="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  Edit Button & Target Link
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Update button text and target link URL
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Existing Link Indicator */}
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Existing Link:</span>
              <span className="font-mono font-bold text-blue-700 truncate max-w-[200px]">
                {editHref || defaultHref || "None"}
              </span>
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

              {/* Quick Link Shortcut Chips */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-semibold text-slate-500">
                  Quick Page Link Shortcuts:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Home", url: "/" },
                    { label: "Our Schools", url: "/our-school" },
                    { label: "Volunteers", url: "/about-gjtf-volunteers" },
                    { label: "University", url: "/university-chapter" },
                    { label: "City Leads", url: "/city-chapter-leads" },
                    { label: "Blogs", url: "/blogs" },
                    { label: "Donate Now", url: "/donate-now" },
                    { label: "Contact Us", url: "/contact-us" },
                  ].map((shortcut) => (
                    <button
                      key={shortcut.url}
                      type="button"
                      onClick={() => setEditHref(shortcut.url)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                        editHref === shortcut.url
                          ? "bg-blue-600 text-white font-bold"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
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
                  Update Button & Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
