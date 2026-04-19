"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { createDoctorProductCheckout } from "../purchase-actions";
import {
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  Receipt,
  AlertTriangle,
  ShieldCheck,
  FileText,
  CheckSquare,
  Building2,
  Hash,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BillingItem {
  id: string;
  code?: string;
  title: string;
  type: "code" | "modifier" | "script" | "letter" | "template" | "checklist" | "payer";
  content: string;
}

interface BillingSection {
  id: string;
  title: string;
  description: string;
  items: BillingItem[];
}

/* ------------------------------------------------------------------ */
/*  Data import (lazy)                                                  */
/* ------------------------------------------------------------------ */

let BILLING_SECTIONS: BillingSection[] = [];
try {
  BILLING_SECTIONS = require("./billing-data").BILLING_SECTIONS;
} catch {
  // billing-data not created yet
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FREE_CODES = ["98940", "98941", "98942"];
const FREE_SECTION_INDEX = 0;

const TYPE_ICON: Record<BillingItem["type"], typeof FileText> = {
  code: Hash,
  modifier: Hash,
  script: FileText,
  letter: FileText,
  template: FileText,
  checklist: CheckSquare,
  payer: Building2,
};

/* ------------------------------------------------------------------ */
/*  Markdown-ish renderer                                              */
/* ------------------------------------------------------------------ */

function renderContent(raw: string) {
  const paragraphs = raw.split("\n\n");
  return paragraphs.map((p, pi) => {
    const trimmed = p.trim();
    if (!trimmed) return null;

    // Bullet list
    const lines = trimmed.split("\n");
    if (lines.every((l) => l.trimStart().startsWith("- "))) {
      return (
        <ul key={pi} className="list-disc pl-5 space-y-1 text-sm text-gray-700 leading-relaxed mb-3">
          {lines.map((l, li) => (
            <li key={li} dangerouslySetInnerHTML={{ __html: boldify(l.replace(/^\s*-\s*/, "")) }} />
          ))}
        </ul>
      );
    }

    // Mixed — some lines may be bullets, some not
    const hasBullets = lines.some((l) => l.trimStart().startsWith("- "));
    if (hasBullets) {
      return (
        <div key={pi} className="mb-3 space-y-1">
          {lines.map((l, li) => {
            const isBullet = l.trimStart().startsWith("- ");
            if (isBullet) {
              return (
                <div key={li} className="flex gap-2 text-sm text-gray-700 leading-relaxed pl-2">
                  <span className="text-gray-400 select-none">&bull;</span>
                  <span dangerouslySetInnerHTML={{ __html: boldify(l.replace(/^\s*-\s*/, "")) }} />
                </div>
              );
            }
            return (
              <p key={li} className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: boldify(l) }} />
            );
          })}
        </div>
      );
    }

    return (
      <p key={pi} className="text-sm text-gray-700 leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: boldify(trimmed) }} />
    );
  });
}

function boldify(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong class='font-bold text-neuro-navy'>$1</strong>");
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BillingGuidePage() {
  const [purchased, setPurchased] = useState(false);
  const [loadingPurchase, setLoadingPurchase] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* --- Purchase check -------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) {
          setLoadingPurchase(false);
          return;
        }
        const { data } = await (supabase as any)
          .from("course_purchases")
          .select("course_id")
          .eq("user_id", user.id)
          .eq("course_id", "billing-guide");
        if (!cancelled) {
          setPurchased(Array.isArray(data) && data.length > 0);
        }
      } catch {
        // fail open — will show locked state
      } finally {
        if (!cancelled) setLoadingPurchase(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  /* --- Computed counts ------------------------------------------- */
  const totalCodes = useMemo(
    () => BILLING_SECTIONS.reduce((n, s) => n + s.items.filter((i) => i.type === "code" || i.type === "modifier").length, 0),
    []
  );
  const totalLetters = useMemo(
    () => BILLING_SECTIONS.reduce((n, s) => n + s.items.filter((i) => i.type === "letter").length, 0),
    []
  );
  const totalTemplates = useMemo(
    () => BILLING_SECTIONS.reduce((n, s) => n + s.items.filter((i) => i.type === "template" || i.type === "script").length, 0),
    []
  );

  /* --- Search ---------------------------------------------------- */
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return BILLING_SECTIONS;
    const q = searchQuery.toLowerCase();
    return BILLING_SECTIONS.map((section) => {
      const matchedItems = section.items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.code && item.code.toLowerCase().includes(q)) ||
          item.content.toLowerCase().includes(q)
      );
      if (matchedItems.length === 0 && !section.title.toLowerCase().includes(q)) return null;
      return { ...section, items: matchedItems.length > 0 ? matchedItems : section.items };
    }).filter(Boolean) as BillingSection[];
  }, [searchQuery]);

  /* --- Helpers --------------------------------------------------- */
  const toggleSection = useCallback((id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCopy = useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard may not be available
    }
  }, []);

  const isItemAccessible = useCallback(
    (sectionIndex: number, item: BillingItem) => {
      if (purchased) return true;
      if (sectionIndex === FREE_SECTION_INDEX && item.code && FREE_CODES.includes(item.code)) return true;
      return false;
    },
    [purchased]
  );

  const isSectionAccessible = useCallback(
    (sectionIndex: number) => purchased || sectionIndex === FREE_SECTION_INDEX,
    [purchased]
  );

  /* --- Badge for item type --------------------------------------- */
  const codeBadge = (item: BillingItem) => {
    if (item.type === "code" && item.code) {
      return (
        <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-neuro-navy text-white font-mono font-black text-base tracking-wider flex-shrink-0">
          {item.code}
        </span>
      );
    }
    if (item.type === "modifier" && item.code) {
      return (
        <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-purple-600 text-white font-mono font-black text-base tracking-wider flex-shrink-0">
          {item.code}
        </span>
      );
    }
    return null;
  };

  const hasCopyButton = (type: BillingItem["type"]) =>
    type === "script" || type === "letter" || type === "template";

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-black text-neuro-navy flex items-center gap-3">
          <Receipt className="w-7 h-7 text-neuro-orange" /> Insurance &amp; Billing Toolkit
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          The $39 that saves you $30,000/year in missed revenue.
        </p>
      </div>

      {/* Legal Disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          This guide is for educational reference. Billing codes, rules, and reimbursement rates change
          frequently. Always verify current guidelines with your payer and compliance team.
        </p>
      </div>

      {/* Purchase CTA (if not purchased) */}
      {!loadingPurchase && !purchased && (
        <div className="bg-neuro-navy rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-white font-black text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-neuro-orange" />
                $39 one-time &mdash; Own it forever
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="text-[11px] font-bold text-gray-300 bg-white/10 px-2.5 py-1 rounded-lg">
                  {BILLING_SECTIONS.length} Sections
                </span>
                <span className="text-[11px] font-bold text-gray-300 bg-white/10 px-2.5 py-1 rounded-lg">
                  {totalCodes} Codes &amp; Modifiers
                </span>
                {totalLetters > 0 && (
                  <span className="text-[11px] font-bold text-gray-300 bg-white/10 px-2.5 py-1 rounded-lg">
                    {totalLetters} Appeal Letters
                  </span>
                )}
                {totalTemplates > 0 && (
                  <span className="text-[11px] font-bold text-gray-300 bg-white/10 px-2.5 py-1 rounded-lg">
                    {totalTemplates} Templates &amp; Scripts
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={async () => {
                const result = await createDoctorProductCheckout('billing-guide', 'Insurance & Billing Toolkit', 3900);
                if (result.url) window.location.href = result.url;
                else alert(result.error);
              }}
              className="px-6 py-3 bg-neuro-orange text-white rounded-xl font-black text-sm hover:bg-neuro-orange/90 transition-colors whitespace-nowrap flex-shrink-0"
            >
              Buy Now &mdash; $39
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search codes, modifiers, templates..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors"
        />
      </div>

      {/* Sections */}
      {filteredSections.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 font-bold">No results found. Try a different search term.</p>
        </div>
      )}

      <div className="space-y-4">
        {filteredSections.map((section, sIdx) => {
          const isOpen = expandedSections.has(section.id);
          const accessible = isSectionAccessible(sIdx);

          return (
            <div key={section.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full text-left p-4 md:p-5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
              >
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-neuro-navy text-sm md:text-base">{section.title}</h2>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {section.items.length} item{section.items.length !== 1 ? "s" : ""}
                    </span>
                    {!accessible && (
                      <Lock className="w-3.5 h-3.5 text-gray-300" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                </div>
              </button>

              {/* Section Content */}
              {isOpen && (
                <div className="border-t border-gray-100">
                  {!accessible ? (
                    /* Locked section */
                    <div className="p-6 text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 to-white/95 backdrop-blur-sm" />
                      <div className="relative z-10 flex flex-col items-center gap-3 py-4">
                        <Lock className="w-8 h-8 text-gray-300" />
                        <p className="text-sm font-bold text-gray-400">
                          Purchase the Billing Toolkit to unlock this section
                        </p>
                        <button
                          onClick={async () => {
                            const result = await createDoctorProductCheckout('billing-guide', 'Insurance & Billing Toolkit', 3900);
                            if (result.url) window.location.href = result.url;
                            else alert(result.error);
                          }}
                          className="px-5 py-2.5 bg-neuro-orange text-white rounded-lg font-bold text-xs hover:bg-neuro-orange/90 transition-colors"
                        >
                          Unlock for $39
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Accessible section */
                    <div className="p-3 md:p-4 space-y-2">
                      {section.items.map((item) => {
                        const itemAccessible = isItemAccessible(sIdx, item);
                        const isItemOpen = expandedItems.has(item.id);
                        const ItemIcon = TYPE_ICON[item.type] || FileText;
                        const badge = codeBadge(item);
                        const copyable = hasCopyButton(item.type);

                        /* Locked item within an accessible section */
                        if (!itemAccessible) {
                          return (
                            <div
                              key={item.id}
                              className="rounded-lg border border-gray-100 p-3 md:p-4 opacity-50 flex items-center gap-3"
                            >
                              {badge || (
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <Lock className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-gray-400 truncate">{item.title}</p>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                                LOCKED
                              </span>
                            </div>
                          );
                        }

                        /* Accessible item */
                        return (
                          <div
                            key={item.id}
                            className="rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                          >
                            {/* Item header */}
                            <button
                              onClick={() => toggleItem(item.id)}
                              className="w-full text-left p-3 md:p-4 flex items-center gap-3"
                            >
                              {badge || (
                                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                                  <ItemIcon className="w-4 h-4 text-gray-500" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-neuro-navy truncate">{item.title}</p>
                              </div>
                              {isItemOpen ? (
                                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                            </button>

                            {/* Item expanded content */}
                            {isItemOpen && (
                              <div className="border-t border-gray-100 p-3 md:p-4">
                                <div className="bg-gray-50 rounded-xl p-4 max-h-[32rem] overflow-y-auto">
                                  {renderContent(item.content)}
                                </div>
                                {copyable && (
                                  <div className="mt-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(item.id, item.content);
                                      }}
                                      className="px-4 py-2 bg-neuro-navy text-white rounded-lg font-bold text-xs hover:bg-neuro-navy/90 transition-colors flex items-center gap-1.5"
                                    >
                                      {copiedId === item.id ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" /> Copied!
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" /> Copy
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom purchase CTA (if not purchased) */}
      {!loadingPurchase && !purchased && BILLING_SECTIONS.length > 0 && (
        <div className="bg-neuro-navy rounded-xl p-6 mt-8">
          <div className="text-center">
            <Zap className="w-8 h-8 text-neuro-orange mx-auto mb-3" />
            <p className="text-white font-black text-lg mb-1">
              Unlock the Complete Billing Toolkit
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {BILLING_SECTIONS.length} sections, {totalCodes} codes &amp; modifiers
              {totalLetters > 0 ? `, ${totalLetters} appeal letters` : ""}
              {totalTemplates > 0 ? `, ${totalTemplates} templates` : ""}.
              One-time purchase.
            </p>
            <button
              onClick={async () => {
                const result = await createDoctorProductCheckout('billing-guide', 'Insurance & Billing Toolkit', 3900);
                if (result.url) window.location.href = result.url;
                else alert(result.error);
              }}
              className="px-8 py-3 bg-neuro-orange text-white rounded-xl font-black text-sm hover:bg-neuro-orange/90 transition-colors"
            >
              Buy Now &mdash; $39
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
