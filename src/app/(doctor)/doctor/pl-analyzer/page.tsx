"use client";

import UpgradeGate from "@/components/doctor/UpgradeGate";
import PageHeader from "@/components/portal/PageHeader";
import ExampleBanner from "@/components/portal/ExampleBanner";
import { getDoctorTimezone } from "@/lib/doctor-timezone";
import { matchesPlExample, plainPlValues } from "@/lib/portal/tool-examples";
import {
  benchmarkTone,
  buildStatement,
  categorySeries,
  coachingNote,
  coachingText,
  compareToSaved,
  currencyForCountry,
  currentMonthInZone,
  extraTimeZone,
  figuresFromSnapshot,
  figuresFromStatement,
  formatCompactMoney,
  formatDateInZone,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  gapAnalysis,
  healthScore,
  isContraIncome,
  isMonthKey,
  linePercent,
  moneyInputText,
  monthLabel,
  normalizeValues,
  parseMoneyInput,
  quickWins,
  shiftMonth,
  shortMonthLabel,
  topProblems,
  valuesMatch,
  yearToDate,
  type BenchmarkTone,
  type MonthFigures,
  type StoredSnapshot,
} from "@/lib/pl/calc";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Info,
  Printer,
  Save,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { saveToolData, loadToolData } from "../tool-data-actions";
import { getPortalShellData } from "../portal-actions";
import { deletePlSnapshot, loadPlSnapshots, savePlSnapshot, type PlSnapshotRecord } from "./actions";
import { PL_SECTIONS, PROFIT_COACHING, SCALING_EXAMPLES } from "./pl-data";

export type PlPreview = {
  clinicName: string;
  country: string;
  state: string | null;
  timeZone: string;
  now: string;
  drafts: Record<string, Record<string, number>>;
  snapshots: PlSnapshotRecord[];
};

const TONE: Record<BenchmarkTone, string> = {
  good: "text-portal-success",
  close: "text-portal-warning",
  bad: "text-portal-danger",
};

const DONUT_COLORS = ["#e97325", "#1a2744", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#14b8a6", "#f59e0b", "#6366f1", "#84cc16"];

function draftKey(month: string) {
  return `pl_draft_${month}`;
}

function openCategories(values: Record<string, number>) {
  const open = PL_SECTIONS.flatMap((section) =>
    section.categories.filter((category) => category.items.some((item) => values[item.id])).map((category) => category.id),
  );
  return open.length ? open : ["4000-income"];
}

function practiceZone(state: string | null, country: string | null, browserZone: string) {
  return getDoctorTimezone(state, country) || extraTimeZone(country) || browserZone || "UTC";
}

function MoneyField({
  label,
  value,
  contra,
  onValue,
}: {
  label: string;
  value: number;
  contra: boolean;
  onValue: (amount: number) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <input
        aria-label={label}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        value={text !== null ? text : moneyInputText(value)}
        onFocus={() => setText(value ? moneyInputText(value) : "")}
        onChange={(event) => {
          const parsed = parseMoneyInput(event.target.value);
          if (!parsed.ok) {
            setError(parsed.error);
            return;
          }
          setError(null);
          setText(parsed.text);
          onValue(parsed.amount);
        }}
        onBlur={() => {
          const parsed = parseMoneyInput(text ?? moneyInputText(value));
          const amount = parsed.ok ? parsed.amount : value;
          onValue(contra && amount > 0 ? -amount : amount);
          setText(null);
          setError(parsed.ok ? null : parsed.error);
        }}
        className="w-full min-h-11 text-right border border-portal-border rounded-lg px-3 text-base tabular-nums text-portal-ink bg-white focus:outline-none focus:ring-2 focus:ring-portal-accent"
      />
      {error ? <p className="mt-1 text-sm text-portal-danger">{error}</p> : null}
    </div>
  );
}

function HealthGauge({ score }: { score: number }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size * 0.38;
  const strokeWidth = size * 0.08;
  const circumference = Math.PI * r;
  const safe = Number.isFinite(score) ? Math.min(Math.max(score, 0), 100) : 0;
  const dashOffset = circumference * (1 - safe / 100);
  let color = "#c0362c";
  let label = "Critical";
  if (safe >= 85) { color = "#1f8a4c"; label = "Exceptional"; }
  else if (safe >= 70) { color = "#2a5d8f"; label = "Strong"; }
  else if (safe >= 50) { color = "#1f8a4c"; label = "Healthy"; }
  else if (safe >= 30) { color = "#a86400"; label = "Needs work"; }

  return (
    <div className="flex flex-col items-center">
      <svg width="100%" height="140" viewBox={`0 0 ${size} ${size * 0.65}`} role="img" aria-label={`Health score ${Math.round(safe)}, ${label}`}>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#e3e8ed" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize="32" fontWeight="700" fill="#16202a">{Math.round(safe)}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="14" fontWeight="600" fill={color}>{label}</text>
      </svg>
    </div>
  );
}

function DonutChart({
  segments,
  centerLabel,
  centerValue,
  selected,
  onSelect,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  centerLabel: string;
  centerValue: string;
  selected: string | null;
  onSelect: (label: string) => void;
}) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 85;
  const strokeWidth = 32;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const paths = segments.reduce<Array<{ label: string; value: number; color: string; dash: number; offset: number }>>((items, segment) => {
    const used = items.reduce((sum, item) => sum + item.dash, 0);
    const pct = total > 0 ? segment.value / total : 0;
    const dash = circumference * pct;
    return [...items, { ...segment, dash, offset: circumference - used }];
  }, []);

  return (
    <div className="flex flex-col items-center">
      <svg width="100%" height="240" viewBox={`0 0 ${size} ${size}`}>
        {paths.map((path) => (
          <circle
            key={path.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={path.color}
            strokeWidth={selected === path.label ? strokeWidth + 6 : strokeWidth}
            strokeDasharray={`${path.dash} ${circumference - path.dash}`}
            strokeDashoffset={path.offset}
            opacity={selected && selected !== path.label ? 0.4 : 1}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fill="#3d4a57">{centerLabel}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="16" fontWeight="700" fill="#16202a">{centerValue}</text>
      </svg>
      <div className="flex flex-wrap gap-2 justify-center">
        {segments.map((segment) => (
          <button
            key={segment.label}
            type="button"
            onClick={() => onSelect(segment.label)}
            className={`min-h-11 flex items-center gap-2 px-3 rounded-full border text-sm ${selected === segment.label ? "border-portal-ink font-bold" : "border-portal-border"}`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: segment.color }} />
            {segment.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TrendChart({
  points,
  currency,
}: {
  points: Array<{ label: string; income: number; costs: number; margin: number | null }>;
  currency: string;
}) {
  if (points.length < 2) return null;
  const width = 520;
  const height = 200;
  const pad = 48;
  const margins = points.map((point) => point.margin ?? 0);
  const maxVal = Math.max(...margins, 40, 0);
  const minVal = Math.min(...margins, 0);
  const range = maxVal - minVal || 1;
  const step = (width - pad * 2) / (points.length - 1);
  const yFor = (value: number) => pad + ((maxVal - value) / range) * (height - pad * 2);
  const labelStep = points.length > 8 ? Math.ceil(points.length / 6) : 1;
  const ticks = [0, 20, 40];
  if (minVal < 0) ticks.unshift(Math.round(minVal));
  if (maxVal > 40) ticks.push(Math.round(maxVal));

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Profit margin by month">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={pad} y1={yFor(tick)} x2={width - pad} y2={yFor(tick)} stroke="#e3e8ed" />
          <text x={pad - 8} y={yFor(tick) + 4} textAnchor="end" fontSize="12" fill="#3d4a57">{tick}%</text>
        </g>
      ))}
      <line x1={pad} y1={yFor(40)} x2={width - pad} y2={yFor(40)} stroke="#1f8a4c" strokeDasharray="6 3" />
      <polyline
        fill="none"
        stroke="#16202a"
        strokeWidth="2.5"
        points={points.map((point, index) => `${pad + index * step},${yFor(point.margin ?? 0)}`).join(" ")}
      />
      {points.map((point, index) => (
        <g key={point.label}>
          <circle cx={pad + index * step} cy={yFor(point.margin ?? 0)} r="4" fill={(point.margin ?? 0) >= 40 ? "#1f8a4c" : "#c0362c"} />
          {(index % labelStep === 0 || index === points.length - 1) && (
            <text x={pad + index * step} y={height - 8} textAnchor="middle" fontSize="12" fill="#3d4a57">{point.label}</text>
          )}
        </g>
      ))}
      <text x={width - pad} y={16} textAnchor="end" fontSize="12" fill="#1f8a4c">40% target</text>
      <title>{points.map((point) => `${point.label}: income ${formatMoney(point.income, currency)}, costs ${formatMoney(point.costs, currency)}`).join(". ")}</title>
    </svg>
  );
}

export default function PLAnalyzerPage() {
  return (
    <UpgradeGate feature="P&L Analyzer" requiredTier="pro" description="Enter your monthly numbers and see income, costs, profit, and how this month compares.">
      <PLAnalyzerContent />
    </UpgradeGate>
  );
}

export function PLAnalyzerContent({ preview }: { preview?: PlPreview }) {
  const previewRef = useRef(preview);
  const browserZone = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
    catch { return "UTC"; }
  }, []);
  const initialZone = preview ? preview.timeZone : browserZone;
  const initialNow = preview ? new Date(preview.now) : new Date();

  const [timeZone, setTimeZone] = useState(initialZone);
  const [zoneSource, setZoneSource] = useState(preview ? "clinic" : "device");
  const [currency, setCurrency] = useState(preview ? currencyForCountry(preview.country) : "USD");
  const [clinicName, setClinicName] = useState(preview?.clinicName || "Your practice");
  const [month, setMonth] = useState(currentMonthInZone(initialZone, initialNow));
  const [values, setValues] = useState<Record<string, number>>(preview?.drafts[currentMonthInZone(initialZone, initialNow)] || {});
  const [snapshots, setSnapshots] = useState<PlSnapshotRecord[]>(preview?.snapshots || []);
  const [activeTab, setActiveTab] = useState(1);
  const [expanded, setExpanded] = useState<string[]>(openCategories(preview?.drafts[currentMonthInZone(initialZone, initialNow)] || {}));
  const [tooltipItem, setTooltipItem] = useState<string | null>(null);
  const [exampleId, setExampleId] = useState<string | null>(null);
  const [exampleKept, setExampleKept] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [draftReady, setDraftReady] = useState(Boolean(preview));
  const [historyReady, setHistoryReady] = useState(Boolean(preview));
  const [draftStatus, setDraftStatus] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [selectedDonut, setSelectedDonut] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [settingsNote, setSettingsNote] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedMonth = useRef<string | null>(preview ? currentMonthInZone(initialZone, initialNow) : null);
  const monthTouched = useRef(Boolean(preview));
  const snapshotsRef = useRef(snapshots);
  const valuesRef = useRef(values);
  const exampleRef = useRef(exampleId);
  const payloadRef = useRef<{ month: string; data: Record<string, unknown> } | null>(null);
  const previewDrafts = useRef<Record<string, Record<string, unknown>>>(preview?.drafts || {});
  snapshotsRef.current = snapshots;
  valuesRef.current = values;
  exampleRef.current = exampleId;

  const statement = useMemo(() => buildStatement(values, PL_SECTIONS), [values]);
  const liveFigures = useMemo(() => {
    if (!draftReady) {
      const saved = snapshots.find((item) => item.month === month);
      if (saved) return figuresFromSnapshot(saved, PL_SECTIONS);
    }
    return figuresFromStatement(month, statement, currency);
  }, [draftReady, snapshots, month, statement, currency]);
  const savedFigures = useMemo(
    () => snapshots.map((snapshot) => figuresFromSnapshot(snapshot, PL_SECTIONS)),
    [snapshots],
  );
  const ytd = useMemo(() => yearToDate(month, savedFigures, liveFigures), [month, savedFigures, liveFigures]);
  const lastMonth = compareToSaved(liveFigures, savedFigures, shiftMonth(month, -1));
  const lastYear = compareToSaved(liveFigures, savedFigures, shiftMonth(month, -12));
  const score = useMemo(() => healthScore(statement, PL_SECTIONS), [statement]);
  const expenseCoverage = useMemo(() => {
    const categories = PL_SECTIONS.find((section) => section.type === "expenses")?.categories || [];
    const filled = categories.filter((category) => category.items.some((item) => statement.values[item.id])).length;
    return { filled, total: categories.length, thin: filled < Math.ceil(categories.length / 2) };
  }, [statement]);
  const gaps = useMemo(() => gapAnalysis(statement, PL_SECTIONS), [statement]);
  const problems = useMemo(() => topProblems(statement, PL_SECTIONS), [statement]);
  const wins = useMemo(() => quickWins(statement, PL_SECTIONS), [statement]);
  const currentSnapshot = snapshots.find((snapshot) => snapshot.month === month) || null;
  const historyDiffers = Boolean(currentSnapshot && !valuesMatch(currentSnapshot.expenses, statement.values));

  const persistDraft = useCallback(async (monthKey: string, data: Record<string, unknown> | null) => {
    if (previewRef.current) {
      if (data == null) delete previewDrafts.current[monthKey];
      else previewDrafts.current[monthKey] = data;
      setDraftStatus("Saved");
      setDraftError(null);
      return;
    }
    const result = await saveToolData(draftKey(monthKey), data);
    if (!result?.success) {
      setDraftError("Your latest change could not be saved. Check your connection and keep this page open.");
      setDraftStatus("");
      return;
    }
    setDraftError(null);
    setDraftStatus("Saved");
  }, []);

  useEffect(() => {
    if (previewRef.current) return;
    let cancelled = false;
    getPortalShellData().then((shell) => {
      if (cancelled) return;
      const doctor = shell?.doctor;
      if (!doctor) {
        setSettingsNote("Clinic settings did not load. Amounts are in US dollars and months follow this device.");
        return;
      }
      const zone = practiceZone(doctor.state, doctor.country, browserZone);
      setTimeZone(zone);
      setZoneSource(getDoctorTimezone(doctor.state, doctor.country) || extraTimeZone(doctor.country) ? "clinic" : "device");
      setCurrency(currencyForCountry(doctor.country));
      setClinicName(doctor.clinic_name?.trim() || "Your practice");
      if (!monthTouched.current) setMonth(currentMonthInZone(zone));
    }).catch(() => {
      if (!cancelled) setSettingsNote("Clinic settings did not load. Amounts are in US dollars and months follow this device.");
    });
    return () => { cancelled = true; };
  }, [browserZone]);

  useEffect(() => {
    if (previewRef.current) return;
    let cancelled = false;
    loadPlSnapshots().then((result) => {
      if (cancelled) return;
      setSnapshots(result.snapshots);
      setHistoryError(result.error);
      setHistoryReady(true);
    }).catch(() => {
      if (cancelled) return;
      setHistoryError("Saved months could not be loaded. You can still enter this month.");
      setHistoryReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    let cancelled = false;
    loadedMonth.current = null;
    setDraftReady(false);
    setSaveMsg("");
    setPendingDelete(null);
    const requested = month;
    const apply = (saved: Record<string, unknown> | null) => {
      if (cancelled) return;
      const match = saved && saved.__cleared === true ? null : matchesPlExample(saved, SCALING_EXAMPLES);
      const plain = saved && saved.__cleared === true ? {} : saved ? plainPlValues(saved) : {};
      setExampleId(match);
      setExampleKept(Boolean(match));
      setValues(plain);
      setExpanded(openCategories(normalizeValues(plain)));
      loadedMonth.current = requested;
      setDraftReady(true);
    };
    const fromSnapshot = () => {
      const snap = snapshotsRef.current.find((item) => item.month === requested);
      if (snap && Object.keys(snap.expenses || {}).length) apply(snap.expenses);
      else apply(null);
    };
    if (previewRef.current) {
      const draft = previewDrafts.current[requested];
      const plain = draft ? plainPlValues(draft) : {};
      if (draft && (draft.__cleared === true || Object.keys(plain).length > 0 || typeof draft.__example === "string")) apply(draft);
      else fromSnapshot();
      return () => { cancelled = true; };
    }
    loadToolData(draftKey(requested)).then((cloud) => {
      if (cancelled) return;
      const saved = cloud && typeof cloud === "object" ? cloud as Record<string, unknown> : null;
      const plain = saved ? plainPlValues(saved) : {};
      if (saved && (saved.__cleared === true || Object.keys(plain).length > 0 || typeof saved.__example === "string")) apply(saved);
      else fromSnapshot();
    }).catch(() => {
      if (!cancelled) {
        setDraftError("This month could not be loaded. Try again in a moment.");
        fromSnapshot();
      }
    });
    return () => {
      cancelled = true;
      const payload = payloadRef.current;
      if (payload && loadedMonth.current === payload.month) void persistDraft(payload.month, payload.data);
    };
  }, [month, historyReady, persistDraft]);

  useEffect(() => {
    if (!draftReady || loadedMonth.current !== month) return;
    const plain = normalizeValues(valuesRef.current);
    const data = exampleRef.current
      ? { ...plain, __example: exampleRef.current }
      : Object.keys(plain).length ? plain : { __cleared: true };
    payloadRef.current = { month, data };
    setDraftStatus("Saving...");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistDraft(month, data);
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [values, exampleId, month, draftReady, persistDraft]);

  const changeMonth = (delta: number) => {
    monthTouched.current = true;
    setDraftReady(false);
    setValues({});
    setMonth((current) => shiftMonth(current, delta));
  };

  const handleValue = (id: string, amount: number) => {
    setValues((current) => ({ ...current, [id]: amount }));
  };

  const applyExample = (example: (typeof SCALING_EXAMPLES)[number]) => {
    setExampleId(example.id);
    setExampleKept(false);
    setShowExamples(false);
    setValues(example.lineItems);
    setExpanded(openCategories(example.lineItems));
  };

  const clearExample = () => {
    setExampleId(null);
    setExampleKept(false);
    setShowExamples(false);
    setValues({});
    const cleared = { __cleared: true };
    payloadRef.current = { month, data: cleared };
    void persistDraft(month, cleared);
  };

  const keepExample = () => {
    const plain = normalizeValues(valuesRef.current);
    if (!exampleKept && exampleId) {
      setExampleKept(true);
      payloadRef.current = { month, data: { ...plain, __example: exampleId } };
      void persistDraft(month, { ...plain, __example: exampleId });
      return;
    }
    setExampleId(null);
    setExampleKept(false);
    setValues(plain);
    payloadRef.current = { month, data: plain };
    void persistDraft(month, plain);
  };

  const saveMonth = async () => {
    if (exampleId) {
      setSaveMsg("This is sample data. Clear it, or mark it as your data, before saving the month.");
      return;
    }
    if (!statement.hasAnyInput) {
      setSaveMsg("Enter at least one number first.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    if (previewRef.current) {
      const next = snapshots.filter((item) => item.month !== month).concat([{
        month,
        expenses: statement.values,
        collections_cents: Math.round(statement.totalIncome * 100),
        profit_margin: statement.profitMargin ?? 0,
        net_income_cents: Math.round(statement.netIncome * 100),
        currency,
      }]).sort((a, b) => a.month.localeCompare(b.month));
      setSnapshots(next);
      setSaveMsg(currentSnapshot ? "Updated this saved month." : "Saved this month.");
      setSaving(false);
      return;
    }
    const result = await savePlSnapshot({ month, values: statement.values, currency });
    setSaving(false);
    if (!result.ok) {
      setSaveMsg(result.error);
      return;
    }
    setSnapshots(result.snapshots);
    setSaveMsg(currentSnapshot ? "Updated this saved month." : "Saved this month.");
  };

  const removeMonth = async (target: string) => {
    if (!isMonthKey(target)) return;
    setSaving(true);
    setSaveMsg("");
    if (previewRef.current) {
      setSnapshots((current) => current.filter((item) => item.month !== target));
      if (target === month) {
        setValues({});
        setExampleId(null);
        delete previewDrafts.current[target];
      }
      setPendingDelete(null);
      setSaving(false);
      setSaveMsg("Deleted that saved month.");
      return;
    }
    const result = await deletePlSnapshot(target);
    if (!result.ok) {
      setSaving(false);
      setSaveMsg(result.error);
      return;
    }
    if (target === month) {
      setValues({});
      setExampleId(null);
      const cleared = { __cleared: true };
      payloadRef.current = { month, data: cleared };
      await persistDraft(target, cleared);
    }
    setSnapshots(result.snapshots);
    setPendingDelete(null);
    setSaving(false);
    setSaveMsg("Deleted that saved month.");
  };

  const trendPoints = useMemo(() => {
    return [...snapshots]
      .filter((snapshot) => isMonthKey(snapshot.month))
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((snapshot) => {
        const figures = figuresFromSnapshot(snapshot, PL_SECTIONS);
        return {
          label: shortMonthLabel(snapshot.month),
          income: figures.income,
          costs: (Math.round(figures.cogs * 100) + Math.round(figures.expenses * 100)) / 100,
          margin: figures.margin,
        };
      });
  }, [snapshots]);
  const trends = useMemo(() => categorySeries(snapshots as StoredSnapshot[], PL_SECTIONS), [snapshots]);

  const tabs = [
    { id: 1, label: "Numbers", icon: DollarSign },
    { id: 2, label: "Analysis", icon: BarChart3 },
    { id: 3, label: "Trends", icon: TrendingUp },
    { id: 4, label: "Report", icon: FileText },
  ];

  function Summary() {
    const cards = [
      ["Total income", statement.totalIncome, "text-portal-success"],
      ["Gross profit", statement.grossProfit, "text-portal-info"],
      ["Total expenses", statement.totalExpenses, "text-portal-danger"],
      ["Net profit", statement.netIncome, statement.netIncome >= 0 ? "text-portal-success" : "text-portal-danger"],
    ] as const;
    return (
      <div className="grid grid-cols-2 gap-3 mb-4">
        {cards.map(([label, amount, color]) => (
          <div key={label} className="bg-white border border-portal-border rounded-xl p-4">
            <div className="text-sm text-portal-ink-2">{label}</div>
            <div className={`text-xl font-bold tabular-nums ${color}`}>{draftReady ? formatMoney(amount, currency) : "…"}</div>
            {label === "Net profit" && statement.profitMargin != null && (
              <div className={`text-sm font-semibold ${color}`}>{formatPercent(statement.profitMargin)} margin</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  function ComparisonLine({ title, row }: { title: string; row: NonNullable<ReturnType<typeof compareToSaved>> }) {
    return (
      <p className="text-sm text-portal-ink-2">
        <span className="font-bold text-portal-ink">{title}: </span>
        income {formatSignedMoney(row.income.delta, currency)}
        {row.income.percent != null ? ` (${formatPercent(row.income.percent)})` : ""}
        , net {formatSignedMoney(row.net.delta, currency)}
        {row.net.percent != null ? ` (${formatPercent(row.net.percent)})` : ""}
        {row.marginPoints != null ? `, margin ${row.marginPoints >= 0 ? "+" : ""}${row.marginPoints.toFixed(1)} points` : ""}
      </p>
    );
  }

  function NumbersTab() {
    const ordered = [...snapshots].sort((a, b) => b.month.localeCompare(a.month));
    return (
      <div>
        <Summary />
        <div className="bg-white border border-portal-border rounded-xl p-4 mb-4 space-y-2">
          <h2 className="text-base font-bold text-portal-ink">Year to date through {monthLabel(month)}</h2>
          {ytd.mixedCurrency ? (
            <p className="text-sm text-portal-ink-2">These months were saved in different currencies, so they are not added together.</p>
          ) : ytd.included.length === 0 ? (
            <p className="text-sm text-portal-ink-2">Nothing saved for this year yet. This month counts as soon as you enter a number.</p>
          ) : (
            <>
              <p className="text-sm text-portal-ink">Income {formatMoney(ytd.income, currency)} · Net {formatMoney(ytd.net, currency)} · Margin {formatPercent(ytd.margin)}</p>
              <p className="text-sm text-portal-ink-2">
                Average month: income {formatMoney(ytd.averageIncome || 0, currency)}, net {formatMoney(ytd.averageNet || 0, currency)}.
              </p>
              <p className="text-sm text-portal-ink-2">
                Includes {ytd.included.map((item) => shortMonthLabel(item)).join(", ")}.
                {ytd.missing.length ? ` Not entered: ${ytd.missing.map((item) => shortMonthLabel(item)).join(", ")}.` : ""}
              </p>
            </>
          )}
          {lastMonth ? <ComparisonLine title={`Compared with ${monthLabel(lastMonth.month)}`} row={lastMonth} /> : null}
          {lastYear ? <ComparisonLine title={`Compared with ${monthLabel(lastYear.month)}`} row={lastYear} /> : null}
        </div>

        <div className="flex items-center justify-between gap-2 mb-4">
          <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg border border-portal-border bg-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="text-base font-bold text-portal-ink">{monthLabel(month)}</div>
            <div className="text-sm text-portal-muted">{currency} · {zoneSource === "clinic" ? "Clinic time zone" : "This device's time zone"}</div>
          </div>
          <button type="button" aria-label="Next month" onClick={() => changeMonth(1)} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg border border-portal-border bg-white">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {!draftReady ? <p className="text-sm text-portal-ink-2 mb-4">Loading this month…</p> : null}
        {draftError ? <p className="text-sm text-portal-danger mb-3" role="alert">{draftError}</p> : null}
        {historyError ? <p className="text-sm text-portal-warning mb-3" role="alert">{historyError}</p> : null}
        {settingsNote ? <p className="text-sm text-portal-ink-2 mb-3">{settingsNote}</p> : null}

        <div className={`mb-4 space-y-3 ${draftReady ? "" : "opacity-60 pointer-events-none"}`}>
          {exampleId ? <ExampleBanner onClear={clearExample} onKeep={keepExample} keepLabel={exampleKept ? "This is my data" : "Keep example"} /> : null}
          {!showExamples && !exampleId ? (
            <button type="button" onClick={() => setShowExamples(true)} className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold">
              Load an example practice
            </button>
          ) : null}
          {showExamples ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SCALING_EXAMPLES.map((example) => (
                <button key={example.id} type="button" onClick={() => applyExample(example)} className="min-h-11 text-left p-3 rounded-lg border border-portal-border bg-white">
                  <div className="text-sm font-bold text-portal-ink">{example.title}</div>
                  <div className="text-sm text-portal-ink-2">{example.subtitle}</div>
                </button>
              ))}
            </div>
          ) : null}
          <p className="text-sm text-portal-muted">Tap a category to enter numbers. Cents are kept. Changes save to your account.</p>
        </div>

        <div className={draftReady ? "" : "opacity-60 pointer-events-none"}>
          {PL_SECTIONS.map((section) => {
            const accent = section.type === "income" ? "#1f8a4c" : section.type === "cogs" ? "#a86400" : "#c0362c";
            return (
              <section key={section.id} className="mb-5">
                <h2 className="text-sm font-bold mb-2 pl-3" style={{ borderLeft: `4px solid ${accent}`, color: accent }}>{section.label}</h2>
                {section.categories.map((category) => {
                  const isOpen = expanded.includes(category.id);
                  const catTotal = category.items.reduce((sum, item) => sum + (statement.values[item.id] || 0), 0);
                  const catPct = linePercent(catTotal, statement.totalIncome);
                  return (
                    <div key={category.id} className="bg-white border border-portal-border rounded-lg mb-2 overflow-hidden">
                      <button type="button" onClick={() => setExpanded((current) => current.includes(category.id) ? current.filter((id) => id !== category.id) : [...current, category.id])} className="w-full min-h-11 px-3 py-3 text-left">
                        <span className="flex items-center gap-2">
                          {isOpen ? <ChevronDown className="w-4 h-4 text-portal-muted" /> : <ChevronRight className="w-4 h-4 text-portal-muted" />}
                          <span className="text-sm font-bold text-portal-ink flex-1">{category.label}</span>
                        </span>
                        {catTotal !== 0 && (
                          <span className="mt-1 pl-6 flex items-center justify-between gap-3">
                            <span className="text-sm tabular-nums text-portal-ink">{formatMoney(catTotal, currency)}</span>
                            {section.type !== "income" && (
                              <span className={`text-sm font-semibold ${TONE[benchmarkTone(catPct, category.minPct, category.maxPct)]}`}>{formatPercent(catPct)}</span>
                            )}
                          </span>
                        )}
                      </button>
                      {isOpen && category.items.map((item) => {
                        const raw = values[item.id] || 0;
                        const normalized = statement.values[item.id] || 0;
                        const pct = linePercent(normalized, statement.totalIncome);
                        const showPct = normalized !== 0 && (section.type !== "income" || isContraIncome(item.id));
                        const coaching = coachingText(item, normalized, statement.totalIncome);
                        return (
                          <div key={item.id} className="px-3 py-3 border-t border-portal-border">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm text-portal-ink">{item.label}</p>
                                <p className="text-xs text-portal-muted">{item.code}</p>
                              </div>
                              <button type="button" aria-label={`About ${item.label}`} onClick={() => setTooltipItem(tooltipItem === item.id ? null : item.id)} className="min-h-11 min-w-11 inline-flex items-center justify-center text-portal-muted">
                                <Info className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="mt-2 flex items-start gap-3">
                              <div className="flex-1">
                                <MoneyField key={`${month}:${item.id}`} label={item.label} value={raw} contra={isContraIncome(item.id)} onValue={(amount) => handleValue(item.id, amount)} />
                              </div>
                              {showPct ? (
                                <span className={`pt-3 text-sm font-semibold w-16 text-right ${TONE[benchmarkTone(pct, item.minPct, item.maxPct)]}`}>{formatPercent(pct)}</span>
                              ) : null}
                            </div>
                            {showPct ? <p className="mt-1 text-xs text-portal-muted">Benchmark {item.minPct}% to {item.maxPct}%</p> : null}
                            {isContraIncome(item.id) ? <p className="mt-1 text-xs text-portal-muted">This reduces income. A positive amount is saved as a minus.</p> : null}
                            {tooltipItem === item.id && (
                              <div className="mt-2 p-3 rounded-lg bg-[#1e293b] text-slate-100 text-sm leading-relaxed">
                                {item.tooltip}
                                {coaching ? <p className="mt-2 pt-2 border-t border-slate-600">{coaching}</p> : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>

        <div className="bg-white border border-portal-border rounded-xl p-4 space-y-3">
          <button type="button" onClick={saveMonth} disabled={saving || !draftReady || !statement.hasAnyInput} className="w-full sm:w-auto min-h-11 px-5 rounded-lg bg-portal-accent text-white text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : currentSnapshot ? "Update saved month" : "Save this month"}
          </button>
          <p className="text-sm text-portal-ink-2" role="status">
            {draftStatus === "Saving..." ? "Saving draft…" : draftStatus === "Saved" ? "Draft saved to your account." : "Draft saves automatically."}
            {currentSnapshot ? " This month is in your history." : " Save this month to add it to history and trends."}
            {historyDiffers ? " History is older than the numbers on screen." : ""}
          </p>
          {saveMsg ? <p className={`text-sm font-semibold ${saveMsg.startsWith("Saved") || saveMsg.startsWith("Updated") || saveMsg.startsWith("Deleted") ? "text-portal-success" : "text-portal-danger"}`} role="status">{saveMsg}</p> : null}
          {currentSnapshot ? (
            pendingDelete === month ? (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => removeMonth(month)} className="min-h-11 px-4 rounded-lg bg-portal-danger text-white text-sm font-bold">Confirm delete</button>
                <button type="button" onClick={() => setPendingDelete(null)} className="min-h-11 px-4 rounded-lg border border-portal-border text-sm font-bold">Cancel</button>
              </div>
            ) : (
              <button type="button" onClick={() => setPendingDelete(month)} className="min-h-11 px-4 rounded-lg border border-portal-border text-sm font-bold inline-flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete this saved month
              </button>
            )
          ) : null}
        </div>

        <div className="mt-6">
          <h2 className="text-base font-bold text-portal-ink mb-2">Saved months</h2>
          {ordered.length === 0 ? (
            <p className="text-sm text-portal-ink-2">No months in history yet. Saving a month lets you reopen it, compare it, and see the trend.</p>
          ) : (
            <ul className="space-y-2">
              {ordered.map((snapshot) => {
                const figures = figuresFromSnapshot(snapshot, PL_SECTIONS);
                return (
                  <li key={snapshot.month} className="bg-white border border-portal-border rounded-lg">
                    <button type="button" onClick={() => { monthTouched.current = true; setMonth(snapshot.month); setActiveTab(1); }} className="w-full min-h-11 px-3 py-3 text-left">
                      <span className="block text-sm font-bold text-portal-ink">{monthLabel(snapshot.month)}</span>
                      <span className="block text-sm text-portal-ink-2">Income {formatMoney(figures.income, snapshot.currency || currency)} · Net {formatMoney(figures.net, snapshot.currency || currency)} · {formatPercent(figures.margin)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  function AnalysisTab() {
    if (!statement.hasAnyInput) {
      return <Empty icon={BarChart3} title="Enter this month's numbers first" body="Analysis shows up once income or costs are filled in." />;
    }
    const donut = PL_SECTIONS.find((section) => section.type === "expenses")!.categories.map((category, index) => {
      const total = category.items.reduce((sum, item) => sum + (statement.values[item.id] || 0), 0);
      return { label: category.label, value: total > 0 ? total : 0, color: DONUT_COLORS[index % DONUT_COLORS.length] };
    }).filter((segment) => segment.value > 0);
    const scoreLabel = score >= 85 ? "Exceptional" : score >= 70 ? "Strong" : score >= 50 ? "Healthy" : score >= 30 ? "Needs work" : "Critical";
    return (
      <div className="space-y-4">
        <section className="bg-white border border-portal-border rounded-xl p-4">
          <h2 className="text-base font-bold text-center mb-2">Practice health score</h2>
          <HealthGauge score={score} />
          <p className="text-sm text-center text-portal-ink-2">{score}/100 · {scoreLabel}. Profit, expenses, revenue mix, and cost of goods each add points.</p>
          {expenseCoverage.thin ? (
            <p className="mt-3 text-sm text-portal-ink-2">Only {expenseCoverage.filled} of {expenseCoverage.total} expense groups are filled in. Empty groups are left out of the score, so add the rest of the month before you rely on it.</p>
          ) : null}
        </section>
        {donut.length > 0 && (
          <section className="bg-white border border-portal-border rounded-xl p-4">
            <h2 className="text-base font-bold text-center mb-2">Where expenses go</h2>
            <DonutChart segments={donut} centerLabel="Net profit" centerValue={formatMoney(statement.netIncome, currency)} selected={selectedDonut} onSelect={(label) => setSelectedDonut(selectedDonut === label ? null : label)} />
          </section>
        )}
        <section className="bg-white border border-portal-border rounded-xl p-4">
          <h2 className="text-base font-bold mb-3">Gap analysis</h2>
          {gaps.length === 0 ? <p className="text-sm text-portal-ink-2">No expense categories to compare yet.</p> : (
            <ul className="space-y-2">
              {gaps.map((row) => (
                <li key={row.category.id} className="flex items-center justify-between gap-3 border-b border-portal-border py-2">
                  <div>
                    <div className="text-sm font-semibold">{row.category.label}</div>
                    <div className="text-xs text-portal-muted">{formatMoney(row.catTotal, currency)} · benchmark {row.category.minPct}%–{row.category.maxPct}%</div>
                  </div>
                  <div className={`text-sm font-bold text-right ${TONE[benchmarkTone(row.catPct, row.category.minPct, row.category.maxPct)]}`}>
                    {formatPercent(row.catPct)}
                    {row.gap > 0 ? <div className="text-xs font-semibold">+{formatPercent(row.gap)} over</div> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        {problems.length > 0 && (
          <section className="bg-white border border-portal-danger rounded-xl p-4">
            <h2 className="text-base font-bold text-portal-danger mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Top problems</h2>
            <ol className="space-y-3">
              {problems.map((problem, index) => (
                <li key={problem.item.id}>
                  <p className="text-sm font-bold">#{index + 1} {problem.item.label} · {formatPercent(problem.actualPct)} (max {formatPercent(problem.item.maxPct)})</p>
                  <p className="text-sm text-portal-ink-2">{formatMoney(problem.gapDollar, currency)} over the midpoint this month.</p>
                  <p className="text-sm text-portal-ink">{problem.item.coachingOver?.replace("[X]", formatPercent(problem.actualPct)) || "Review this line for savings."}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
        {wins.length > 0 && (
          <section className="bg-white border border-portal-success rounded-xl p-4">
            <h2 className="text-base font-bold text-portal-success mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Quick wins</h2>
            <ul className="space-y-2">
              {wins.map((win) => (
                <li key={win.item.id} className="text-sm">
                  <span className="font-bold">{win.item.label}.</span> Save {formatMoney(win.savings, currency)} this month by moving from {formatPercent(win.actualPct)} to {formatPercent(win.item.midPct)}.
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  function TrendsTab() {
    if (snapshots.length < 2) {
      return <Empty icon={TrendingUp} title="Save two months to see a trend" body="Each saved month is one point. Update a month any time. The same month is never stored twice." />;
    }
    return (
      <div className="space-y-4">
        <ul className="space-y-2">
          {[...snapshots].sort((a, b) => b.month.localeCompare(a.month)).map((snapshot) => {
            const figures: MonthFigures = figuresFromSnapshot(snapshot, PL_SECTIONS);
            const money = snapshot.currency || currency;
            const rows = [
              ["Income", formatMoney(figures.income, money)],
              ["Costs", formatMoney(figures.cogs + figures.expenses, money)],
              ["Net", formatMoney(figures.net, money)],
              ["Margin", formatPercent(figures.margin)],
            ] as const;
            return (
              <li key={snapshot.month} className="bg-white border border-portal-border rounded-xl p-3">
                <div className="text-sm font-bold text-portal-ink">{monthLabel(snapshot.month)}</div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  {rows.map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-2">
                      <dt className="text-sm text-portal-ink-2">{label}</dt>
                      <dd className="text-sm font-semibold tabular-nums text-portal-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>
        <section className="bg-white border border-portal-border rounded-xl p-4">
          <h2 className="text-base font-bold">Profit margin</h2>
          <p className="text-sm text-portal-ink-2 mb-2">The green line is the 40% target. Labels include the year so two Januarys are not mixed up.</p>
          <TrendChart points={trendPoints} currency={currency} />
        </section>
        <section className="bg-white border border-portal-border rounded-xl p-4">
          <h2 className="text-base font-bold">Income and total costs</h2>
          <p className="text-sm text-portal-ink-2 mb-3">Total costs are cost of goods plus operating expenses, so the gap is net profit.</p>
          <ul className="space-y-2">
            {trendPoints.map((point) => (
              <li key={point.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold w-16">{point.label}</span>
                <span className="text-portal-success tabular-nums">{formatCompactMoney(point.income, currency)}</span>
                <span className="text-portal-danger tabular-nums">{formatCompactMoney(point.costs, currency)}</span>
              </li>
            ))}
          </ul>
        </section>
        {trends.length > 0 && (
          <section className="bg-white border border-portal-border rounded-xl p-4">
            <h2 className="text-base font-bold mb-3">Expense categories</h2>
            <ul className="space-y-3">
              {trends.map((row) => (
                <li key={row.category.id} className="flex items-center gap-3">
                  <span className="text-sm font-semibold flex-1 min-w-0 truncate">{row.category.label}</span>
                  <span className="text-sm tabular-nums w-14 text-right">{formatPercent(row.pcts[row.pcts.length - 1])}</span>
                  {row.trend > 1 ? <TrendingUp className="w-4 h-4 text-portal-danger" aria-label="Up more than 1 point" /> : null}
                  {row.trend < -1 ? <TrendingDown className="w-4 h-4 text-portal-success" aria-label="Down more than 1 point" /> : null}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  function ReportTab() {
    if (!statement.hasAnyInput) {
      return <Empty icon={FileText} title="Enter this month's numbers first" body="The report is a printout of the month you are viewing." />;
    }
    const note = coachingNote(statement.profitMargin, PROFIT_COACHING);
    const scoreLabel = score >= 85 ? "Exceptional" : score >= 70 ? "Strong" : score >= 50 ? "Healthy" : score >= 30 ? "Needs work" : "Critical";
    return (
      <div className="print-report space-y-4">
        <div className="bg-[#1a2744] text-white rounded-xl p-5">
          <h2 className="text-xl font-bold">{clinicName}</h2>
          <p className="text-base">Profit and loss · {monthLabel(month)}</p>
          <p className="text-sm text-slate-300">{currency} · {formatDateInZone(new Date(), timeZone)}</p>
        </div>
        <section className="bg-white border border-portal-border rounded-xl p-4">
          <h3 className="text-base font-bold mb-2">Summary</h3>
          <p className="text-sm">Health score {score}/100 ({scoreLabel})</p>
          <p className="text-sm">Income {formatMoney(statement.totalIncome, currency)} · Gross profit {formatMoney(statement.grossProfit, currency)}</p>
          <p className="text-sm">Expenses {formatMoney(statement.totalExpenses, currency)} · Net {formatMoney(statement.netIncome, currency)} ({formatPercent(statement.profitMargin)})</p>
          {note ? <p className="text-sm text-portal-ink-2 mt-3">{note}</p> : null}
          {expenseCoverage.thin ? <p className="text-sm text-portal-ink-2 mt-3">Only {expenseCoverage.filled} of {expenseCoverage.total} expense groups are filled in. Empty groups are not in the score.</p> : null}
        </section>
        <section className="bg-white border border-portal-border rounded-xl p-4">
          <h3 className="text-base font-bold mb-3">Full statement</h3>
          {PL_SECTIONS.map((section) => (
            <div key={section.id} className="mb-4">
              <h4 className="text-sm font-bold border-b border-portal-border pb-1 mb-2">{section.label}</h4>
              {section.categories.map((category) => {
                const rows = category.items.filter((item) => statement.values[item.id]);
                if (!rows.length) return null;
                const total = category.items.reduce((sum, item) => sum + (statement.values[item.id] || 0), 0);
                return (
                  <div key={category.id} className="mb-3">
                    {rows.map((item) => (
                      <div key={item.id} className="flex justify-between gap-3 py-1 text-sm">
                        <span>{item.label}</span>
                        <span className="tabular-nums font-semibold">{formatMoney(statement.values[item.id], currency)}{section.type !== "income" ? ` ${formatPercent(linePercent(statement.values[item.id], statement.totalIncome))}` : ""}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold border-t border-portal-border pt-1">
                      <span>Total {category.label}</span>
                      <span className="tabular-nums">{formatMoney(total, currency)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div className="flex justify-between bg-[#1a2744] text-white rounded-lg px-3 py-3 text-sm font-bold">
            <span>Net profit</span>
            <span>{formatMoney(statement.netIncome, currency)} ({formatPercent(statement.profitMargin)})</span>
          </div>
        </section>
        <div className="flex flex-wrap gap-2 no-print">
          <button type="button" onClick={() => window.print()} className="min-h-11 px-4 rounded-lg bg-[#1a2744] text-white text-sm font-bold inline-flex items-center gap-2"><Printer className="w-4 h-4" /> Print</button>
          <button type="button" onClick={saveMonth} disabled={saving} className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold inline-flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
          <button type="button" onClick={() => changeMonth(1)} className="min-h-11 px-4 rounded-lg border border-portal-border text-sm font-bold">Next month</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          nav, aside, header, footer, .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-report { max-width: 100% !important; }
        }
      `}</style>
      <div className="max-w-[900px] mx-auto px-4 py-6">
        <div className="no-print">
          <PageHeader title="P&L analyzer" description="Enter a month from your books and see income, costs, profit, and how it compares." />
        </div>
        <div className="grid grid-cols-4 gap-1 mb-6 bg-portal-surface p-1 rounded-xl no-print">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`min-h-11 min-w-0 flex flex-col items-center justify-center rounded-lg px-1 py-1 text-xs font-semibold leading-4 ${activeTab === tab.id ? "bg-white text-portal-ink shadow-sm" : "text-portal-ink-2"}`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        {activeTab === 1 && NumbersTab()}
        {activeTab === 2 && AnalysisTab()}
        {activeTab === 3 && TrendsTab()}
        {activeTab === 4 && ReportTab()}
      </div>
    </>
  );
}

function Empty({ icon: Icon, title, body }: { icon: typeof BarChart3; title: string; body: string }) {
  return (
    <div className="text-center py-12 text-portal-ink-2">
      <Icon className="w-8 h-8 mx-auto mb-3 text-portal-muted" />
      <p className="font-semibold text-portal-ink">{title}</p>
      <p className="text-sm mt-1">{body}</p>
    </div>
  );
}
