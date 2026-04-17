"use client";

import { useState, useEffect, useCallback } from "react";
import { saveReport, getReportHistory, getReport, getReportCount } from "./actions";

/* ─── Types ─── */

interface FormData {
  patientFirstName: string;
  patientAge: number;
  scanDate: string;
  scanType: "Initial Scan" | "Progress Scan" | "Re-Evaluation" | "Wellness Check";
  semgPattern: "Symmetric/Normal" | "Mild Asymmetry" | "Moderate Asymmetry" | "Severe Asymmetry";
  semgRegion: string;
  semgEnergy: string;
  semgNotes: string;
  thermoPattern: "Balanced" | "Mild Imbalance" | "Moderate Imbalance" | "Significant Imbalance";
  thermoRegion: string;
  thermoMaxDiff: number;
  thermoConsistency: string;
  hrvSDNN: number;
  hrvLFHF: number;
  hrvRMSSD: number;
  hrvTotalPower: number;
  prevSDNN: number;
  prevSemgPattern: string;
  prevThermoDiff: number;
  visitsCompleted: number;
  weeksInCare: number;
}

interface ReportData extends FormData {
  id?: string;
  score: number;
  scoreLabel: string;
  scoreColor: string;
  createdAt?: string;
}

interface HistoryItem {
  id: string;
  patient_name: string;
  scan_date: string;
  scan_type: string;
  score: number;
}

function scoreLabelFromScore(score: number): string {
  if (score >= 80) return "Thriving";
  if (score >= 60) return "Adapting Well";
  if (score >= 40) return "Stressed";
  if (score >= 20) return "Struggling";
  return "In Crisis";
}

/* ─── Constants ─── */

const REGIONS = [
  "Upper Cervical (C1-C2)",
  "Mid Cervical (C3-C5)",
  "Lower Cervical (C5-C7)",
  "Upper Thoracic (T1-T4)",
  "Mid Thoracic (T5-T8)",
  "Lower Thoracic (T9-T12)",
  "Lumbar (L1-L5)",
  "Multiple Regions",
];

const REGION_SYMPTOMS: Record<string, string> = {
  "Upper Cervical (C1-C2)": "headaches, brain fog, and sleep issues",
  "Mid Cervical (C3-C5)": "neck tension, shoulder pain, and arm tingling",
  "Lower Cervical (C5-C7)": "neck tension, shoulder pain, and arm tingling",
  "Upper Thoracic (T1-T4)": "upper back tension, breathing patterns, and heart rate regulation",
  "Mid Thoracic (T5-T8)": "mid-back pain and digestive issues",
  "Lower Thoracic (T9-T12)": "core stability and adrenal function",
  "Lumbar (L1-L5)": "low back pain, hip issues, and leg weakness",
  "Multiple Regions": "a wide range of symptoms across the body",
};

const SPINE_SEGMENTS = [
  { key: "Upper Cervical (C1-C2)", label: "C1-C2", y: 30 },
  { key: "Mid Cervical (C3-C5)", label: "C3-C5", y: 55 },
  { key: "Lower Cervical (C5-C7)", label: "C5-C7", y: 80 },
  { key: "Upper Thoracic (T1-T4)", label: "T1-T4", y: 110 },
  { key: "Mid Thoracic (T5-T8)", label: "T5-T8", y: 140 },
  { key: "Lower Thoracic (T9-T12)", label: "T9-T12", y: 170 },
  { key: "Lumbar (L1-L5)", label: "L1-L5", y: 200 },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const DEFAULT_FORM: FormData = {
  patientFirstName: "",
  patientAge: 35,
  scanDate: todayStr(),
  scanType: "Initial Scan",
  semgPattern: "Symmetric/Normal",
  semgRegion: "Upper Cervical (C1-C2)",
  semgEnergy: "Normal",
  semgNotes: "",
  thermoPattern: "Balanced",
  thermoRegion: "Upper Cervical (C1-C2)",
  thermoMaxDiff: 0.5,
  thermoConsistency: "First scan",
  hrvSDNN: 55,
  hrvLFHF: 1.5,
  hrvRMSSD: 0,
  hrvTotalPower: 0,
  prevSDNN: 0,
  prevSemgPattern: "Symmetric/Normal",
  prevThermoDiff: 0,
  visitsCompleted: 0,
  weeksInCare: 0,
};

/* ─── Score helpers ─── */

function calcScore(fd: FormData): { score: number; label: string; color: string } {
  const semgMap: Record<string, number> = { "Symmetric/Normal": 25, "Mild Asymmetry": 20, "Moderate Asymmetry": 12, "Severe Asymmetry": 5 };
  const thermoMap: Record<string, number> = { "Balanced": 25, "Mild Imbalance": 20, "Moderate Imbalance": 12, "Significant Imbalance": 5 };

  const semgScore = semgMap[fd.semgPattern] ?? 12;
  const thermoScore = thermoMap[fd.thermoPattern] ?? 12;
  const sdnnScore = fd.hrvSDNN > 70 ? 25 : fd.hrvSDNN >= 50 ? 20 : fd.hrvSDNN >= 35 ? 12 : 5;
  const lfhfScore = fd.hrvLFHF < 1.5 ? 25 : fd.hrvLFHF <= 2.5 ? 20 : fd.hrvLFHF <= 4 ? 12 : 5;

  const score = semgScore + thermoScore + sdnnScore + lfhfScore;

  let label: string;
  let color: string;
  if (score >= 80) { label = "Thriving"; color = "#22c55e"; }
  else if (score >= 60) { label = "Adapting Well"; color = "#3b82f6"; }
  else if (score >= 40) { label = "Stressed"; color = "#f97316"; }
  else if (score >= 20) { label = "Struggling"; color = "#ea580c"; }
  else { label = "In Crisis"; color = "#ef4444"; }

  return { score, label, color };
}

function prevScore(fd: FormData): number | null {
  if (fd.scanType !== "Progress Scan" && fd.scanType !== "Re-Evaluation") return null;
  const semgMap: Record<string, number> = { "Symmetric/Normal": 25, "Mild Asymmetry": 20, "Moderate Asymmetry": 12, "Severe Asymmetry": 5 };
  const thermoMap: Record<string, number> = { "Balanced": 25, "Mild Imbalance": 20, "Moderate Imbalance": 12, "Significant Imbalance": 5 };
  const prevSemg = semgMap[fd.prevSemgPattern] ?? 12;
  const prevThermo = fd.prevThermoDiff <= 0.3 ? 25 : fd.prevThermoDiff <= 0.7 ? 20 : fd.prevThermoDiff <= 1.2 ? 12 : 5;
  const prevSdnn = fd.prevSDNN > 70 ? 25 : fd.prevSDNN >= 50 ? 20 : fd.prevSDNN >= 35 ? 12 : 5;
  return prevSemg + prevThermo + prevSdnn + 15; // approximate LF/HF middle
}

/* ─── Age-adaptive language ─── */

function ageLang(age: number) {
  if (age <= 5) return { subject: "Your little one's nervous system", possessive: "their", audience: "parent" as const };
  if (age <= 12) return { subject: "Your child's nervous system", possessive: "their", audience: "parent" as const };
  if (age <= 17) return { subject: "Your nervous system", possessive: "your", audience: "teen" as const };
  if (age <= 64) return { subject: "Your nervous system", possessive: "your", audience: "adult" as const };
  return { subject: "Your nervous system", possessive: "your", audience: "senior" as const };
}

/* ─── SVG Gauge arc helper ─── */

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const rad = (a: number) => ((a - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startAngle));
  const y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(endAngle));
  const y2 = cy + r * Math.sin(rad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/* ─── Component ─── */

export default function ScanReportGenerator() {
  const [mode, setMode] = useState<"builder" | "report">("builder");
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportHistory, setReportHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const set = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  }, []);

  /* Load history */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      try {
        const h = await getReportHistory();
        if (!cancelled && Array.isArray(h)) setReportHistory(h);
      } catch { /* ignore */ }
      if (!cancelled) setHistoryLoading(false);
    })();
    return () => { cancelled = true; };
  }, [mode]);

  /* Generate report */
  const handleGenerate = async () => {
    setLoading(true);
    const { score, label, color } = calcScore(formData);
    const rd: ReportData = { ...formData, score, scoreLabel: label, scoreColor: color };

    try {
      const saved = await saveReport({
        patientName: rd.patientFirstName,
        patientAge: rd.patientAge,
        scanDate: rd.scanDate,
        scanType: rd.scanType,
        reportData: rd as unknown as Record<string, unknown>,
        score: rd.score,
      });
      if ("id" in saved) rd.id = saved.id;
    } catch { /* still show report */ }

    setReportData(rd);
    setMode("report");
    setLoading(false);
  };

  /* Load from history */
  const handleLoadReport = async (id: string) => {
    setLoading(true);
    try {
      const r = await getReport(id);
      if (r) {
        // report_data is the jsonb blob that contains all the FormData fields
        const blob = (r.report_data ?? {}) as Record<string, unknown>;
        const rd: ReportData = {
          ...(DEFAULT_FORM),
          ...(blob as Partial<FormData>),
          id: r.id,
          patientFirstName: (blob.patientFirstName as string) || r.patient_name || "",
          patientAge: (blob.patientAge as number) || r.patient_age || 35,
          scanDate: (blob.scanDate as string) || r.scan_date || "",
          scanType: ((blob.scanType as string) || r.scan_type || "Initial Scan") as FormData["scanType"],
          score: r.score,
          scoreLabel: scoreLabelFromScore(r.score),
          scoreColor: r.score >= 80 ? "#22c55e" : r.score >= 60 ? "#3b82f6" : r.score >= 40 ? "#f97316" : r.score >= 20 ? "#ea580c" : "#ef4444",
          createdAt: r.created_at,
        };
        setReportData(rd);
        setMode("report");
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const showProgress = formData.scanType === "Progress Scan" || formData.scanType === "Re-Evaluation";

  /* ─── Select helper ─── */
  const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
    <label className="block">
      <span className="text-sm font-semibold text-neuro-navy">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-neuro-orange focus:ring-2 focus:ring-neuro-orange/30 outline-none">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );

  const NumberInput = ({ label, value, onChange, step, min, suffix }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; suffix?: string }) => (
    <label className="block">
      <span className="text-sm font-semibold text-neuro-navy">{label}{suffix ? ` (${suffix})` : ""}</span>
      <input type="number" value={value} step={step ?? 1} min={min ?? 0} onChange={e => onChange(parseFloat(e.target.value) || 0)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-neuro-orange focus:ring-2 focus:ring-neuro-orange/30 outline-none" />
    </label>
  );

  /* ════════════════════════════════════════════════════
     BUILDER MODE
     ════════════════════════════════════════════════════ */
  if (mode === "builder") {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-black text-neuro-navy flex items-center gap-3">
            <svg className="w-7 h-7 text-neuro-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Scan Report Generator
          </h1>
          <p className="text-gray-500 text-sm mt-1">Input scan data, generate a beautiful patient-friendly report.</p>
        </div>

        {/* ── Patient Info ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-neuro-navy mb-4">Patient Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-neuro-navy">Patient First Name</span>
              <input type="text" value={formData.patientFirstName} onChange={e => set("patientFirstName", e.target.value)} placeholder="e.g. Sarah" className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-neuro-orange focus:ring-2 focus:ring-neuro-orange/30 outline-none" />
            </label>
            <NumberInput label="Patient Age" value={formData.patientAge} onChange={v => set("patientAge", v)} min={0} />
            <label className="block">
              <span className="text-sm font-semibold text-neuro-navy">Scan Date</span>
              <input type="date" value={formData.scanDate} onChange={e => set("scanDate", e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-neuro-orange focus:ring-2 focus:ring-neuro-orange/30 outline-none" />
            </label>
            <Select label="Scan Type" value={formData.scanType} onChange={v => set("scanType", v as FormData["scanType"])} options={["Initial Scan", "Progress Scan", "Re-Evaluation", "Wellness Check"]} />
          </div>
        </section>

        {/* ── sEMG ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-neuro-navy mb-4">sEMG (Surface Electromyography)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Overall Pattern" value={formData.semgPattern} onChange={v => set("semgPattern", v as FormData["semgPattern"])} options={["Symmetric/Normal", "Mild Asymmetry", "Moderate Asymmetry", "Severe Asymmetry"]} />
            <Select label="Primary Region" value={formData.semgRegion} onChange={v => set("semgRegion", v)} options={REGIONS} />
            <Select label="Energy Level" value={formData.semgEnergy} onChange={v => set("semgEnergy", v)} options={["Exhausted/Suppressed", "Below Normal", "Normal", "Elevated/Guarding", "Hyperactive/Defensive"]} />
          </div>
          <label className="block mt-4">
            <span className="text-sm font-semibold text-neuro-navy">Notes (optional)</span>
            <textarea value={formData.semgNotes} onChange={e => set("semgNotes", e.target.value)} rows={2} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-neuro-orange focus:ring-2 focus:ring-neuro-orange/30 outline-none resize-y" />
          </label>
        </section>

        {/* ── Thermography ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-neuro-navy mb-4">Thermography</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Overall Pattern" value={formData.thermoPattern} onChange={v => set("thermoPattern", v as FormData["thermoPattern"])} options={["Balanced", "Mild Imbalance", "Moderate Imbalance", "Significant Imbalance"]} />
            <Select label="Primary Region" value={formData.thermoRegion} onChange={v => set("thermoRegion", v)} options={REGIONS} />
            <NumberInput label="Max Temp Differential" value={formData.thermoMaxDiff} onChange={v => set("thermoMaxDiff", v)} step={0.1} suffix="°C" />
            <Select label="Pattern Consistency" value={formData.thermoConsistency} onChange={v => set("thermoConsistency", v)} options={["First scan", "Consistent with previous", "Improved from previous", "Worsened from previous"]} />
          </div>
        </section>

        {/* ── HRV ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-neuro-navy mb-4">Heart Rate Variability (HRV)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumberInput label="SDNN" value={formData.hrvSDNN} onChange={v => set("hrvSDNN", v)} suffix="ms" />
            <NumberInput label="LF/HF Ratio" value={formData.hrvLFHF} onChange={v => set("hrvLFHF", v)} step={0.1} />
            <NumberInput label="RMSSD (optional)" value={formData.hrvRMSSD} onChange={v => set("hrvRMSSD", v)} suffix="ms" />
            <NumberInput label="Total Power (optional)" value={formData.hrvTotalPower} onChange={v => set("hrvTotalPower", v)} />
          </div>
        </section>

        {/* ── Progress Comparison ── */}
        {showProgress && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-heading font-bold text-neuro-navy mb-4">Progress Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInput label="Previous SDNN" value={formData.prevSDNN} onChange={v => set("prevSDNN", v)} suffix="ms" />
              <Select label="Previous sEMG Pattern" value={formData.prevSemgPattern} onChange={v => set("prevSemgPattern", v)} options={["Symmetric/Normal", "Mild Asymmetry", "Moderate Asymmetry", "Severe Asymmetry"]} />
              <NumberInput label="Previous Thermo Differential" value={formData.prevThermoDiff} onChange={v => set("prevThermoDiff", v)} step={0.1} suffix="°C" />
              <NumberInput label="Visits Completed" value={formData.visitsCompleted} onChange={v => set("visitsCompleted", v)} />
              <NumberInput label="Weeks in Care" value={formData.weeksInCare} onChange={v => set("weeksInCare", v)} />
            </div>
          </section>
        )}

        {/* ── Generate Button ── */}
        <button onClick={handleGenerate} disabled={loading || !formData.patientFirstName} className="w-full py-4 rounded-xl bg-neuro-orange text-white font-heading font-bold text-lg hover:bg-neuro-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
          {loading ? "Generating..." : "Generate Report"}
        </button>

        {/* ── History ── */}
        <section className="mt-10">
          <h2 className="text-lg font-heading font-bold text-neuro-navy mb-4">Report History</h2>
          {historyLoading ? (
            <p className="text-gray-400 text-sm">Loading history...</p>
          ) : reportHistory.length === 0 ? (
            <p className="text-gray-400 text-sm">No previous reports yet.</p>
          ) : (
            <div className="space-y-2">
              {reportHistory.map(h => {
                const label = scoreLabelFromScore(h.score);
                const badgeColor = h.score >= 80 ? "bg-green-100 text-green-700" : h.score >= 60 ? "bg-blue-100 text-blue-700" : h.score >= 40 ? "bg-orange-100 text-orange-700" : h.score >= 20 ? "bg-red-100 text-red-600" : "bg-red-200 text-red-800";
                return (
                  <button key={h.id} onClick={() => handleLoadReport(h.id)} className="w-full text-left flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-neuro-orange/40 transition-colors">
                    <div>
                      <span className="font-semibold text-neuro-navy">{h.patient_name}</span>
                      <span className="text-gray-400 text-sm ml-3">{h.scan_date}</span>
                      <span className="text-gray-400 text-sm ml-3">{h.scan_type}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${badgeColor}`}>{h.score} &middot; {label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     REPORT MODE
     ════════════════════════════════════════════════════ */

  if (!reportData) return null;

  const rd = reportData;
  const lang = ageLang(rd.patientAge);
  const isProgress = rd.scanType === "Progress Scan" || rd.scanType === "Re-Evaluation";
  const pScore = isProgress ? prevScore(rd) : null;
  const scoreDelta = pScore !== null ? rd.score - pScore : 0;
  const scorePct = pScore && pScore > 0 ? Math.round((scoreDelta / pScore) * 100) : 0;

  /* Gauge arc math */
  const sweepStart = -140;
  const sweepEnd = 140;
  const sweepRange = sweepEnd - sweepStart; // 280
  const fillEnd = sweepStart + (rd.score / 100) * sweepRange;

  /* SDNN age-adjusted interpretation */
  const sdnnInterp = (() => {
    const age = rd.patientAge;
    const sdnn = rd.hrvSDNN;
    if (age < 30) {
      if (sdnn > 80) return "excellent for your age";
      if (sdnn > 55) return "within a healthy range for your age";
      if (sdnn > 35) return "below optimal for your age";
      return "significantly low for your age";
    }
    if (age < 50) {
      if (sdnn > 70) return "excellent for your age";
      if (sdnn > 50) return "within a healthy range for your age";
      if (sdnn > 35) return "below optimal for your age";
      return "significantly low for your age";
    }
    if (age < 65) {
      if (sdnn > 60) return "excellent for your age";
      if (sdnn > 40) return "within a healthy range for your age";
      if (sdnn > 25) return "below optimal for your age";
      return "significantly low for your age";
    }
    if (sdnn > 50) return "excellent for your age";
    if (sdnn > 35) return "within a healthy range for your age";
    if (sdnn > 20) return "below optimal for your age";
    return "significantly low for your age";
  })();

  /* LF/HF tilt */
  const beamAngle = Math.max(-25, Math.min(25, (rd.hrvLFHF - 1.5) * 8));

  /* sEMG narrative */
  const semgNarrative = (() => {
    const symptoms = REGION_SYMPTOMS[rd.semgRegion] ?? "various symptoms";
    const sub = lang.subject;
    switch (rd.semgPattern) {
      case "Symmetric/Normal":
        return `${sub} is showing a beautifully balanced muscle pattern. The muscles along ${lang.possessive} spine are firing symmetrically, which is exactly what we want to see. This balanced pattern in the ${rd.semgRegion} area supports healthy function and good communication between the brain and body.`;
      case "Mild Asymmetry":
        return `${sub} is showing a mild imbalance in muscle activity around the ${rd.semgRegion} area. This is a small deviation from ideal, meaning the muscles on one side are working slightly harder than the other. This kind of pattern is often associated with ${symptoms}. The good news is that mild imbalances typically respond well to care.`;
      case "Moderate Asymmetry":
        return `${sub} is showing a moderate imbalance in muscle activity, particularly in the ${rd.semgRegion} area. This means the muscles on one side of the spine are working noticeably harder than the other, creating uneven stress on the joints and nerves. This pattern is commonly linked to ${symptoms}. Addressing this imbalance is an important part of ${lang.possessive} care plan.`;
      case "Severe Asymmetry":
        return `${sub} is showing a significant imbalance in muscle activity around the ${rd.semgRegion} area. This level of asymmetry indicates that the muscles are under considerable stress, with one side working much harder than the other. This pattern is strongly associated with ${symptoms}. The important thing to know is that even significant imbalances can improve with consistent, focused care.`;
      default:
        return "";
    }
  })();

  /* Thermo narrative */
  const thermoNarrative = (() => {
    const sub = lang.subject;
    const diff = rd.thermoMaxDiff.toFixed(1);
    switch (rd.thermoPattern) {
      case "Balanced":
        return `The temperature scan shows a well-balanced pattern with only a ${diff}°C differential. ${sub} is regulating autonomic function beautifully. Even temperatures on both sides of the spine indicate that the nerves controlling blood flow and organ function are working in harmony.`;
      case "Mild Imbalance":
        return `The temperature scan reveals a mild imbalance with a ${diff}°C differential in the ${rd.thermoRegion} area. ${sub} is showing a small difference in autonomic regulation between the left and right sides. This suggests the nerves in this area are under slight stress, which can subtly affect how the body manages internal functions like circulation and digestion.`;
      case "Moderate Imbalance":
        return `The temperature scan shows a moderate imbalance with a ${diff}°C differential in the ${rd.thermoRegion} area. ${sub} has a noticeable difference in autonomic regulation. This means the nerves controlling blood vessel diameter and organ function are not communicating evenly, which can affect energy levels, immune response, and overall adaptability.`;
      case "Significant Imbalance":
        return `The temperature scan reveals a significant imbalance with a ${diff}°C differential in the ${rd.thermoRegion} area. ${sub} is showing a substantial difference in autonomic control between the left and right sides. This level of imbalance indicates that the nervous system is under considerable stress in this region, impacting the body's ability to self-regulate effectively. Targeted care can help restore balance over time.`;
      default:
        return "";
    }
  })();

  /* Summary sentences */
  const summaryText = (() => {
    const name = rd.patientFirstName;
    const lines: string[] = [];

    if (rd.score >= 80) {
      lines.push(`${name}, ${lang.possessive} nervous system is performing at an excellent level.`);
      lines.push(`The muscle balance, temperature regulation, and heart rate variability are all showing strong, healthy patterns.`);
    } else if (rd.score >= 60) {
      lines.push(`${name}, ${lang.possessive} nervous system is adapting well overall, with some areas where we can help it function even better.`);
      lines.push(`We saw solid results in several areas, and there are clear opportunities for improvement that targeted care can address.`);
    } else if (rd.score >= 40) {
      lines.push(`${name}, ${lang.possessive} nervous system is showing signs of stress in several areas.`);
      lines.push(`This is common and very treatable. The scan gives us a clear roadmap for exactly where to focus ${lang.possessive} care.`);
    } else {
      lines.push(`${name}, ${lang.possessive} nervous system is working hard to compensate for some significant stressors.`);
      lines.push(`While the numbers show the body is under strain, this also means there is tremendous room for improvement with the right care plan.`);
    }

    if (lang.audience === "senior") {
      lines.push(`Supporting nervous system health is one of the most impactful things you can do for vitality and independence as we age.`);
    }

    lines.push(`Every step forward in nervous system health translates to better function, better energy, and a better quality of life.`);
    return lines.join(" ");
  })();

  /* Next steps */
  const nextSteps = isProgress
    ? `Based on ${lang.possessive} progress scan results, we can see how the body is responding to care. We will continue to refine the approach, building on the improvements we have seen. The next phase of care will be tailored to the areas that still need attention, ensuring we keep the positive momentum going. ${rd.patientFirstName}'s next scan will help us track continued progress and adjust as needed.`
    : `Now that we have a comprehensive baseline of ${lang.possessive} nervous system function, we can create a targeted care plan designed specifically for ${rd.patientFirstName}. The initial phase of care will focus on the areas where we saw the most stress, helping the nervous system begin to re-establish healthy patterns. We will re-scan at key milestones to measure progress and make sure the care plan is delivering results.`;

  /* SDNN bar position (clamped 0–120ms range mapped to 0–100%) */
  const sdnnBarPct = Math.min(100, Math.max(0, (rd.hrvSDNN / 120) * 100));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          [data-print-area], [data-print-area] * { visibility: visible !important; }
          [data-print-area] {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20px 30px !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6 no-print">
        <button onClick={() => { setMode("builder"); setReportData(null); }} className="px-4 py-2 rounded-lg bg-gray-100 text-neuro-navy font-semibold hover:bg-gray-200 transition-colors text-sm">
          &larr; Back to Builder
        </button>
        <button onClick={() => window.print()} className="px-6 py-2 rounded-lg bg-neuro-orange text-white font-bold hover:bg-neuro-orange-light transition-colors text-sm shadow">
          Print Report
        </button>
      </div>

      {/* ── Print Area ── */}
      <div data-print-area="">
        {/* Header */}
        <div className="bg-neuro-navy text-white rounded-xl p-6 mb-6 text-center">
          <h1 className="text-2xl font-heading font-black tracking-tight">Nervous System Assessment Report</h1>
          <div className="mt-2 flex items-center justify-center gap-4 text-sm text-gray-300">
            <span>Patient: <strong className="text-white">{rd.patientFirstName}</strong></span>
            <span className="opacity-50">|</span>
            <span>{rd.scanDate}</span>
            <span className="opacity-50">|</span>
            <span>{rd.scanType}</span>
          </div>
        </div>

        {/* Section 1: Score Gauge */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm text-center">
          <h2 className="text-lg font-heading font-bold text-neuro-navy mb-4">Overall Nervous System Score</h2>
          <div className="flex justify-center">
            <svg viewBox="0 0 200 200" width="220" height="220">
              {/* Background arc */}
              <path d={describeArc(100, 110, 70, sweepStart, sweepEnd)} fill="none" stroke="#e5e7eb" strokeWidth={14} strokeLinecap="round" />
              {/* Foreground arc */}
              <path d={describeArc(100, 110, 70, sweepStart, fillEnd)} fill="none" stroke={rd.scoreColor} strokeWidth={14} strokeLinecap="round" />
              {/* Score text */}
              <text x="100" y="105" textAnchor="middle" fontSize="40" fontWeight="800" fill={rd.scoreColor}>{rd.score}</text>
              <text x="100" y="125" textAnchor="middle" fontSize="13" fontWeight="600" fill="#6b7280">out of 100</text>
              <text x="100" y="155" textAnchor="middle" fontSize="16" fontWeight="700" fill={rd.scoreColor}>{rd.scoreLabel}</text>
            </svg>
          </div>
          <p className="text-gray-600 mt-2 max-w-md mx-auto text-sm">
            {rd.score >= 80 && `${rd.patientFirstName}'s nervous system is performing at an outstanding level.`}
            {rd.score >= 60 && rd.score < 80 && `${rd.patientFirstName}'s nervous system is adapting well with room for optimization.`}
            {rd.score >= 40 && rd.score < 60 && `${rd.patientFirstName}'s nervous system is showing signs of stress that we can address together.`}
            {rd.score < 40 && `${rd.patientFirstName}'s nervous system is under significant stress — a clear care plan will make a real difference.`}
          </p>
        </section>

        {/* Section 2: sEMG */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-neuro-navy mb-1">What Your Muscles Are Telling Us</h2>
          <p className="text-xs text-gray-400 mb-4">Surface Electromyography (sEMG)</p>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Spine diagram */}
            <div className="flex-shrink-0">
              <svg viewBox="0 0 160 230" width="140" height="210">
                {/* Spine line */}
                <line x1="40" y1="20" x2="40" y2="210" stroke="#d1d5db" strokeWidth={3} strokeLinecap="round" />
                {SPINE_SEGMENTS.map(seg => {
                  const isAffected = rd.semgRegion === seg.key || rd.semgRegion === "Multiple Regions";
                  const color = isAffected
                    ? rd.semgPattern === "Severe Asymmetry" ? "#ef4444" : rd.semgPattern === "Moderate Asymmetry" ? "#f97316" : rd.semgPattern === "Mild Asymmetry" ? "#facc15" : "#22c55e"
                    : "#22c55e";
                  return (
                    <g key={seg.key}>
                      <circle cx={40} cy={seg.y} r={8} fill={color} opacity={0.85} />
                      <text x={56} y={seg.y + 4} fontSize="10" fill="#374151" fontWeight={isAffected ? "700" : "400"}>{seg.label}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
            {/* Narrative */}
            <div className="flex-1">
              <p className="text-gray-700 text-sm leading-relaxed mb-3">{semgNarrative}</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <span className="font-semibold text-neuro-navy">Energy Level:</span>{" "}
                <span className="text-gray-600">{rd.semgEnergy}</span>
                {rd.semgNotes && (
                  <p className="text-gray-500 text-xs mt-1">Note: {rd.semgNotes}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Thermography */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-neuro-navy mb-1">What Your Temperature Pattern Reveals</h2>
          <p className="text-xs text-gray-400 mb-4">Infrared Thermography</p>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Spine diagram — temperature variant */}
            <div className="flex-shrink-0">
              <svg viewBox="0 0 160 230" width="140" height="210">
                <line x1="40" y1="20" x2="40" y2="210" stroke="#d1d5db" strokeWidth={3} strokeLinecap="round" />
                {SPINE_SEGMENTS.map(seg => {
                  const isAffected = rd.thermoRegion === seg.key || rd.thermoRegion === "Multiple Regions";
                  const intensity = isAffected ? Math.min(1, rd.thermoMaxDiff / 2) : 0;
                  const r = Math.round(34 + intensity * 200);
                  const g = Math.round(197 - intensity * 150);
                  const b = Math.round(94 - intensity * 50);
                  const color = isAffected ? `rgb(${r},${g},${b})` : "#22c55e";
                  return (
                    <g key={seg.key}>
                      <circle cx={40} cy={seg.y} r={8} fill={color} opacity={0.85} />
                      <text x={56} y={seg.y + 4} fontSize="10" fill="#374151" fontWeight={isAffected ? "700" : "400"}>{seg.label}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-gray-700 text-sm leading-relaxed mb-3">{thermoNarrative}</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <span className="font-semibold text-neuro-navy">Pattern Consistency:</span>{" "}
                <span className="text-gray-600">{rd.thermoConsistency}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: HRV */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-neuro-navy mb-1">Your Heart Rate Variability</h2>
          <p className="text-xs text-gray-400 mb-4">HRV Analysis</p>

          {/* SDNN Bar */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-neuro-navy mb-2">SDNN: {rd.hrvSDNN} ms</p>
            <div className="relative h-8 rounded-full overflow-hidden flex">
              <div className="h-full bg-red-400" style={{ width: "25%" }} />
              <div className="h-full bg-orange-400" style={{ width: "15%" }} />
              <div className="h-full bg-blue-400" style={{ width: "25%" }} />
              <div className="h-full bg-green-400" style={{ width: "35%" }} />
              {/* Labels */}
              <span className="absolute left-[5%] top-1/2 -translate-y-1/2 text-[9px] text-white font-bold">Low</span>
              <span className="absolute left-[28%] top-1/2 -translate-y-1/2 text-[9px] text-white font-bold">Fair</span>
              <span className="absolute left-[50%] top-1/2 -translate-y-1/2 text-[9px] text-white font-bold">Good</span>
              <span className="absolute left-[78%] top-1/2 -translate-y-1/2 text-[9px] text-white font-bold">Excellent</span>
            </div>
            {/* Triangle marker */}
            <div className="relative h-4">
              <div className="absolute -top-1" style={{ left: `${sdnnBarPct}%`, transform: "translateX(-50%)" }}>
                <svg width="14" height="10" viewBox="0 0 14 10"><polygon points="7,0 0,10 14,10" fill={rd.scoreColor} /></svg>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-2">
              {lang.possessive === "their" ? "Their" : "Your"} SDNN of {rd.hrvSDNN} ms is {sdnnInterp}. SDNN measures the overall adaptability of the nervous system — higher values generally indicate a more resilient and flexible system.
            </p>
          </div>

          {/* LF/HF Balance Beam */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-neuro-navy mb-2">Autonomic Balance (LF/HF Ratio: {rd.hrvLFHF})</p>
            <div className="flex justify-center">
              <svg viewBox="0 0 300 80" width="300" height="80">
                {/* Fulcrum triangle */}
                <polygon points="150,45 140,65 160,65" fill="#9ca3af" />
                {/* Beam */}
                <g transform={`rotate(${beamAngle}, 150, 40)`}>
                  <line x1="40" y1="40" x2="260" y2="40" stroke="#374151" strokeWidth={3} strokeLinecap="round" />
                  <circle cx="40" cy="40" r="6" fill="#ef4444" />
                  <circle cx="260" cy="40" r="6" fill="#3b82f6" />
                </g>
                <text x="40" y="77" textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="600">Fight or Flight</text>
                <text x="260" y="77" textAnchor="middle" fontSize="9" fill="#3b82f6" fontWeight="600">Rest &amp; Digest</text>
              </svg>
            </div>
            <p className="text-gray-600 text-sm mt-2">
              {rd.hrvLFHF < 1.5
                ? `${lang.possessive === "their" ? "Their" : "Your"} autonomic nervous system is well balanced, with a healthy emphasis on the rest-and-digest (parasympathetic) branch. This is ideal for recovery and healing.`
                : rd.hrvLFHF <= 2.5
                  ? `${lang.possessive === "their" ? "Their" : "Your"} autonomic balance is within a normal range. There is a slight lean toward the fight-or-flight (sympathetic) side, which is common and within healthy limits.`
                  : rd.hrvLFHF <= 4
                    ? `${lang.possessive === "their" ? "Their" : "Your"} autonomic nervous system is leaning more toward the fight-or-flight (sympathetic) side. This suggests the body is in a heightened state of alertness, which over time can affect recovery, sleep, and energy.`
                    : `${lang.possessive === "their" ? "Their" : "Your"} autonomic nervous system is strongly shifted toward fight-or-flight mode. This level of sympathetic dominance means the body is spending too much energy on stress response and not enough on healing, digestion, and recovery.`
              }
            </p>
          </div>

          {/* Optional metrics */}
          {(rd.hrvRMSSD > 0 || rd.hrvTotalPower > 0) && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm flex gap-6">
              {rd.hrvRMSSD > 0 && <span><strong className="text-neuro-navy">RMSSD:</strong> {rd.hrvRMSSD} ms</span>}
              {rd.hrvTotalPower > 0 && <span><strong className="text-neuro-navy">Total Power:</strong> {rd.hrvTotalPower}</span>}
            </div>
          )}
        </section>

        {/* Section 5: Summary */}
        <section className="bg-neuro-cream rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-neuro-navy mb-3">Summary</h2>
          <p className="text-gray-700 text-sm leading-relaxed">{summaryText}</p>
        </section>

        {/* Section 6: Progress (conditional) */}
        {isProgress && pScore !== null && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-heading font-bold text-neuro-navy mb-4">Progress Since Last Scan</h2>
            <div className="flex items-center justify-center gap-8 mb-4">
              <div className="text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Previous</p>
                <p className="text-3xl font-heading font-black text-gray-400">{pScore}</p>
              </div>
              <div className="text-center">
                {scoreDelta > 0 && (
                  <svg viewBox="0 0 40 40" width="48" height="48"><polygon points="20,5 35,30 5,30" fill="#22c55e" /></svg>
                )}
                {scoreDelta < 0 && (
                  <svg viewBox="0 0 40 40" width="48" height="48"><polygon points="20,35 35,10 5,10" fill="#ef4444" /></svg>
                )}
                {scoreDelta === 0 && (
                  <svg viewBox="0 0 40 20" width="48" height="24"><rect x="5" y="8" width="30" height="4" rx="2" fill="#9ca3af" /></svg>
                )}
                <p className="text-sm font-bold mt-1" style={{ color: scoreDelta > 0 ? "#22c55e" : scoreDelta < 0 ? "#ef4444" : "#9ca3af" }}>
                  {scoreDelta > 0 ? "+" : ""}{scoreDelta} pts ({scorePct > 0 ? "+" : ""}{scorePct}%)
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Current</p>
                <p className="text-3xl font-heading font-black" style={{ color: rd.scoreColor }}>{rd.score}</p>
              </div>
            </div>

            {/* Metric comparisons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">sEMG Pattern</p>
                <p className="text-gray-500">{rd.prevSemgPattern}</p>
                <p className="font-bold text-neuro-navy">&darr; {rd.semgPattern}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Thermo Diff</p>
                <p className="text-gray-500">{rd.prevThermoDiff}°C</p>
                <p className="font-bold text-neuro-navy">&darr; {rd.thermoMaxDiff}°C</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">SDNN</p>
                <p className="text-gray-500">{rd.prevSDNN} ms</p>
                <p className="font-bold text-neuro-navy">&darr; {rd.hrvSDNN} ms</p>
              </div>
            </div>

            {rd.visitsCompleted > 0 && (
              <p className="text-gray-600 text-sm text-center mt-4">
                After <strong>{rd.visitsCompleted} visits</strong> over <strong>{rd.weeksInCare} weeks</strong>, {rd.patientFirstName} has {scoreDelta > 0 ? "made meaningful progress" : scoreDelta === 0 ? "maintained their baseline" : "experienced some changes in nervous system function"}.
              </p>
            )}
          </section>
        )}

        {/* Section 7: Next Steps */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-neuro-navy mb-3">Next Steps</h2>
          <p className="text-gray-700 text-sm leading-relaxed">{nextSteps}</p>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
          <p className="font-semibold text-gray-500">Powered by NeuroChiro</p>
          <p className="mt-1">{rd.scanDate}</p>
          <p className="mt-1 italic">This report is for informational purposes only and does not constitute medical advice. Please consult your healthcare provider for diagnosis and treatment decisions.</p>
        </div>
      </div>
    </div>
  );
}
