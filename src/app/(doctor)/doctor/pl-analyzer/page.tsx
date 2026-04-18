"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Data imports (safe fallback if pl-data doesn't exist yet)
// ---------------------------------------------------------------------------

let PL_CATEGORIES: any[] = [];
let SCALING_EXAMPLES: any[] = [];
let PROFIT_COACHING: any[] = [];
try {
  const data = require("./pl-data");
  PL_CATEGORIES = data.PL_CATEGORIES || [];
  SCALING_EXAMPLES = data.SCALING_EXAMPLES || [];
  PROFIT_COACHING = data.PROFIT_COACHING || [];
} catch {}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  id: string;
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
  name: string;
  items: LineItem[];
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

function parseNumericInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

function statusEmoji(userPct: number, minPct: number, maxPct: number): string {
  if (userPct >= minPct && userPct <= maxPct) return "\u{1F7E2}"; // green
  const distMin = Math.abs(userPct - minPct);
  const distMax = Math.abs(userPct - maxPct);
  if ((userPct < minPct && distMin <= 2) || (userPct > maxPct && distMax <= 2))
    return "\u{1F7E1}"; // yellow
  return "\u{1F534}"; // red
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
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 12,
            whiteSpace: "nowrap",
            maxWidth: 260,
            zIndex: 50,
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
        {/* grid lines */}
        {[0, 10, 20, 30, 40, 50].map((v) => {
          if (v > maxVal + 5) return null;
          const y = pad + ((maxVal - v) / range) * (h - pad * 2);
          return (
            <g key={v}>
              <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#e2e8f0" strokeDasharray="4" />
              <text x={pad - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
                {v}%
              </text>
            </g>
          );
        })}
        {/* 40% target line */}
        {(() => {
          const y40 = pad + ((maxVal - 40) / range) * (h - pad * 2);
          return (
            <line x1={pad} y1={y40} x2={w - pad} y2={y40} stroke="#22c55e" strokeWidth={1.5} strokeDasharray="6 3" />
          );
        })()}
        {/* line */}
        <path d={pathD} fill="none" stroke="#1a2744" strokeWidth={2.5} />
        {/* dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill={profitColor(p.value)} stroke="#fff" strokeWidth={1.5} />
            <text x={p.x} y={h - 6} textAnchor="middle" fontSize={9} fill="#64748b">
              {p.label.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function PLAnalyzerPage() {
  const [collections, setCollections] = useState(50000);
  const [userExpenses, setUserExpenses] = useState<Record<string, number>>({});
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const sliderRef = useRef<HTMLInputElement>(null);

  // ------ Purchase check ------
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await (supabase as any).auth.getUser();
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

        // Load snapshots
        const { data: snaps } = await (supabase as any)
          .from("pl_snapshots")
          .select("month, profit_margin")
          .eq("user_id", user.id)
          .order("month", { ascending: true })
          .limit(12);
        if (snaps) setSnapshots(snaps);
      } catch {
        // silent
      } finally {
        setCheckingPurchase(false);
      }
    })();
  }, []);

  // ------ All line items flattened ------
  const allItems: LineItem[] = useMemo(() => {
    return (PL_CATEGORIES as PLCategory[]).flatMap((c) => c.items || []);
  }, []);

  // ------ Derived calcs ------
  const hasAnyInput = useMemo(() => Object.values(userExpenses).some((v) => v > 0), [userExpenses]);

  const perfectAmounts = useMemo(() => {
    const map: Record<string, number> = {};
    allItems.forEach((item) => {
      map[item.id] = Math.round((collections * item.midPct) / 100);
    });
    return map;
  }, [allItems, collections]);

  const userPercentages = useMemo(() => {
    const map: Record<string, number> = {};
    allItems.forEach((item) => {
      const val = userExpenses[item.id] || 0;
      map[item.id] = collections > 0 ? (val / collections) * 100 : 0;
    });
    return map;
  }, [allItems, userExpenses, collections]);

  const totalExpenses = useMemo(() => Object.values(userExpenses).reduce((s, v) => s + v, 0), [userExpenses]);
  const profitMargin = useMemo(
    () => (collections > 0 ? ((collections - totalExpenses) / collections) * 100 : 0),
    [collections, totalExpenses],
  );
  const moneyLeftPerMonth = useMemo(() => 0.4 * collections - (collections - totalExpenses), [collections, totalExpenses]);
  const moneyLeftPerYear = moneyLeftPerMonth * 12;

  const biggestGap = useMemo(() => {
    let worst: { item: LineItem; gap: number } | null = null;
    allItems.forEach((item) => {
      const userPct = userPercentages[item.id] || 0;
      if (userPct > item.maxPct) {
        const gap = userPct - item.maxPct;
        if (!worst || gap > worst.gap) worst = { item, gap };
      }
    });
    return worst as { item: LineItem; gap: number } | null;
  }, [allItems, userPercentages]);

  const profitCoachingNote = useMemo(() => {
    if (!PROFIT_COACHING || PROFIT_COACHING.length === 0) return null;
    const sorted = [...PROFIT_COACHING].sort((a: any, b: any) => (b.minPct ?? 0) - (a.minPct ?? 0));
    for (const pc of sorted) {
      if (profitMargin >= (pc.minPct ?? 0)) return pc;
    }
    return sorted[sorted.length - 1] || null;
  }, [profitMargin]);

  // ------ Category totals ------
  const categoryTotals = useMemo(() => {
    const map: Record<string, { perfectDollar: number; perfectPct: number; userDollar: number; userPct: number }> = {};
    (PL_CATEGORIES as PLCategory[]).forEach((cat) => {
      const pDollar = (cat.items || []).reduce((s: number, it: LineItem) => s + (perfectAmounts[it.id] || 0), 0);
      const uDollar = (cat.items || []).reduce((s: number, it: LineItem) => s + (userExpenses[it.id] || 0), 0);
      map[cat.id] = {
        perfectDollar: pDollar,
        perfectPct: collections > 0 ? (pDollar / collections) * 100 : 0,
        userDollar: uDollar,
        userPct: collections > 0 ? (uDollar / collections) * 100 : 0,
      };
    });
    return map;
  }, [perfectAmounts, userExpenses, collections]);

  // ------ Handlers ------
  const handleCollections = useCallback((raw: string) => {
    setCollections(parseNumericInput(raw));
  }, []);

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCollections(parseInt(e.target.value, 10));
  }, []);

  const handleExpense = useCallback((id: string, raw: string) => {
    setUserExpenses((prev) => ({ ...prev, [id]: parseNumericInput(raw) }));
  }, []);

  const applyScalingExample = useCallback((example: any) => {
    setCollections(example.collections || 50000);
    const expenses: Record<string, number> = {};
    if (example.items) {
      for (const [id, val] of Object.entries(example.items)) {
        expenses[id] = val as number;
      }
    }
    setUserExpenses(expenses);
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }, []);

  const saveSnapshot = useCallback(async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await (supabase as any).auth.getUser();
      if (!user) {
        setSaveMsg("Please log in to save.");
        return;
      }
      const month = new Date().toISOString().slice(0, 7); // YYYY-MM
      await (supabase as any).from("pl_snapshots").upsert(
        {
          user_id: user.id,
          month,
          collections_cents: Math.round(collections * 100),
          expenses: userExpenses,
          profit_margin: Math.round(profitMargin * 100) / 100,
        },
        { onConflict: "user_id,month" },
      );
      setSaveMsg("Saved!");
      // refresh snapshots
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
  }, [collections, userExpenses, profitMargin]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ------ Category status ------
  function categoryStatus(cat: PLCategory): string {
    const hasInput = cat.items.some((it) => (userExpenses[it.id] || 0) > 0);
    if (!hasInput) return "";
    const statuses = cat.items
      .filter((it) => (userExpenses[it.id] || 0) > 0)
      .map((it) => statusEmoji(userPercentages[it.id] || 0, it.minPct, it.maxPct));
    if (statuses.includes("\u{1F534}")) return "\u{1F534}";
    if (statuses.includes("\u{1F7E1}")) return "\u{1F7E1}";
    if (statuses.length > 0) return "\u{1F7E2}";
    return "";
  }

  // ------ Render ------
  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          nav, aside, header, footer, .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #fff !important; }
          .pl-container { max-width: 100% !important; padding: 0 !important; }
        }
        .pl-input:focus { outline: 2px solid #e97325; outline-offset: 1px; }
      `}</style>

      <div className="pl-container" style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {/* ===== HEADER ===== */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#1a2744" }}>
            <DollarSignIcon size={32} />
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#1a2744" }}>Perfect P&L Analyzer</h1>
          </div>
          <p style={{ color: "#64748b", marginTop: 8, fontSize: 15, maxWidth: 560, marginInline: "auto" }}>
            See what a perfectly run practice looks like at YOUR revenue level. Then compare your numbers.
          </p>
        </div>

        {/* ===== COLLECTIONS INPUT ===== */}
        <div
          style={{
            background: "#1a2744",
            borderRadius: 12,
            padding: "24px 20px",
            marginBottom: 20,
            color: "#fff",
          }}
        >
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: "#94a3b8" }}>
            Monthly Collections
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700 }}>$</span>
            <input
              className="pl-input"
              type="text"
              inputMode="numeric"
              value={fmt(collections)}
              onChange={(e) => handleCollections(e.target.value)}
              style={{
                fontSize: 28,
                fontWeight: 700,
                background: "transparent",
                border: "none",
                borderBottom: "2px solid #e97325",
                color: "#fff",
                width: 200,
                padding: "4px 0",
              }}
            />
          </div>
          <input
            ref={sliderRef}
            type="range"
            min={10000}
            max={200000}
            step={1000}
            value={collections}
            onChange={handleSlider}
            style={{ width: "100%", marginTop: 16, accentColor: "#e97325" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginTop: 4 }}>
            <span>$10,000</span>
            <span>$200,000</span>
          </div>
        </div>

        {/* ===== SCALING EXAMPLES ===== */}
        {SCALING_EXAMPLES.length > 0 && (
          <div className="no-print" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 24 }}>
            {SCALING_EXAMPLES.map((ex: any) => (
              <button
                key={ex.label}
                onClick={() => applyScalingExample(ex)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1.5px solid #e2e8f0",
                  background: collections === ex.collections ? "#1a2744" : "#fff",
                  color: collections === ex.collections ? "#fff" : "#1a2744",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        )}

        {/* ===== GAP ANALYSIS SUMMARY ===== */}
        {isPurchased && hasAnyInput && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 28,
            }}
          >
            {/* Your Profit Margin */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Your Profit Margin</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: profitColor(profitMargin) }}>{fmtPct(profitMargin)}</div>
            </div>
            {/* Perfect Target */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Perfect Target</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#22c55e" }}>40%</div>
            </div>
            {/* Money Left on the Table */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Money Left on Table</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: moneyLeftPerMonth > 0 ? "#ef4444" : "#22c55e" }}>
                ${fmt(Math.abs(Math.round(moneyLeftPerMonth)))}/mo
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>${fmt(Math.abs(Math.round(moneyLeftPerYear)))}/yr</div>
            </div>
            {/* #1 Problem Area */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>#1 Problem Area</div>
              {biggestGap ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>{biggestGap.item.label}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    {biggestGap.item.coachingOver?.replace("[X]", fmtPct(userPercentages[biggestGap.item.id])).slice(0, 80) || "Over benchmark"}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 16, fontWeight: 700, color: "#22c55e" }}>All within range!</div>
              )}
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
              Input your real expenses, see gap analysis, coaching notes, and save monthly snapshots.
            </p>
            <div
              style={{
                display: "inline-block",
                background: "#e97325",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              $29 one-time
            </div>
          </div>
        )}

        {/* ===== P&L TABLE ===== */}
        <div style={{ overflowX: "auto" }}>
          {(PL_CATEGORIES as PLCategory[]).map((cat) => {
            const isExpanded = expandedCategories.includes(cat.id);
            const ct = categoryTotals[cat.id];
            const catSt = categoryStatus(cat);

            return (
              <div key={cat.id} style={{ marginBottom: 8, border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "1fr repeat(4, 90px) 40px",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: isExpanded ? "#f1f5f9" : "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#1a2744",
                    textAlign: "left",
                    gap: 4,
                    minWidth: 600,
                  }}
                >
                  <span>{isExpanded ? "\u25BC" : "\u25B6"} {cat.name}</span>
                  <span style={{ textAlign: "right", fontSize: 13 }}>${fmt(ct?.perfectDollar || 0)}</span>
                  <span style={{ textAlign: "right", fontSize: 13, color: "#64748b" }}>{fmtPct(ct?.perfectPct || 0)}</span>
                  <span style={{ textAlign: "right", fontSize: 13 }}>{(ct?.userDollar || 0) > 0 ? `$${fmt(ct.userDollar)}` : "-"}</span>
                  <span style={{ textAlign: "right", fontSize: 13, color: "#64748b" }}>{(ct?.userDollar || 0) > 0 ? fmtPct(ct.userPct) : "-"}</span>
                  <span style={{ textAlign: "center" }}>{catSt}</span>
                </button>

                {/* Expanded line items */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid #e2e8f0" }}>
                    {/* Column headers */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr repeat(4, 90px) 40px",
                        padding: "6px 16px",
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: "#94a3b8",
                        fontWeight: 600,
                        gap: 4,
                        minWidth: 600,
                      }}
                    >
                      <span>Line Item</span>
                      <span style={{ textAlign: "right" }}>Perfect $</span>
                      <span style={{ textAlign: "right" }}>Perfect %</span>
                      <span style={{ textAlign: "right" }}>Your $</span>
                      <span style={{ textAlign: "right" }}>Your %</span>
                      <span style={{ textAlign: "center" }}>Status</span>
                    </div>

                    {(cat.items || []).map((item: LineItem) => {
                      const perfectDollar = perfectAmounts[item.id] || 0;
                      const userVal = userExpenses[item.id] || 0;
                      const userPct = userPercentages[item.id] || 0;
                      const st = userVal > 0 ? statusEmoji(userPct, item.minPct, item.maxPct) : "";
                      const isOver = userVal > 0 && userPct > item.maxPct;
                      const isUnder = userVal > 0 && userPct < item.minPct;
                      const showCoaching = (isOver || isUnder) && st === "\u{1F534}";

                      return (
                        <div key={item.id}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr repeat(4, 90px) 40px",
                              padding: "8px 16px",
                              fontSize: 13,
                              alignItems: "center",
                              gap: 4,
                              minWidth: 600,
                              borderTop: "1px solid #f1f5f9",
                            }}
                          >
                            <span style={{ display: "flex", alignItems: "center" }}>
                              {item.label}
                              {item.tooltip && <InfoTooltip text={item.tooltip} />}
                            </span>
                            <span style={{ textAlign: "right", color: "#1a2744" }}>${fmt(perfectDollar)}</span>
                            <span style={{ textAlign: "right", color: "#64748b" }}>{fmtPct(item.midPct)}</span>
                            <span style={{ textAlign: "right" }}>
                              {isPurchased ? (
                                <input
                                  className="pl-input"
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="0"
                                  value={userVal > 0 ? fmt(userVal) : ""}
                                  onChange={(e) => handleExpense(item.id, e.target.value)}
                                  style={{
                                    width: 80,
                                    textAlign: "right",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 6,
                                    padding: "4px 6px",
                                    fontSize: 13,
                                    background: "#fafbfc",
                                  }}
                                />
                              ) : (
                                <span style={{ color: "#cbd5e1" }}>-</span>
                              )}
                            </span>
                            <span style={{ textAlign: "right", color: "#64748b" }}>{userVal > 0 ? fmtPct(userPct) : "-"}</span>
                            <span style={{ textAlign: "center" }}>{st}</span>
                          </div>

                          {/* Coaching note */}
                          {isPurchased && showCoaching && (
                            <div
                              style={{
                                margin: "0 16px 8px",
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
          })}
        </div>

        {/* ===== BOTTOM LINE ===== */}
        <div
          style={{
            background: "#f8fafc",
            border: "2px solid #e2e8f0",
            borderRadius: 12,
            padding: 20,
            marginTop: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1a2744" }}>Total Expenses</span>
            <span style={{ fontWeight: 700, fontSize: 18 }}>
              ${fmt(totalExpenses)}{" "}
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                ({collections > 0 ? fmtPct((totalExpenses / collections) * 100) : "0%"})
              </span>
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 12,
              borderTop: "2px solid #1a2744",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 17, color: "#1a2744" }}>Owner&apos;s Take-Home</span>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontWeight: 800, fontSize: 28, color: profitColor(profitMargin) }}>
                ${fmt(collections - totalExpenses)}
              </span>
              <span style={{ fontSize: 14, color: profitColor(profitMargin), fontWeight: 600, marginLeft: 8 }}>
                {fmtPct(profitMargin)}
              </span>
            </div>
          </div>

          {/* Profit coaching note */}
          {isPurchased && hasAnyInput && profitCoachingNote && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                background: profitMargin >= 35 ? "#f0fdf4" : profitMargin >= 25 ? "#fefce8" : "#fef2f2",
                border: `1px solid ${profitMargin >= 35 ? "#bbf7d0" : profitMargin >= 25 ? "#fef08a" : "#fecaca"}`,
                borderRadius: 8,
                fontSize: 13,
                color: "#1a2744",
                lineHeight: 1.6,
              }}
            >
              <strong>{profitCoachingNote.title || "Coaching Note"}:</strong> {profitCoachingNote.note || profitCoachingNote.message || ""}
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
              {saving ? "Saving..." : "Save This Month's P&L"}
            </button>
          )}
          <button
            onClick={handlePrint}
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
          {saveMsg && <span style={{ alignSelf: "center", fontSize: 13, color: saveMsg === "Saved!" ? "#22c55e" : "#ef4444" }}>{saveMsg}</span>}
        </div>

        {/* Empty state when no data */}
        {PL_CATEGORIES.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
            <p style={{ fontSize: 15 }}>P&L categories are loading... If this persists, the data file may not be configured yet.</p>
          </div>
        )}
      </div>
    </>
  );
}
