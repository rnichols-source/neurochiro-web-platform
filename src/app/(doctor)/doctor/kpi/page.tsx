"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { logDailyEntry, getTodayEntry, getWeeklyData, getDailyEntries, getStreak } from "./actions";
import type { KpiEntry, WeeklySummary } from "./actions";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENERGY_EMOJIS = ["😩", "😐", "😊", "😎", "🔥"] as const;

const NETWORK_BENCHMARKS = {
  patientVisitsWeek: 72,
  newPatientsWeek: 4,
  collectionsWeek: 4800_00, // cents
  showRate: 84,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fmtDollars(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function showRate(visits: number, noShows: number): number {
  const total = visits + noShows;
  if (total === 0) return 0;
  return Math.round((visits / total) * 100);
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : 100;
  return Math.round(((current - previous) / previous) * 100);
}

function percentileLabel(value: number, benchmark: number): { label: string; tier: "gold" | "silver" | "neutral" | "none" } {
  const ratio = value / benchmark;
  if (ratio >= 1.3) return { label: "Top 10%", tier: "gold" };
  if (ratio >= 1.1) return { label: "Top 25%", tier: "silver" };
  if (ratio >= 0.9) return { label: "Top 50%", tier: "neutral" };
  return { label: "", tier: "none" };
}

function groupByWeek(entries: KpiEntry[]): WeeklySummary[] {
  const map = new Map<string, KpiEntry[]>();
  for (const e of entries) {
    const d = new Date(e.date + "T00:00:00");
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d);
    mon.setDate(diff);
    const ws = mon.toISOString().slice(0, 10);
    const list = map.get(ws) ?? [];
    list.push(e);
    map.set(ws, list);
  }
  const out: WeeklySummary[] = [];
  for (const [weekStart, items] of map) {
    out.push({
      weekStart,
      patientVisits: items.reduce((s, e) => s + (e.patient_visits ?? 0), 0),
      newPatients: items.reduce((s, e) => s + (e.new_patients ?? 0), 0),
      collections: items.reduce((s, e) => s + (e.collections ?? 0), 0),
      noShows: items.reduce((s, e) => s + (e.no_shows ?? 0), 0),
      energyLevel: items.length > 0 ? Math.round(items.reduce((s, e) => s + (e.energy_level ?? 0), 0) / items.length) : 0,
      entryCount: items.length,
    });
  }
  out.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  return out;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function KpiTrackerPage() {
  // Data state
  const [todayEntry, setTodayEntry] = useState<KpiEntry | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklySummary[]>([]);
  const [dailyEntries, setDailyEntries] = useState<KpiEntry[]>([]);
  const [streak, setStreak] = useState<{ current: number; longest: number }>({ current: 0, longest: 0 });

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [editing, setEditing] = useState(false);
  const [chartRange, setChartRange] = useState<30 | 60 | 90>(30);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [patientVisits, setPatientVisits] = useState("");
  const [newPatients, setNewPatients] = useState("");
  const [collectionsDollars, setCollectionsDollars] = useState("");
  const [noShows, setNoShows] = useState("");
  const [energyLevel, setEnergyLevel] = useState<number>(0);

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  const loadData = useCallback(async () => {
    try {
      const [entry, weekly, daily, streakData] = await Promise.all([
        getTodayEntry(),
        getWeeklyData(14),
        getDailyEntries(90),
        getStreak(),
      ]);
      setTodayEntry(entry);
      setWeeklyData(weekly);
      setDailyEntries(daily);
      setStreak(streakData);
      setError(null);
    } catch {
      setError("Unable to load data. Showing empty state.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // -----------------------------------------------------------------------
  // Form helpers
  // -----------------------------------------------------------------------

  const hasLogged = todayEntry !== null && !editing;

  const populateFormFromEntry = useCallback((entry: KpiEntry) => {
    setPatientVisits(String(entry.patient_visits));
    setNewPatients(String(entry.new_patients));
    setCollectionsDollars(String(entry.collections / 100));
    setNoShows(String(entry.no_shows));
    setEnergyLevel(entry.energy_level);
  }, []);

  const handleSubmit = async () => {
    if (energyLevel === 0) return;
    setSubmitting(true);
    const result = await logDailyEntry({
      patientVisits: parseInt(patientVisits) || 0,
      newPatients: parseInt(newPatients) || 0,
      collections: Math.round((parseFloat(collectionsDollars) || 0) * 100),
      noShows: parseInt(noShows) || 0,
      energyLevel,
    });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    await loadData();
  };

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const sevenDayAvg = useMemo(() => {
    const last7 = dailyEntries.slice(-7);
    if (last7.length === 0) return null;
    const n = last7.length;
    return {
      patient_visits: Math.round(last7.reduce((s, e) => s + e.patient_visits, 0) / n),
      new_patients: Math.round(last7.reduce((s, e) => s + e.new_patients, 0) / n),
      collections: Math.round(last7.reduce((s, e) => s + e.collections, 0) / n),
      no_shows: Math.round(last7.reduce((s, e) => s + e.no_shows, 0) / n),
      energy_level: Math.round(last7.reduce((s, e) => s + e.energy_level, 0) / n),
    };
  }, [dailyEntries]);

  const thisWeek = weeklyData.length > 0 ? weeklyData[weeklyData.length - 1] : null;
  const lastWeek = weeklyData.length > 1 ? weeklyData[weeklyData.length - 2] : null;

  const chartWeeks = useMemo(() => {
    const weeksNeeded = Math.ceil(chartRange / 7);
    const allWeeks = groupByWeek(dailyEntries);
    return allWeeks.slice(-weeksNeeded);
  }, [dailyEntries, chartRange]);

  // Smart alerts
  const alerts = useMemo(() => {
    const result: { type: "warning" | "positive" | "info"; message: string }[] = [];
    if (result.length >= 2) return result;

    // Show rate < 80%
    if (thisWeek) {
      const sr = showRate(thisWeek.patientVisits, thisWeek.noShows);
      if (sr > 0 && sr < 80) {
        result.push({ type: "warning", message: "Your show rate is below 80% this week. Consider tightening confirmation calls and same-day reminders." });
      }
    }
    if (result.length >= 2) return result;

    // New patients declining 3 weeks
    if (weeklyData.length >= 3) {
      const recent3 = weeklyData.slice(-3);
      if (recent3[0].newPatients > recent3[1].newPatients && recent3[1].newPatients > recent3[2].newPatients) {
        result.push({ type: "warning", message: "New patients have declined 3 weeks in a row. Time to review your marketing funnels and community events." });
      }
    }
    if (result.length >= 2) return result;

    // Energy avg < 2.5 for 2 weeks
    if (weeklyData.length >= 2) {
      const last2 = weeklyData.slice(-2);
      if (last2.every(w => w.energyLevel > 0 && w.energyLevel < 2.5)) {
        result.push({ type: "warning", message: "Your energy has been low for two weeks. Consider delegating, taking a half-day, or adjusting your schedule." });
      }
    }
    if (result.length >= 2) return result;

    // Collections up + visits down
    if (thisWeek && lastWeek && lastWeek.collections > 0 && lastWeek.patientVisits > 0) {
      if (thisWeek.collections > lastWeek.collections && thisWeek.patientVisits < lastWeek.patientVisits) {
        result.push({ type: "positive", message: "Collections are up while visits are down. Great ROF and case compliance." });
      }
    }
    if (result.length >= 2) return result;

    // Everything up
    if (thisWeek && lastWeek && lastWeek.patientVisits > 0) {
      if (
        thisWeek.patientVisits > lastWeek.patientVisits &&
        thisWeek.newPatients >= lastWeek.newPatients &&
        thisWeek.collections > lastWeek.collections
      ) {
        result.push({ type: "positive", message: "All key metrics are trending up. You are in a growth phase. Keep the momentum going!" });
      }
    }

    return result.slice(0, 2);
  }, [thisWeek, lastWeek, weeklyData]);

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const CompareIndicator = ({ current, average, invert }: { current: number; average: number; invert?: boolean }) => {
    if (average === 0) return null;
    const diff = current - average;
    const pct = Math.round((diff / average) * 100);
    const isGood = invert ? diff <= 0 : diff >= 0;
    const within2 = Math.abs(pct) <= 2;
    if (within2) return <span className="text-xs text-gray-400 ml-1">--</span>;
    return (
      <span className={`text-xs ml-1 font-bold ${isGood ? "text-emerald-600" : "text-red-500"}`}>
        {diff > 0 ? "+" : ""}{pct}%
      </span>
    );
  };

  const WeekCompareRow = ({ label, current, previous, isCurrency, isRate, invert }: {
    label: string; current: number; previous: number; isCurrency?: boolean; isRate?: boolean; invert?: boolean;
  }) => {
    const pct = pctChange(current, previous);
    const within2 = pct !== null && Math.abs(pct) <= 2;
    const isGood = invert ? (pct !== null && pct <= 0) : (pct !== null && pct >= 0);
    const arrow = within2 || pct === null ? "→" : (pct > 0 ? "↑" : "↓");
    const color = within2 || pct === null ? "text-gray-400" : isGood ? "text-emerald-600" : "text-red-500";
    const display = isCurrency ? fmtDollars(current) : isRate ? `${current}%` : String(current);
    const prevDisplay = isCurrency ? fmtDollars(previous) : isRate ? `${previous}%` : String(previous);
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <span className="text-sm text-gray-600 font-medium">{label}</span>
        <div className="flex items-center gap-3 text-right">
          <span className="text-xs text-gray-400 w-16 text-right">{prevDisplay}</span>
          <span className={`text-sm font-bold ${color}`}>{arrow}</span>
          <span className="text-sm font-black text-neuro-navy w-16 text-right">{display}</span>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------------
  // SVG Charts
  // -----------------------------------------------------------------------

  const CollectionsBarChart = () => {
    const data = chartWeeks;
    if (data.length === 0) return <p className="text-sm text-gray-400 text-center py-10">No data yet</p>;
    const maxVal = Math.max(...data.map(w => w.collections), 1);
    const barWidth = Math.max(20, Math.floor(100 / data.length) - 4);
    const chartH = 180;
    const [hovered, setHovered] = useState<number | null>(null);
    return (
      <svg viewBox={`0 0 ${data.length * (barWidth + 8) + 20} ${chartH + 30}`} className="w-full" style={{ maxHeight: 200 }}>
        {data.map((w, i) => {
          const h = (w.collections / maxVal) * chartH;
          const x = i * (barWidth + 8) + 10;
          const y = chartH - h;
          return (
            <g key={w.weekStart} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} onTouchStart={() => setHovered(i)}>
              <rect x={x} y={y} width={barWidth} height={h} rx={4} className="fill-neuro-orange/80 hover:fill-neuro-orange transition-colors" />
              {hovered === i && (
                <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="fill-neuro-navy text-[10px] font-bold">
                  {fmtDollars(w.collections)}
                </text>
              )}
              <text x={x + barWidth / 2} y={chartH + 16} textAnchor="middle" className="fill-gray-400 text-[8px]">
                {w.weekStart.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const ShowRateLineChart = () => {
    const data = chartWeeks;
    if (data.length === 0) return <p className="text-sm text-gray-400 text-center py-10">No data yet</p>;
    const chartW = 300;
    const chartH = 180;
    const target = 85;
    const minR = Math.min(...data.map(w => showRate(w.patientVisits, w.noShows)), target - 10);
    const maxR = Math.max(...data.map(w => showRate(w.patientVisits, w.noShows)), target + 10);
    const range = maxR - minR || 1;
    const points = data.map((w, i) => {
      const sr = showRate(w.patientVisits, w.noShows);
      const x = data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * (chartW - 40) + 20;
      const y = chartH - ((sr - minR) / range) * (chartH - 30) - 15;
      return { x, y, sr };
    });
    const targetY = chartH - ((target - minR) / range) * (chartH - 30) - 15;
    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return (
      <svg viewBox={`0 0 ${chartW} ${chartH + 10}`} className="w-full" style={{ maxHeight: 200 }}>
        <line x1={0} y1={targetY} x2={chartW} y2={targetY} stroke="#9CA3AF" strokeWidth={1} strokeDasharray="6 4" />
        <text x={chartW - 4} y={targetY - 4} textAnchor="end" className="fill-gray-400 text-[9px]">85% target</text>
        <path d={pathD} fill="none" stroke="#EA580C" strokeWidth={2.5} strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} className={p.sr >= target ? "fill-emerald-500" : "fill-neuro-orange"} />
            <text x={p.x} y={p.y - 8} textAnchor="middle" className="fill-neuro-navy text-[9px] font-bold">{p.sr}%</text>
          </g>
        ))}
      </svg>
    );
  };

  const EnergySparkline = () => {
    const data = chartWeeks;
    if (data.length === 0) return <p className="text-sm text-gray-400 text-center py-10">No data yet</p>;
    const chartW = 300;
    const chartH = 80;
    const points = data.map((w, i) => {
      const x = data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * (chartW - 40) + 20;
      const y = chartH - ((w.energyLevel / 5) * (chartH - 20)) - 10;
      return { x, y, level: w.energyLevel };
    });
    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return (
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ maxHeight: 100 }}>
        <path d={pathD} fill="none" stroke="#F97316" strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, i) => (
          <text key={i} x={p.x} y={p.y - 2} textAnchor="middle" className="text-[12px]">
            {ENERGY_EMOJIS[Math.min(Math.max(p.level - 1, 0), 4)]}
          </text>
        ))}
      </svg>
    );
  };

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Main Render
  // -----------------------------------------------------------------------

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          nav, header, .no-print, [data-mobile-nav], .fixed { display: none !important; }
          body { background: white !important; font-size: 12px; }
          .print-break { page-break-before: always; }
          .print-title::before { content: "KPI Monthly Report"; font-size: 24px; font-weight: 900; display: block; margin-bottom: 12px; }
        }
      `}</style>

      <div className="space-y-6 pb-32 md:pb-8 max-w-2xl mx-auto">
        {/* Error banner */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Toast */}
        {showToast && (
          <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold text-center shadow-lg animate-pulse">
            Logged! Keep the streak alive.
          </div>
        )}

        {/* ============================================================= */}
        {/* Section 1: Streak + Greeting */}
        {/* ============================================================= */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-bold text-neuro-navy">
            {streak.current > 0
              ? <span className="inline-flex items-center gap-1"><span className="text-base">🔥</span> {streak.current}-day streak</span>
              : "Start your streak!"}
          </span>
          <span className="text-sm text-gray-500">{getGreeting()}, Doc</span>
        </div>

        {/* ============================================================= */}
        {/* Section 2: Daily Check-In Card */}
        {/* ============================================================= */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {hasLogged ? (
            /* --- Already logged view --- */
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-neuro-navy">Today&apos;s Numbers</h2>
                <button
                  onClick={() => { populateFormFromEntry(todayEntry!); setEditing(true); }}
                  className="text-xs font-bold text-neuro-orange hover:underline no-print"
                >
                  Update
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Patient Visits</p>
                  <p className="text-xl font-black text-neuro-navy">
                    {todayEntry!.patient_visits}
                    {sevenDayAvg && <CompareIndicator current={todayEntry!.patient_visits} average={sevenDayAvg.patient_visits} />}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">New Patients</p>
                  <p className="text-xl font-black text-neuro-navy">
                    {todayEntry!.new_patients}
                    {sevenDayAvg && <CompareIndicator current={todayEntry!.new_patients} average={sevenDayAvg.new_patients} />}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Collections</p>
                  <p className="text-xl font-black text-neuro-navy">
                    {fmtDollars(todayEntry!.collections)}
                    {sevenDayAvg && <CompareIndicator current={todayEntry!.collections} average={sevenDayAvg.collections} />}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">No-Shows</p>
                  <p className="text-xl font-black text-neuro-navy">
                    {todayEntry!.no_shows}
                    {sevenDayAvg && <CompareIndicator current={todayEntry!.no_shows} average={sevenDayAvg.no_shows} invert />}
                  </p>
                </div>
              </div>
              <div className="mt-4 bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Energy Level</p>
                <p className="text-2xl">{ENERGY_EMOJIS[Math.min(Math.max(todayEntry!.energy_level - 1, 0), 4)]}</p>
              </div>
            </div>
          ) : (
            /* --- Log form view --- */
            <div className="p-5">
              <h2 className="text-lg font-black text-neuro-navy mb-4">Log Today&apos;s Numbers</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Patient Visits</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={patientVisits}
                    onChange={e => setPatientVisits(e.target.value)}
                    placeholder="0"
                    className="w-full min-h-[48px] py-4 px-4 text-lg font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">New Patients</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={newPatients}
                    onChange={e => setNewPatients(e.target.value)}
                    placeholder="0"
                    className="w-full min-h-[48px] py-4 px-4 text-lg font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Collections ($)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={collectionsDollars}
                    onChange={e => setCollectionsDollars(e.target.value)}
                    placeholder="0"
                    className="w-full min-h-[48px] py-4 px-4 text-lg font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">No-Shows</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={noShows}
                    onChange={e => setNoShows(e.target.value)}
                    placeholder="0"
                    className="w-full min-h-[48px] py-4 px-4 text-lg font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-neuro-orange/30 focus:border-neuro-orange outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Energy Level</label>
                  <div className="flex items-center gap-2 justify-between">
                    {ENERGY_EMOJIS.map((emoji, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEnergyLevel(i + 1)}
                        className={`flex-1 min-h-[48px] text-2xl rounded-xl border-2 transition-all ${
                          energyLevel === i + 1
                            ? "border-neuro-orange bg-neuro-orange/10 ring-2 ring-neuro-orange shadow-sm scale-105"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || energyLevel === 0}
                className="w-full mt-5 py-4 bg-neuro-orange text-white font-black text-lg rounded-xl hover:bg-neuro-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {submitting ? "Saving..." : "Log Today ✓"}
              </button>
            </div>
          )}
        </div>

        {/* ============================================================= */}
        {/* Section 3: Weekly Scorecard */}
        {/* ============================================================= */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-lg font-black text-neuro-navy mb-4">Weekly Scorecard</h2>
          {thisWeek ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wide font-bold">Last Week</span>
                <span className="text-xs text-gray-400 uppercase tracking-wide font-bold">This Week</span>
              </div>
              <WeekCompareRow
                label="Patient Visits"
                current={thisWeek.patientVisits}
                previous={lastWeek?.patientVisits ?? 0}
              />
              <WeekCompareRow
                label="New Patients"
                current={thisWeek.newPatients}
                previous={lastWeek?.newPatients ?? 0}
              />
              <WeekCompareRow
                label="Collections"
                current={thisWeek.collections}
                previous={lastWeek?.collections ?? 0}
                isCurrency
              />
              <WeekCompareRow
                label="Show Rate"
                current={showRate(thisWeek.patientVisits, thisWeek.noShows)}
                previous={lastWeek ? showRate(lastWeek.patientVisits, lastWeek.noShows) : 0}
                isRate
              />
              <WeekCompareRow
                label="Avg Energy"
                current={thisWeek.energyLevel}
                previous={lastWeek?.energyLevel ?? 0}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Log a few days to see your weekly scorecard.</p>
          )}
        </div>

        {/* ============================================================= */}
        {/* Section 4: Trend Charts */}
        {/* ============================================================= */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 print-break">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-neuro-navy">Trends</h2>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 no-print">
              {([30, 60, 90] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setChartRange(d)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    chartRange === d ? "bg-white text-neuro-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Collections bar chart */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Collections by Week</p>
              <CollectionsBarChart />
            </div>

            {/* Show rate line chart */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Show Rate</p>
              <ShowRateLineChart />
            </div>

            {/* Energy sparkline */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Energy Trend</p>
              <EnergySparkline />
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* Section 5: Network Benchmarks */}
        {/* ============================================================= */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-lg font-black text-neuro-navy mb-4">Network Benchmarks</h2>
          <p className="text-xs text-gray-400 mb-3">Compared to NeuroChiro network averages</p>
          <div className="space-y-3">
            {[
              {
                label: "Patient Visits/Week",
                yours: thisWeek?.patientVisits ?? 0,
                bench: NETWORK_BENCHMARKS.patientVisitsWeek,
                fmt: (v: number) => String(v),
              },
              {
                label: "New Patients/Week",
                yours: thisWeek?.newPatients ?? 0,
                bench: NETWORK_BENCHMARKS.newPatientsWeek,
                fmt: (v: number) => String(v),
              },
              {
                label: "Collections/Week",
                yours: thisWeek?.collections ?? 0,
                bench: NETWORK_BENCHMARKS.collectionsWeek,
                fmt: (v: number) => fmtDollars(v),
              },
              {
                label: "Show Rate",
                yours: thisWeek ? showRate(thisWeek.patientVisits, thisWeek.noShows) : 0,
                bench: NETWORK_BENCHMARKS.showRate,
                fmt: (v: number) => `${v}%`,
              },
            ].map(({ label, yours, bench, fmt }) => {
              const p = percentileLabel(yours, bench);
              return (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400">Network avg: {fmt(bench)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-neuro-navy">{fmt(yours)}</span>
                    {p.tier !== "none" && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        p.tier === "gold"
                          ? "bg-amber-100 text-amber-700"
                          : p.tier === "silver"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-blue-50 text-blue-600"
                      }`}>
                        {p.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================= */}
        {/* Section 6: Smart Alerts */}
        {/* ============================================================= */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-black text-neuro-navy">Insights</h2>
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`rounded-2xl p-4 text-sm font-medium ${
                  alert.type === "warning"
                    ? "bg-amber-50 border border-amber-200 text-amber-800"
                    : alert.type === "positive"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-blue-50 border border-blue-200 text-blue-800"
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ============================================================= */}
        {/* Section 7: Monthly Report Button */}
        {/* ============================================================= */}
        <div className="no-print">
          <button
            onClick={() => window.print()}
            className="w-full py-4 bg-neuro-navy text-white font-bold rounded-xl hover:bg-neuro-navy/90 transition-all active:scale-[0.98] text-sm"
          >
            Generate Monthly Report
          </button>
        </div>

        {/* ============================================================= */}
        {/* Fixed mobile "Log Today" button */}
        {/* ============================================================= */}
        {!hasLogged && !loading && (
          <div className="fixed bottom-20 left-4 right-4 md:hidden z-40 no-print">
            <button
              onClick={() => {
                document.querySelector<HTMLInputElement>("input[type=number]")?.focus();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full py-4 bg-neuro-orange text-white font-black text-lg rounded-xl shadow-xl shadow-neuro-orange/30 active:scale-[0.98] transition-all"
            >
              Log Today ✓
            </button>
          </div>
        )}
      </div>
    </>
  );
}
