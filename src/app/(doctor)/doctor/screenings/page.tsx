"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { createDoctorProductCheckout } from "../purchase-actions";
import {
  Target,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  Zap,
  Users,
  Network,
  ShoppingBag,
  ClipboardList,
  MessageSquare,
  Calculator,
  BarChart3,
  BookOpen,
} from "lucide-react";

let SCREENING_KIT: any = null;
try {
  const data = require("./screening-kit");
  SCREENING_KIT = data.SCREENING_KIT;
} catch {}

// Section metadata
const SECTION_META: Record<string, { icon: React.ElementType; color: string }> = {
  philosophy: { icon: BookOpen, color: "#e97325" },
  preEvent: { icon: ClipboardList, color: "#3b82f6" },
  screeningFlow: { icon: Target, color: "#22c55e" },
  materials: { icon: Copy, color: "#8b5cf6" },
  networkBuilder: { icon: Network, color: "#06b6d4" },
  vendorConnect: { icon: ShoppingBag, color: "#f43f5e" },
  followUp: { icon: MessageSquare, color: "#f59e0b" },
  roi: { icon: Calculator, color: "#10b981" },
  tracking: { icon: BarChart3, color: "#6366f1" },
};

function renderHighlighted(text: string) {
  const parts = text.split(/(\[[A-Z0-9_ /&'()!,.—-]+\])/g);
  return parts.map((part, i) =>
    /^\[.+\]$/.test(part) ? (
      <span key={i} className="bg-orange-100 text-orange-700 px-0.5 rounded font-bold">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-neuro-orange transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ScreeningsPage() {
  const [isPurchased, setIsPurchased] = useState(false);
  const [checking, setChecking] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) { setChecking(false); return; }
        const { data } = await (supabase as any)
          .from("course_purchases")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", "screening-mastery")
          .limit(1);
        if (data && data.length > 0) setIsPurchased(true);
      } catch {} finally {
        setChecking(false);
      }
    })();
  }, []);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleItem = (key: string) => {
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  if (!SCREENING_KIT) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Screening kit data is loading...</p>
      </div>
    );
  }

  const kit = SCREENING_KIT;
  const sectionKeys = Object.keys(kit.sections);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-neuro-orange/10 text-neuro-orange text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
          <Target className="w-3.5 h-3.5" />
          Premium Tool
        </div>
        <h1 className="text-3xl font-black text-neuro-navy mb-2">{kit.title}</h1>
        <p className="text-gray-500 max-w-lg mx-auto">{kit.subtitle}</p>
      </div>

      {/* Expected Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-xs text-gray-400 font-semibold uppercase mb-1">Screened/Event</div>
          <div className="text-xl font-black text-neuro-navy">{kit.expectedResults.screenedPerEvent}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-xs text-gray-400 font-semibold uppercase mb-1">Sign-Up Rate</div>
          <div className="text-xl font-black text-green-600">{kit.expectedResults.signUpRate}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-xs text-gray-400 font-semibold uppercase mb-1">Show Rate</div>
          <div className="text-xl font-black text-neuro-navy">{kit.expectedResults.showRate}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-xs text-gray-400 font-semibold uppercase mb-1">Case Accept</div>
          <div className="text-xl font-black text-neuro-orange">{kit.expectedResults.caseAcceptance}</div>
        </div>
      </div>

      {/* ROI Example */}
      <div className="bg-neuro-navy rounded-xl p-5 text-white mb-6 text-center">
        <div className="text-sm text-gray-400 mb-1">Example ROI</div>
        <div className="text-sm font-medium">{kit.expectedResults.exampleCalc}</div>
        <div className="text-xs text-neuro-orange font-bold mt-2">{kit.expectedResults.annualProjection}</div>
      </div>

      {/* Purchase Gate */}
      {!isPurchased && !checking && (
        <div className="bg-gradient-to-r from-neuro-navy to-[#2d3f5e] rounded-xl p-6 text-white text-center mb-8">
          <Lock className="w-8 h-8 text-neuro-orange mx-auto mb-3" />
          <h3 className="text-lg font-black mb-2">Unlock the Screening Event Mastery Kit</h3>
          <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
            Get the complete screening system with the 3-Build Philosophy, every script, printable forms, network builder, vendor connect, and follow-up sequences.
          </p>
          <button
            onClick={async () => {
              const result = await createDoctorProductCheckout("screening-mastery", "Screening Event Mastery Kit", 7900);
              if (result.url) window.location.href = result.url;
              else alert(result.error);
            }}
            className="px-8 py-3 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors"
          >
            $79 — Unlock Now
          </button>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {sectionKeys.map((key) => {
          const section = kit.sections[key];
          if (!section) return null;
          const isExpanded = expandedSections.includes(key);
          const meta = SECTION_META[key] || { icon: Zap, color: "#64748b" };
          const Icon = meta.icon;
          const hasItems = section.items && Array.isArray(section.items);
          const hasContent = section.content;
          const isLocked = !isPurchased && key !== "philosophy"; // Philosophy is free preview

          return (
            <div key={key} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => toggleSection(key)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: meta.color + "15", color: meta.color }}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-neuro-navy text-sm">{section.title}</div>
                  {hasItems && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {section.items.length} items
                    </div>
                  )}
                </div>
                {isLocked && <Lock className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </button>

              {/* Section content */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {isLocked ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      <Lock className="w-5 h-5 mx-auto mb-2 text-gray-300" />
                      Purchase to unlock this section
                    </div>
                  ) : hasContent ? (
                    <div className="p-4">
                      <div className="flex justify-end mb-2">
                        <CopyButton text={section.content} />
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                        {renderHighlighted(section.content)}
                      </pre>
                    </div>
                  ) : hasItems ? (
                    <div className="divide-y divide-gray-50">
                      {section.items.map((item: any, i: number) => {
                        const itemKey = `${key}-${i}`;
                        const itemExpanded = expandedItems.includes(itemKey);
                        return (
                          <div key={i}>
                            <button
                              onClick={() => toggleItem(itemKey)}
                              className="w-full flex items-center gap-3 p-3 pl-6 text-left hover:bg-gray-50 transition-colors"
                            >
                              <span className="text-xs font-mono text-gray-300 w-5">{i + 1}.</span>
                              <span className="flex-1 text-sm font-semibold text-neuro-navy">
                                {item.title}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold px-2 py-0.5 bg-gray-50 rounded">
                                {item.type}
                              </span>
                              {itemExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </button>
                            {itemExpanded && (
                              <div className="px-6 pb-4 pl-14">
                                <div className="flex justify-end mb-2">
                                  <CopyButton text={item.content} />
                                </div>
                                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">
                                  {renderHighlighted(item.content)}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      {!isPurchased && !checking && (
        <div className="text-center mt-10 mb-8">
          <button
            onClick={async () => {
              const result = await createDoctorProductCheckout("screening-mastery", "Screening Event Mastery Kit", 7900);
              if (result.url) window.location.href = result.url;
              else alert(result.error);
            }}
            className="px-10 py-4 bg-neuro-orange text-white font-bold rounded-xl text-lg hover:bg-neuro-orange/90 transition-colors"
          >
            Unlock for $79
          </button>
          <p className="text-xs text-gray-400 mt-2">One-time purchase. Lifetime access.</p>
        </div>
      )}
    </div>
  );
}
