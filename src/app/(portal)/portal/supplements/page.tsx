"use client";

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
  return d.getDay(); // 0=Sun
}

function getWeekDates(): string[] {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
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

  // Load from localStorage
  useEffect(() => {
    setLocalData(loadLocal());
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

  // Debounced save
  const persist = useCallback((data: LocalData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // storage full
      }
    }, 500);
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
        <Loader2 className="w-8 h-8 text-neuro-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          Supplement & Nutrition Guide
        </h1>
        <p className="text-gray-500 mt-1">
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
                ? "bg-neuro-navy text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-neuro-orange/30"
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

  // Streak calculation for a supplement
  const getStreak = (suppId: string): number => {
    let streak = 0;
    const d = new Date();
    // Check today first
    if (localData.completions[todayStr()]?.[suppId]) {
      streak = 1;
      d.setDate(d.getDate() - 1);
    } else {
      // if not completed today, check from yesterday
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

  // Weekly compliance
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

  // Best streak across all supplements
  const bestStreak = stack.reduce(
    (max, s) => Math.max(max, getStreak(s.supplementId)),
    0
  );

  // Weekly day status
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

  // Group by timing
  const grouped: Record<string, StackItem[]> = {};
  TIMING_ORDER.forEach((t) => {
    const items = stack.filter((s) => s.timing === t);
    if (items.length > 0) grouped[t] = items;
  });

  if (stack.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <Apple className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">
          Add supplements from the Library tab to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-neuro-navy">
        My Supplement Stack <span aria-hidden="true">💊</span>
      </h2>

      {/* Timing groups */}
      {TIMING_ORDER.map((timing) => {
        const items = grouped[timing];
        if (!items) return null;
        return (
          <div key={timing} className="space-y-3">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wide">
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
                  className={`bg-white rounded-2xl border p-4 flex items-center gap-3 transition-all ${
                    done
                      ? "border-green-200 bg-green-50/30"
                      : "border-gray-100"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleCompletion(item.supplementId)}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                      done
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 hover:border-neuro-orange"
                    }`}
                  >
                    {done && <Check className="w-5 h-5 text-white" />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg" aria-hidden="true">
                        {supp.emoji}
                      </span>
                      <span className="font-bold text-neuro-navy text-sm">
                        {supp.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {item.dose}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {item.withFood ? "With food" : "Empty stomach"}
                      </span>
                    </div>
                    {streak > 0 && (
                      <p className="text-[11px] text-neuro-orange font-bold mt-1">
                        <Flame className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                        {streak} day streak
                      </p>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromStack(item.supplementId)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-red-400 transition-all shrink-0"
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
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-neuro-navy">
            This week: {totalTaken}/{totalPossible} supplements taken (
            {compliancePct}%)
          </p>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              compliancePct >= 80
                ? "bg-green-500"
                : compliancePct >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
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
                      ? "bg-green-100 text-green-600"
                      : status === "partial"
                      ? "bg-yellow-100 text-yellow-600"
                      : status === "missed"
                      ? "bg-red-50 text-gray-400"
                      : "bg-gray-50 text-gray-300"
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
                <span className="text-[10px] text-gray-400">{dayLabel}</span>
              </div>
            );
          })}
        </div>

        {bestStreak > 0 && (
          <p className="text-sm text-neuro-navy font-bold">
            <Flame className="w-4 h-4 inline -mt-0.5 mr-1 text-neuro-orange" />
            Your longest streak: {bestStreak} day{bestStreak !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <button
          onClick={() => setDisclaimerOpen(!disclaimerOpen)}
          className="w-full text-left p-4 flex items-center gap-2 text-sm text-gray-400"
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
          <div className="px-4 pb-4 text-xs text-gray-400 leading-relaxed">
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
      <h2 className="text-xl font-black text-neuro-navy">
        Supplement Library
      </h2>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search supplements..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-neuro-orange/50 bg-white"
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
                : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
            style={
              categoryFilter === cat.id
                ? {
                    backgroundColor:
                      cat.id === "all"
                        ? "#1e293b"
                        : CATEGORY_COLORS[cat.id] || "#1e293b",
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
              className={`bg-white rounded-2xl border transition-all ${
                locked
                  ? "border-gray-100 opacity-75"
                  : "border-gray-100 hover:border-neuro-orange/30"
              }`}
            >
              {/* Collapsed header */}
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
                    <span className="font-bold text-neuro-navy text-sm">
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
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {summary}
                  </p>
                </div>
                {locked ? (
                  <Lock className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                ) : expanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
                )}
              </button>

              {/* Lock message */}
              {locked && (
                <div className="px-4 pb-4 -mt-1">
                  <PurchaseGate />
                </div>
              )}

              {/* Expanded content */}
              {expanded && (
                <div className="px-4 pb-5 border-t border-gray-50 pt-4 space-y-4">
                  <SectionBlock label="What It Is" text={supp.whatItIs} />
                  <div className="border-l-4 border-neuro-orange bg-orange-50 rounded-xl p-4">
                    <p className="text-xs font-black text-neuro-orange uppercase tracking-wide mb-1">
                      Why Your Chiropractor Recommends It
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
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
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-1">
                      The Research
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed italic">
                      {supp.research}
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 bg-green-50 rounded-xl p-4">
                    <p className="text-xs font-black text-green-600 uppercase tracking-wide mb-1">
                      Signs It&apos;s Working
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {supp.signsWorking}
                    </p>
                  </div>
                  <SectionBlock
                    label="Signs You Might Need This"
                    text={supp.signsYouNeed}
                  />

                  {/* Add to stack */}
                  {isInStack(supp.id) ? (
                    <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                      <Check className="w-5 h-5" />
                      Added to My Stack
                    </div>
                  ) : (
                    <button
                      onClick={() => addToStack(supp)}
                      className="px-5 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm hover:bg-neuro-orange/90 transition-all flex items-center gap-2"
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
      <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}

function PurchaseGate() {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
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
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-black text-neuro-navy text-lg">
          The Inflammation Connection
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          Chiropractic adjustments correct your structure. But your body also needs
          the right fuel to heal, rebuild, and hold those corrections. When
          inflammation is high, your muscles stay tight, your nerves stay irritated,
          and your progress slows down. Nutrition is the missing piece that
          accelerates everything.
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-sm font-black text-blue-700">Adjustments</p>
            <p className="text-[10px] text-blue-500 mt-1">
              Structural Healing
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 flex flex-col items-center justify-center">
            <p className="text-sm font-black text-green-700">Nutrition</p>
            <p className="text-[10px] text-green-500 mt-1">Chemical Healing</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 flex flex-col items-center justify-center">
            <p className="text-lg font-black text-neuro-orange">=</p>
            <p className="text-[10px] text-orange-600 font-bold mt-0.5">
              Faster Results
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: 5 Inflammation Triggers */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-black text-neuro-navy text-lg flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-500" />
          The 5 Inflammation Triggers
        </h3>
        <div className="space-y-3">
          {INFLAMMATION_TRIGGERS.map((trigger, i) => (
            <div
              key={i}
              className="border border-gray-100 rounded-xl p-4 space-y-2"
            >
              <h4 className="font-bold text-neuro-navy text-sm">
                {i + 1}. {trigger.title}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {trigger.description}
              </p>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs font-bold text-green-700 mb-0.5">
                  What to Do
                </p>
                <p className="text-xs text-green-800 leading-relaxed">
                  {trigger.whatToDo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sections 3-6: locked unless purchased */}
      {!hasPurchased ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center relative">
          <Lock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="font-black text-neuro-navy mb-2">
            Unlock the Full Nutrition Guide
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            The Anti-Inflammatory Plate, hydration calculator, shopping list, and
            more.
          </p>
          <p className="text-neuro-navy font-bold mb-4">$9.99 one-time purchase</p>
          <button className="px-6 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm hover:bg-neuro-orange/90 transition-all">
            Unlock Full Guide
          </button>
        </div>
      ) : (
        <>
          {/* Section 3: Anti-Inflammatory Plate */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-black text-neuro-navy text-lg">
              The Anti-Inflammatory Plate
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Build every meal around this simple template for balanced,
              inflammation-fighting nutrition.
            </p>
            <div className="relative w-full max-w-xs mx-auto aspect-square">
              {/* Plate circle */}
              <div className="w-full h-full rounded-full border-4 border-gray-200 overflow-hidden relative">
                {/* Top half = vegetables */}
                <div className="absolute inset-0 bottom-1/2 bg-green-100 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-black text-green-700">50%</p>
                    <p className="text-xs font-bold text-green-600">
                      Vegetables
                    </p>
                  </div>
                </div>
                {/* Bottom-left = protein */}
                <div className="absolute left-0 right-1/2 top-1/2 bottom-0 bg-blue-100 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-black text-blue-700">25%</p>
                    <p className="text-[10px] font-bold text-blue-600">
                      Protein
                    </p>
                  </div>
                </div>
                {/* Bottom-right = fats/carbs */}
                <div className="absolute left-1/2 right-0 top-1/2 bottom-0 bg-orange-100 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-black text-orange-700">25%</p>
                    <p className="text-[10px] font-bold text-orange-600">
                      Fats/Carbs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Hydration Rule */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-black text-neuro-navy text-lg flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              Hydration Rule
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your discs are 80% water. Dehydrated discs compress nerves, slow
              healing, and make adjustments harder to hold.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={weight}
                onChange={(e) => saveWeight(e.target.value)}
                placeholder="Your weight (lbs)"
                className="w-40 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-neuro-orange/50"
              />
              {waterOz && waterOz > 0 && (
                <div className="bg-blue-50 rounded-xl px-4 py-3">
                  <p className="text-sm font-black text-blue-700">
                    {waterOz} oz/day
                  </p>
                  <p className="text-[10px] text-blue-500">Your target</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Shopping list */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-black text-neuro-navy text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              Foods That Fight Inflammation
            </h3>
            {Object.entries(SHOPPING_LIST).map(([category, items]) => (
              <div key={category}>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">
                  {category}
                </p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 py-1 text-sm text-gray-700"
                    >
                      <div className="w-4 h-4 rounded border border-gray-300 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Section 6: Foods to Minimize */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-black text-neuro-navy text-lg">
              Foods to Minimize
            </h3>
            <p className="text-sm text-gray-500">
              You don&apos;t have to eliminate everything &mdash; just be mindful of
              how often these show up.
            </p>
            <div className="space-y-1">
              {MINIMIZE_FOODS.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 py-1 text-sm text-gray-700"
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
      <h2 className="text-xl font-black text-neuro-navy">
        Anti-Inflammatory Meal Ideas
      </h2>

      {categories.map((cat) => {
        const meals = MEAL_IDEAS.filter((m) => m.category === cat.key);
        return (
          <div key={cat.key} className="space-y-3">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-wide">
              {cat.label}
            </h3>
            {meals.map((meal, idx) => {
              const locked = !hasPurchased && idx >= FREE_PER_CATEGORY;
              const isSaved = localData.savedMeals.includes(meal.id);

              if (locked) {
                return (
                  <div
                    key={meal.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="font-bold text-gray-400 text-sm">
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
                  className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 hover:border-neuro-orange/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-neuro-navy text-sm">
                        {meal.title}
                      </h4>
                      <span className="inline-block mt-1 text-[10px] font-bold text-neuro-orange bg-orange-50 px-2 py-0.5 rounded-full">
                        {meal.prepTime}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleSaved(meal.id)}
                      className={`p-2 rounded-lg transition-all shrink-0 ${
                        isSaved
                          ? "text-red-500 bg-red-50"
                          : "text-gray-300 hover:text-red-400 hover:bg-red-50"
                      }`}
                      title={isSaved ? "Unsave" : "Save"}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={isSaved ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {meal.description}
                  </p>
                  <ul className="space-y-1">
                    {meal.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        className="text-xs text-gray-500 flex items-start gap-2"
                      >
                        <span className="text-neuro-orange mt-0.5 shrink-0">
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
