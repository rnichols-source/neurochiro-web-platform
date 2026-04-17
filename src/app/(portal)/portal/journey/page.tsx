"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Flame, Trophy, Calendar, Star, Lock, Pencil, Check, X } from "lucide-react";
import {
  getCheckinHistory,
  getCheckinStreak,
  addJourneyNote,
  isPremiumMember,
} from "../premium-actions";

const FREE_DAYS = 7;

type CheckinEntry = {
  date: string;
  sleep: number;
  stress: number;
  energy: number;
  pain: number;
  score: number;
  note: string | null;
};

type StreakData = {
  current: number;
  longest: number;
};

function scoreEmoji(score: number): string {
  if (score >= 80) return "\u{1F929}"; // star-struck
  if (score >= 60) return "\u{1F60A}"; // smile
  if (score >= 40) return "\u{1F610}"; // neutral
  if (score >= 20) return "\u{1F615}"; // confused
  return "\u{1F62B}"; // tired
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#84cc16";
  if (score >= 40) return "#f59e0b";
  if (score >= 20) return "#f97316";
  return "#ef4444";
}

function getMilestones(
  entry: CheckinEntry,
  index: number,
  allEntries: CheckinEntry[],
  streakCurrent: number
): string[] {
  const badges: string[] = [];
  if (index === 0) badges.push("First Check-in!");

  // Streak milestones based on position from the end
  const daysFromEnd = allEntries.length - index;
  if (daysFromEnd === 7 && streakCurrent >= 7) badges.push("7-Day Streak!");
  if (daysFromEnd === 30 && streakCurrent >= 30) badges.push("30 Days!");
  if (entry.score >= 80) badges.push("Score above 80!");

  return badges;
}

// ── SVG Sparkline Chart ─────────────────────────────────────────────────

function WellnessChart({ data }: { data: CheckinEntry[] }) {
  if (data.length < 2) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center text-sm text-gray-400">
        Need at least 2 check-ins to show a chart.
      </div>
    );
  }

  const width = 600;
  const height = 160;
  const padX = 30;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - (d.score / 100) * chartH,
    score: d.score,
    date: d.date,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  // Gradient stops based on score ranges
  const avgScore = data.reduce((a, d) => a + d.score, 0) / data.length;
  const gradientColor = scoreColor(avgScore);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={gradientColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((v) => {
        const y = padY + chartH - (v / 100) * chartH;
        return (
          <g key={v}>
            <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
            <text x={padX - 6} y={y + 3} textAnchor="end" className="text-[10px] fill-gray-400">
              {v}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke={gradientColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={scoreColor(p.score)} stroke="white" strokeWidth="1.5">
          <title>{`${p.date}: ${p.score}`}</title>
        </circle>
      ))}

      {/* Date labels (first, middle, last) */}
      {[0, Math.floor(points.length / 2), points.length - 1].map((idx) => (
        <text
          key={idx}
          x={points[idx].x}
          y={height - 2}
          textAnchor="middle"
          className="text-[9px] fill-gray-400"
        >
          {new Date(data[idx].date + "T12:00:00").toLocaleDateString("en", {
            month: "short",
            day: "numeric",
          })}
        </text>
      ))}
    </svg>
  );
}

// ── Mini bar for breakdown ──────────────────────────────────────────────

function MiniBreakdown({ entry }: { entry: CheckinEntry }) {
  const items = [
    { label: "Sleep", value: entry.sleep, max: 5, color: "bg-blue-400" },
    { label: "Stress", value: 6 - entry.stress, max: 5, color: "bg-purple-400" },
    { label: "Energy", value: entry.energy, max: 5, color: "bg-yellow-400" },
    { label: "Pain", value: 6 - entry.pain, max: 5, color: "bg-red-400" },
  ];

  return (
    <div className="flex gap-1.5 items-end">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-0.5">
          <div className="w-5 bg-gray-100 rounded-full overflow-hidden" style={{ height: 24 }}>
            <div
              className={`w-full ${item.color} rounded-full transition-all`}
              style={{ height: `${(item.value / item.max) * 100}%`, marginTop: `${100 - (item.value / item.max) * 100}%` }}
            />
          </div>
          <span className="text-[8px] text-gray-400 font-bold">{item.label[0]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Editable Note ───────────────────────────────────────────────────────

function EditableNote({
  date,
  initialNote,
  onSave,
}: {
  date: string;
  initialNote: string | null;
  onSave: (date: string, note: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initialNote || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await addJourneyNote(date, text);
      onSave(date, text);
    } catch {
      // Silently fail
    }
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-neuro-orange"
          autoFocus
        />
        <button
          onClick={save}
          disabled={saving}
          className="p-2 bg-neuro-navy text-white rounded-lg hover:bg-neuro-navy/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setText(initialNote || "");
          }}
          className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 hover:text-neuro-orange transition-colors"
    >
      <Pencil className="w-3 h-3" />
      {initialNote ? (
        <span className="text-gray-600 italic">{initialNote}</span>
      ) : (
        <span>Add a note</span>
      )}
    </button>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────

export default function JourneyPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<CheckinEntry[]>([]);
  const [streak, setStreak] = useState<StreakData>({ current: 0, longest: 0 });
  const [premium, setPremium] = useState(false);
  const [rangeDays, setRangeDays] = useState(30);

  const loadData = useCallback(async (days: number) => {
    try {
      const [historyData, streakData, premiumStatus] = await Promise.all([
        getCheckinHistory(days),
        getCheckinStreak(),
        isPremiumMember(),
      ]);
      setHistory(historyData || []);
      setStreak(streakData || { current: 0, longest: 0 });
      setPremium(premiumStatus);
    } catch {
      // Graceful fallback
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(rangeDays);
  }, [rangeDays, loadData]);

  const handleNoteSave = (date: string, note: string) => {
    setHistory((prev) =>
      prev.map((e) => (e.date === date ? { ...e, note } : e))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-neuro-orange animate-spin" />
      </div>
    );
  }

  // Split visible vs blurred data for non-premium
  const visibleHistory = premium ? history : history.slice(-FREE_DAYS);
  const blurredHistory = premium ? [] : history.slice(0, -FREE_DAYS);
  const totalCheckins = history.length;

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          My Journey
        </h1>
        <p className="text-gray-500 mt-1">Your health story, one day at a time.</p>
      </header>

      {/* Streak & Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Flame className={`w-5 h-5 ${streak.current > 0 ? "text-orange-500" : "text-gray-300"}`} />
          </div>
          <p className="text-2xl font-black text-neuro-navy">{streak.current}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Day Streak</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-black text-neuro-navy">{streak.longest}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Best Streak</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-neuro-navy">{totalCheckins}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Check-ins</p>
        </div>
      </div>

      {/* Wellness Score Chart */}
      {history.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-neuro-navy">Wellness Score</h2>
            <div className="flex gap-1">
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setRangeDays(d)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    rangeDays === d
                      ? "bg-neuro-navy text-white"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <WellnessChart data={premium ? history : visibleHistory} />
        </section>
      )}

      {/* Timeline */}
      <section>
        <h2 className="font-black text-neuro-navy mb-4">Timeline</h2>

        {/* Blurred preview for non-premium */}
        {!premium && blurredHistory.length > 0 && (
          <div className="relative mb-4">
            <div className="space-y-3 filter blur-sm pointer-events-none select-none">
              {blurredHistory.slice(-3).map((entry) => (
                <div
                  key={entry.date}
                  className="bg-white rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{scoreEmoji(entry.score)}</span>
                    <div>
                      <p className="font-bold text-neuro-navy text-sm">{entry.date}</p>
                      <p className="text-xs text-gray-400">Score: {entry.score}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-neuro-orange/20 p-6 text-center shadow-lg max-w-xs">
                <Lock className="w-6 h-6 text-neuro-orange mx-auto mb-2" />
                <p className="font-black text-neuro-navy text-sm mb-1">
                  See your full journey
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  Unlock your complete health history and trends.
                </p>
                <p className="text-sm font-bold text-neuro-navy mb-3">$9/month</p>
                <button className="px-5 py-2.5 bg-neuro-orange text-white rounded-xl font-bold text-xs hover:bg-neuro-orange/90 transition-all">
                  Start Free Trial
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visible timeline entries */}
        <div className="relative">
          {/* Vertical line */}
          {visibleHistory.length > 1 && (
            <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gray-100" />
          )}

          <div className="space-y-4">
            {[...visibleHistory].reverse().map((entry, idx) => {
              const milestones = getMilestones(
                entry,
                history.indexOf(entry),
                history,
                streak.current
              );
              const dateObj = new Date(entry.date + "T12:00:00");
              const isToday = entry.date === new Date().toISOString().split("T")[0];

              return (
                <div key={entry.date} className="relative flex gap-4 pl-2">
                  {/* Timeline dot */}
                  <div
                    className="shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm z-10"
                    style={{
                      borderColor: scoreColor(entry.score),
                      backgroundColor: `${scoreColor(entry.score)}15`,
                    }}
                  >
                    <span className="text-xs">{scoreEmoji(entry.score)}</span>
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 bg-white rounded-xl border p-4 ${
                      isToday ? "border-neuro-orange/30 shadow-sm" : "border-gray-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-neuro-navy text-sm">
                            {isToday
                              ? "Today"
                              : dateObj.toLocaleDateString("en", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                          </p>
                          {isToday && (
                            <span className="text-[10px] font-black uppercase tracking-wide text-neuro-orange bg-neuro-orange/10 px-2 py-0.5 rounded-full">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Wellness: <span className="font-bold" style={{ color: scoreColor(entry.score) }}>{entry.score}</span>/100
                        </p>
                      </div>
                      <MiniBreakdown entry={entry} />
                    </div>

                    {/* Milestones */}
                    {milestones.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {milestones.map((badge) => (
                          <span
                            key={badge}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full"
                          >
                            <Star className="w-3 h-3" />
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Note */}
                    <EditableNote
                      date={entry.date}
                      initialNote={entry.note}
                      onSave={handleNoteSave}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {visibleHistory.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-black text-gray-400 mb-2">No check-ins yet</h3>
            <p className="text-gray-500 text-sm mb-4">
              Start your daily check-ins to build your health journey.
            </p>
            <a
              href="/portal/track"
              className="inline-flex px-5 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm hover:bg-neuro-orange/90 transition-all"
            >
              Start First Check-in
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
