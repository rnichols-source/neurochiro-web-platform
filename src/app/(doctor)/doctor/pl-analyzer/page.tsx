"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Lock,
  Printer,
  Save,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Info,
  Check,
  X,
  AlertTriangle,
  Target,
  PieChart,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { createDoctorProductCheckout } from "../purchase-actions";
import {
  PL_SECTIONS,
  SCALING_EXAMPLES,
  PROFIT_COACHING,
  getAllItems,
  type PLSection,
  type PLLineItem,
  type PLCategory,
} from "./pl-data";

// =============================================================================
// Types
// =============================================================================

interface PLState {
  activeTab: number;
  month: string;
  values: Record<string, number>;
  isPurchased: boolean;
  checkingPurchase: boolean;
  saving: boolean;
  saveMsg: string;
  expandedCategories: string[];
  selectedDonutSegment: string | null;
  snapshots: Array<{
    month: string;
    profit_margin: number;
    expenses: Record<string, number>;
    collections_cents: number;
  }>;
}

// =============================================================================
// Helpers
// =============================================================================

function fmt(n: number): string {
  return Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtPct(n: number): string {
  return n.toFixed(1) + "%";
}

function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
}

function parseNumericInput(raw: string): number {
  const negative = raw.includes("-");
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const val = cleaned ? parseFloat(cleaned) : 0;
  return negative ? -Math.abs(val) : val;
}

function getMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return d.toISOString().slice(0, 7);
}

function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m, 1);
  return d.toISOString().slice(0, 7);
}

function pctColor(userPct: number, minPct: number, maxPct: number): string {
  if (userPct >= minPct && userPct <= maxPct) return "#22c55e";
  const distMin = Math.abs(userPct - minPct);
  const distMax = Math.abs(userPct - maxPct);
  if ((userPct < minPct && distMin <= 2) || (userPct > maxPct && distMax <= 2))
    return "#eab308";
  return "#ef4444";
}

const DONUT_COLORS = [
  "#e97325",
  "#1a2744",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#6366f1",
  "#84cc16",
];

// =============================================================================
// SVG Components
// =============================================================================

function HealthGauge({ score, size = 200 }: { score: number; size?: number }) {
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size * 0.38;
  const strokeWidth = size * 0.08;
  const circumference = Math.PI * r;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const dashOffset = circumference * (1 - progress);

  let color = "#ef4444";
  let label = "Critical";
  if (score >= 85) {
    color = "#22c55e";
    label = "Exceptional";
  } else if (score >= 70) {
    color = "#3b82f6";
    label = "Strong";
  } else if (score >= 50) {
    color = "#22c55e";
    label = "Healthy";
  } else if (score >= 30) {
    color = "#eab308";
    label = "Needs Work";
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text
          x={cx}
          y={cy - 16}
          textAnchor="middle"
          fontSize={size * 0.18}
          fontWeight="800"
          fill="#1a2744"
        >
          {Math.round(score)}
        </text>
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontSize={size * 0.07}
          fontWeight="600"
          fill={color}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

function DonutChart({
  segments,
  centerLabel,
  centerValue,
  onSegmentClick,
  selectedSegment,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  centerLabel: string;
  centerValue: string;
  onSegmentClick: (label: string) => void;
  selectedSegment: string | null;
}) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 85;
  const strokeWidth = 35;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let currentOffset = 0;
  const paths = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dash = circumference * pct;
    const offset = circumference - currentOffset;
    currentOffset += dash;
    const isSelected = selectedSegment === seg.label;
    return { ...seg, dash, offset, isSelected };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map((p, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={p.color}
            strokeWidth={p.isSelected ? strokeWidth + 6 : strokeWidth}
            strokeDasharray={`${p.dash} ${circumference - p.dash}`}
            strokeDashoffset={p.offset}
            opacity={selectedSegment && !p.isSelected ? 0.4 : 1}
            style={{ cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => onSegmentClick(p.label)}
          />
        ))}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize="12"
          fill="#64748b"
          fontWeight="600"
        >
          {centerLabel}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize="18"
          fill="#1a2744"
          fontWeight="800"
        >
          {centerValue}
        </text>
      </svg>
      <div className="flex flex-wrap gap-2 mt-3 justify-center max-w-[300px]">
        {segments.map((seg, i) => (
          <button
            key={i}
            onClick={() => onSegmentClick(seg.label)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all ${
              selectedSegment === seg.label
                ? "border-[#1a2744] bg-slate-50 font-bold"
                : "border-slate-200"
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: seg.color }}
            />
            {seg.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TrendLine({
  data,
  target,
  width = 500,
  height = 180,
}: {
  data: Array<{ label: string; value: number }>;
  target?: number;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const pad = 40;
  const maxVal = Math.max(...data.map((d) => d.value), target || 0) * 1.1;
  const minVal = Math.min(...data.map((d) => d.value), 0);
  const range = maxVal - minVal || 1;
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data.map((d, i) => ({
    x: pad + i * stepX,
    y: pad + ((maxVal - d.value) / range) * (height - pad * 2),
    ...d,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      preserveAspectRatio="xMidYMid meet"
    >
      {[0, 10, 20, 30, 40, 50].map((v) => {
        if (v > maxVal + 5) return null;
        const y = pad + ((maxVal - v) / range) * (height - pad * 2);
        return (
          <g key={v}>
            <line
              x1={pad}
              y1={y}
              x2={width - pad}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4"
            />
            <text x={pad - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
              {v}%
            </text>
          </g>
        );
      })}
      {target !== undefined && (
        <line
          x1={pad}
          y1={pad + ((maxVal - target) / range) * (height - pad * 2)}
          x2={width - pad}
          y2={pad + ((maxVal - target) / range) * (height - pad * 2)}
          stroke="#22c55e"
          strokeWidth={1.5}
          strokeDasharray="6 3"
        />
      )}
      <path d={pathD} fill="none" stroke="#1a2744" strokeWidth={2.5} />
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={4}
            fill={p.value >= (target || 40) ? "#22c55e" : "#ef4444"}
            stroke="#fff"
            strokeWidth={1.5}
          />
          <text
            x={p.x}
            y={height - 6}
            textAnchor="middle"
            fontSize={9}
            fill="#64748b"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function DualTrendLine({
  incomeData,
  expenseData,
  width = 500,
  height = 180,
}: {
  incomeData: Array<{ label: string; value: number }>;
  expenseData: Array<{ label: string; value: number }>;
  width?: number;
  height?: number;
}) {
  if (incomeData.length < 2) return null;
  const pad = 50;
  const allValues = [...incomeData.map((d) => d.value), ...expenseData.map((d) => d.value)];
  const maxVal = Math.max(...allValues) * 1.1;
  const minVal = 0;
  const range = maxVal - minVal || 1;
  const stepX = (width - pad * 2) / (incomeData.length - 1);

  const incPoints = incomeData.map((d, i) => ({
    x: pad + i * stepX,
    y: pad + ((maxVal - d.value) / range) * (height - pad * 2),
    ...d,
  }));
  const expPoints = expenseData.map((d, i) => ({
    x: pad + i * stepX,
    y: pad + ((maxVal - d.value) / range) * (height - pad * 2),
    ...d,
  }));

  const incPath = incPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const expPath = expPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  // Shaded gap area
  const areaPath =
    incPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") +
    " " +
    expPoints
      .slice()
      .reverse()
      .map((p, i) => `${i === 0 ? "L" : "L"}${p.x},${p.y}`)
      .join(" ") +
    " Z";

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={areaPath} fill="rgba(34,197,94,0.1)" />
      <path d={incPath} fill="none" stroke="#22c55e" strokeWidth={2.5} />
      <path d={expPath} fill="none" stroke="#ef4444" strokeWidth={2.5} />
      {incPoints.map((p, i) => (
        <g key={"i" + i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#22c55e" />
          <text x={p.x} y={height - 6} textAnchor="middle" fontSize={9} fill="#64748b">
            {p.label}
          </text>
        </g>
      ))}
      {expPoints.map((p, i) => (
        <g key={"e" + i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#ef4444" />
        </g>
      ))}
      {/* Y-axis labels */}
      {[0, Math.round(maxVal / 4), Math.round(maxVal / 2), Math.round((maxVal * 3) / 4), Math.round(maxVal)].map(
        (v) => {
          const y = pad + ((maxVal - v) / range) * (height - pad * 2);
          return (
            <text key={v} x={pad - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">
              ${Math.round(v / 1000)}k
            </text>
          );
        }
      )}
    </svg>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function PLAnalyzerPage() {
  const [activeTab, setActiveTab] = useState(1);
  const [month, setMonth] = useState(getCurrentMonth());
  const [values, setValues] = useState<Record<string, number>>({});
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedDonutSegment, setSelectedDonutSegment] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<
    Array<{
      month: string;
      profit_margin: number;
      expenses: Record<string, number>;
      collections_cents: number;
    }>
  >([]);
  const [tooltipItem, setTooltipItem] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  // ---- Purchase check ----
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setCheckingPurchase(false);
          return;
        }
        const { data } = await (supabase as any)
          .from("course_purchases")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", "pl-analyzer")
          .limit(1);
        if (data && data.length > 0) setIsPurchased(true);

        const { data: snaps } = await (supabase as any)
          .from("pl_snapshots")
          .select("month, profit_margin, expenses, collections_cents")
          .eq("user_id", user.id)
          .order("month", { ascending: true })
          .limit(24);
        if (snaps) setSnapshots(snaps as any);
      } catch {
      } finally {
        setCheckingPurchase(false);
      }
    })();
  }, []);

  // ---- Load from localStorage on mount ----
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`pl_draft_${month}`);
      if (saved) {
        setValues(JSON.parse(saved));
      }
    } catch {}
  }, [month]);

  // ---- Auto-save draft to localStorage (debounced 500ms) ----
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`pl_draft_${month}`, JSON.stringify(valuesRef.current));
      } catch {}
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [values, month]);

  // ---- Computed values ----
  const incomeSection = PL_SECTIONS.find((s) => s.type === "income")!;
  const cogsSection = PL_SECTIONS.find((s) => s.type === "cogs")!;
  const expenseSection = PL_SECTIONS.find((s) => s.type === "expenses")!;

  const totalIncome = useMemo(() => {
    return incomeSection.categories
      .flatMap((c) => c.items)
      .reduce((sum, item) => sum + (values[item.id] || 0), 0);
  }, [values]);

  const totalCOGS = useMemo(() => {
    return cogsSection.categories
      .flatMap((c) => c.items)
      .reduce((sum, item) => sum + (values[item.id] || 0), 0);
  }, [values]);

  const grossProfit = totalIncome - totalCOGS;

  const totalExpenses = useMemo(() => {
    return expenseSection.categories
      .flatMap((c) => c.items)
      .reduce((sum, item) => sum + (values[item.id] || 0), 0);
  }, [values]);

  const netIncome = grossProfit - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;
  const hasAnyInput = useMemo(() => Object.values(values).some((v) => v !== 0), [values]);

  // ---- Pct for each item ----
  const itemPct = useCallback(
    (id: string) => {
      const val = values[id] || 0;
      return totalIncome > 0 ? (Math.abs(val) / totalIncome) * 100 : 0;
    },
    [values, totalIncome]
  );

  // ---- Health Score ----
  const healthScore = useMemo(() => {
    if (!hasAnyInput || totalIncome <= 0) return 0;

    // Profit margin points (40)
    let profitPts = 5;
    if (profitMargin >= 40) profitPts = 40;
    else if (profitMargin >= 35) profitPts = 35;
    else if (profitMargin >= 30) profitPts = 28;
    else if (profitMargin >= 25) profitPts = 20;
    else if (profitMargin >= 20) profitPts = 12;

    // Expense ratio points (30)
    const expCats = expenseSection.categories;
    let withinBenchmark = 0;
    let totalCats = 0;
    expCats.forEach((cat) => {
      const catTotal = cat.items.reduce((s, it) => s + Math.abs(values[it.id] || 0), 0);
      if (catTotal > 0) {
        totalCats++;
        const catPct = (catTotal / totalIncome) * 100;
        if (catPct >= cat.minPct && catPct <= cat.maxPct) withinBenchmark++;
      }
    });
    const expRatio = totalCats > 0 ? withinBenchmark / totalCats : 0;
    let expPts = 5;
    if (expRatio >= 1) expPts = 30;
    else if (expRatio >= 0.8) expPts = 24;
    else if (expRatio >= 0.6) expPts = 18;
    else if (expRatio >= 0.4) expPts = 12;

    // Revenue mix points (15)
    const piVal = values["4035"] || 0;
    const revPts = piVal > 0 ? 15 : 10;

    // COGS points (15)
    const cogsPct = (totalCOGS / totalIncome) * 100;
    let cogsPts = 5;
    if (cogsPct < 8) cogsPts = 15;
    else if (cogsPct < 12) cogsPts = 10;

    return profitPts + expPts + revPts + cogsPts;
  }, [hasAnyInput, totalIncome, profitMargin, values, totalCOGS]);

  // ---- Gap analysis items ----
  const gapItems = useMemo(() => {
    const items: Array<{
      category: PLCategory;
      catTotal: number;
      catPct: number;
      gap: number;
    }> = [];
    expenseSection.categories.forEach((cat) => {
      const catTotal = cat.items.reduce((s, it) => s + (values[it.id] || 0), 0);
      if (catTotal <= 0) return;
      const catPct = (catTotal / totalIncome) * 100;
      const gap = catPct - cat.maxPct;
      items.push({ category: cat, catTotal, catPct, gap });
    });
    return items.sort((a, b) => b.gap - a.gap);
  }, [values, totalIncome]);

  // ---- Top 3 problems ----
  const topProblems = useMemo(() => {
    const allExpenseItems = expenseSection.categories.flatMap((c) => c.items);
    const cogsItems = cogsSection.categories.flatMap((c) => c.items);
    const allItems = [...allExpenseItems, ...cogsItems];
    const problems: Array<{
      item: PLLineItem;
      actualPct: number;
      gapDollar: number;
    }> = [];
    allItems.forEach((item) => {
      const val = values[item.id] || 0;
      if (val <= 0) return;
      const pct = (Math.abs(val) / totalIncome) * 100;
      if (pct > item.maxPct && item.maxPct > 0) {
        const gapDollar = ((pct - item.midPct) / 100) * totalIncome;
        problems.push({ item, actualPct: pct, gapDollar });
      }
    });
    return problems.sort((a, b) => b.gapDollar - a.gapDollar).slice(0, 3);
  }, [values, totalIncome]);

  // ---- Quick wins ----
  const quickWins = useMemo(() => {
    const allExpenseItems = expenseSection.categories.flatMap((c) => c.items);
    const wins: Array<{
      item: PLLineItem;
      actualPct: number;
      savings: number;
    }> = [];
    allExpenseItems.forEach((item) => {
      const val = values[item.id] || 0;
      if (val <= 0) return;
      const pct = (Math.abs(val) / totalIncome) * 100;
      if (pct > item.maxPct && item.maxPct > 0) {
        const targetVal = (item.midPct / 100) * totalIncome;
        const savings = val - targetVal;
        if (savings > 0) wins.push({ item, actualPct: pct, savings });
      }
    });
    return wins.sort((a, b) => b.savings - a.savings).slice(0, 5);
  }, [values, totalIncome]);

  // ---- Handlers ----
  const handleValue = useCallback((id: string, raw: string) => {
    setValues((prev) => ({ ...prev, [id]: parseNumericInput(raw) }));
  }, []);

  const applyScalingExample = useCallback((example: (typeof SCALING_EXAMPLES)[0]) => {
    setValues(example.lineItems);
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  const changeMonth = useCallback(
    (dir: -1 | 1) => {
      const newMonth = dir === -1 ? prevMonth(month) : nextMonth(month);
      setMonth(newMonth);
      // Try loading from localStorage
      try {
        const saved = localStorage.getItem(`pl_draft_${newMonth}`);
        if (saved) {
          setValues(JSON.parse(saved));
          return;
        }
      } catch {}
      // Try loading from snapshot
      const snap = snapshots.find((s) => s.month === newMonth);
      if (snap && snap.expenses) {
        setValues(snap.expenses);
      } else {
        setValues({});
      }
    },
    [month, snapshots]
  );

  const saveSnapshot = useCallback(async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaveMsg("Please log in to save.");
        setSaving(false);
        return;
      }
      await (supabase as any).from("pl_snapshots").upsert(
        {
          user_id: user.id,
          month,
          collections_cents: Math.round(totalIncome * 100),
          expenses: values,
          profit_margin: Math.round(profitMargin * 100) / 100,
        },
        { onConflict: "user_id,month" }
      );
      setSaveMsg("Saved!");
      const { data: snaps } = await (supabase as any)
        .from("pl_snapshots")
        .select("month, profit_margin, expenses, collections_cents")
        .eq("user_id", user.id)
        .order("month", { ascending: true })
        .limit(24);
      if (snaps) setSnapshots(snaps as any);
    } catch {
      setSaveMsg("Error saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [month, totalIncome, values, profitMargin]);

  // ---- Purchase gate ----
  function PurchaseGate({ children }: { children: React.ReactNode }) {
    if (checkingPurchase) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400 text-sm">Checking access...</div>
        </div>
      );
    }
    if (!isPurchased) {
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
            <Lock className="w-10 h-10 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-[#1a2744] mb-2">
              Unlock P&L Intelligence
            </h3>
            <p className="text-slate-500 text-sm mb-4 text-center max-w-xs">
              Get health scoring, gap analysis, coaching notes, trend tracking, and print-ready reports.
            </p>
            <button
              onClick={async () => {
                const result = await createDoctorProductCheckout(
                  "pl-analyzer",
                  "Perfect P&L Analyzer",
                  2900
                );
                if (result.url) window.location.href = result.url;
                else alert(result.error);
              }}
              className="bg-[#e97325] text-white px-6 py-3 rounded-lg font-bold text-base hover:bg-[#d4631e] transition-colors"
            >
              Unlock P&L Intelligence &mdash; $29
            </button>
          </div>
          <div className="opacity-20 pointer-events-none">{children}</div>
        </div>
      );
    }
    return <>{children}</>;
  }

  // ============================================================================
  // TAB 1: Enter Numbers
  // ============================================================================

  function Tab1() {
    return (
      <div>
        {/* Summary bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 font-semibold uppercase mb-1">
              Total Income
            </div>
            <div className="text-xl font-extrabold text-green-600">{fmtMoney(totalIncome)}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 font-semibold uppercase mb-1">
              Gross Profit
            </div>
            <div className="text-xl font-extrabold text-blue-600">{fmtMoney(grossProfit)}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 font-semibold uppercase mb-1">
              Total Expenses
            </div>
            <div className="text-xl font-extrabold text-red-500">{fmtMoney(totalExpenses)}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 font-semibold uppercase mb-1">
              Net Income
            </div>
            <div
              className={`text-xl font-extrabold ${netIncome >= 0 ? "text-green-600" : "text-red-500"}`}
            >
              {fmtMoney(netIncome)}
            </div>
            {totalIncome > 0 && (
              <div className={`text-xs font-semibold ${profitMargin >= 0 ? "text-green-600" : "text-red-500"}`}>
                {fmtPct(profitMargin)} margin
              </div>
            )}
          </div>
        </div>

        {/* Month selector */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-base font-bold text-[#1a2744]">{getMonthLabel(month)}</span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scaling examples */}
        <div className="mb-6 no-print">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Load Example
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {SCALING_EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                onClick={() => applyScalingExample(ex)}
                className="text-left p-3 rounded-lg border border-slate-200 hover:border-[#e97325] hover:bg-orange-50 transition-all"
              >
                <div className="text-xs font-bold text-[#1a2744]">{ex.title}</div>
                <div className="text-[11px] text-slate-500">{ex.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Entry form sections */}
        {PL_SECTIONS.map((section) => {
          const borderColor =
            section.type === "income"
              ? "#22c55e"
              : section.type === "cogs"
                ? "#f59e0b"
                : "#ef4444";
          const headerBg =
            section.type === "income"
              ? "bg-green-50"
              : section.type === "cogs"
                ? "bg-amber-50"
                : "bg-red-50";

          return (
            <div key={section.id} className="mb-6">
              <div
                className={`${headerBg} px-4 py-2 rounded-t-lg mb-1`}
                style={{ borderLeft: `4px solid ${borderColor}` }}
              >
                <span className="text-sm font-extrabold uppercase tracking-wide" style={{ color: borderColor }}>
                  {section.label}
                </span>
              </div>

              {section.categories.map((cat) => {
                const isExpanded = expandedCategories.includes(cat.id);
                const catTotal = cat.items.reduce((s, it) => s + (values[it.id] || 0), 0);
                const catPct = totalIncome > 0 ? (Math.abs(catTotal) / totalIncome) * 100 : 0;

                return (
                  <div
                    key={cat.id}
                    className="border border-slate-200 rounded-lg mb-1 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">{cat.code}</span>
                        <span className="text-sm font-bold text-[#1a2744]">{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {catTotal !== 0 && (
                          <>
                            <span className="text-sm font-semibold tabular-nums text-[#1a2744]">
                              {fmtMoney(catTotal)}
                            </span>
                            {section.type !== "income" && (
                              <span
                                className="text-xs font-semibold"
                                style={{ color: pctColor(catPct, cat.minPct, cat.maxPct) }}
                              >
                                {fmtPct(catPct)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50">
                        {cat.items.map((item) => {
                          const val = values[item.id] || 0;
                          const pct = itemPct(item.id);
                          const showPct = val !== 0 && section.type !== "income";
                          const color = showPct
                            ? pctColor(pct, item.minPct, item.maxPct)
                            : "#64748b";

                          return (
                            <div key={item.id} className="px-4 py-2 border-t border-slate-100">
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] text-slate-400 font-mono w-8">
                                  {item.code}
                                </span>
                                <span className="text-sm text-[#1a2744] flex-1">
                                  {item.label}
                                </span>
                                <button
                                  onClick={() =>
                                    setTooltipItem(tooltipItem === item.id ? null : item.id)
                                  }
                                  className="text-slate-400 hover:text-[#e97325] transition-colors"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="0"
                                  value={
                                    val !== 0
                                      ? val < 0
                                        ? "-" + fmt(Math.abs(val))
                                        : fmt(val)
                                      : ""
                                  }
                                  onChange={(e) => handleValue(item.id, e.target.value)}
                                  className="w-28 text-right border border-slate-200 rounded-md px-2 py-1.5 text-sm tabular-nums bg-white focus:outline-none focus:ring-2 focus:ring-[#e97325] focus:border-transparent"
                                />
                                {showPct && (
                                  <span
                                    className="text-xs font-semibold w-12 text-right"
                                    style={{ color }}
                                  >
                                    {fmtPct(pct)}
                                  </span>
                                )}
                                {!showPct && <span className="w-12" />}
                              </div>
                              {showPct && (
                                <div className="ml-11 mt-0.5 text-[10px] text-slate-400">
                                  Benchmark: {item.minPct}% - {item.maxPct}%
                                </div>
                              )}
                              {tooltipItem === item.id && (
                                <div className="ml-11 mt-2 p-3 bg-[#1e293b] text-slate-100 text-xs rounded-lg max-w-md leading-relaxed">
                                  {item.tooltip}
                                  {val !== 0 && pct > item.maxPct && item.coachingOver && (
                                    <div className="mt-2 pt-2 border-t border-slate-600 text-orange-300">
                                      <strong>Coaching:</strong>{" "}
                                      {item.coachingOver.replace("[X]", fmtPct(pct))}
                                    </div>
                                  )}
                                  {val !== 0 && pct < item.minPct && item.minPct > 0 && item.coachingUnder && (
                                    <div className="mt-2 pt-2 border-t border-slate-600 text-blue-300">
                                      <strong>Coaching:</strong>{" "}
                                      {item.coachingUnder.replace("[X]", fmtPct(pct))}
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
                );
              })}
            </div>
          );
        })}

        {/* Save button */}
        <div className="flex items-center gap-4 mt-6 no-print">
          <button
            onClick={saveSnapshot}
            disabled={saving || !hasAnyInput}
            className="bg-[#e97325] text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-[#d4631e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save This Month"}
          </button>
          {saveMsg && (
            <span
              className={`text-sm font-semibold ${saveMsg === "Saved!" ? "text-green-500" : "text-red-500"}`}
            >
              {saveMsg}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // TAB 2: Analysis
  // ============================================================================

  function Tab2() {
    const donutSegments = expenseSection.categories
      .map((cat, i) => {
        const catTotal = cat.items.reduce((s, it) => s + (values[it.id] || 0), 0);
        return {
          label: cat.label,
          value: catTotal > 0 ? catTotal : 0,
          color: DONUT_COLORS[i % DONUT_COLORS.length],
        };
      })
      .filter((s) => s.value > 0);

    return (
      <PurchaseGate>
        <div>
          {!hasAnyInput && (
            <div className="text-center py-12 text-slate-400">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">Enter your numbers in Tab 1 first</p>
              <p className="text-sm mt-1">Analysis will appear here once you have data.</p>
            </div>
          )}

          {hasAnyInput && (
            <>
              {/* Health Score */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                <h3 className="text-base font-bold text-[#1a2744] mb-4 text-center">
                  Practice Health Score
                </h3>
                <HealthGauge score={healthScore} size={220} />
                <div className="grid grid-cols-4 gap-2 mt-4 text-center text-[11px]">
                  <div>
                    <div className="font-bold text-[#1a2744]">Profit</div>
                    <div className="text-slate-500">40 pts max</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#1a2744]">Expenses</div>
                    <div className="text-slate-500">30 pts max</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#1a2744]">Revenue Mix</div>
                    <div className="text-slate-500">15 pts max</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#1a2744]">COGS</div>
                    <div className="text-slate-500">15 pts max</div>
                  </div>
                </div>
              </div>

              {/* Donut chart */}
              {donutSegments.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                  <h3 className="text-base font-bold text-[#1a2744] mb-4 text-center">
                    Expense Breakdown
                  </h3>
                  <DonutChart
                    segments={donutSegments}
                    centerLabel="Net Income"
                    centerValue={fmtMoney(netIncome)}
                    onSegmentClick={(label) =>
                      setSelectedDonutSegment(selectedDonutSegment === label ? null : label)
                    }
                    selectedSegment={selectedDonutSegment}
                  />
                </div>
              )}

              {/* Gap analysis grid */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                <h3 className="text-base font-bold text-[#1a2744] mb-4">Gap Analysis</h3>
                <div className="grid gap-2">
                  {gapItems.map((g) => (
                    <div
                      key={g.category.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            g.gap > 0
                              ? "bg-red-500"
                              : g.gap > -2
                                ? "bg-yellow-400"
                                : "bg-green-500"
                          }`}
                        />
                        <div>
                          <div className="text-sm font-semibold text-[#1a2744]">
                            {g.category.label}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {fmtMoney(g.catTotal)} | Benchmark: {g.category.minPct}%-{g.category.maxPct}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-sm font-bold"
                          style={{
                            color: pctColor(g.catPct, g.category.minPct, g.category.maxPct),
                          }}
                        >
                          {fmtPct(g.catPct)}
                        </div>
                        {g.gap > 0 && (
                          <div className="text-[11px] text-red-500">+{fmtPct(g.gap)} over</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 3 Problems */}
              {topProblems.length > 0 && (
                <div className="bg-white border border-red-100 rounded-xl p-6 mb-6">
                  <h3 className="text-base font-bold text-red-600 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Top Problems
                  </h3>
                  <div className="space-y-4">
                    {topProblems.map((p, i) => (
                      <div key={p.item.id} className="p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-[#1a2744]">
                            #{i + 1} {p.item.label}
                          </span>
                          <span className="text-red-500 font-bold text-sm">
                            {fmtPct(p.actualPct)} (max {fmtPct(p.item.maxPct)})
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mb-2">
                          Gap: {fmtMoney(p.gapDollar)}/mo over midpoint
                        </div>
                        <div className="text-xs text-slate-700 leading-relaxed">
                          {p.item.coachingOver
                            ? p.item.coachingOver.replace("[X]", fmtPct(p.actualPct))
                            : "Review this line item for potential savings."}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Wins */}
              {quickWins.length > 0 && (
                <div className="bg-white border border-green-100 rounded-xl p-6">
                  <h3 className="text-base font-bold text-green-600 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Quick Wins
                  </h3>
                  <div className="space-y-3">
                    {quickWins.map((w) => (
                      <div
                        key={w.item.id}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#1a2744]">
                            {w.item.label}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Reduce from {fmtPct(w.actualPct)} to {fmtPct(w.item.midPct)}
                          </div>
                        </div>
                        <div className="text-green-600 font-bold text-sm">
                          Save {fmtMoney(w.savings)}/mo
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PurchaseGate>
    );
  }

  // ============================================================================
  // TAB 3: Trends
  // ============================================================================

  function Tab3() {
    const sortedSnapshots = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));

    const profitData = sortedSnapshots.map((s) => ({
      label: s.month.slice(5),
      value: s.profit_margin,
    }));

    const incomeData = sortedSnapshots.map((s) => ({
      label: s.month.slice(5),
      value: s.collections_cents / 100,
    }));

    const expenseData = sortedSnapshots.map((s) => {
      const inc = s.collections_cents / 100;
      const profit = (s.profit_margin / 100) * inc;
      return { label: s.month.slice(5), value: inc - profit };
    });

    // Category sparklines
    const categoryTrends = useMemo(() => {
      if (sortedSnapshots.length < 2) return [];
      return expenseSection.categories
        .map((cat) => {
          const pcts = sortedSnapshots.map((snap) => {
            if (!snap.expenses) return 0;
            const catTotal = cat.items.reduce(
              (s, it) => s + (snap.expenses[it.id] || 0),
              0
            );
            const income = snap.collections_cents / 100;
            return income > 0 ? (catTotal / income) * 100 : 0;
          });
          const first = pcts[0] || 0;
          const last = pcts[pcts.length - 1] || 0;
          const trend = last - first;
          return { category: cat, pcts, trend };
        })
        .filter((c) => c.pcts.some((p) => p > 0));
    }, [sortedSnapshots]);

    return (
      <PurchaseGate>
        <div>
          {snapshots.length < 2 ? (
            <div className="text-center py-16 text-slate-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">Save 2+ months to unlock trends</p>
              <p className="text-sm mt-1">
                Go to &ldquo;Enter Numbers&rdquo; and save at least 2 months of data.
              </p>
            </div>
          ) : (
            <>
              {/* Profit margin line */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                <h3 className="text-base font-bold text-[#1a2744] mb-1">
                  Profit Margin Trend
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Green dashed line = 40% target
                </p>
                <TrendLine data={profitData} target={40} />
              </div>

              {/* Revenue vs Expenses */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                <h3 className="text-base font-bold text-[#1a2744] mb-1">
                  Revenue vs Expenses
                </h3>
                <div className="flex gap-4 text-xs mb-4">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-green-500 inline-block" /> Revenue
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-red-500 inline-block" /> Expenses
                  </span>
                </div>
                <DualTrendLine incomeData={incomeData} expenseData={expenseData} />
              </div>

              {/* Category sparklines */}
              {categoryTrends.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="text-base font-bold text-[#1a2744] mb-4">
                    Category Trends
                  </h3>
                  <div className="space-y-3">
                    {categoryTrends.map((ct) => {
                      const max = Math.max(...ct.pcts, 1);
                      return (
                        <div
                          key={ct.category.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
                        >
                          <span className="text-sm font-semibold text-[#1a2744] w-40 truncate">
                            {ct.category.label}
                          </span>
                          <div className="flex-1 h-6 flex items-center">
                            <svg
                              width="100%"
                              height="24"
                              viewBox="0 0 100 24"
                              preserveAspectRatio="none"
                            >
                              <polyline
                                points={ct.pcts
                                  .map(
                                    (p, i) =>
                                      `${(i / (ct.pcts.length - 1)) * 100},${24 - (p / max) * 20}`
                                  )
                                  .join(" ")}
                                fill="none"
                                stroke={ct.trend > 1 ? "#ef4444" : ct.trend < -1 ? "#22c55e" : "#94a3b8"}
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold w-12 text-right">
                            {fmtPct(ct.pcts[ct.pcts.length - 1])}
                          </span>
                          {ct.trend > 1 && (
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">
                              <TrendingUp className="w-3 h-3 inline" />
                            </span>
                          )}
                          {ct.trend < -1 && (
                            <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">
                              <TrendingDown className="w-3 h-3 inline" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PurchaseGate>
    );
  }

  // ============================================================================
  // TAB 4: Report
  // ============================================================================

  function Tab4() {
    const profitCoachingNote = PROFIT_COACHING.find(
      (pc) => profitMargin >= pc.minPct && profitMargin < pc.maxPct
    );

    let scoreLabel = "Critical";
    if (healthScore >= 85) scoreLabel = "Exceptional";
    else if (healthScore >= 70) scoreLabel = "Strong";
    else if (healthScore >= 50) scoreLabel = "Healthy";
    else if (healthScore >= 30) scoreLabel = "Needs Work";

    return (
      <PurchaseGate>
        <div>
          {!hasAnyInput ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">Enter your numbers first</p>
              <p className="text-sm mt-1">Your report will be generated once data is entered.</p>
            </div>
          ) : (
            <div className="print-report">
              {/* Header */}
              <div className="bg-[#1a2744] text-white p-6 rounded-xl mb-6 print:rounded-none">
                <h2 className="text-xl font-extrabold">AlignLife Practice</h2>
                <h3 className="text-lg font-bold mt-1">Profit &amp; Loss Statement</h3>
                <p className="text-slate-300 text-sm mt-1">{getMonthLabel(month)}</p>
              </div>

              {/* Executive summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
                <h3 className="text-base font-bold text-[#1a2744] mb-3">Executive Summary</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase">Health Score</div>
                    <div className="text-lg font-extrabold text-[#1a2744]">
                      {healthScore}/100 ({scoreLabel})
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase">Total Income</div>
                    <div className="text-lg font-extrabold text-green-600">
                      {fmtMoney(totalIncome)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase">Net Income</div>
                    <div
                      className={`text-lg font-extrabold ${netIncome >= 0 ? "text-green-600" : "text-red-500"}`}
                    >
                      {fmtMoney(netIncome)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase">Profit Margin</div>
                    <div
                      className={`text-lg font-extrabold ${profitMargin >= 35 ? "text-green-600" : profitMargin >= 25 ? "text-yellow-500" : "text-red-500"}`}
                    >
                      {fmtPct(profitMargin)}
                    </div>
                  </div>
                </div>
                {profitCoachingNote && (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {profitCoachingNote.note}
                  </p>
                )}
              </div>

              {/* Full P&L */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                <h3 className="text-base font-bold text-[#1a2744] mb-4">
                  Full P&amp;L Statement
                </h3>
                {PL_SECTIONS.map((section) => (
                  <div key={section.id} className="mb-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 pb-1 border-b border-slate-100">
                      {section.label}
                    </div>
                    {section.categories.map((cat) => {
                      const catTotal = cat.items.reduce(
                        (s, it) => s + (values[it.id] || 0),
                        0
                      );
                      return (
                        <div key={cat.id} className="mb-3">
                          {cat.items.map((item) => {
                            const val = values[item.id] || 0;
                            if (val === 0) return null;
                            const pct = itemPct(item.id);
                            return (
                              <div
                                key={item.id}
                                className="flex justify-between py-1 text-sm"
                              >
                                <span className="text-slate-600">
                                  <span className="text-slate-400 text-[11px] font-mono mr-2">
                                    {item.code}
                                  </span>
                                  {item.label}
                                </span>
                                <span className="tabular-nums text-[#1a2744] font-semibold">
                                  {fmtMoney(val)}{" "}
                                  <span className="text-slate-400 text-xs ml-1">
                                    {section.type !== "income" ? fmtPct(pct) : ""}
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                          {catTotal !== 0 && (
                            <div className="flex justify-between py-1 text-sm font-bold border-t border-slate-100 mt-1">
                              <span className="text-[#1a2744]">
                                Total {cat.label}
                              </span>
                              <span className="tabular-nums text-[#1a2744]">
                                {fmtMoney(catTotal)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {section.type === "income" && (
                      <div className="flex justify-between py-2 text-sm font-extrabold bg-green-50 px-3 rounded-lg">
                        <span>Total Income</span>
                        <span className="text-green-600">{fmtMoney(totalIncome)}</span>
                      </div>
                    )}
                    {section.type === "cogs" && (
                      <div className="space-y-1">
                        <div className="flex justify-between py-2 text-sm font-extrabold bg-amber-50 px-3 rounded-lg">
                          <span>Total COGS</span>
                          <span className="text-amber-700">{fmtMoney(totalCOGS)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-sm font-extrabold bg-blue-50 px-3 rounded-lg">
                          <span>Gross Profit</span>
                          <span className="text-blue-600">{fmtMoney(grossProfit)}</span>
                        </div>
                      </div>
                    )}
                    {section.type === "expenses" && (
                      <div className="flex justify-between py-2 text-sm font-extrabold bg-red-50 px-3 rounded-lg">
                        <span>Total Expenses</span>
                        <span className="text-red-500">{fmtMoney(totalExpenses)}</span>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex justify-between py-3 text-base font-extrabold bg-[#1a2744] text-white px-4 rounded-lg mt-4">
                  <span>Net Income</span>
                  <span>
                    {fmtMoney(netIncome)} ({fmtPct(profitMargin)})
                  </span>
                </div>
              </div>

              {/* Benchmark comparison */}
              {gapItems.filter((g) => g.gap > 0).length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                  <h3 className="text-base font-bold text-[#1a2744] mb-4">
                    Benchmark Comparison (Out of Range)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 font-semibold text-slate-500">Category</th>
                          <th className="text-right py-2 font-semibold text-slate-500">Actual</th>
                          <th className="text-right py-2 font-semibold text-slate-500">
                            Benchmark
                          </th>
                          <th className="text-right py-2 font-semibold text-slate-500">Gap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gapItems
                          .filter((g) => g.gap > 0)
                          .map((g) => (
                            <tr key={g.category.id} className="border-b border-slate-50">
                              <td className="py-2 text-[#1a2744] font-semibold">
                                {g.category.label}
                              </td>
                              <td className="py-2 text-right text-red-500 font-semibold">
                                {fmtPct(g.catPct)}
                              </td>
                              <td className="py-2 text-right text-slate-500">
                                {g.category.minPct}%-{g.category.maxPct}%
                              </td>
                              <td className="py-2 text-right text-red-500 font-bold">
                                +{fmtPct(g.gap)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {(topProblems.length > 0 || quickWins.length > 0) && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                  <h3 className="text-base font-bold text-[#1a2744] mb-4">Recommendations</h3>
                  {topProblems.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-red-600 mb-2">Top Issues</h4>
                      {topProblems.map((p, i) => (
                        <div key={p.item.id} className="text-sm text-slate-700 mb-2">
                          <span className="font-bold">
                            {i + 1}. {p.item.label}
                          </span>{" "}
                          at {fmtPct(p.actualPct)} (max {fmtPct(p.item.maxPct)}) &mdash;{" "}
                          {fmtMoney(p.gapDollar)}/mo over midpoint
                        </div>
                      ))}
                    </div>
                  )}
                  {quickWins.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-green-600 mb-2">Quick Wins</h4>
                      {quickWins.map((w) => (
                        <div key={w.item.id} className="text-sm text-slate-700 mb-2">
                          <span className="font-bold">{w.item.label}:</span> Save{" "}
                          {fmtMoney(w.savings)}/mo by reducing to {fmtPct(w.item.midPct)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-xs text-slate-400 py-4 border-t border-slate-200">
                <p>AlignLife Practice</p>
                <p>Generated by NeuroChiro P&amp;L Analyzer | {new Date().toLocaleDateString()}</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6 no-print">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-[#1a2744] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#2d3f5e] transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={saveSnapshot}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#e97325] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#d4631e] transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={() => {
                    setValues({});
                    setActiveTab(1);
                  }}
                  className="flex items-center gap-2 border border-slate-200 text-[#1a2744] px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  New Month
                </button>
              </div>
            </div>
          )}
        </div>
      </PurchaseGate>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  const tabs = [
    { id: 1, label: "Enter Numbers", icon: DollarSign },
    { id: 2, label: "Analysis", icon: BarChart3 },
    { id: 3, label: "Trends", icon: TrendingUp },
    { id: 4, label: "Report", icon: FileText },
  ];

  return (
    <>
      <style>{`
        @media print {
          nav, aside, header, footer, .no-print { display: none !important; }
          body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-report { max-width: 100% !important; }
        }
      `}</style>

      <div className="max-w-[900px] mx-auto px-4 py-6">
        {/* Page header */}
        <div className="text-center mb-6 no-print">
          <div className="inline-flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-[#e97325]" />
            <h1 className="text-2xl font-extrabold text-[#1a2744]">P&amp;L Analyzer</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Enter your numbers from QuickBooks and see exactly where your money is going.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl no-print">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isGated = tab.id > 1 && !isPurchased && !checkingPurchase;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-white text-[#1a2744] shadow-sm"
                    : "text-slate-500 hover:text-[#1a2744]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {isGated && <Lock className="w-3 h-3 text-slate-400" />}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 1 && Tab1()}
        {activeTab === 2 && Tab2()}
        {activeTab === 3 && Tab3()}
        {activeTab === 4 && Tab4()}
      </div>
    </>
  );
}
