"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { createDoctorProductCheckout } from "../purchase-actions";

// ---------------------------------------------------------------------------
// Data imports
// ---------------------------------------------------------------------------

let PL_SECTIONS: any[] = [];
let SCALING_EXAMPLES: any[] = [];
let PROFIT_COACHING: any[] = [];
try {
  const data = require("./pl-data");
  PL_SECTIONS = data.PL_SECTIONS || [];
  SCALING_EXAMPLES = data.SCALING_EXAMPLES || [];
  PROFIT_COACHING = data.PROFIT_COACHING || [];
} catch {}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  id: string;
  code: string;
  label: string;
  tooltip?: string;
  minPct: number;
  midPct: number;
  maxPct: number;
  coachingOver?: string;
  coachingUnder?: string;
}

interface PLCategory {
  id: string;
  code: string;
  label: string;
  minPct: number;
  maxPct: number;
  items: LineItem[];
}

interface PLSectionType {
  id: string;
  type: "income" | "cogs" | "expenses";
  label: string;
  categories: PLCategory[];
}

interface Snapshot {
  month: string;
  profit_margin: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtPct(n: number): string {
  return n.toFixed(1) + "%";
}

function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
}

function parseNumericInput(raw: string): number {
  // Allow negative numbers (for refunds, sales tax)
  const negative = raw.includes("-");
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const val = cleaned ? parseFloat(cleaned) : 0;
  return negative ? -Math.abs(val) : val;
}

function statusEmoji(userPct: number, minPct: number, maxPct: number): string {
  if (minPct === 0 && maxPct === 0) {
    return userPct === 0 ? "\u{1F7E2}" : "\u{1F534}";
  }
  if (userPct >= minPct && userPct <= maxPct) return "\u{1F7E2}";
  const distMin = Math.abs(userPct - minPct);
  const distMax = Math.abs(userPct - maxPct);
  if ((userPct < minPct && distMin <= 2) || (userPct > maxPct && distMax <= 2))
    return "\u{1F7E1}";
  return "\u{1F534}";
}

function profitColor(pct: number): string {
  if (pct >= 35) return "#22c55e";
  if (pct >= 25) return "#eab308";
  return "#ef4444";
}

// ---------------------------------------------------------------------------
// DollarSign SVG icon
// ---------------------------------------------------------------------------

function DollarSignIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// InfoTooltip
// ---------------------------------------------------------------------------

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-block", marginLeft: 4, cursor: "pointer" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow((p) => !p)}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      {show && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1e293b",
            color: "#f8fafc",
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: 12,
            whiteSpace: "normal",
            maxWidth: 300,
            minWidth: 200,
            zIndex: 50,
            lineHeight: 1.5,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Trend Chart (SVG)
// ---------------------------------------------------------------------------

function TrendChart({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length < 2) return null;
  const sorted = [...snapshots].sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  const w = 600;
  const h = 200;
  const pad = 40;
  const maxVal = Math.max(...sorted.map((s) => s.profit_margin), 50);
  const minVal = Math.min(...sorted.map((s) => s.profit_margin), 0);
  const range = maxVal - minVal || 1;
  const stepX = (w - pad * 2) / (sorted.length - 1);

  const points = sorted.map((s, i) => ({
    x: pad + i * stepX,
    y: pad + ((maxVal - s.profit_margin) / range) * (h - pad * 2),
    label: s.month,
    value: s.profit_margin,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div style={{ overflowX: "auto", marginTop: 16 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        {[0, 10, 20, 30, 40, 50].map((v) => {
          if (v > maxVal + 5) return null;
          const y = pad + ((maxVal - v) / range) * (h - pad * 2);
          return (
            <g key={v}>
              <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#e2e8f0" strokeDasharray="4" />
              <text x={pad - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">{v}%</text>
            </g>
          );
        })}
        {(() => {
          const y40 = pad + ((maxVal - 40) / range) * (h - pad * 2);
          return <line x1={pad} y1={y40} x2={w - pad} y2={y40} stroke="#22c55e" strokeWidth={1.5} strokeDasharray="6 3" />;
        })()}
        <path d={pathD} fill="none" stroke="#1a2744" strokeWidth={2.5} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill={profitColor(p.value)} stroke="#fff" strokeWidth={1.5} />
            <text x={p.x} y={h - 6} textAnchor="middle" fontSize={9} fill="#64748b">{p.label.slice(5)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Line Component
// ---------------------------------------------------------------------------

function SummaryLine({
  label,
  amount,
  bold,
  bg,
  borderTop,
  color,
}: {
  label: string;
  amount: number;
  bold?: boolean;
  bg?: string;
  borderTop?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 160px",
        padding: "10px 16px",
        background: bg || "transparent",
        borderTop: borderTop ? "2px solid #1a2744" : undefined,
        fontWeight: bold ? 800 : 600,
        fontSize: bold ? 16 : 14,
        color: color || "#1a2744",
      }}
    >
      <span>{label}</span>
      <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {fmtMoney(amount)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function PLAnalyzerPage() {
  const [userValues, setUserValues] = useState<Record<string, number>>({});
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // ------ Purchase check ------
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) { setCheckingPurchase(false); return; }
        const { data } = await (supabase as any)
          .from("course_purchases")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", "pl-analyzer")
          .limit(1);
        if (data && data.length > 0) setIsPurchased(true);
        const { data: snaps } = await (supabase as any)
          .from("pl_snapshots")
          .select("month, profit_margin")
          .eq("user_id", user.id)
          .order("month", { ascending: true })
          .limit(12);
        if (snaps) setSnapshots(snaps);
      } catch {} finally {
        setCheckingPurchase(false);
      }
    })();
  }, []);

  // ------ Section helpers ------
  const sections = PL_SECTIONS as PLSectionType[];
  const incomeSection = sections.find((s) => s.type === "income");
  const cogsSection = sections.find((s) => s.type === "cogs");
  const expenseSection = sections.find((s) => s.type === "expenses");

  // ------ Computed totals ------
  const totalIncome = useMemo(() => {
    if (!incomeSection) return 0;
    return incomeSection.categories
      .flatMap((c) => c.items)
      .reduce((sum, item) => sum + (userValues[item.id] || 0), 0);
  }, [incomeSection, userValues]);

  const totalCOGS = useMemo(() => {
    if (!cogsSection) return 0;
    return cogsSection.categories
      .flatMap((c) => c.items)
      .reduce((sum, item) => sum + (userValues[item.id] || 0), 0);
  }, [cogsSection, userValues]);

  const grossProfit = totalIncome - totalCOGS;

  const totalExpenses = useMemo(() => {
    if (!expenseSection) return 0;
    return expenseSection.categories
      .flatMap((c) => c.items)
      .reduce((sum, item) => sum + (userValues[item.id] || 0), 0);
  }, [expenseSection, userValues]);

  const netOperatingIncome = grossProfit - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netOperatingIncome / totalIncome) * 100 : 0;
  const hasAnyInput = useMemo(() => Object.values(userValues).some((v) => v !== 0), [userValues]);

  // ------ Percentage calculations ------
  const userPercentages = useMemo(() => {
    const map: Record<string, number> = {};
    sections.forEach((section) => {
      section.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          const val = userValues[item.id] || 0;
          map[item.id] = totalIncome > 0 ? (Math.abs(val) / totalIncome) * 100 : 0;
        });
      });
    });
    return map;
  }, [sections, userValues, totalIncome]);

  // ------ Gap analysis ------
  const biggestGap = useMemo(() => {
    let worst: { item: LineItem; gap: number } | null = null;
    if (!expenseSection && !cogsSection) return null;
    [...(cogsSection?.categories || []), ...(expenseSection?.categories || [])]
      .flatMap((c) => c.items)
      .forEach((item) => {
        const val = userValues[item.id] || 0;
        if (val <= 0) return;
        const userPct = userPercentages[item.id] || 0;
        if (userPct > item.maxPct && item.maxPct > 0) {
          const gap = userPct - item.maxPct;
          if (!worst || gap > worst.gap) worst = { item, gap };
        }
      });
    return worst as { item: LineItem; gap: number } | null;
  }, [cogsSection, expenseSection, userValues, userPercentages]);

  const profitCoachingNote = useMemo(() => {
    if (!PROFIT_COACHING || PROFIT_COACHING.length === 0) return null;
    const sorted = [...PROFIT_COACHING].sort((a: any, b: any) => (b.minPct ?? 0) - (a.minPct ?? 0));
    for (const pc of sorted) {
      if (profitMargin >= (pc.minPct ?? 0)) return pc;
    }
    return sorted[sorted.length - 1] || null;
  }, [profitMargin]);

  // Category totals
  const categoryTotals = useMemo(() => {
    const map: Record<string, { userDollar: number; userPct: number }> = {};
    sections.forEach((section) => {
      section.categories.forEach((cat) => {
        const uDollar = cat.items.reduce((s, it) => s + (userValues[it.id] || 0), 0);
        map[cat.id] = {
          userDollar: uDollar,
          userPct: totalIncome > 0 ? (Math.abs(uDollar) / totalIncome) * 100 : 0,
        };
      });
    });
    return map;
  }, [sections, userValues, totalIncome]);

  // ------ Handlers ------
  const handleValue = useCallback((id: string, raw: string) => {
    setUserValues((prev) => ({ ...prev, [id]: parseNumericInput(raw) }));
  }, []);

  const applyScalingExample = useCallback((example: any) => {
    setUserValues(example.lineItems || {});
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }, []);

  const saveSnapshot = useCallback(async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const supabase = createClient();
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user) { setSaveMsg("Please log in to save."); return; }
      const month = new Date().toISOString().slice(0, 7);
      await (supabase as any).from("pl_snapshots").upsert(
        {
          user_id: user.id,
          month,
          collections_cents: Math.round(totalIncome * 100),
          expenses: userValues,
          profit_margin: Math.round(profitMargin * 100) / 100,
        },
        { onConflict: "user_id,month" },
      );
      setSaveMsg("Saved!");
      const { data: snaps } = await (supabase as any)
        .from("pl_snapshots")
        .select("month, profit_margin")
        .eq("user_id", user.id)
        .order("month", { ascending: true })
        .limit(12);
      if (snaps) setSnapshots(snaps);
    } catch {
      setSaveMsg("Error saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [totalIncome, userValues, profitMargin]);

  // ------ Category status ------
  function categoryStatus(cat: PLCategory, sectionType: string): string {
    if (sectionType === "income") return "";
    const hasInput = cat.items.some((it) => (userValues[it.id] || 0) !== 0);
    if (!hasInput) return "";
    const statuses = cat.items
      .filter((it) => (userValues[it.id] || 0) !== 0)
      .map((it) => statusEmoji(userPercentages[it.id] || 0, it.minPct, it.maxPct));
    if (statuses.includes("\u{1F534}")) return "\u{1F534}";
    if (statuses.includes("\u{1F7E1}")) return "\u{1F7E1}";
    if (statuses.length > 0) return "\u{1F7E2}";
    return "";
  }

  // ------ Section colors ------
  function sectionStyle(type: string) {
    switch (type) {
      case "income":
        return { headerBg: "#f0fdf4", headerBorder: "#bbf7d0", labelColor: "#166534" };
      case "cogs":
        return { headerBg: "#fef3c7", headerBorder: "#fde68a", labelColor: "#92400e" };
      case "expenses":
        return { headerBg: "#fef2f2", headerBorder: "#fecaca", labelColor: "#991b1b" };
      default:
        return { headerBg: "#f8fafc", headerBorder: "#e2e8f0", labelColor: "#1a2744" };
    }
  }

  // ------ Render a category ------
  function renderCategory(cat: PLCategory, sectionType: string) {
    const isExpanded = expandedCategories.includes(cat.id);
    const ct = categoryTotals[cat.id];
    const catSt = categoryStatus(cat, sectionType);
    const isIncome = sectionType === "income";

    return (
      <div key={cat.id} style={{ marginBottom: 4, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
        {/* Category header */}
        <button
          onClick={() => toggleCategory(cat.id)}
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 160px 70px 36px",
            alignItems: "center",
            padding: "10px 16px",
            background: isExpanded ? "#f8fafc" : "#fff",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            color: "#1a2744",
            textAlign: "left",
            gap: 4,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>{isExpanded ? "\u25BC" : "\u25B6"}</span>
            <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500, minWidth: 36 }}>{cat.code}</span>
            {cat.label}
          </span>
          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            {(ct?.userDollar || 0) !== 0 ? fmtMoney(ct.userDollar) : "\u2014"}
          </span>
          <span style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>
            {(ct?.userDollar || 0) !== 0 && !isIncome ? fmtPct(ct.userPct) : ""}
          </span>
          <span style={{ textAlign: "center", fontSize: 14 }}>{catSt}</span>
        </button>

        {/* Expanded line items */}
        {isExpanded && (
          <div style={{ borderTop: "1px solid #e2e8f0" }}>
            {/* Column headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 160px 70px 36px",
                padding: "4px 16px",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "#94a3b8",
                fontWeight: 600,
                gap: 4,
              }}
            >
              <span>Account</span>
              <span style={{ textAlign: "right" }}>Amount</span>
              <span style={{ textAlign: "right" }}>% Rev</span>
              <span style={{ textAlign: "center" }}></span>
            </div>

            {cat.items.map((item: LineItem) => {
              const userVal = userValues[item.id] || 0;
              const userPct = userPercentages[item.id] || 0;
              const st = userVal !== 0 && !isIncome ? statusEmoji(userPct, item.minPct, item.maxPct) : "";
              const isOver = userVal > 0 && userPct > item.maxPct && item.maxPct > 0;
              const isUnder = userVal > 0 && userPct < item.minPct && item.minPct > 0;
              const showCoaching = !isIncome && (isOver || isUnder) && st === "\u{1F534}";

              return (
                <div key={item.id}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 160px 70px 36px",
                      padding: "6px 16px",
                      fontSize: 13,
                      alignItems: "center",
                      gap: 4,
                      borderTop: "1px solid #f8fafc",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 500, minWidth: 36, marginRight: 4 }}>{item.code}</span>
                      {item.label}
                      {item.tooltip && <InfoTooltip text={item.tooltip} />}
                    </span>
                    <span style={{ textAlign: "right" }}>
                      {isPurchased ? (
                        <input
                          className="pl-input"
                          type="text"
                          inputMode="numeric"
                          placeholder="0.00"
                          value={userVal !== 0 ? (userVal < 0 ? "-" + fmt(Math.abs(userVal)) : fmt(userVal)) : ""}
                          onChange={(e) => handleValue(item.id, e.target.value)}
                          style={{
                            width: 120,
                            textAlign: "right",
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 13,
                            background: "#fafbfc",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        />
                      ) : (
                        <span style={{ color: "#cbd5e1" }}>\u2014</span>
                      )}
                    </span>
                    <span style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>
                      {userVal !== 0 && !isIncome ? fmtPct(userPct) : ""}
                    </span>
                    <span style={{ textAlign: "center", fontSize: 14 }}>{st}</span>
                  </div>

                  {/* Coaching note */}
                  {isPurchased && showCoaching && (
                    <div
                      style={{
                        margin: "0 16px 6px 56px",
                        padding: "8px 12px",
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "#9a3412",
                        lineHeight: 1.5,
                      }}
                    >
                      {isOver
                        ? (item.coachingOver || "").replace("[X]", fmtPct(userPct))
                        : (item.coachingUnder || "").replace("[X]", fmtPct(userPct))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ------ Render ------
  return (
    <>
      <style>{`
        @media print {
          nav, aside, header, footer, .no-print { display: none !important; }
          body { background: #fff !important; }
          .pl-container { max-width: 100% !important; padding: 0 !important; }
        }
        .pl-input:focus { outline: 2px solid #e97325; outline-offset: 1px; }
      `}</style>

      <div className="pl-container" style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {/* ===== HEADER ===== */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#1a2744" }}>
            <DollarSignIcon size={32} />
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#1a2744" }}>Perfect P&L Analyzer</h1>
          </div>
          <p style={{ color: "#64748b", marginTop: 6, fontSize: 14, maxWidth: 520, marginInline: "auto" }}>
            Your personal bookkeeper. Enter your numbers straight from QuickBooks and see exactly where your money is going.
          </p>
        </div>

        {/* ===== SCALING EXAMPLES ===== */}
        {SCALING_EXAMPLES.length > 0 && (
          <div className="no-print" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", marginBottom: 6 }}>
              Load Example
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 6 }}>
              {SCALING_EXAMPLES.map((ex: any) => (
                <button
                  key={ex.id}
                  onClick={() => applyScalingExample(ex)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #e2e8f0",
                    background: "#fff",
                    color: "#1a2744",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <div>{ex.title}</div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>{ex.subtitle}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== UPGRADE CARD ===== */}
        {!isPurchased && !checkingPurchase && (
          <div
            className="no-print"
            style={{
              background: "linear-gradient(135deg, #1a2744 0%, #2d3f5e 100%)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
              color: "#fff",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Unlock Your Numbers</h3>
            <p style={{ color: "#94a3b8", margin: "0 0 16px", fontSize: 14 }}>
              Input your real P&L, see gap analysis, coaching notes, and save monthly snapshots.
            </p>
            <button
              onClick={async () => {
                const result = await createDoctorProductCheckout("pl-analyzer", "Perfect P&L Analyzer", 2900);
                if (result.url) window.location.href = result.url;
                else alert(result.error);
              }}
              style={{
                display: "inline-block",
                background: "#e97325",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
                border: "none",
              }}
            >
              $29 one-time
            </button>
          </div>
        )}

        {/* ===== SUMMARY CARDS (when data entered) ===== */}
        {isPurchased && hasAnyInput && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Total Income</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#166534" }}>{fmtMoney(totalIncome)}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Gross Profit</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1a2744" }}>{fmtMoney(grossProfit)}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Net Income</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: profitColor(profitMargin) }}>{fmtMoney(netOperatingIncome)}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Profit Margin</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: profitColor(profitMargin) }}>{fmtPct(profitMargin)}</div>
              {biggestGap && (
                <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>
                  #1 Issue: {biggestGap.item.label}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== P&L TABLE ===== */}
        <div style={{ overflowX: "auto" }}>
          {sections.map((section) => {
            const style = sectionStyle(section.type);
            return (
              <div key={section.id} style={{ marginBottom: 16 }}>
                {/* Section header */}
                <div
                  style={{
                    background: style.headerBg,
                    borderLeft: `4px solid ${style.labelColor}`,
                    padding: "8px 16px",
                    borderRadius: "6px 6px 0 0",
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 800, color: style.labelColor, textTransform: "uppercase", letterSpacing: 1 }}>
                    {section.label}
                  </span>
                </div>

                {/* Categories */}
                {section.categories.map((cat) => renderCategory(cat, section.type))}

                {/* Section total */}
                {section.type === "income" && (
                  <SummaryLine label="Total for Income" amount={totalIncome} bold bg="#f0fdf4" borderTop color="#166534" />
                )}
                {section.type === "cogs" && (
                  <>
                    <SummaryLine label="Total Cost of Goods Sold" amount={totalCOGS} bold bg="#fef3c7" borderTop color="#92400e" />
                    <SummaryLine label="Gross Profit" amount={grossProfit} bold bg="#e0f2fe" borderTop color="#0c4a6e" />
                  </>
                )}
                {section.type === "expenses" && (
                  <SummaryLine label="Total for Expenses" amount={totalExpenses} bold bg="#fef2f2" borderTop color="#991b1b" />
                )}
              </div>
            );
          })}
        </div>

        {/* ===== BOTTOM LINE ===== */}
        <div
          style={{
            background: "#1a2744",
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>Net Operating Income</span>
            <span style={{ fontSize: 22, fontWeight: 800 }}>{fmtMoney(netOperatingIncome)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>Net Income</span>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: profitColor(profitMargin) }}>
                {fmtMoney(netOperatingIncome)}
              </span>
              <span style={{ fontSize: 14, color: profitColor(profitMargin), fontWeight: 600, marginLeft: 8 }}>
                {totalIncome > 0 ? fmtPct(profitMargin) : ""}
              </span>
            </div>
          </div>

          {/* Profit coaching note */}
          {isPurchased && hasAnyInput && profitCoachingNote && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 13,
                color: "#e2e8f0",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#fff" }}>Coaching Note:</strong> {profitCoachingNote.note || ""}
            </div>
          )}
        </div>

        {/* ===== TREND CHART ===== */}
        {isPurchased && snapshots.length >= 2 && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#1a2744" }}>Profit Margin Trend</h3>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 8px" }}>Last 12 months. Green dashed line = 40% target.</p>
            <TrendChart snapshots={snapshots} />
          </div>
        )}

        {/* ===== ACTIONS ===== */}
        <div className="no-print" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
          {isPurchased && (
            <button
              onClick={saveSnapshot}
              disabled={saving || !hasAnyInput}
              style={{
                padding: "12px 24px",
                background: saving ? "#94a3b8" : "#e97325",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: saving || !hasAnyInput ? "default" : "pointer",
                opacity: !hasAnyInput ? 0.5 : 1,
              }}
            >
              {saving ? "Saving..." : "Save This Month\u2019s P&L"}
            </button>
          )}
          <button
            onClick={() => window.print()}
            style={{
              padding: "12px 24px",
              background: "#fff",
              color: "#1a2744",
              border: "1.5px solid #e2e8f0",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Print P&L Report
          </button>
          {saveMsg && (
            <span style={{ alignSelf: "center", fontSize: 13, color: saveMsg === "Saved!" ? "#22c55e" : "#ef4444" }}>
              {saveMsg}
            </span>
          )}
        </div>

        {PL_SECTIONS.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
            <p style={{ fontSize: 15 }}>P&L data is loading...</p>
          </div>
        )}
      </div>
    </>
  );
}
