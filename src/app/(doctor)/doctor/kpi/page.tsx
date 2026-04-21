"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Target,
  Flame,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Settings,
  AlertTriangle,
  Award,
  BarChart3,
  Activity,
} from "lucide-react";
import { logDailyEntry, getTodayEntry, getWeeklyData, getDailyEntries, getStreak } from "./actions";
import type { KpiEntry, WeeklySummary } from "./actions";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENERGY_EMOJIS = ["\u{1F629}", "\u{1F610}", "\u{1F642}", "\u{1F60E}", "\u{1F525}"] as const;

const LS_GOALS_KEY = "neurochiro-kpi-goals";
const LS_EXTRAS_KEY = "neurochiro-kpi-extras";

interface Goals {
  visits: number;
  newPatients: number;
  collections: number; // cents
  noShows: number;
  referrals: number;
}

const DEFAULT_GOALS: Goals = {
  visits: 40,
  newPatients: 2,
  collections: 280000,
  noShows: 2,
  referrals: 3,
};

interface FormState {
  patientVisits: string;
  newPatients: string;
  collections: string;
  noShows: string;
  referrals: string;
  reactivations: string;
  caseAcceptance: string;
  servicesPerVisit: string;
  energyLevel: number;
}

const INITIAL_FORM: FormState = {
  patientVisits: "",
  newPatients: "",
  collections: "",
  noShows: "",
  referrals: "",
  reactivations: "",
  caseAcceptance: "",
  servicesPerVisit: "",
  energyLevel: 0,
};

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const WORKING_DAYS_DEFAULT = [true, true, true, true, true, false, false];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fmtDollars(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatWeekLabel(monday: Date): string {
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString("en-US", opts)} - ${friday.toLocaleDateString("en-US", opts)}`;
}

function getStatusColor(value: number, target: number, invert: boolean): string {
  if (invert) {
    if (value <= target) return "#22c55e";
    if (value <= target * 1.2) return "#eab308";
    return "#ef4444";
  }
  if (value >= target) return "#22c55e";
  if (value >= target * 0.8) return "#eab308";
  return "#ef4444";
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function KpiTrackerPage() {
  // Data state
  const [todayEntry, setTodayEntry] = useState<KpiEntry | null>(null);
  const [entries, setEntries] = useState<KpiEntry[]>([]);
  const [streak, setStreak] = useState<{ current: number; longest: number }>({ current: 0, longest: 0 });

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMoreMetrics, setShowMoreMetrics] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [trendPeriod, setTrendPeriod] = useState<7 | 30 | 60 | 90>(30);
  const [showGoals, setShowGoals] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());

  // Form state
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  // Goals state
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [workingDays, setWorkingDays] = useState(WORKING_DAYS_DEFAULT);
  const [monthlyRevenueGoal, setMonthlyRevenueGoal] = useState("");

  // Refs for localStorage debounce
  const goalsRef = useRef(goals);
  goalsRef.current = goals;

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  const loadData = useCallback(async () => {
    try {
      const [entry, daily, streakData] = await Promise.all([
        getTodayEntry(),
        getDailyEntries(90),
        getStreak(),
      ]);
      setTodayEntry(entry);
      setEntries(daily);
      setStreak(streakData);
      setError(null);
    } catch {
      setError("Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load goals from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_GOALS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setGoals({ ...DEFAULT_GOALS, ...parsed });
      }
    } catch {}
  }, []);

  // Pre-fill form if today is already logged
  useEffect(() => {
    if (todayEntry) {
      setForm({
        patientVisits: String(todayEntry.patient_visits),
        newPatients: String(todayEntry.new_patients),
        collections: String(todayEntry.collections / 100),
        noShows: String(todayEntry.no_shows),
        referrals: "",
        reactivations: "",
        caseAcceptance: "",
        servicesPerVisit: "",
        energyLevel: todayEntry.energy_level,
      });
      // Load extras from localStorage
      try {
        const extras = localStorage.getItem(LS_EXTRAS_KEY);
        if (extras) {
          const parsed = JSON.parse(extras);
          setForm(prev => ({
            ...prev,
            referrals: parsed.referrals ?? "",
            reactivations: parsed.reactivations ?? "",
            caseAcceptance: parsed.caseAcceptance ?? "",
            servicesPerVisit: parsed.servicesPerVisit ?? "",
          }));
        }
      } catch {}
    }
  }, [todayEntry]);

  // -----------------------------------------------------------------------
  // Form helpers
  // -----------------------------------------------------------------------

  const updateForm = useCallback((field: keyof FormState, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async () => {
    if (form.energyLevel === 0) return;
    setSubmitting(true);
    setError(null);

    const result = await logDailyEntry({
      patientVisits: parseInt(form.patientVisits) || 0,
      newPatients: parseInt(form.newPatients) || 0,
      collections: Math.round((parseFloat(form.collections) || 0) * 100),
      noShows: parseInt(form.noShows) || 0,
      energyLevel: form.energyLevel,
    });

    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    // Save extras to localStorage
    try {
      localStorage.setItem(LS_EXTRAS_KEY, JSON.stringify({
        referrals: form.referrals,
        reactivations: form.reactivations,
        caseAcceptance: form.caseAcceptance,
        servicesPerVisit: form.servicesPerVisit,
        date: new Date().toISOString().slice(0, 10),
      }));
    } catch {}

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    await loadData();
  };

  const saveGoals = () => {
    try {
      localStorage.setItem(LS_GOALS_KEY, JSON.stringify(goals));
    } catch {}
  };

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const thirtyDayAvg = useMemo(() => {
    const last30 = entries.slice(-30);
    if (last30.length === 0) return null;
    const n = last30.length;
    return {
      visits: Math.round(last30.reduce((s, e) => s + e.patient_visits, 0) / n),
      newPatients: Math.round(last30.reduce((s, e) => s + e.new_patients, 0) / n),
      collections: Math.round(last30.reduce((s, e) => s + e.collections, 0) / n),
      noShows: Math.round(last30.reduce((s, e) => s + e.no_shows, 0) / n),
    };
  }, [entries]);

  // Weekly data for the weekly scorecard
  const weeklyScorecard = useMemo(() => {
    const now = new Date();
    const targetMonday = getMonday(now);
    targetMonday.setDate(targetMonday.getDate() + weekOffset * 7);

    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(targetMonday);
      d.setDate(d.getDate() + i);
      weekDates.push(d.toISOString().slice(0, 10));
    }

    const dayEntries: (KpiEntry | null)[] = weekDates.map(date =>
      entries.find(e => e.date === date) ?? null
    );

    return { monday: targetMonday, weekDates, dayEntries };
  }, [entries, weekOffset]);

  // Trend data
  const trendData = useMemo(() => {
    const periodEntries = entries.slice(-trendPeriod);
    return periodEntries;
  }, [entries, trendPeriod]);

  // Previous period for comparison
  const previousPeriodData = useMemo(() => {
    if (entries.length < trendPeriod * 2) return null;
    return entries.slice(-(trendPeriod * 2), -trendPeriod);
  }, [entries, trendPeriod]);

  // Coaching alerts
  const alerts = useMemo(() => {
    const result: { type: "green" | "orange" | "blue"; icon: "streak" | "warning" | "milestone" | "info"; title: string; description: string }[] = [];

    if (entries.length === 0) {
      result.push({
        type: "blue",
        icon: "info",
        title: "Welcome!",
        description: "Start logging to unlock coaching insights.",
      });
      return result;
    }

    // 1. Streak
    if (streak.current > 0) {
      result.push({
        type: "green",
        icon: "streak",
        title: `${streak.current}-day streak!`,
        description: "Keep it going.",
      });
    }

    const last5 = entries.slice(-5);

    // 2. Collections below target 3+ of last 5
    if (last5.length >= 3) {
      const belowCount = last5.filter(e => e.collections < goals.collections).length;
      if (belowCount >= 3) {
        result.push({
          type: "orange",
          icon: "warning",
          title: "Collections below target",
          description: `Collections have been below your ${fmtDollars(goals.collections)} target ${belowCount} of the last 5 days. Review your billing and case acceptance.`,
        });
      }
    }

    // 3. No-shows above goal 3+ of last 5
    if (last5.length >= 3 && result.length < 3) {
      const highNoShows = last5.filter(e => e.no_shows > goals.noShows).length;
      if (highNoShows >= 3) {
        result.push({
          type: "orange",
          icon: "warning",
          title: "No-shows trending high",
          description: "Consider tightening confirmation calls and same-day reminders.",
        });
      }
    }

    // 4. New patients = 0 for last 3 days
    if (entries.length >= 3 && result.length < 3) {
      const last3 = entries.slice(-3);
      if (last3.every(e => e.new_patients === 0)) {
        result.push({
          type: "orange",
          icon: "warning",
          title: "New patient drought",
          description: "No new patients in 3 days. Review your marketing funnels and community events.",
        });
      }
    }

    // 5. This week collections > any previous week
    if (result.length < 3) {
      const thisWeekEntries = weeklyScorecard.dayEntries.filter(Boolean) as KpiEntry[];
      const thisWeekCollections = thisWeekEntries.reduce((s, e) => s + e.collections, 0);
      if (thisWeekCollections > 0) {
        // Get previous weeks
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 30);
        const prevEntries = entries.filter(e => {
          const d = new Date(e.date + "T00:00:00");
          return d >= fourWeeksAgo && !weeklyScorecard.weekDates.includes(e.date);
        });
        // Group by week
        const weekTotals = new Map<string, number>();
        for (const e of prevEntries) {
          const mon = getMonday(new Date(e.date + "T00:00:00")).toISOString().slice(0, 10);
          weekTotals.set(mon, (weekTotals.get(mon) ?? 0) + e.collections);
        }
        const maxPrevWeek = Math.max(...Array.from(weekTotals.values()), 0);
        if (thisWeekCollections > maxPrevWeek && maxPrevWeek > 0) {
          result.push({
            type: "green",
            icon: "milestone",
            title: "Best week in 30 days!",
            description: `This week's collections (${fmtDollars(thisWeekCollections)}) are your best in the last month.`,
          });
        }
      }
    }

    return result.slice(0, 3);
  }, [entries, streak, goals, weeklyScorecard]);

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Section renderers (called as functions, not JSX components)
  // -----------------------------------------------------------------------

  const TopBar = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-4">
      <div>
        <h1 className="text-xl font-black text-neuro-navy">
          {getGreeting()}, Doc
        </h1>
        <p className="text-sm text-gray-500">{formatDate(new Date())}</p>
      </div>
      <div className="flex items-center gap-3">
        {streak.current > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-sm font-bold text-neuro-navy">
            <Flame className="w-4 h-4 text-neuro-orange" />
            {streak.current}-day streak
          </span>
        )}
      </div>
    </div>
  );

  // ─── Section 1: Log Today's Numbers ─────────────────────────────────────

  const Section1 = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-black text-neuro-navy mb-5">
        {todayEntry ? "Update Today\u2019s Log" : "Log Today\u2019s Numbers"}
      </h2>

      {/* Core metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Patient Visits</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.patientVisits}
            onChange={e => updateForm("patientVisits", e.target.value)}
            placeholder="0"
            className="w-full min-h-[48px] py-3 px-4 text-lg font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">New Patients</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.newPatients}
            onChange={e => updateForm("newPatients", e.target.value)}
            placeholder="0"
            className="w-full min-h-[48px] py-3 px-4 text-lg font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Collections ($)</label>
          <input
            type="number"
            inputMode="decimal"
            value={form.collections}
            onChange={e => updateForm("collections", e.target.value)}
            placeholder="0"
            className="w-full min-h-[48px] py-3 px-4 text-lg font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">No-Shows</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.noShows}
            onChange={e => updateForm("noShows", e.target.value)}
            placeholder="0"
            className="w-full min-h-[48px] py-3 px-4 text-lg font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Referrals</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.referrals}
            onChange={e => updateForm("referrals", e.target.value)}
            placeholder="0"
            className="w-full min-h-[48px] py-3 px-4 text-lg font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange outline-none transition-all"
          />
        </div>
      </div>

      {/* Collapsible More Metrics */}
      <button
        onClick={() => setShowMoreMetrics(!showMoreMetrics)}
        className="text-sm font-bold text-neuro-orange mb-4 hover:underline"
      >
        {showMoreMetrics ? "Hide" : "More Metrics"} {showMoreMetrics ? "\u25B2" : "\u25BC"}
      </button>

      {showMoreMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Reactivations</label>
            <input
              type="number"
              inputMode="numeric"
              value={form.reactivations}
              onChange={e => updateForm("reactivations", e.target.value)}
              placeholder="0"
              className="w-full min-h-[44px] py-2 px-4 text-base font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Case Acceptance %</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={form.caseAcceptance}
              onChange={e => updateForm("caseAcceptance", e.target.value)}
              placeholder="0"
              className="w-full min-h-[44px] py-2 px-4 text-base font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Services per Visit</label>
            <input
              type="number"
              inputMode="decimal"
              step={0.1}
              value={form.servicesPerVisit}
              onChange={e => updateForm("servicesPerVisit", e.target.value)}
              placeholder="0"
              className="w-full min-h-[44px] py-2 px-4 text-base font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange outline-none transition-all"
            />
          </div>
        </div>
      )}

      {/* Energy emoji row */}
      <div className="mb-5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Energy Level</label>
        <div className="flex items-center gap-2">
          {ENERGY_EMOJIS.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => updateForm("energyLevel", i + 1)}
              className={`flex-1 min-h-[48px] text-2xl rounded-xl border-2 transition-all ${
                form.energyLevel === i + 1
                  ? "border-white bg-neuro-navy ring-2 ring-neuro-navy shadow-md scale-105"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={submitting || form.energyLevel === 0}
        className="w-full py-4 bg-neuro-orange text-white font-black text-lg rounded-xl hover:bg-neuro-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
      >
        {submitting ? "Saving..." : showSuccess ? (
          <span className="inline-flex items-center gap-2"><Check className="w-5 h-5" /> Saved!</span>
        ) : todayEntry ? "Update Today\u2019s Log" : "Log Today"}
      </button>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );

  // ─── Section 2: Today's Scorecard ───────────────────────────────────────

  const Section2 = () => {
    const today = todayEntry;
    if (!today) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-neuro-navy mb-3">Today&apos;s Scorecard</h2>
          <p className="text-sm text-gray-400 text-center py-6">Log today&apos;s numbers to see your scorecard.</p>
        </div>
      );
    }

    const cards = [
      {
        label: "Patient Visits",
        value: today.patient_visits,
        target: goals.visits,
        avg: thirtyDayAvg?.visits ?? 0,
        invert: false,
        format: (v: number) => String(v),
      },
      {
        label: "New Patients",
        value: today.new_patients,
        target: goals.newPatients,
        avg: thirtyDayAvg?.newPatients ?? 0,
        invert: false,
        format: (v: number) => String(v),
      },
      {
        label: "Collections",
        value: today.collections,
        target: goals.collections,
        avg: thirtyDayAvg?.collections ?? 0,
        invert: false,
        format: (v: number) => fmtDollars(v),
      },
      {
        label: "No-Shows",
        value: today.no_shows,
        target: goals.noShows,
        avg: thirtyDayAvg?.noShows ?? 0,
        invert: true,
        format: (v: number) => String(v),
      },
    ];

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-neuro-navy mb-4">Today&apos;s Scorecard</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(card => {
            const statusColor = getStatusColor(card.value, card.target, card.invert);
            return (
              <div key={card.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{card.label}</p>
                <p className="text-2xl font-black text-neuro-navy">{card.format(card.value)}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
                  <span className="text-[10px] text-gray-500">Target: {card.format(card.target)}</span>
                </div>
                {thirtyDayAvg && (
                  <p className="text-[10px] text-gray-400 mt-1">30d avg: {card.format(card.avg)}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Section 3: Weekly Scorecard ────────────────────────────────────────

  const Section3 = () => {
    const { monday, weekDates, dayEntries } = weeklyScorecard;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayDayIndex = weekDates.indexOf(todayStr);

    // Calculate totals and averages from logged days only
    const loggedEntries = dayEntries.filter(Boolean) as KpiEntry[];
    const loggedCount = loggedEntries.length;

    const totals = {
      visits: loggedEntries.reduce((s, e) => s + e.patient_visits, 0),
      newPatients: loggedEntries.reduce((s, e) => s + e.new_patients, 0),
      collections: loggedEntries.reduce((s, e) => s + e.collections, 0),
      noShows: loggedEntries.reduce((s, e) => s + e.no_shows, 0),
    };

    const avgs = loggedCount > 0 ? {
      visits: Math.round(totals.visits / loggedCount),
      newPatients: Math.round(totals.newPatients / loggedCount),
      collections: Math.round(totals.collections / loggedCount),
      noShows: Math.round(totals.noShows / loggedCount),
    } : null;

    const rows = [
      { label: "Visits", key: "patient_visits" as const, target: goals.visits, fmt: (v: number) => String(v) },
      { label: "New Pts", key: "new_patients" as const, target: goals.newPatients, fmt: (v: number) => String(v) },
      { label: "Collections", key: "collections" as const, target: goals.collections, fmt: (v: number) => fmtDollars(v) },
      { label: "No-Shows", key: "no_shows" as const, target: goals.noShows, fmt: (v: number) => String(v), invert: true },
      { label: "Energy", key: "energy_level" as const, target: 0, fmt: (v: number) => v > 0 ? ENERGY_EMOJIS[Math.min(v - 1, 4)] : "\u2014" },
    ];

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-neuro-navy">Weekly Scorecard</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-1 rounded hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-xs font-bold text-gray-600 min-w-[130px] text-center">
              {formatWeekLabel(monday)}
            </span>
            <button
              onClick={() => setWeekOffset(prev => Math.min(prev + 1, 0))}
              disabled={weekOffset >= 0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 font-bold text-gray-400 uppercase w-24"></th>
                {DAYS_OF_WEEK.map((day, i) => (
                  <th
                    key={day}
                    className={`py-2 px-2 font-bold text-gray-500 text-center ${
                      i === todayDayIndex ? "bg-orange-50 rounded-t-lg" : ""
                    }`}
                  >
                    {day}
                  </th>
                ))}
                <th className="py-2 px-2 font-bold text-neuro-navy text-center">TOTAL</th>
                <th className="py-2 px-2 font-bold text-neuro-navy text-center">AVG</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-bold text-gray-600">{row.label}</td>
                  {dayEntries.map((entry, i) => {
                    const val = entry ? (entry as any)[row.key] : null;
                    const isToday = i === todayDayIndex;
                    let cellText = "\u2014";
                    let textColor = "text-gray-400";

                    if (val !== null && val !== undefined) {
                      cellText = row.fmt(val);
                      if (row.target > 0 && row.key !== "energy_level") {
                        const isInvert = !!(row as any).invert;
                        if (isInvert) {
                          textColor = val <= row.target ? "text-green-600 font-bold" : "text-red-500 font-bold";
                        } else {
                          textColor = val >= row.target ? "text-green-600 font-bold" : "text-red-500 font-bold";
                        }
                      } else {
                        textColor = "text-neuro-navy font-bold";
                      }
                    }

                    return (
                      <td
                        key={i}
                        className={`py-2 px-2 text-center ${textColor} ${isToday ? "bg-orange-50" : ""}`}
                      >
                        {cellText}
                      </td>
                    );
                  })}
                  <td className="py-2 px-2 text-center font-black text-neuro-navy">
                    {row.key === "energy_level"
                      ? (loggedCount > 0 ? ENERGY_EMOJIS[Math.min(Math.round(loggedEntries.reduce((s, e) => s + e.energy_level, 0) / loggedCount) - 1, 4)] : "\u2014")
                      : row.key === "collections"
                      ? fmtDollars(totals.collections)
                      : row.key === "patient_visits"
                      ? String(totals.visits)
                      : row.key === "new_patients"
                      ? String(totals.newPatients)
                      : String(totals.noShows)
                    }
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-gray-600">
                    {row.key === "energy_level"
                      ? (loggedCount > 0 ? ENERGY_EMOJIS[Math.min(Math.round(loggedEntries.reduce((s, e) => s + e.energy_level, 0) / loggedCount) - 1, 4)] : "\u2014")
                      : avgs
                      ? row.key === "collections"
                        ? fmtDollars(avgs.collections)
                        : row.key === "patient_visits"
                        ? String(avgs.visits)
                        : row.key === "new_patients"
                        ? String(avgs.newPatients)
                        : String(avgs.noShows)
                      : "\u2014"
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─── Section 4: Trends ──────────────────────────────────────────────────

  const Section4 = () => {
    if (trendData.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-neuro-navy mb-4">Trends</h2>
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-bold">Log your first day to see trends!</p>
            <p className="text-xs text-gray-300 mt-1">Charts will appear here once you have data.</p>
          </div>
        </div>
      );
    }

    // SVG chart builder
    const buildLineChart = (
      data: { date: string; value: number }[],
      targetValue: number,
      formatValue: (v: number) => string,
      color: string
    ) => {
      if (data.length === 0) return null;

      const W = 600;
      const H = 200;
      const PAD_X = 50;
      const PAD_Y = 30;
      const chartW = W - PAD_X * 2;
      const chartH = H - PAD_Y * 2;

      const values = data.map(d => d.value);
      const minVal = Math.min(...values, targetValue) * 0.9;
      const maxVal = Math.max(...values, targetValue) * 1.1;
      const range = maxVal - minVal || 1;

      const points = data.map((d, i) => ({
        x: PAD_X + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
        y: PAD_Y + chartH - ((d.value - minVal) / range) * chartH,
        value: d.value,
        date: d.date,
      }));

      const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

      // Area fill
      const areaD = pathD + ` L ${points[points.length - 1].x} ${PAD_Y + chartH} L ${points[0].x} ${PAD_Y + chartH} Z`;

      const targetY = PAD_Y + chartH - ((targetValue - minVal) / range) * chartH;

      // X labels: show every Nth
      const labelInterval = Math.max(1, Math.floor(data.length / 6));

      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
          {/* Area fill */}
          <path d={areaD} fill={color} opacity={0.08} />

          {/* Target dashed line */}
          <line x1={PAD_X} y1={targetY} x2={W - PAD_X} y2={targetY} stroke="#9CA3AF" strokeWidth={1} strokeDasharray="6 4" />
          <text x={W - PAD_X + 4} y={targetY + 3} className="fill-gray-400" style={{ fontSize: 9 }}>Target</text>

          {/* Line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

          {/* Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
              fill={p.value >= targetValue ? "#22c55e" : "#ef4444"}
            />
          ))}

          {/* X axis labels */}
          {points.map((p, i) => {
            if (i % labelInterval !== 0 && i !== points.length - 1) return null;
            const label = data[i].date.slice(5); // MM-DD
            return (
              <text key={i} x={p.x} y={H - 5} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 9 }}>
                {label}
              </text>
            );
          })}

          {/* Y axis labels */}
          {[0, 0.5, 1].map(frac => {
            const val = minVal + frac * range;
            const y = PAD_Y + chartH - frac * chartH;
            return (
              <text key={frac} x={PAD_X - 8} y={y + 3} textAnchor="end" className="fill-gray-400" style={{ fontSize: 9 }}>
                {formatValue(Math.round(val))}
              </text>
            );
          })}
        </svg>
      );
    };

    const collectionsData = trendData.map(e => ({ date: e.date, value: e.collections }));
    const visitsData = trendData.map(e => ({ date: e.date, value: e.patient_visits }));

    // Metric summary
    const periodTotal = trendData.reduce((s, e) => s + e.collections, 0);
    const dailyAvg = trendData.length > 0 ? Math.round(periodTotal / trendData.length) : 0;
    const bestDay = trendData.length > 0
      ? trendData.reduce((best, e) => e.collections > best.collections ? e : best, trendData[0])
      : null;

    let trendPct: number | null = null;
    if (previousPeriodData && previousPeriodData.length > 0) {
      const prevTotal = previousPeriodData.reduce((s, e) => s + e.collections, 0);
      if (prevTotal > 0) {
        trendPct = Math.round(((periodTotal - prevTotal) / prevTotal) * 100);
      }
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-neuro-navy">Trends</h2>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {([7, 30, 60, 90] as const).map(d => (
              <button
                key={d}
                onClick={() => setTrendPeriod(d)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  trendPeriod === d ? "bg-white text-neuro-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Collections chart */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Collections</p>
            {buildLineChart(collectionsData, goals.collections, (v) => fmtDollars(v), "#e97325")}
          </div>

          {/* Visits chart */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Patient Visits</p>
            {buildLineChart(visitsData, goals.visits, (v) => String(v), "#1a2744")}
          </div>

          {/* Metric summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Period Total</p>
              <p className="text-sm font-black text-neuro-navy">{fmtDollars(periodTotal)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Daily Avg</p>
              <p className="text-sm font-black text-neuro-navy">{fmtDollars(dailyAvg)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Best Day</p>
              <p className="text-sm font-black text-neuro-navy">
                {bestDay ? `${fmtDollars(bestDay.collections)} (${bestDay.date.slice(5)})` : "\u2014"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Trend</p>
              <p className={`text-sm font-black ${trendPct !== null ? (trendPct >= 0 ? "text-green-600" : "text-red-500") : "text-gray-400"}`}>
                {trendPct !== null ? `${trendPct > 0 ? "+" : ""}${trendPct}%` : "\u2014"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Section 5: Coaching Alerts ─────────────────────────────────────────

  const Section5 = () => {
    const visibleAlerts = alerts.filter((_, i) => !dismissedAlerts.has(i));
    if (visibleAlerts.length === 0) return null;

    const alertStyles = {
      green: "border-l-green-500 bg-green-50",
      orange: "border-l-orange-500 bg-orange-50",
      blue: "border-l-blue-500 bg-blue-50",
    };

    const alertIcons = {
      streak: <Flame className="w-4 h-4 text-green-600" />,
      warning: <AlertTriangle className="w-4 h-4 text-orange-600" />,
      milestone: <Award className="w-4 h-4 text-green-600" />,
      info: <Activity className="w-4 h-4 text-blue-600" />,
    };

    return (
      <div className="space-y-3">
        <h2 className="text-lg font-black text-neuro-navy">Coaching Alerts</h2>
        {alerts.map((alert, i) => {
          if (dismissedAlerts.has(i)) return null;
          return (
            <div
              key={i}
              className={`border-l-4 rounded-xl p-4 flex items-start gap-3 ${alertStyles[alert.type]}`}
            >
              <span className="mt-0.5">{alertIcons[alert.icon]}</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-neuro-navy">{alert.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{alert.description}</p>
              </div>
              <button
                onClick={() => setDismissedAlerts(prev => new Set([...prev, i]))}
                className="text-gray-300 hover:text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Section 6: Goals & Settings ────────────────────────────────────────

  const Section6 = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setShowGoals(!showGoals)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2">
          <Settings className="w-4 h-4 text-neuro-orange" /> Goals &amp; Settings
        </span>
        <span className="text-xs text-gray-400">{showGoals ? "\u25B2" : "\u25BC"}</span>
      </button>

      {showGoals && (
        <div className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Daily Visit Target</label>
              <input
                type="number"
                value={goals.visits}
                onChange={e => setGoals(prev => ({ ...prev, visits: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Daily New Patient Target</label>
              <input
                type="number"
                value={goals.newPatients}
                onChange={e => setGoals(prev => ({ ...prev, newPatients: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Daily Collections Target ($)</label>
              <input
                type="number"
                value={goals.collections / 100}
                onChange={e => setGoals(prev => ({ ...prev, collections: Math.round((parseFloat(e.target.value) || 0) * 100) }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Daily No-Show Goal (stay below)</label>
              <input
                type="number"
                value={goals.noShows}
                onChange={e => setGoals(prev => ({ ...prev, noShows: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Daily Referral Target</label>
              <input
                type="number"
                value={goals.referrals}
                onChange={e => setGoals(prev => ({ ...prev, referrals: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Monthly Revenue Goal ($)</label>
              <input
                type="number"
                value={monthlyRevenueGoal}
                onChange={e => {
                  setMonthlyRevenueGoal(e.target.value);
                  const monthly = parseFloat(e.target.value) || 0;
                  if (monthly > 0) {
                    setGoals(prev => ({ ...prev, collections: Math.round((monthly / 22) * 100) }));
                  }
                }}
                placeholder="Auto-calculates daily target (\u00F7 22 days)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange"
              />
              {monthlyRevenueGoal && (
                <p className="text-[10px] text-gray-400 mt-1">
                  = {fmtDollars(Math.round((parseFloat(monthlyRevenueGoal) / 22) * 100))}/day
                </p>
              )}
            </div>
          </div>

          {/* Working days */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Working Days</label>
            <div className="flex gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                <button
                  key={day}
                  onClick={() => {
                    const next = [...workingDays];
                    next[i] = !next[i];
                    setWorkingDays(next);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    workingDays[i]
                      ? "bg-neuro-navy text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveGoals}
            className="w-full py-3 bg-neuro-navy text-white font-bold text-sm rounded-xl hover:bg-neuro-navy/90 transition-all active:scale-[0.98]"
          >
            Save Goals
          </button>
        </div>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Main Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6 pb-32 md:pb-8 max-w-4xl mx-auto">
      {TopBar()}
      {Section1()}
      {Section2()}
      {Section3()}
      {Section4()}
      {Section5()}
      {Section6()}
    </div>
  );
}
