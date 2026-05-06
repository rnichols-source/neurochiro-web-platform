"use client";

import { saveToolData, loadToolData } from "@/app/actions/tool-data";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Apple,
  Search,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Heart,
  Lock,
  Droplets,
  ShoppingCart,
  Flame,
  Loader2,
  Info,
} from "lucide-react";
import {
  SUPPLEMENTS,
  MEAL_IDEAS,
  SUPPLEMENT_CATEGORIES,
  INFLAMMATION_TRIGGERS,
  SHOPPING_LIST,
  type Supplement,
  type MealIdea,
} from "./supplement-data";
import { createClient } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StackItem {
  supplementId: string;
  dose: string;
  timing: "morning" | "midday" | "evening" | "bedtime";
  withFood: boolean;
}

interface LocalData {
  myStack: StackItem[];
  completions: Record<string, Record<string, boolean>>;
  savedMeals: string[];
  bodyWeight: number | null;
}

const STORAGE_KEY = "neurochiro-supplements";

const CATEGORY_COLORS: Record<string, string> = {
  inflammation: "#ef4444",
  "nervous-system": "#8b5cf6",
  gut: "#22c55e",
  energy: "#f59e0b",
  sleep: "#6366f1",
  immune: "#3b82f6",
  joint: "#e97325",
};

const TIMING_LABELS: Record<string, string> = {
  morning: "Morning Stack",
  midday: "Midday Stack",
  evening: "Evening Stack",
  bedtime: "Bedtime Stack",
};

const TIMING_ORDER = ["morning", "midday", "evening", "bedtime"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getDefaultData(): LocalData {
  return { myStack: [], completions: {}, savedMeals: [], bodyWeight: null };
}

function loadLocal(): LocalData {
  if (typeof window === "undefined") return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    return { ...getDefaultData(), ...JSON.parse(raw) };
  } catch {
    return getDefaultData();
  }
}

function dayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDay();
}

function getWeekDates(): string[] {
  const today = new Date();
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function getCategoryLabel(catId: string): string {
  return SUPPLEMENT_CATEGORIES.find((c) => c.id === catId)?.label || catId;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SupplementsPage() {
  const [activeTab, setActiveTab] = useState<
    "tracker" | "library" | "nutrition" | "meals"
  >("tracker");
  const [localData, setLocalData] = useState<LocalData>(getDefaultData);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from Supabase (localStorage fallback)
  useEffect(() => {
    loadToolData('supplements').then((cloud) => {
      if (cloud) {
        setLocalData({ ...getDefaultData(), ...cloud });
      } else {
        setLocalData(loadLocal());
      }
    }).catch(() => {
      setLocalData(loadLocal());
    });
  }, []);

  // Purchase check
  useEffect(() => {
    async function checkPurchase() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setPurchaseLoading(false);
          return;
        }
        const { data } = await (supabase as any)
          .from("course_purchases")
          .select("course_id")
          .eq("user_id", user.id)
          .eq("course_id", "patient-supplement-guide");
        if (data && data.length > 0) setHasPurchased(true);
      } catch {
        // fail silently
      }
      setPurchaseLoading(false);
    }
    checkPurchase();
  }, []);

  // Debounced save to Supabase + localStorage
  const persist = useCallback((data: LocalData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToolData('supplements', data).catch(() => {});
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
    }, 1000);
  }, []);

  const update = useCallback(
    (fn: (prev: LocalData) => LocalData) => {
      setLocalData((prev) => {
        const next = fn(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const tabs = [
    { key: "tracker" as const, label: "My Supplements" },
    { key: "library" as const, label: "Library" },
    { key: "nutrition" as const, label: "Nutrition" },
    { key: "meals" as const, label: "Meal Ideas" },
  ];

  if (purchaseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 text-[#D66829] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-white">
          Supplement & Nutrition Guide
        </h1>
        <p className="text-xs text-white/35 mt-1">
          Your personalized nutrition toolkit for faster results.
        </p>
      </header>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all shrink-0 ${
              activeTab === t.key
                ? "bg-[#D66829] text-white"
                : "bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.1]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "tracker" && (
        <TrackerTab localData={localData} update={update} />
      )}
      {activeTab === "library" && (
        <LibraryTab
          localData={localData}
          update={update}
          hasPurchased={hasPurchased}
        />
      )}
      {activeTab === "nutrition" && (
        <NutritionTab
          localData={localData}
          update={update}
          hasPurchased={hasPurchased}
        />
      )}
      {activeTab === "meals" && (
        <MealsTab
          localData={localData}
          update={update}
          hasPurchased={hasPurchased}
        />
      )}
    </div>
  );
}

// ===========================================================================
// TAB 1: My Supplements (Daily Tracker)
// ===========================================================================

function TrackerTab({
  localData,
  update,
}: {
  localData: LocalData;
  update: (fn: (prev: LocalData) => LocalData) => void;
}) {
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const today = todayStr();
  const todayCompletions = localData.completions[today] || {};
  const stack = localData.myStack;

  const toggleCompletion = (suppId: string) => {
    update((prev) => {
      const dayMap = { ...(prev.completions[today] || {}) };
      dayMap[suppId] = !dayMap[suppId];
      return { ...prev, completions: { ...prev.completions, [today]: dayMap } };
    });
  };

  const removeFromStack = (suppId: string) => {
    update((prev) => ({
      ...prev,
      myStack: prev.myStack.filter((s) => s.supplementId !== suppId),
    }));
  };

  const getStreak = (suppId: string): number => {
    let streak = 0;
    const d = new Date();
    if (localData.completions[todayStr()]?.[suppId]) {
      streak = 1;
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() - 1);
    }
    for (let i = 0; i < 365; i++) {
      const ds = d.toISOString().split("T")[0];
      if (localData.completions[ds]?.[suppId]) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const weekDates = getWeekDates();
  const totalPossible = stack.length * weekDates.filter((d) => d <= today).length;
  let totalTaken = 0;
  weekDates.forEach((d) => {
    if (d > today) return;
    const dayMap = localData.completions[d] || {};
    stack.forEach((s) => {
      if (dayMap[s.supplementId]) totalTaken++;
    });
  });
  const compliancePct =
    totalPossible > 0 ? Math.round((totalTaken / totalPossible) * 100) : 0;

  const bestStreak = stack.reduce(
    (max, s) => Math.max(max, getStreak(s.supplementId)),
    0
  );

  const getDayStatus = (
    dateStr: string
  ): "complete" | "partial" | "missed" | "future" => {
    if (dateStr > today) return "future";
    if (stack.length === 0) return "missed";
    const dayMap = localData.completions[dateStr] || {};
    const taken = stack.filter((s) => dayMap[s.supplementId]).length;
    if (taken === stack.length) return "complete";
    if (taken > 0) return "partial";
    return "missed";
  };

  const grouped: Record<string, StackItem[]> = {};
  TIMING_ORDER.forEach((t) => {
    const items = stack.filter((s) => s.timing === t);
    if (items.length > 0) grouped[t] = items;
  });

  if (stack.length === 0) {
    return (
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-8 text-center shadow-lg shadow-black/20">
        <Apple className="w-12 h-12 text-white/10 mx-auto mb-3" />
        <p className="text-white/30 font-medium">
          Add supplements from the Library tab to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829]">
        My Supplement Stack
      </h2>

      {/* Timing groups */}
      {TIMING_ORDER.map((timing) => {
        const items = grouped[timing];
        if (!items) return null;
        return (
          <div key={timing} className="space-y-3">
            <h3 className="text-[12px] font-medium text-white/60 uppercase tracking-wide">
              {TIMING_LABELS[timing]}
            </h3>
            {items.map((item) => {
              const supp = SUPPLEMENTS.find(
                (s) => s.id === item.supplementId
              );
              if (!supp) return null;
              const done = !!todayCompletions[item.supplementId];
              const streak = getStreak(item.supplementId);
              return (
                <div
                  key={item.supplementId}
                  className={`bg-[#162231] rounded-2xl border p-4 flex items-center gap-3 transition-all ${
                    done
                      ? "border-green-500/20 bg-green-500/[0.03]"
                      : "border-white/[0.08]"
                  }`}
                >
                  <button
                    onClick={() => toggleCompletion(item.supplementId)}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                      done
                        ? "bg-green-500 border-green-500"
                        : "border-white/20 hover:border-[#D66829]"
                    }`}
                  >
                    {done && <Check className="w-5 h-5 text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg" aria-hidden="true">
                        {supp.emoji}
                      </span>
                      <span className="font-bold text-white text-sm">
                        {supp.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-white/40">
                        {item.dose}
                      </span>
                      <span className="text-[10px] text-white/35">
                        {item.withFood ? "With food" : "Empty stomach"}
                      </span>
                    </div>
                    {streak > 0 && (
                      <p className="text-[11px] text-[#D66829] font-bold mt-1">
                        <Flame className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                        {streak} day streak
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => removeFromStack(item.supplementId)}
                    className="p-1 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-red-400 transition-all shrink-0"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Compliance bar */}
      <div className="bg-[#162231] rounded-2xl border border-white/[0.08] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">
            This week: {totalTaken}/{totalPossible} supplements taken (
            {compliancePct}%)
          </p>
        </div>
        <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              compliancePct >= 80
                ? "bg-gradient-to-r from-green-500 to-green-400"
                : compliancePct >= 50
                ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                : "bg-gradient-to-r from-red-500 to-red-400"
            }`}
            style={{ width: `${compliancePct}%` }}
          />
        </div>

        {/* Weekly calendar */}
        <div className="flex items-center justify-between gap-1">
          {weekDates.map((d) => {
            const status = getDayStatus(d);
            const dayLabel = new Date(d + "T12:00:00")
              .toLocaleDateString("en", { weekday: "short" })
              .slice(0, 3);
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    status === "complete"
                      ? "bg-green-500/10 text-green-400"
                      : status === "partial"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : status === "missed"
                      ? "bg-red-500/10 text-white/35"
                      : "bg-white/[0.04] text-white/20"
                  }`}
                >
                  {status === "complete" ? (
                    <Check className="w-4 h-4" />
                  ) : status === "partial" ? (
                    "~"
                  ) : status === "missed" ? (
                    <X className="w-3 h-3" />
                  ) : (
                    <span className="text-[8px]">&bull;</span>
                  )}
                </div>
                <span className="text-[10px] text-white/35">{dayLabel}</span>
              </div>
            );
          })}
        </div>

        {bestStreak > 0 && (
          <p className="text-sm text-white font-bold">
            <Flame className="w-4 h-4 inline -mt-0.5 mr-1 text-[#D66829]" />
            Your longest streak: {bestStreak} day{bestStreak !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-[#162231] rounded-2xl border border-white/[0.08]">
        <button
          onClick={() => setDisclaimerOpen(!disclaimerOpen)}
          className="w-full text-left p-4 flex items-center gap-2 text-sm text-white/35"
        >
          <Info className="w-4 h-4 shrink-0" />
          <span className="font-bold">Disclaimer</span>
          {disclaimerOpen ? (
            <ChevronDown className="w-4 h-4 ml-auto" />
          ) : (
            <ChevronRight className="w-4 h-4 ml-auto" />
          )}
        </button>
        {disclaimerOpen && (
          <div className="px-4 pb-4 text-xs text-white/35 leading-relaxed">
            Supplements work when you take them consistently. Missing a day here
            and there is normal &mdash; just get back on track the next day. These
            recommendations are general wellness guidelines and do not replace
            medical advice. Always talk to your doctor before starting any new
            supplement, especially if you take medications or have a medical
            condition.
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// TAB 2: Supplement Library
// ===========================================================================

function LibraryTab({
  localData,
  update,
  hasPurchased,
}: {
  localData: LocalData;
  update: (fn: (prev: LocalData) => LocalData) => void;
  hasPurchased: boolean;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const FREE_LIMIT = 4;

  const filtered = SUPPLEMENTS.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.whatItIs.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      categoryFilter === "all" || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const addToStack = (supp: Supplement) => {
    update((prev) => {
      if (prev.myStack.some((s) => s.supplementId === supp.id)) return prev;
      return {
        ...prev,
        myStack: [
          ...prev.myStack,
          {
            supplementId: supp.id,
            dose: supp.defaultDose,
            timing: supp.defaultTiming,
            withFood: supp.withFood,
          },
        ],
      };
    });
  };

  const isInStack = (id: string) =>
    localData.myStack.some((s) => s.supplementId === id);

  return (
    <div className="space-y-5">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829]">
        Supplement Library
      </h2>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search supplements..."
          className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:border-[#D66829]/40 outline-none"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SUPPLEMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              categoryFilter === cat.id
                ? "text-white"
                : "bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.1]"
            }`}
            style={
              categoryFilter === cat.id
                ? {
                    backgroundColor:
                      cat.id === "all"
                        ? "#D66829"
                        : CATEGORY_COLORS[cat.id] || "#D66829",
                  }
                : undefined
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Supplement cards */}
      <div className="space-y-3">
        {filtered.map((supp, idx) => {
          const globalIdx = SUPPLEMENTS.indexOf(supp);
          const locked = !hasPurchased && globalIdx >= FREE_LIMIT;
          const expanded = expandedId === supp.id && !locked;
          const summary = supp.whatItIs.split(".")[0] + ".";

          return (
            <div
              key={supp.id}
              className={`bg-[#162231] rounded-2xl border transition-all ${
                locked
                  ? "border-white/[0.08] opacity-75"
                  : "border-white/[0.08] hover:border-[#D66829]/20"
              }`}
            >
              <button
                onClick={() => !locked && setExpandedId(expanded ? null : supp.id)}
                className="w-full text-left p-4 flex items-start gap-3"
                disabled={locked}
              >
                <span className="text-2xl shrink-0" aria-hidden="true">
                  {supp.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-white text-sm">
                      {supp.name}
                    </span>
                    <span
                      className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[supp.category] || "#6b7280",
                      }}
                    >
                      {getCategoryLabel(supp.category)}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 line-clamp-1">
                    {summary}
                  </p>
                </div>
                {locked ? (
                  <Lock className="w-4 h-4 text-white/35 shrink-0 mt-1" />
                ) : expanded ? (
                  <ChevronDown className="w-5 h-5 text-white/20 shrink-0 mt-1" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-white/20 shrink-0 mt-1" />
                )}
              </button>

              {locked && (
                <div className="px-4 pb-4 -mt-1">
                  <PurchaseGate />
                </div>
              )}

              {expanded && (
                <div className="px-4 pb-5 border-t border-white/[0.06] pt-4 space-y-4">
                  <SectionBlock label="What It Is" text={supp.whatItIs} />
                  <div className="border-l-4 border-[#D66829] bg-[#D66829]/10 rounded-xl p-4">
                    <p className="text-xs font-black text-[#D66829] uppercase tracking-wide mb-1">
                      Why Your Chiropractor Recommends It
                    </p>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {supp.whyChiroRecommends}
                    </p>
                  </div>
                  <SectionBlock label="What It Does" text={supp.whatItDoes} />
                  <SectionBlock
                    label="Who Benefits Most"
                    text={supp.whoBenefits}
                  />
                  <SectionBlock label="How to Take It" text={supp.howToTake} />
                  <SectionBlock
                    label="What to Look For"
                    text={supp.whatToLookFor}
                  />
                  <SectionBlock
                    label="Common Concerns"
                    text={supp.commonConcerns}
                  />
                  <div>
                    <p className="text-xs font-black text-white/35 uppercase tracking-wide mb-1">
                      The Research
                    </p>
                    <p className="text-sm text-white/40 leading-relaxed italic">
                      {supp.research}
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 bg-green-500/10 rounded-xl p-4">
                    <p className="text-xs font-black text-green-400 uppercase tracking-wide mb-1">
                      Signs It&apos;s Working
                    </p>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {supp.signsWorking}
                    </p>
                  </div>
                  <SectionBlock
                    label="Signs You Might Need This"
                    text={supp.signsYouNeed}
                  />

                  {isInStack(supp.id) ? (
                    <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                      <Check className="w-5 h-5" />
                      Added to My Stack
                    </div>
                  ) : (
                    <button
                      onClick={() => addToStack(supp)}
                      className="px-5 py-3 bg-[#D66829] text-white rounded-xl font-bold text-sm hover:bg-[#e8834a] transition-all flex items-center gap-2 shadow-lg shadow-[#D66829]/20"
                    >
                      <Plus className="w-4 h-4" />
                      Add to My Stack
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-black text-white/35 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm text-white/60 leading-relaxed">{text}</p>
    </div>
  );
}

function PurchaseGate() {
  return (
    <div className="flex items-center gap-2 text-xs text-white/35">
      <Lock className="w-3 h-3" />
      <span>$9.99 &mdash; Unlock Full Guide</span>
    </div>
  );
}

// ===========================================================================
// TAB 3: Nutrition Basics
// ===========================================================================

function NutritionTab({
  localData,
  update,
  hasPurchased,
}: {
  localData: LocalData;
  update: (fn: (prev: LocalData) => LocalData) => void;
  hasPurchased: boolean;
}) {
  const [weight, setWeight] = useState<string>(
    localData.bodyWeight ? String(localData.bodyWeight) : ""
  );

  const saveWeight = (val: string) => {
    setWeight(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      update((prev) => ({ ...prev, bodyWeight: num }));
    }
  };

  const waterOz = weight ? Math.round(parseInt(weight, 10) / 2) : null;

  const MINIMIZE_FOODS = [
    "Fried foods and fast food",
    "Sugary drinks (soda, sweet tea, juice with added sugar)",
    "White bread, pasta, and pastries",
    "Processed meats (hot dogs, deli meat with nitrates)",
    "Candy, cookies, and cake",
    "Margarine and shortening",
    "Excessive alcohol",
    "Artificial sweeteners",
    "Packaged snacks with long ingredient lists",
  ];

  return (
    <div className="space-y-5">
      {/* Section 1: Inflammation Connection */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-5 space-y-4 shadow-lg shadow-black/20">
        <h3 className="font-black text-white text-lg">
          The Inflammation Connection
        </h3>
        <p className="text-[13px] text-white/45 leading-relaxed">
          Chiropractic adjustments correct your structure. But your body also needs
          the right fuel to heal, rebuild, and hold those corrections. When
          inflammation is high, your muscles stay tight, your nerves stay irritated,
          and your progress slows down. Nutrition is the missing piece that
          accelerates everything.
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-500/10 rounded-xl p-3">
            <p className="text-sm font-black text-blue-400">Adjustments</p>
            <p className="text-[10px] text-blue-400/70 mt-1">
              Structural Healing
            </p>
          </div>
          <div className="bg-green-500/10 rounded-xl p-3 flex flex-col items-center justify-center">
            <p className="text-sm font-black text-green-400">Nutrition</p>
            <p className="text-[10px] text-green-400/70 mt-1">Chemical Healing</p>
          </div>
          <div className="bg-[#D66829]/10 rounded-xl p-3 flex flex-col items-center justify-center">
            <p className="text-lg font-black text-[#D66829]">=</p>
            <p className="text-[10px] text-[#D66829] font-bold mt-0.5">
              Faster Results
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: 5 Inflammation Triggers */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-5 space-y-4 shadow-lg shadow-black/20">
        <h3 className="font-black text-white text-lg flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-400" />
          The 5 Inflammation Triggers
        </h3>
        <div className="space-y-3">
          {INFLAMMATION_TRIGGERS.map((trigger, i) => (
            <div
              key={i}
              className="border border-white/[0.08] rounded-xl p-4 space-y-2"
            >
              <h4 className="font-bold text-white text-sm">
                {i + 1}. {trigger.title}
              </h4>
              <p className="text-xs text-white/50 leading-relaxed">
                {trigger.description}
              </p>
              <div className="bg-green-500/10 rounded-lg p-3">
                <p className="text-xs font-bold text-green-400 mb-0.5">
                  What to Do
                </p>
                <p className="text-xs text-green-400/80 leading-relaxed">
                  {trigger.whatToDo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sections 3-6: locked unless purchased */}
      {!hasPurchased ? (
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-8 text-center relative shadow-lg shadow-black/20">
          <Lock className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <h3 className="font-black text-white mb-2">
            Unlock the Full Nutrition Guide
          </h3>
          <p className="text-sm text-white/40 mb-4">
            The Anti-Inflammatory Plate, hydration calculator, shopping list, and
            more.
          </p>
          <p className="text-white font-bold mb-4">$9.99 one-time purchase</p>
          <button onClick={async () => { const { createPremiumCheckout } = await import("../premium-actions"); const r = await createPremiumCheckout(); if (r?.url) window.location.href = r.url; }} className="px-6 py-3 bg-[#D66829] text-white rounded-xl font-bold text-sm hover:bg-[#e8834a] transition-all shadow-lg shadow-[#D66829]/20">
            Unlock Full Guide
          </button>
        </div>
      ) : (
        <>
          {/* Section 3: Anti-Inflammatory Plate */}
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-5 space-y-4 shadow-lg shadow-black/20">
            <h3 className="font-black text-white text-lg">
              The Anti-Inflammatory Plate
            </h3>
            <p className="text-[13px] text-white/45 leading-relaxed">
              Build every meal around this simple template for balanced,
              inflammation-fighting nutrition.
            </p>
            <div className="relative w-full max-w-xs mx-auto aspect-square">
              <div className="w-full h-full rounded-full border-4 border-white/[0.08] overflow-hidden relative">
                <div className="absolute inset-0 bottom-1/2 bg-green-500/15 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-black text-green-400">50%</p>
                    <p className="text-xs font-bold text-green-400/70">
                      Vegetables
                    </p>
                  </div>
                </div>
                <div className="absolute left-0 right-1/2 top-1/2 bottom-0 bg-blue-500/15 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-black text-blue-400">25%</p>
                    <p className="text-[10px] font-bold text-blue-400/70">
                      Protein
                    </p>
                  </div>
                </div>
                <div className="absolute left-1/2 right-0 top-1/2 bottom-0 bg-[#D66829]/15 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-black text-[#D66829]">25%</p>
                    <p className="text-[10px] font-bold text-[#D66829]/70">
                      Fats/Carbs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Hydration Rule */}
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-5 space-y-4 shadow-lg shadow-black/20">
            <h3 className="font-black text-white text-lg flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-400" />
              Hydration Rule
            </h3>
            <p className="text-[13px] text-white/45 leading-relaxed">
              Your discs are 80% water. Dehydrated discs compress nerves, slow
              healing, and make adjustments harder to hold.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={weight}
                onChange={(e) => saveWeight(e.target.value)}
                placeholder="Your weight (lbs)"
                className="w-40 px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:border-[#D66829]/40 outline-none"
              />
              {waterOz && waterOz > 0 && (
                <div className="bg-blue-500/10 rounded-xl px-4 py-3">
                  <p className="text-sm font-black text-blue-400">
                    {waterOz} oz/day
                  </p>
                  <p className="text-[10px] text-blue-400/70">Your target</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Shopping list */}
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-5 space-y-4 shadow-lg shadow-black/20">
            <h3 className="font-black text-white text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-400" />
              Foods That Fight Inflammation
            </h3>
            {Object.entries(SHOPPING_LIST).map(([category, items]) => (
              <div key={category}>
                <p className="text-xs font-black text-white/35 uppercase tracking-wide mb-2">
                  {category}
                </p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 py-1 text-sm text-white/60"
                    >
                      <div className="w-4 h-4 rounded border border-white/20 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Section 6: Foods to Minimize */}
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-5 space-y-3 shadow-lg shadow-black/20">
            <h3 className="font-black text-white text-lg">
              Foods to Minimize
            </h3>
            <p className="text-[13px] text-white/40">
              You don&apos;t have to eliminate everything &mdash; just be mindful of
              how often these show up.
            </p>
            <div className="space-y-1">
              {MINIMIZE_FOODS.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 py-1 text-sm text-white/60"
                >
                  <X className="w-3 h-3 text-red-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ===========================================================================
// TAB 4: Meal Ideas
// ===========================================================================

function MealsTab({
  localData,
  update,
  hasPurchased,
}: {
  localData: LocalData;
  update: (fn: (prev: LocalData) => LocalData) => void;
  hasPurchased: boolean;
}) {
  const FREE_PER_CATEGORY = 2;
  const categories: Array<{
    key: MealIdea["category"];
    label: string;
  }> = [
    { key: "breakfast", label: "Breakfast" },
    { key: "lunch", label: "Lunch" },
    { key: "dinner", label: "Dinner" },
    { key: "snack", label: "Snacks" },
  ];

  const toggleSaved = (mealId: string) => {
    update((prev) => {
      const saved = prev.savedMeals.includes(mealId)
        ? prev.savedMeals.filter((id) => id !== mealId)
        : [...prev.savedMeals, mealId];
      return { ...prev, savedMeals: saved };
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829]">
        Anti-Inflammatory Meal Ideas
      </h2>

      {categories.map((cat) => {
        const meals = MEAL_IDEAS.filter((m) => m.category === cat.key);
        return (
          <div key={cat.key} className="space-y-3">
            <h3 className="text-[12px] font-medium text-white/60 uppercase tracking-wide">
              {cat.label}
            </h3>
            {meals.map((meal, idx) => {
              const locked = !hasPurchased && idx >= FREE_PER_CATEGORY;
              const isSaved = localData.savedMeals.includes(meal.id);

              if (locked) {
                return (
                  <div
                    key={meal.id}
                    className="bg-[#162231] rounded-2xl border border-white/[0.08] p-4 opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-white/35 shrink-0" />
                      <div>
                        <p className="font-bold text-white/35 text-sm">
                          {meal.title}
                        </p>
                        <PurchaseGate />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={meal.id}
                  className="bg-[#162231] rounded-2xl border border-white/[0.08] p-4 space-y-3 hover:border-[#D66829]/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {meal.title}
                      </h4>
                      <span className="inline-block mt-1 text-[10px] font-bold text-[#D66829] bg-[#D66829]/10 px-2 py-0.5 rounded-full">
                        {meal.prepTime}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleSaved(meal.id)}
                      className={`p-2 rounded-lg transition-all shrink-0 ${
                        isSaved
                          ? "text-red-400 bg-red-500/10"
                          : "text-white/20 hover:text-red-400 hover:bg-red-500/10"
                      }`}
                      title={isSaved ? "Unsave" : "Save"}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={isSaved ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {meal.description}
                  </p>
                  <ul className="space-y-1">
                    {meal.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        className="text-xs text-white/40 flex items-start gap-2"
                      >
                        <span className="text-[#D66829] mt-0.5 shrink-0">
                          &bull;
                        </span>
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
