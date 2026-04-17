"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  Presentation,
  Copy,
  Check,
  Edit3,
  X,
  ChevronDown,
  ChevronRight,
  Lock,
  Zap,
  Users,
  Calendar,
  DollarSign,
  Utensils,
  RefreshCw,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Kit types                                                          */
/* ------------------------------------------------------------------ */

interface KitExpectedResults {
  attendees: string;
  signUpRate: string;
  showRate: string;
  caseAcceptance: string;
  exampleCalc: string;
}

interface SectionItem {
  title: string;
  type: string;
  content: string;
}

interface KitSections {
  preEvent: { title: string; items: SectionItem[] };
  presentation: { title: string; content: string };
  materials: { title: string; items: SectionItem[] };
  postEvent: { title: string; items: SectionItem[] };
  tracking: { title: string; content: string };
}

interface Kit {
  id: string;
  title: string;
  subtitle: string;
  audience: string;
  price: number;
  format: string;
  expectedResults: KitExpectedResults;
  sections: KitSections;
}

/* ------------------------------------------------------------------ */
/*  Lazy-load kits (try/catch in case files missing)                   */
/* ------------------------------------------------------------------ */

let KIT_1: Kit | null = null;
let KIT_2: Kit | null = null;
let KIT_3: Kit | null = null;
let KIT_4: Kit | null = null;
let KIT_5: Kit | null = null;

try {
  const k1 = require("./workshop-kit1");
  KIT_1 = k1.KIT_1;
} catch {}
try {
  const k23 = require("./workshop-kits23");
  KIT_2 = k23.KIT_2;
  KIT_3 = k23.KIT_3;
} catch {}
try {
  const k45 = require("./workshop-kits45");
  KIT_4 = k45.KIT_4;
  KIT_5 = k45.KIT_5;
} catch {}

const ALL_KITS: Kit[] = [KIT_1, KIT_2, KIT_3, KIT_4, KIT_5].filter(
  Boolean
) as Kit[];

/* ------------------------------------------------------------------ */
/*  Kit icon mapping                                                   */
/* ------------------------------------------------------------------ */

const KIT_ICONS: Record<string, React.ElementType> = {
  "kit-dinner": Utensils,
  "kit-reactivation": RefreshCw,
};

function getKitIcon(id: string) {
  return KIT_ICONS[id] || Presentation;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Count items across the pre-event, materials, and post-event sections */
function countKitContents(kit: Kit) {
  const marketingCount = kit.sections.preEvent.items.length;
  const followUpCount = kit.sections.postEvent.items.length;
  return { marketingCount, followUpCount };
}

/** Highlight [PLACEHOLDER] tokens */
function renderHighlighted(text: string) {
  const parts = text.split(/(\[[A-Z0-9_ /&'()!,.—-]+\])/g);
  return parts.map((part, i) =>
    /^\[.+\]$/.test(part) ? (
      <span key={i} className="bg-orange-100 text-orange-700 px-0.5 rounded font-bold">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/* ------------------------------------------------------------------ */
/*  Section keys (for accordion)                                       */
/* ------------------------------------------------------------------ */

type SectionKey = "preEvent" | "presentation" | "materials" | "postEvent" | "tracking";

const SECTION_ORDER: { key: SectionKey; label: string }[] = [
  { key: "preEvent", label: "Pre-Event Marketing" },
  { key: "presentation", label: "The Presentation" },
  { key: "materials", label: "Materials & Setup" },
  { key: "postEvent", label: "Post-Event Follow-Up" },
  { key: "tracking", label: "Conversion Tracking" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function WorkshopsPage() {
  /* ---------- state ---------- */
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [caseValue, setCaseValue] = useState(2500);

  /* ---------- purchase check ---------- */
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      try {
        const { data } = await (supabase as any)
          .from("course_purchases")
          .select("course_id")
          .eq("user_id", user.id);
        setPurchasedIds((data || []).map((r: any) => r.course_id));
      } catch {}
    });
  }, []);

  const hasBundled = purchasedIds.includes("workshop-bundle");

  const isUnlocked = (kitId: string) =>
    hasBundled || purchasedIds.includes(kitId);

  /* ---------- ROI calc ---------- */
  const roiLow = Math.round(15 * 0.6 * 0.5 * 0.4 * caseValue);
  const roiHigh = Math.round(30 * 0.8 * 0.7 * 0.6 * caseValue);

  /* ---------- selected kit ---------- */
  const selectedKit = useMemo(
    () => ALL_KITS.find((k) => k.id === selectedKitId) ?? null,
    [selectedKitId]
  );

  /* ---------- bundle pricing ---------- */
  const totalIndividual = ALL_KITS.reduce((s, k) => s + k.price, 0);

  /* ---------- helpers ---------- */
  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCopy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleEdit = (key: string, text: string) => {
    setEditingKey(key);
    setEditContent(text);
  };

  const handleCopyEdited = async (key: string) => {
    await navigator.clipboard.writeText(editContent);
    setCopiedKey(key);
    setEditingKey(null);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  /* ================================================================ */
  /*  KIT DETAIL VIEW                                                  */
  /* ================================================================ */

  if (selectedKit) {
    const unlocked = isUnlocked(selectedKit.id);

    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => {
            setSelectedKitId(null);
            setExpandedSections(new Set());
            setEditingKey(null);
          }}
          className="text-sm font-bold text-gray-400 hover:text-neuro-navy mb-6 flex items-center gap-1 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to All Kits
        </button>

        {/* Kit header */}
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-black text-neuro-navy">
            {selectedKit.title}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{selectedKit.subtitle}</p>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> {selectedKit.audience}
            </span>
            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {selectedKit.format}
            </span>
          </div>
        </div>

        {/* Expected results */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-green-800 text-sm mb-2">Expected Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-green-600 font-bold block">Attendees</span>
              <span className="text-green-900 font-black text-lg">{selectedKit.expectedResults.attendees}</span>
            </div>
            <div>
              <span className="text-green-600 font-bold block">Sign-Up Rate</span>
              <span className="text-green-900 font-black text-lg">{selectedKit.expectedResults.signUpRate}</span>
            </div>
            <div>
              <span className="text-green-600 font-bold block">Show Rate</span>
              <span className="text-green-900 font-black text-lg">{selectedKit.expectedResults.showRate}</span>
            </div>
            <div>
              <span className="text-green-600 font-bold block">Case Acceptance</span>
              <span className="text-green-900 font-black text-lg">{selectedKit.expectedResults.caseAcceptance}</span>
            </div>
          </div>
          <p className="text-green-700 text-xs mt-3 leading-relaxed">{selectedKit.expectedResults.exampleCalc}</p>
        </div>

        {/* Purchase gate banner */}
        {!unlocked && (
          <div className="bg-neuro-navy rounded-xl p-5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-white font-bold">Unlock this kit to access all content</p>
              <p className="text-gray-400 text-xs">Preview available below — purchase to copy and customize.</p>
            </div>
            <button className="px-6 py-3 bg-neuro-orange text-white rounded-xl font-black text-sm hover:bg-neuro-orange/90 transition-colors whitespace-nowrap flex items-center gap-2">
              <Lock className="w-4 h-4" /> Unlock Kit — ${selectedKit.price}
            </button>
          </div>
        )}

        {/* Accordion sections */}
        <div className="space-y-3">
          {SECTION_ORDER.map(({ key, label }) => {
            const isOpen = expandedSections.has(key);
            const section = selectedKit.sections[key];

            return (
              <div key={key} className="bg-white rounded-xl border border-gray-100">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full text-left p-5 flex items-center justify-between"
                >
                  <h3 className="font-bold text-neuro-navy text-sm">{label}</h3>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-300 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 p-5">
                    {/* Sections with items array: preEvent, materials, postEvent */}
                    {(key === "preEvent" || key === "materials" || key === "postEvent") && (
                      <div className="space-y-4">
                        {(section as { title: string; items: SectionItem[] }).items.map(
                          (item, idx) => {
                            const itemKey = `${selectedKit.id}-${key}-${idx}`;
                            const isItemEditing = editingKey === itemKey;
                            const showFullContent = unlocked;
                            const previewText =
                              item.content.slice(0, 200) +
                              (item.content.length > 200 ? "..." : "");

                            return (
                              <div
                                key={idx}
                                className="bg-gray-50 rounded-xl p-4"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-sm text-neuro-navy">
                                    {item.title}
                                  </h4>
                                  <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded">
                                    {item.type}
                                  </span>
                                </div>
                                {showFullContent ? (
                                  isItemEditing ? (
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-gray-500">
                                          Customize before copying
                                        </p>
                                        <button
                                          onClick={() => setEditingKey(null)}
                                          className="text-gray-400 hover:text-gray-600"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <textarea
                                        value={editContent}
                                        onChange={(e) =>
                                          setEditContent(e.target.value)
                                        }
                                        className="w-full h-64 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange resize-y font-mono leading-relaxed"
                                      />
                                      <button
                                        onClick={() =>
                                          handleCopyEdited(itemKey)
                                        }
                                        className="px-4 py-2 bg-neuro-orange text-white rounded-lg font-bold text-xs hover:bg-neuro-orange/90 transition-colors flex items-center gap-1.5"
                                      >
                                        {copiedKey === itemKey ? (
                                          <>
                                            <Check className="w-3.5 h-3.5" />{" "}
                                            Copied!
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3.5 h-3.5" />{" "}
                                            Copy Customized
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed mb-3">
                                        {renderHighlighted(item.content)}
                                      </pre>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() =>
                                            handleCopy(itemKey, item.content)
                                          }
                                          className="px-3 py-1.5 bg-neuro-navy text-white rounded-lg font-bold text-[10px] hover:bg-neuro-navy/90 transition-colors flex items-center gap-1"
                                        >
                                          {copiedKey === itemKey ? (
                                            <>
                                              <Check className="w-3 h-3" />{" "}
                                              Copied!
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3 h-3" /> Copy
                                            </>
                                          )}
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleEdit(itemKey, item.content)
                                          }
                                          className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg font-bold text-[10px] hover:bg-white transition-colors flex items-center gap-1"
                                        >
                                          <Edit3 className="w-3 h-3" />{" "}
                                          Customize
                                        </button>
                                      </div>
                                    </div>
                                  )
                                ) : (
                                  <div className="relative overflow-hidden">
                                    <pre className="whitespace-pre-wrap text-sm text-gray-400 font-sans leading-relaxed">
                                      {previewText}
                                    </pre>
                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}

                    {/* Sections with single content string: presentation, tracking */}
                    {(key === "presentation" || key === "tracking") && (() => {
                      const contentSection = section as { title: string; content: string };
                      const contentKey = `${selectedKit.id}-${key}`;
                      const isContentEditing = editingKey === contentKey;
                      const showFull = unlocked;
                      const firstSection = contentSection.content.slice(0, 400) + "...";

                      return showFull ? (
                        isContentEditing ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-gray-500">
                                Customize before copying
                              </p>
                              <button
                                onClick={() => setEditingKey(null)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full h-96 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange resize-y font-mono leading-relaxed"
                            />
                            <button
                              onClick={() => handleCopyEdited(contentKey)}
                              className="px-4 py-2 bg-neuro-orange text-white rounded-lg font-bold text-xs hover:bg-neuro-orange/90 transition-colors flex items-center gap-1.5"
                            >
                              {copiedKey === contentKey ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" /> Copy
                                  Customized
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="bg-gray-50 rounded-xl p-5 mb-3 max-h-[600px] overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                                {renderHighlighted(contentSection.content)}
                              </pre>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleCopy(contentKey, contentSection.content)
                                }
                                className="px-4 py-2 bg-neuro-navy text-white rounded-lg font-bold text-xs hover:bg-neuro-navy/90 transition-colors flex items-center gap-1.5"
                              >
                                {copiedKey === contentKey ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" /> Copy
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleEdit(contentKey, contentSection.content)
                                }
                                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold text-xs hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Customize
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="relative overflow-hidden">
                          <div className="bg-gray-50 rounded-xl p-5">
                            <pre className="whitespace-pre-wrap text-sm text-gray-400 font-sans leading-relaxed">
                              {firstSection}
                            </pre>
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <button className="px-5 py-2.5 bg-neuro-orange text-white rounded-lg font-bold text-xs hover:bg-neuro-orange/90 transition-colors flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" /> Unlock Kit — $
                              {selectedKit.price}
                            </button>
                            <span className="text-xs text-gray-400">
                              or get all 5 kits for $149
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  MAIN GRID VIEW                                                   */
  /* ================================================================ */

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-black text-neuro-navy flex items-center gap-3">
          <Presentation className="w-7 h-7 text-neuro-orange" /> Workshop-in-a-Box
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Everything you need to run a profitable community workshop. Pick a kit, customize it, fill your schedule.
        </p>
      </div>

      {/* ROI Calculator */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-neuro-navy text-sm mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-neuro-orange" /> Workshop ROI Calculator
        </h2>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-500">
                Average Case Value
              </label>
              <span className="text-sm font-black text-neuro-navy">
                ${caseValue.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={5000}
              step={100}
              value={caseValue}
              onChange={(e) => setCaseValue(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-neuro-orange"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>$1,000</span>
              <span>$5,000</span>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-xs text-green-600 font-bold mb-1">
              One workshop could generate
            </p>
            <p className="text-2xl font-black text-green-800">
              ${roiLow.toLocaleString()} &mdash; ${roiHigh.toLocaleString()}
            </p>
            <p className="text-[10px] text-green-500 mt-1">in new patient revenue</p>
          </div>
        </div>
      </div>

      {/* Bundle CTA */}
      {!hasBundled && (
        <div className="bg-neuro-navy rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-neuro-orange" />
                <span className="text-xs font-black uppercase tracking-widest text-neuro-orange">
                  Best Value
                </span>
              </div>
              <h2 className="text-xl font-black text-white mb-1">
                Workshop Mastery System &mdash; All 5 Kits
              </h2>
              <p className="text-gray-400 text-sm">
                Every workshop kit, every script, every follow-up template. Use forever.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-3xl font-black text-white">$149</span>
                <span className="text-gray-400 line-through">
                  ${totalIndividual}
                </span>
                <span className="bg-neuro-orange/20 text-neuro-orange text-xs font-black px-2 py-0.5 rounded-full">
                  Save ${totalIndividual - 149}
                </span>
              </div>
            </div>
            <button className="px-6 py-3 bg-neuro-orange text-white rounded-xl font-black text-sm hover:bg-neuro-orange/90 transition-colors whitespace-nowrap">
              Get All 5 Kits &mdash; $149
            </button>
          </div>
        </div>
      )}

      {/* Kit Cards Grid */}
      {ALL_KITS.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 font-bold">
            Workshop kits are being loaded. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_KITS.map((kit) => {
            const unlocked = isUnlocked(kit.id);
            const { marketingCount, followUpCount } = countKitContents(kit);
            const Icon = getKitIcon(kit.id);

            return (
              <div
                key={kit.id}
                className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-neuro-orange/10 text-neuro-orange flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-neuro-navy text-sm leading-tight">
                        {kit.title}
                      </h3>
                      <p className="text-[10px] font-bold text-neuro-orange mt-0.5">
                        {kit.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{kit.audience}</span>
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      {kit.format}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      What&apos;s Included
                    </p>
                    <p className="text-xs text-gray-600">
                      {marketingCount} marketing template{marketingCount !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-gray-600">
                      Full presenter script
                    </p>
                    <p className="text-xs text-gray-600">
                      {kit.sections.materials.items.length} material{kit.sections.materials.items.length !== 1 ? "s" : ""} &amp; setup guide{kit.sections.materials.items.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-gray-600">
                      {followUpCount} follow-up message{followUpCount !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-gray-600">Conversion tracker</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 p-4">
                  {unlocked ? (
                    <button
                      onClick={() => setSelectedKitId(kit.id)}
                      className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg font-bold text-xs hover:bg-green-600 transition-colors"
                    >
                      Open Kit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedKitId(kit.id)}
                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-bold text-xs hover:bg-gray-50 transition-colors"
                      >
                        Preview
                      </button>
                      <button className="flex-1 px-4 py-2.5 bg-neuro-orange text-white rounded-lg font-bold text-xs hover:bg-neuro-orange/90 transition-colors flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> Unlock ${kit.price}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom note */}
      <div className="mt-8 text-center">
        <p className="text-[10px] text-gray-300 max-w-lg mx-auto leading-relaxed">
          All templates include [BRACKETED PLACEHOLDERS] highlighted in orange for easy customization. Replace all placeholders with your specific information before use.
        </p>
      </div>
    </div>
  );
}
