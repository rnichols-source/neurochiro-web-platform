"use client";
import UpgradeGate from "@/components/doctor/UpgradeGate";
import { saveToolData, loadToolData } from "../tool-data-actions";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Activity,
  Thermometer,
  Heart,
  Printer,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Check,
  FileText,
  Clock,
  X,
  Info,
} from "lucide-react";
import { saveReport, getReportHistory, getReport } from "./actions";
import { getPortalShellData } from "../portal-actions";
import PageHeader from "@/components/portal/PageHeader";
import ExampleBanner from "@/components/portal/ExampleBanner";

/* ─── Types ─── */

interface FormData {
  patientFirstName: string;
  patientAge: number | null;
  scanDate: string;
  scanType: "Initial Scan" | "Progress Scan" | "Re-Evaluation" | "Wellness Check";
  doctorName: string;
  practiceName: string;
  semgPattern: string;
  semgRegion: string;
  semgEnergy: string;
  semgNotes: string;
  thermoPattern: string;
  thermoRegion: string;
  thermoMaxDiff: number | null;
  thermoConsistency: string;
  hrvSDNN: number | null;
  hrvLFHF: number | null;
  hrvRMSSD: number | null;
  hrvTotalPower: number | null;
  prevSDNN: number | null;
  prevSemgPattern: string;
  prevThermoDiff: number | null;
  visitsCompleted: number | null;
  weeksInCare: number | null;
  editSummary: string;
  doctorNotes: string;
  showProgress: boolean;
  showNotes: boolean;
  currentStep: number;
}

interface HistoryItem {
  id: string;
  patient_name: string;
  scan_date: string;
  scan_type: string;
  score: number;
  created_at: string;
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

const SPINE_SEGMENTS: { label: string; region: string; group: string }[] = [
  { label: "C1", region: "Upper Cervical (C1-C2)", group: "Cervical" },
  { label: "C2", region: "Upper Cervical (C1-C2)", group: "Cervical" },
  { label: "C3", region: "Mid Cervical (C3-C5)", group: "Cervical" },
  { label: "C4", region: "Mid Cervical (C3-C5)", group: "Cervical" },
  { label: "C5", region: "Mid Cervical (C3-C5)", group: "Cervical" },
  { label: "C6", region: "Lower Cervical (C5-C7)", group: "Cervical" },
  { label: "C7", region: "Lower Cervical (C5-C7)", group: "Cervical" },
  { label: "T1", region: "Upper Thoracic (T1-T4)", group: "Thoracic" },
  { label: "T2", region: "Upper Thoracic (T1-T4)", group: "Thoracic" },
  { label: "T3", region: "Upper Thoracic (T1-T4)", group: "Thoracic" },
  { label: "T4", region: "Upper Thoracic (T1-T4)", group: "Thoracic" },
  { label: "T5", region: "Mid Thoracic (T5-T8)", group: "Thoracic" },
  { label: "T6", region: "Mid Thoracic (T5-T8)", group: "Thoracic" },
  { label: "T7", region: "Mid Thoracic (T5-T8)", group: "Thoracic" },
  { label: "T8", region: "Mid Thoracic (T5-T8)", group: "Thoracic" },
  { label: "T9", region: "Lower Thoracic (T9-T12)", group: "Thoracic" },
  { label: "T10", region: "Lower Thoracic (T9-T12)", group: "Thoracic" },
  { label: "T11", region: "Lower Thoracic (T9-T12)", group: "Thoracic" },
  { label: "T12", region: "Lower Thoracic (T9-T12)", group: "Thoracic" },
  { label: "L1", region: "Lumbar (L1-L5)", group: "Lumbar" },
  { label: "L2", region: "Lumbar (L1-L5)", group: "Lumbar" },
  { label: "L3", region: "Lumbar (L1-L5)", group: "Lumbar" },
  { label: "L4", region: "Lumbar (L1-L5)", group: "Lumbar" },
  { label: "L5", region: "Lumbar (L1-L5)", group: "Lumbar" },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const LS_KEY = "neurochiro-scan-report";

const TERM_HELP = {
  sEMG: "Surface EMG reads muscle activity along the spine. A typical side-to-side difference at rest is under about 30 percent, and devices differ.",
  Thermography: "Thermography compares skin temperature on each side of the spine. A typical difference is under about 0.5°C.",
  HRV: "Heart rate variability is the beat-to-beat change in heart timing. Many adult short recordings fall around 50–100 ms SDNN.",
  SDNN: "SDNN is the standard deviation of the time between heartbeats. A typical resting range is about 50–100 ms.",
  RMSSD: "RMSSD summarizes successive differences between heartbeats. A typical resting range is about 20–50 ms.",
  "LF/HF": "LF/HF compares two frequency bands of heart-rate variation. A typical resting ratio is about 0.5–2.0.",
  "Total Power": "Total power is the combined size of those heart-rate frequency bands. A typical short recording is about 1,000–3,000 ms², and devices differ.",
} as const;

function TermInfo({ term }: { term: keyof typeof TERM_HELP }) {
  return (
    <button type="button" className="no-print min-h-11 min-w-11 inline-flex items-center justify-center text-portal-muted" aria-label={TERM_HELP[term]} title={TERM_HELP[term]}>
      <Info className="w-4 h-4" aria-hidden />
    </button>
  );
}

function optionalNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function blankForm(doctorName = "", practiceName = ""): FormData {
  return {
    patientFirstName: "",
    patientAge: null,
    scanDate: todayStr(),
    scanType: "Initial Scan",
    doctorName,
    practiceName,
    semgPattern: "",
    semgRegion: "",
    semgEnergy: "",
    semgNotes: "",
    thermoPattern: "",
    thermoRegion: "",
    thermoMaxDiff: null,
    thermoConsistency: "",
    hrvSDNN: null,
    hrvLFHF: null,
    hrvRMSSD: null,
    hrvTotalPower: null,
    prevSDNN: null,
    prevSemgPattern: "",
    prevThermoDiff: null,
    visitsCompleted: null,
    weeksInCare: null,
    editSummary: "",
    doctorNotes: "",
    showProgress: false,
    showNotes: false,
    currentStep: 1,
  };
}

function exampleForm(doctorName = "", practiceName = ""): FormData {
  return {
    patientFirstName: "",
    patientAge: 35,
    scanDate: todayStr(),
    scanType: "Initial Scan",
    doctorName,
    practiceName,
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
    hrvRMSSD: 35,
    hrvTotalPower: 1200,
    prevSDNN: 0,
    prevSemgPattern: "Symmetric/Normal",
    prevThermoDiff: 0,
    visitsCompleted: 12,
    weeksInCare: 6,
    editSummary: "",
    doctorNotes: "",
    showProgress: true,
    showNotes: true,
    currentStep: 1,
  };
}

function isSeededSample(data: Partial<FormData>): boolean {
  const doctor = String(data.doctorName || "");
  const practice = String(data.practiceName || "");
  return (
    !String(data.patientFirstName || "").trim() &&
    (doctor.includes("[DOCTOR NAME]") || practice.includes("[PRACTICE NAME]")) &&
    data.patientAge === 35 &&
    data.hrvSDNN === 55 &&
    data.visitsCompleted === 12
  );
}

function cleanPracticeField(value: unknown, fallback: string): string {
  const text = String(value || "").trim();
  if (!text || text.includes("[DOCTOR NAME]") || text.includes("[PRACTICE NAME]")) return fallback;
  return text;
}

const STEP_LABELS = ["1. Scan Data", "2. Preview & Edit", "3. Final & Print"];

/* ─── Score Calculation ─── */

type Scores = { total: number; semgScore: number; thermoScore: number; hrvScore: number; label: string; color: string };

function scoreReady(fd: FormData): boolean {
  return Boolean(fd.semgPattern) && Boolean(fd.thermoPattern) && fd.thermoMaxDiff != null && fd.hrvSDNN != null;
}

function calcScores(fd: FormData): Scores | null {
  if (!scoreReady(fd)) return null;
  const semgMap: Record<string, number> = { "Symmetric/Normal": 35, "Mild Asymmetry": 25, "Moderate Asymmetry": 15, "Severe Asymmetry": 5 };
  const thermoMap: Record<string, number> = { "Balanced": 35, "Mild Imbalance": 25, "Moderate Imbalance": 15, "Significant Imbalance": 5 };
  const diff = fd.thermoMaxDiff ?? 0;
  const sdnn = fd.hrvSDNN ?? 0;

  const semgScore = semgMap[fd.semgPattern] ?? 15;
  let thermoScore = thermoMap[fd.thermoPattern] ?? 15;
  if (diff > 2.0) thermoScore -= 5;
  else if (diff > 1.5) thermoScore -= 3;
  thermoScore = Math.max(0, thermoScore);

  let hrvScore = 3;
  if (sdnn >= 80) hrvScore = 30;
  else if (sdnn >= 60) hrvScore = 25;
  else if (sdnn >= 40) hrvScore = 18;
  else if (sdnn >= 20) hrvScore = 10;

  const total = Math.min(100, semgScore + thermoScore + hrvScore);

  let label: string;
  let color: string;
  if (total >= 80) { label = "Thriving"; color = "#22c55e"; }
  else if (total >= 60) { label = "Adapting Well"; color = "#4ade80"; }
  else if (total >= 40) { label = "Stressed"; color = "#facc15"; }
  else if (total >= 20) { label = "Struggling"; color = "#f97316"; }
  else { label = "In Crisis"; color = "#ef4444"; }

  return { total, semgScore, thermoScore, hrvScore, label, color };
}

function calcPrevScore(fd: FormData): number | null {
  if (fd.scanType !== "Progress Scan" && fd.scanType !== "Re-Evaluation") return null;
  if (!fd.prevSDNN && !fd.prevSemgPattern && fd.prevThermoDiff == null) return null;
  const semgMap: Record<string, number> = { "Symmetric/Normal": 35, "Mild Asymmetry": 25, "Moderate Asymmetry": 15, "Severe Asymmetry": 5 };
  const prevDiff = fd.prevThermoDiff ?? 0;
  const prevSdnn = fd.prevSDNN ?? 0;
  const prevSemg = semgMap[fd.prevSemgPattern] ?? 15;
  let prevThermo = prevDiff <= 0.3 ? 35 : prevDiff <= 0.7 ? 25 : prevDiff <= 1.2 ? 15 : 5;
  if (prevDiff > 2.0) prevThermo -= 5;
  else if (prevDiff > 1.5) prevThermo -= 3;
  prevThermo = Math.max(0, prevThermo);
  let prevHrv = 3;
  if (prevSdnn >= 80) prevHrv = 30;
  else if (prevSdnn >= 60) prevHrv = 25;
  else if (prevSdnn >= 40) prevHrv = 18;
  else if (prevSdnn >= 20) prevHrv = 10;
  return Math.min(100, prevSemg + prevThermo + prevHrv);
}

/* ─── Summary Generation ─── */

function generateSummary(fd: FormData, scores: Scores): string {
  const age = fd.patientAge ?? 0;
  const prefix = age <= 12 ? "Your child's" : "Your";
  const symptoms = REGION_SYMPTOMS[fd.semgRegion] || "various symptoms";

  let levelDesc = "";
  if (scores.total >= 80) levelDesc = "performing excellently";
  else if (scores.total >= 60) levelDesc = "adapting well with some areas to optimize";
  else if (scores.total >= 40) levelDesc = "showing signs of moderate stress";
  else if (scores.total >= 20) levelDesc = "under significant stress";
  else levelDesc = "in a state of crisis that needs immediate attention";

  let semgDesc = "";
  if (fd.semgPattern === "Symmetric/Normal") semgDesc = "The muscle patterns along your spine are balanced and healthy.";
  else if (fd.semgPattern === "Mild Asymmetry") semgDesc = `There is a mild imbalance in muscle activity around the ${fd.semgRegion.toLowerCase()} area, commonly associated with ${symptoms}.`;
  else if (fd.semgPattern === "Moderate Asymmetry") semgDesc = `There is a moderate imbalance in muscle activity, particularly in the ${fd.semgRegion.toLowerCase()} area. This pattern is commonly associated with ${symptoms}.`;
  else semgDesc = `There is a significant imbalance in muscle activity around the ${fd.semgRegion.toLowerCase()} area, strongly associated with ${symptoms}.`;

  let hrvDesc = "";
  const sdnn = fd.hrvSDNN ?? 0;
  if (sdnn >= 80) hrvDesc = "Your heart rate variability shows excellent adaptability and resilience.";
  else if (sdnn >= 60) hrvDesc = "Your heart rate variability is in a good range, showing healthy nervous system adaptability.";
  else if (sdnn >= 40) hrvDesc = "Your heart rate variability indicates your body is working harder than normal to adapt to daily stressors.";
  else hrvDesc = "Your heart rate variability is low, indicating significant stress on your nervous system's ability to adapt.";

  let ageNote = "";
  if (age >= 13 && age <= 17) ageNote = " This can affect focus at school and athletic performance.";
  else if (age >= 65) ageNote = " Improving nervous system function is one of the most impactful things you can do for quality of life and independence.";

  return `${prefix} nervous system is ${levelDesc}. ${semgDesc} ${hrvDesc}${ageNote}`;
}

/* ─── SVG Components ─── */

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const rad = (a: number) => ((a - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startAngle));
  const y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(endAngle));
  const y2 = cy + r * Math.sin(rad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function ScoreGauge({ score, size = 200, label, color }: { score: number; size?: number; label: string; color: string }) {
  const sweepStart = -140;
  const sweepEnd = 140;
  const sweepRange = sweepEnd - sweepStart;
  const fillEnd = sweepStart + (score / 100) * sweepRange;

  // Segment colors for the background arc
  const segments = [
    { start: sweepStart, end: sweepStart + sweepRange * 0.2, color: "#ef4444" },
    { start: sweepStart + sweepRange * 0.2, end: sweepStart + sweepRange * 0.4, color: "#f97316" },
    { start: sweepStart + sweepRange * 0.4, end: sweepStart + sweepRange * 0.6, color: "#facc15" },
    { start: sweepStart + sweepRange * 0.6, end: sweepStart + sweepRange * 0.8, color: "#4ade80" },
    { start: sweepStart + sweepRange * 0.8, end: sweepEnd, color: "#22c55e" },
  ];

  return (
    <svg viewBox="0 0 200 200" width={size} height={size}>
      {segments.map((seg, i) => (
        <path key={i} d={describeArc(100, 115, 70, seg.start, seg.end)} fill="none" stroke={seg.color} strokeWidth={12} strokeLinecap="butt" opacity={0.2} />
      ))}
      <path d={describeArc(100, 115, 70, sweepStart, fillEnd)} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" />
      <text x="100" y="108" textAnchor="middle" fontSize="38" fontWeight="800" fill={color}>{score}</text>
      <text x="100" y="128" textAnchor="middle" fontSize="11" fill="#6b7280">out of 100</text>
      <text x="100" y="155" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>{label}</text>
    </svg>
  );
}

function SpineDiagram({ region, severity }: { region: string; severity: string }) {
  const severityColor: Record<string, string> = {
    "Symmetric/Normal": "#22c55e",
    "Mild Asymmetry": "#facc15",
    "Moderate Asymmetry": "#f97316",
    "Severe Asymmetry": "#ef4444",
    "Balanced": "#22c55e",
    "Mild Imbalance": "#facc15",
    "Moderate Imbalance": "#f97316",
    "Significant Imbalance": "#ef4444",
  };
  const activeColor = severityColor[severity] || "#f97316";

  // Group label positions
  const groupLabels = [
    { label: "Cervical", y: 48 },
    { label: "Thoracic", y: 152 },
    { label: "Lumbar", y: 272 },
  ];

  return (
    <svg viewBox="0 0 120 310" width={100} height={260}>
      {groupLabels.map((g) => (
        <text key={g.label} x="2" y={g.y} fontSize="8" fill="#6b7280" fontWeight="600">{g.label}</text>
      ))}
      {SPINE_SEGMENTS.map((seg, i) => {
        const isActive = region === seg.region || region === "Multiple Regions";
        const y = 20 + i * 12;
        return (
          <rect key={seg.label} x="50" y={y} width="40" height="9" rx="3" fill={isActive ? activeColor : "#e2e8f0"} />
        );
      })}
    </svg>
  );
}

function SDNNBar({ value }: { value: number | null }) {
  if (value == null) return <p className="text-sm text-portal-ink-2">Enter SDNN to see the zones.</p>;
  // Zones: Critical <20, Low 20-40, Below Avg 40-60, Normal 60-80, Optimal 80+
  // Map to 0-100% width: each zone = 20%
  const zones = [
    { label: "Critical", color: "#ef4444", min: 0, max: 20 },
    { label: "Low", color: "#f97316", min: 20, max: 40 },
    { label: "Below Avg", color: "#facc15", min: 40, max: 60 },
    { label: "Normal", color: "#86efac", min: 60, max: 80 },
    { label: "Optimal", color: "#22c55e", min: 80, max: 120 },
  ];

  // Position marker: clamp value 0-120, map to 0-100%
  const clamped = Math.max(0, Math.min(120, value));
  const pct = (clamped / 120) * 100;

  return (
    <div>
      <div className="relative h-6 rounded-full overflow-hidden flex">
        {zones.map((z) => (
          <div key={z.label} className="h-full flex items-center justify-center" style={{ width: `${((z.max - z.min) / 120) * 100}%`, backgroundColor: z.color }}>
            <span className="text-xs text-white font-bold">{z.label}</span>
          </div>
        ))}
      </div>
      <div className="relative h-4">
        <div className="absolute -top-1" style={{ left: `${pct}%`, transform: "translateX(-50%)" }}>
          <svg width="12" height="8" viewBox="0 0 12 8"><polygon points="6,0 0,8 12,8" fill="#1a2744" /></svg>
        </div>
      </div>
    </div>
  );
}

/* ─── Component ─── */

export default function ScanReportGenerator() {
  return (
    <UpgradeGate feature="Scan Reports" requiredTier="pro" description="Generate professional scan reports for your patients. Present objective findings with clarity.">
      <ScanReportContent />
    </UpgradeGate>
  );
}

function ScanReportContent() {
  const [state, setState] = useState<FormData>(() => blankForm());
  const [loaded, setLoaded] = useState(false);
  const [showingExample, setShowingExample] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const identityRef = useRef({ doctorName: "", practiceName: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const shell = await getPortalShellData().catch(() => null);
      const doctorName = shell?.fullName?.trim() || "";
      const practiceName = shell?.doctor?.clinic_name?.trim() || "";
      identityRef.current = { doctorName, practiceName };
      let next = blankForm(doctorName, practiceName);
      try {
        const cloud = await loadToolData("scan_report");
        let saved = cloud as Partial<FormData> | null;
        if (!saved) {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) saved = JSON.parse(raw) as Partial<FormData>;
        }
        if (saved && !isSeededSample(saved)) {
          next = {
            ...next,
            ...saved,
            doctorName: cleanPracticeField(saved.doctorName, doctorName),
            practiceName: cleanPracticeField(saved.practiceName, practiceName),
          };
        }
      } catch {
        /* start blank */
      }
      if (!cancelled) {
        setState(next);
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Save to Supabase + localStorage (debounced). Example data is not saved.
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    if (!loaded || showingExample) return;
    const timer = setTimeout(() => {
      const data = stateRef.current;
      saveToolData('scan_report', data).catch(() => {});
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [state, loaded, showingExample]);

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Derived
  const scores = calcScores(state);
  const prevScoreVal = calcPrevScore(state);
  const isProgressType = state.scanType === "Progress Scan" || state.scanType === "Re-Evaluation";
  const summary = scores ? (state.editSummary || generateSummary(state, scores)) : "";
  const ExampleMark = () => showingExample ? <span className="ml-2 text-sm font-bold text-portal-ink">Example</span> : null;

  const loadExample = () => {
    const { doctorName, practiceName } = identityRef.current;
    setShowingExample(true);
    setState(exampleForm(doctorName, practiceName));
  };

  const clearExample = () => {
    const { doctorName, practiceName } = identityRef.current;
    setShowingExample(false);
    setState(blankForm(doctorName, practiceName));
    setSaveSuccess(null);
  };

  // Navigation
  const goToStep = (step: number) => set("currentStep", step as FormData["currentStep"]);
  const nextStep = () => { if (state.currentStep < 3) goToStep(state.currentStep + 1); };
  const prevStep = () => { if (state.currentStep > 1) goToStep(state.currentStep - 1); };

  const resetAll = () => {
    localStorage.removeItem(LS_KEY);
    saveToolData('scan_report', null).catch(() => {});
    const { doctorName, practiceName } = identityRef.current;
    setShowingExample(false);
    setState(blankForm(doctorName, practiceName));
    setSaveSuccess(null);
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(null);
    try {
      const result = await saveReport({
        patientName: state.patientFirstName,
        patientAge: state.patientAge ?? 0,
        scanDate: state.scanDate,
        scanType: state.scanType,
        reportData: { ...state, score: scores?.total ?? null, scoreLabel: scores?.label ?? null } as unknown as Record<string, unknown>,
        score: scores?.total ?? 0,
      });
      if ("id" in result) {
        setSaveSuccess(result.id);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  // History
  const loadHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const h = await getReportHistory();
      if (Array.isArray(h)) setHistory(h);
    } catch { /* ignore */ }
    setHistoryLoading(false);
  };

  const loadReport = async (id: string) => {
    try {
      const r = await getReport(id);
      if (r && r.report_data) {
        const blob = r.report_data as Partial<FormData>;
        setShowingExample(false);
        setState((prev) => ({
          ...prev,
          ...blob,
          doctorName: cleanPracticeField(blob.doctorName, identityRef.current.doctorName),
          practiceName: cleanPracticeField(blob.practiceName, identityRef.current.practiceName),
          currentStep: 3,
        }));
        setHistoryOpen(false);
      }
    } catch { /* ignore */ }
  };

  if (!loaded) return null;

  /* ═══════════════════════════════════════════════════════
     STEP TABS
     ═══════════════════════════════════════════════════════ */

  const StepTabs = () => (
    <div className="step-tabs-container no-print flex rounded-2xl overflow-hidden border border-gray-200 mb-6">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const isActive = state.currentStep === step;
        return (
          <button
            key={step}
            onClick={() => goToStep(step)}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold transition-all border-r last:border-r-0 border-gray-200 ${
              isActive ? "bg-neuro-navy text-white" : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  const NavButtons = () => (
    <div className="no-print flex justify-between mt-8">
      {state.currentStep > 1 ? (
        <button onClick={prevStep} className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      ) : <div />}
      {state.currentStep < 3 ? (
        <button onClick={nextStep} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neuro-orange text-white text-sm font-bold hover:bg-neuro-orange/90 transition-colors">
          Next <ChevronRight className="w-4 h-4" />
        </button>
      ) : <div />}
    </div>
  );

  /* ═══════════════════════════════════════════════════════
     STEP 1: Scan Data Input
     ═══════════════════════════════════════════════════════ */

  const Step1 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column — Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Patient Info */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-neuro-navy tracking-wide flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-neuro-orange" /> Patient Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-500">Patient First Name *<ExampleMark /></label>
              <input type="text" value={state.patientFirstName} onChange={(e) => set("patientFirstName", e.target.value)} placeholder="e.g. Sarah" className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500">Patient Age<ExampleMark /></label>
              <input type="number" value={state.patientAge ?? ""} onChange={(e) => set("patientAge", optionalNumber(e.target.value))} min={0} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 tracking-wide">Scan Date</label>
              <input type="date" value={state.scanDate} onChange={(e) => set("scanDate", e.target.value)} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 tracking-wide">Scan Type</label>
              <select value={state.scanType} onChange={(e) => set("scanType", e.target.value as FormData["scanType"])} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors">
                <option>Initial Scan</option>
                <option>Progress Scan</option>
                <option>Re-Evaluation</option>
                <option>Wellness Check</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 tracking-wide">Doctor Name</label>
              <input type="text" value={state.doctorName} onChange={(e) => set("doctorName", e.target.value)} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 tracking-wide">Practice Name</label>
              <input type="text" value={state.practiceName} onChange={(e) => set("practiceName", e.target.value)} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
            </div>
          </div>
        </section>

        {/* sEMG */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-neuro-navy flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-neuro-orange" /> sEMG <TermInfo term="sEMG" /><ExampleMark />
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 tracking-wide mb-2 block">Overall Pattern</label>
              <div className="flex flex-wrap gap-2">
                {(["Symmetric/Normal", "Mild Asymmetry", "Moderate Asymmetry", "Severe Asymmetry"] as const).map((opt) => (
                  <button key={opt} onClick={() => set("semgPattern", opt)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${state.semgPattern === opt ? "bg-[#1a2744] text-white" : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 tracking-wide">Primary Region</label>
              <select value={state.semgRegion} onChange={(e) => set("semgRegion", e.target.value)} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors">
                <option value="">Select a region</option>
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 tracking-wide mb-2 block">Energy Level</label>
              <div className="flex flex-wrap gap-2">
                {(["Normal", "Moderate Exhaustion", "Significant Exhaustion"] as const).map((opt) => (
                  <button key={opt} onClick={() => set("semgEnergy", opt)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${state.semgEnergy === opt ? "bg-[#1a2744] text-white" : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 tracking-wide">Notes (optional)</label>
              <textarea value={state.semgNotes} onChange={(e) => set("semgNotes", e.target.value)} rows={2} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors resize-y" />
            </div>
          </div>
        </section>

        {/* Thermography */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-neuro-navy flex items-center gap-2 mb-4">
            <Thermometer className="w-4 h-4 text-neuro-orange" /> Thermography <TermInfo term="Thermography" /><ExampleMark />
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 tracking-wide mb-2 block">Overall Pattern</label>
              <div className="flex flex-wrap gap-2">
                {(["Balanced", "Mild Imbalance", "Moderate Imbalance", "Significant Imbalance"] as const).map((opt) => (
                  <button key={opt} onClick={() => set("thermoPattern", opt)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${state.thermoPattern === opt ? "bg-[#1a2744] text-white" : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 tracking-wide">Primary Region</label>
              <select value={state.thermoRegion} onChange={(e) => set("thermoRegion", e.target.value)} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors">
                <option value="">Select a region</option>
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-500">Max Temp Differential<ExampleMark /></label>
                <input type="number" step={0.1} value={state.thermoMaxDiff ?? ""} onChange={(e) => set("thermoMaxDiff", optionalNumber(e.target.value))} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 tracking-wide mb-2 block">Pattern Consistency</label>
                <div className="flex flex-wrap gap-1">
                  {(["First scan", "Improving", "Stable", "Worsening"] as const).map((opt) => (
                    <button key={opt} onClick={() => set("thermoConsistency", opt)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${state.thermoConsistency === opt ? "bg-[#1a2744] text-white" : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HRV */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-neuro-navy flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-neuro-orange" /> HRV <TermInfo term="HRV" /><ExampleMark />
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-bold text-gray-500 inline-flex items-center">SDNN (ms) <TermInfo term="SDNN" /><ExampleMark /></label>
              <input type="number" value={state.hrvSDNN ?? ""} onChange={(e) => set("hrvSDNN", optionalNumber(e.target.value))} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 inline-flex items-center">LF/HF Ratio <TermInfo term="LF/HF" /><ExampleMark /></label>
              <input type="number" step={0.1} value={state.hrvLFHF ?? ""} onChange={(e) => set("hrvLFHF", optionalNumber(e.target.value))} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 inline-flex items-center">RMSSD (ms) <TermInfo term="RMSSD" /><ExampleMark /></label>
              <input type="number" value={state.hrvRMSSD ?? ""} onChange={(e) => set("hrvRMSSD", optionalNumber(e.target.value))} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 inline-flex items-center">Total Power (ms2) <TermInfo term="Total Power" /><ExampleMark /></label>
              <input type="number" value={state.hrvTotalPower ?? ""} onChange={(e) => set("hrvTotalPower", optionalNumber(e.target.value))} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs font-bold text-gray-500 tracking-wide mb-2">SDNN Zones</p>
            {SDNNBar({ value: state.hrvSDNN })}
          </div>
        </section>

        {/* Progress Section */}
        {isProgressType && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button onClick={() => setProgressOpen(!progressOpen)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
              <span className="text-sm font-bold text-neuro-navy tracking-wide flex items-center gap-2">
                <Clock className="w-4 h-4 text-neuro-orange" /> Progress Comparison
              </span>
              {progressOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </button>
            {progressOpen && (
              <div className="px-5 pb-5 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-500">Previous SDNN (ms)<ExampleMark /></label>
                  <input type="number" value={state.prevSDNN ?? ""} onChange={(e) => set("prevSDNN", optionalNumber(e.target.value))} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">Previous sEMG Pattern<ExampleMark /></label>
                  <select value={state.prevSemgPattern} onChange={(e) => set("prevSemgPattern", e.target.value)} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors">
                    <option value="">Select a pattern</option>
                    <option>Symmetric/Normal</option>
                    <option>Mild Asymmetry</option>
                    <option>Moderate Asymmetry</option>
                    <option>Severe Asymmetry</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">Previous Thermo Differential<ExampleMark /></label>
                  <input type="number" step={0.1} value={state.prevThermoDiff ?? ""} onChange={(e) => set("prevThermoDiff", optionalNumber(e.target.value))} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">Visits Completed<ExampleMark /></label>
                  <input type="number" value={state.visitsCompleted ?? ""} onChange={(e) => set("visitsCompleted", optionalNumber(e.target.value))} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500">Weeks in Care<ExampleMark /></label>
                  <input type="number" value={state.weeksInCare ?? ""} onChange={(e) => set("weeksInCare", optionalNumber(e.target.value))} className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors" />
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Right Column — Live Score Preview */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-4">
          <h3 className="text-sm font-bold text-gray-400 mb-4">Live Score Preview<ExampleMark /></h3>
          {scores ? (
          <div className="flex justify-center">
            {ScoreGauge({ score: scores.total, size: 180, label: scores.label, color: scores.color })}
          </div>
          ) : (
            <p className="text-sm text-portal-ink-2 text-center">Enter the sEMG pattern, thermography pattern, max temperature difference, and SDNN to see a score.</p>
          )}

          {/* Mini progress bars */}
          {scores ? <div className="space-y-3 mt-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-gray-600">sEMG</span>
                <span className="font-bold text-neuro-navy">{scores.semgScore}/35</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(scores.semgScore / 35) * 100}%`, backgroundColor: scores.semgScore >= 25 ? "#22c55e" : scores.semgScore >= 15 ? "#facc15" : "#ef4444" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-gray-600">Thermal</span>
                <span className="font-bold text-neuro-navy">{scores.thermoScore}/35</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(scores.thermoScore / 35) * 100}%`, backgroundColor: scores.thermoScore >= 25 ? "#22c55e" : scores.thermoScore >= 15 ? "#facc15" : "#ef4444" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-gray-600">HRV</span>
                <span className="font-bold text-neuro-navy">{scores.hrvScore}/30</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(scores.hrvScore / 30) * 100}%`, backgroundColor: scores.hrvScore >= 25 ? "#22c55e" : scores.hrvScore >= 18 ? "#facc15" : "#ef4444" }} />
              </div>
            </div>
          </div> : null}

          {/* Patient + Date */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm font-bold text-neuro-navy">{state.patientFirstName || "Patient Name"}<ExampleMark /></p>
            <p className="text-xs text-gray-400">{state.scanDate}</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════
     REPORT RENDER (shared between Step 2 and Step 3)
     ═══════════════════════════════════════════════════════ */

  const ReportContent = () => {
    const lfhfInterp = state.hrvLFHF == null ? "" : state.hrvLFHF < 0.8 ? "Parasympathetic Dominant (Recovery Mode)" : state.hrvLFHF <= 2.0 ? "Balanced" : "Sympathetic Dominant (Stress Mode)";
    const hasProgress = Boolean(scores) && isProgressType && prevScoreVal !== null;
    const scoreDelta = hasProgress && scores ? scores.total - (prevScoreVal ?? 0) : 0;
    const thermoDiff = state.thermoMaxDiff ?? 0;
    const sdnn = state.hrvSDNN;

    return (
      <div className="print-area bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-8" style={{ backgroundColor: "#1a2744" }}>
          <p className="text-white/50 text-xs font-bold tracking-[0.2em]">{state.practiceName}</p>
          <h2 className="font-heading text-2xl font-bold text-white mt-1">Nervous System Assessment</h2>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/60">
            <span className="text-white font-bold">{state.patientFirstName || "Patient"}{showingExample ? " (Example)" : ""}</span>
            <span>&middot;</span>
            <span>{state.patientAge == null ? "Age" : `Age ${state.patientAge}`}{showingExample ? " (Example)" : ""}</span>
            <span>&middot;</span>
            <span>{state.scanDate}</span>
            <span>&middot;</span>
            <span>{state.scanType}</span>
            <span>&middot;</span>
            <span>{state.doctorName}</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Your Nervous System Score */}
          <section>
            <h2 className="text-lg font-heading font-bold text-neuro-navy mb-4">Your Nervous System Score{showingExample ? " (Example)" : ""}</h2>
            {scores ? (
            <>
            <div className="flex justify-center mb-4">
              {ScoreGauge({ score: scores.total, size: 220, label: scores.label, color: scores.color })}
            </div>
            {/* 3 sub-score cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 font-bold uppercase">sEMG</p>
                <p className="text-xl font-bold text-neuro-navy mt-1">{scores.semgScore}<span className="text-sm text-gray-400">/35</span></p>
                <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(scores.semgScore / 35) * 100}%`, backgroundColor: scores.semgScore >= 25 ? "#22c55e" : scores.semgScore >= 15 ? "#facc15" : "#ef4444" }} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 font-bold uppercase">Thermal</p>
                <p className="text-xl font-bold text-neuro-navy mt-1">{scores.thermoScore}<span className="text-sm text-gray-400">/35</span></p>
                <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(scores.thermoScore / 35) * 100}%`, backgroundColor: scores.thermoScore >= 25 ? "#22c55e" : scores.thermoScore >= 15 ? "#facc15" : "#ef4444" }} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 font-bold uppercase">HRV</p>
                <p className="text-xl font-bold text-neuro-navy mt-1">{scores.hrvScore}<span className="text-sm text-gray-400">/30</span></p>
                <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(scores.hrvScore / 30) * 100}%`, backgroundColor: scores.hrvScore >= 25 ? "#22c55e" : scores.hrvScore >= 18 ? "#facc15" : "#ef4444" }} />
                </div>
              </div>
            </div>
            {/* Summary text */}
            {summary ? <p className="text-gray-700 text-sm leading-relaxed">{summary}</p> : null}
            </>
            ) : (
              <p className="text-sm text-portal-ink-2">Enter the sEMG pattern, thermography pattern, max temperature difference, and SDNN to see a score.</p>
            )}
          </section>

          {/* Section 2: Scan Findings */}
          <section>
            <h2 className="text-lg font-heading font-bold text-neuro-navy mb-4">Scan Findings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* sEMG Card */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-xs font-bold text-neuro-navy tracking-wide mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-neuro-orange" /> Muscle & Nerve Activity
                </h4>
                <div className="flex justify-center mb-3">
                  {SpineDiagram({ region: state.semgRegion, severity: state.semgPattern })}
                </div>
                <p className="text-sm font-bold text-neuro-navy">{state.semgPattern || "—"}{showingExample ? " · Example" : ""}</p>
                <p className="text-xs text-gray-500 mt-1">Region: {state.semgRegion}</p>
                <div className="mt-2">
                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${state.semgEnergy === "Normal" ? "bg-green-100 text-green-700" : state.semgEnergy === "Moderate Exhaustion" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {state.semgEnergy}
                  </span>
                </div>
              </div>

              {/* Thermo Card */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-xs font-bold text-neuro-navy tracking-wide mb-3 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-neuro-orange" /> Temperature Regulation
                </h4>
                {/* Symmetric bar visualization */}
                <div className="flex items-center justify-center my-4">
                  <svg viewBox="0 0 120 60" width={120} height={60}>
                    <line x1="60" y1="5" x2="60" y2="55" stroke="#d1d5db" strokeWidth={1} />
                    {/* Left bar */}
                    <rect x={60 - Math.min(50, thermoDiff * 25)} y="20" width={Math.min(50, thermoDiff * 25)} height="20" rx="3"
                      fill={state.thermoPattern === "Balanced" ? "#22c55e" : state.thermoPattern === "Mild Imbalance" ? "#facc15" : state.thermoPattern === "Moderate Imbalance" ? "#f97316" : "#ef4444"} opacity={0.7} />
                    {/* Right bar */}
                    <rect x="60" y="20" width={Math.min(50, thermoDiff * 20)} height="20" rx="3"
                      fill={state.thermoPattern === "Balanced" ? "#22c55e" : state.thermoPattern === "Mild Imbalance" ? "#facc15" : state.thermoPattern === "Moderate Imbalance" ? "#f97316" : "#ef4444"} opacity={0.5} />
                    <text x="60" y="52" textAnchor="middle" fontSize="7" fill="#6b7280">{state.thermoMaxDiff == null ? "—" : `${state.thermoMaxDiff.toFixed(1)} C diff`}</text>
                  </svg>
                </div>
                <p className="text-sm font-bold text-neuro-navy">{state.thermoPattern || "—"}{showingExample ? " · Example" : ""}</p>
                <p className="text-sm text-gray-500 mt-1">Max differential: {state.thermoMaxDiff == null ? "—" : `${state.thermoMaxDiff.toFixed(1)} C`}</p>
                <div className="mt-2">
                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${state.thermoConsistency === "Improving" ? "bg-green-100 text-green-700" : state.thermoConsistency === "Worsening" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                    {state.thermoConsistency}
                  </span>
                </div>
              </div>

              {/* HRV Card */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-xs font-bold text-neuro-navy tracking-wide mb-3 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-neuro-orange" /> Stress Adaptability
                </h4>
                <div className="my-3">
                  {SDNNBar({ value: state.hrvSDNN })}
                </div>
                <p className="text-2xl font-bold text-neuro-navy text-center">{sdnn == null ? "—" : sdnn}{showingExample ? " Example" : ""} <span className="text-sm text-gray-400 font-normal">ms</span></p>
                {state.hrvLFHF == null ? null : <p className="text-sm text-gray-500 mt-2">LF/HF: {state.hrvLFHF} - <span className="font-bold">{lfhfInterp}</span></p>}
                {sdnn == null ? null : <p className="text-sm text-gray-500 mt-1">
                  {sdnn >= 80 ? "Excellent nervous system adaptability" : sdnn >= 60 ? "Good adaptability" : sdnn >= 40 ? "Below average adaptability" : sdnn >= 20 ? "Low adaptability" : "Critical - very low adaptability"}
                </p>}
              </div>
            </div>
          </section>

          {/* Section 3: What This Means For You */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-lg font-heading font-bold text-neuro-navy mb-3">What This Means For You</h2>
            <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>
          </section>

          {/* Section 4: Progress */}
          {hasProgress && state.showProgress && (
            <section>
              <h2 className="text-lg font-heading font-bold text-neuro-navy mb-4">Progress</h2>
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400 tracking-wider">Previous</p>
                  <p className="text-3xl font-heading font-bold text-gray-400">{prevScoreVal}</p>
                </div>
                <div className="text-center">
                  <span className={`text-2xl font-bold ${scoreDelta > 0 ? "text-green-500" : scoreDelta < 0 ? "text-red-500" : "text-gray-400"}`}>
                    {scoreDelta > 0 ? "+" : ""}{scoreDelta}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 tracking-wider">Current</p>
                  <p className="text-3xl font-heading font-bold" style={{ color: scores?.color }}>{scores?.total}</p>
                </div>
              </div>
              {/* Metric comparisons */}
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">sEMG Pattern</p>
                  <p className="text-gray-500 text-xs">{state.prevSemgPattern}</p>
                  <p className="font-bold text-neuro-navy text-xs">{state.semgPattern}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Thermo Diff</p>
                  <p className="text-gray-500 text-xs">{state.prevThermoDiff} C</p>
                  <p className="font-bold text-neuro-navy text-xs">{state.thermoMaxDiff} C</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">SDNN</p>
                  <p className="text-gray-500 text-xs">{state.prevSDNN} ms</p>
                  <p className="font-bold text-neuro-navy text-xs">{state.hrvSDNN} ms</p>
                </div>
              </div>
              {(state.weeksInCare ?? 0) > 0 && (
                <p className="text-gray-600 text-sm text-center mt-4">
                  Since starting care {state.weeksInCare} weeks ago ({state.visitsCompleted} visits), your score has {scoreDelta >= 0 ? "improved" : "changed"} from {prevScoreVal} to {scores?.total}.
                </p>
              )}
            </section>
          )}

          {/* Section 5: Doctor Notes */}
          {state.doctorNotes && state.showNotes && (
            <section>
              <h2 className="text-lg font-heading font-bold text-neuro-navy mb-3">Doctor&apos;s Notes</h2>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{state.doctorNotes}</p>
            </section>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-bold">{state.practiceName} &middot; {state.doctorName}</p>
            <p className="text-xs text-gray-400 mt-1 italic">Your nervous system controls every function in your body. These scans help us measure your progress objectively.</p>
            <p className="text-xs text-gray-300 mt-1">{state.scanDate}</p>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════
     STEP 2: Report Preview + Edit
     ═══════════════════════════════════════════════════════ */

  const Step2 = () => (
    <div>
      {ReportContent()}

      {/* Edit controls below report */}
      <div className="no-print mt-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-neuro-navy tracking-wide mb-3">Edit Summary</h3>
          <textarea
            value={state.editSummary}
            onChange={(e) => set("editSummary", e.target.value)}
            rows={4}
            placeholder={scores ? generateSummary(state, scores) : "Summary appears after the required scan fields are filled."}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors resize-y"
          />
          <p className="text-xs text-gray-400 mt-1">Leave blank to use auto-generated summary.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-neuro-navy tracking-wide mb-3">Add Notes</h3>
          <textarea
            value={state.doctorNotes}
            onChange={(e) => set("doctorNotes", e.target.value)}
            rows={3}
            placeholder="Any additional notes for this patient..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors resize-y"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          {isProgressType && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={state.showProgress} onChange={(e) => set("showProgress", e.target.checked)} className="rounded" />
              Show Progress Section
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={state.showNotes} onChange={(e) => set("showNotes", e.target.checked)} className="rounded" />
            Show Doctor Notes
          </label>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════
     STEP 3: Final + Print
     ═══════════════════════════════════════════════════════ */

  const Step3 = () => (
    <div>
      {/* Action buttons */}
      <div className="no-print flex flex-wrap items-center gap-3 mb-6">
        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-neuro-navy text-white text-sm font-bold rounded-xl hover:bg-neuro-navy/90 transition-colors">
          <Printer className="w-4 h-4" /> Print for Patient
        </button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-neuro-orange text-white text-sm font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Report"}
        </button>
        <button onClick={() => goToStep(1)} className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
          <FileText className="w-4 h-4" /> Edit
        </button>
        <button onClick={resetAll} className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-sm font-bold text-gray-400 rounded-xl hover:bg-gray-50 hover:text-red-500 transition-colors">
          <RotateCcw className="w-4 h-4" /> New Report
        </button>
        <button onClick={loadHistory} className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
          <Clock className="w-4 h-4" /> Report History
        </button>
      </div>

      {/* Save success */}
      {saveSuccess && (
        <div className="no-print mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-bold text-green-700">Report saved successfully!</p>
            <p className="text-xs text-green-600">ID: {saveSuccess}</p>
          </div>
          <button onClick={() => setSaveSuccess(null)} className="ml-auto text-green-400 hover:text-green-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* History panel */}
      {historyOpen && (
        <div className="no-print mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-neuro-navy tracking-wide">Report History</h3>
            <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {historyLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-400">No previous reports.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => {
                  const lbl = h.score >= 80 ? "Thriving" : h.score >= 60 ? "Adapting Well" : h.score >= 40 ? "Stressed" : h.score >= 20 ? "Struggling" : "In Crisis";
                  const badgeColor = h.score >= 80 ? "bg-green-100 text-green-700" : h.score >= 60 ? "bg-portal-info-bg text-blue-700" : h.score >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
                  return (
                    <button key={h.id} onClick={() => loadReport(h.id)} className="w-full text-left flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                      <div>
                        <span className="font-bold text-neuro-navy text-sm">{h.patient_name}</span>
                        <span className="text-gray-400 text-xs ml-2">{h.scan_date}</span>
                        <span className="text-gray-400 text-xs ml-2">{h.scan_type}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${badgeColor}`}>{h.score} &middot; {lbl}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report */}
      {ReportContent()}
    </div>
  );

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  return (
    <div className="scan-report-wrapper p-4 md:p-8 max-w-6xl mx-auto">
      <style jsx global>{`
        @media print {
          .no-print, nav, header, footer, aside, button, .step-tabs-container { display: none !important; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          @page { margin: 0.3in 0.4in; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-area { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
          .scan-report-wrapper { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          section { page-break-inside: avoid; }
        }
      `}</style>

      <div className="no-print">
        <PageHeader title="Scan report" description="Enter scan data, preview it, and print a patient-friendly report." />
        <div className="flex flex-wrap gap-2 -mt-2 mb-4">
          <button type="button" onClick={loadExample} className="min-h-11 px-4 rounded-lg bg-white border border-portal-border text-sm font-bold text-portal-ink">Load example patient</button>
          <button type="button" onClick={resetAll} className="min-h-11 px-4 rounded-lg bg-white border border-portal-border text-sm font-bold text-portal-ink inline-flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
        {showingExample ? <div className="mb-4"><ExampleBanner onClear={clearExample} /></div> : null}
      </div>

      {StepTabs()}

      {state.currentStep === 1 && Step1()}
      {state.currentStep === 2 && Step2()}
      {state.currentStep === 3 && Step3()}

      {state.currentStep < 3 && NavButtons()}
    </div>
  );
}
