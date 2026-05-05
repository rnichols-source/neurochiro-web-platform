"use client";
import UpgradeGate from "@/components/doctor/UpgradeGate";
import { saveToolData, loadToolData } from "../tool-data-actions";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Printer,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  ClipboardList,
  Stethoscope,
  Pill,
  FileText,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoringCategory {
  id: string;
  name: string;
  score: number;
}

interface PlanPhase {
  id: string;
  name: string;
  visitsPerWeek: number;
  weeks: number;
}

interface Supplement {
  id: string;
  name: string;
  price: number;
  qty: number;
  selected: boolean;
}

interface LifestyleRec {
  id: string;
  label: string;
  checked: boolean;
  details: string;
}

interface CarePlanState {
  // Step 1
  patientName: string;
  date: string;
  doctorName: string;
  practiceName: string;
  useScoring: boolean;
  scoringCategories: ScoringCategory[];
  // Step 2
  perVisitFee: number;
  phases: PlanPhase[];
  discount: number;
  notesToPatient: string;
  showAdvanced: boolean;
  // Step 3
  useSupplements: boolean;
  supplements: Supplement[];
  useLifestyle: boolean;
  lifestyleRecs: LifestyleRec[];
  // Navigation
  currentStep: number;
  completedSteps: number[];
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_SCORING: ScoringCategory[] = [
  { id: uid(), name: "Posture", score: 0 },
  { id: uid(), name: "Range of Motion", score: 0 },
  { id: uid(), name: "Neurological", score: 0 },
  { id: uid(), name: "Pain Level", score: 0 },
  { id: uid(), name: "Daily Function", score: 0 },
];

const DEFAULT_PHASES: PlanPhase[] = [
  { id: uid(), name: "Intensive", visitsPerWeek: 3, weeks: 4 },
  { id: uid(), name: "Corrective", visitsPerWeek: 2, weeks: 8 },
  { id: uid(), name: "Stabilization", visitsPerWeek: 1, weeks: 12 },
];

const DEFAULT_SUPPLEMENTS: Supplement[] = [
  { id: uid(), name: "Omega-3", price: 35, qty: 1, selected: false },
  { id: uid(), name: "Vitamin D", price: 45, qty: 1, selected: false },
  { id: uid(), name: "Magnesium", price: 25, qty: 1, selected: false },
  { id: uid(), name: "Probiotics", price: 40, qty: 1, selected: false },
  { id: uid(), name: "Whole Food Multi", price: 45, qty: 1, selected: false },
];

const DEFAULT_LIFESTYLE: LifestyleRec[] = [
  { id: uid(), label: "Home exercises", checked: false, details: "" },
  { id: uid(), label: "Ergonomic modifications", checked: false, details: "" },
  { id: uid(), label: "Stress management", checked: false, details: "" },
  { id: uid(), label: "Sleep hygiene", checked: false, details: "" },
  { id: uid(), label: "Nutritional guidance", checked: false, details: "" },
  { id: uid(), label: "Hydration goals", checked: false, details: "" },
  { id: uid(), label: "Stretching routine", checked: false, details: "" },
  { id: uid(), label: "Ice/heat therapy", checked: false, details: "" },
];

const today = () => new Date().toISOString().split("T")[0];

const INITIAL_STATE: CarePlanState = {
  patientName: "",
  date: today(),
  doctorName: "[DOCTOR NAME]",
  practiceName: "[PRACTICE NAME]",
  useScoring: false,
  scoringCategories: DEFAULT_SCORING,
  perVisitFee: 65,
  phases: DEFAULT_PHASES,
  discount: 0,
  notesToPatient: "",
  showAdvanced: false,
  useSupplements: false,
  supplements: DEFAULT_SUPPLEMENTS,
  useLifestyle: false,
  lifestyleRecs: DEFAULT_LIFESTYLE,
  currentStep: 1,
  completedSteps: [],
};

const LS_KEY = "neurochiro-care-plan";

const PHASE_COLORS = ["#e97325", "#1a2744", "#16a34a", "#3b82f6", "#8b5cf6"];

const STEP_LABELS = [
  "1. Patient & Score",
  "2. Build Plan",
  "3. Add-Ons",
  "4. Care Plan",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScoreRecommendation(avg: number): string {
  if (avg <= 0) return "";
  if (avg <= 2) return "Mild — 1-2x/week for 6-8 weeks";
  if (avg <= 3) return "Moderate — 2-3x/week for 8-12 weeks";
  if (avg <= 4) return "Significant — 3x/week for 12 weeks";
  return "Severe — 3-4x/week for 12-16 weeks";
}

function scoreColor(avg: number): string {
  if (avg <= 2) return "#16a34a";
  if (avg <= 3) return "#eab308";
  if (avg <= 4) return "#e97325";
  return "#dc2626";
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CarePlanBuilder() {
  return (
    <UpgradeGate feature="Care Plan Builder" requiredTier="pro" description="Build custom care plans for every patient. Present professional treatment recommendations with confidence.">
      <CarePlanContent />
    </UpgradeGate>
  );
}

function CarePlanContent() {
  const [state, setState] = useState<CarePlanState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Load from Supabase on mount (localStorage fallback)
  useEffect(() => {
    async function load() {
      try {
        const cloud = await loadToolData('care_plan');
        if (cloud) {
          setState((prev) => ({ ...prev, ...cloud }));
        } else {
          // Fallback: migrate from localStorage if exists
          const saved = localStorage.getItem(LS_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as Partial<CarePlanState>;
            setState((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch {
        // Offline fallback
        try {
          const saved = localStorage.getItem(LS_KEY);
          if (saved) setState((prev) => ({ ...prev, ...JSON.parse(saved) }));
        } catch {}
      }
      setLoaded(true);
    }
    load();
  }, []);

  // Save to Supabase on change (debounced)
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      const data = stateRef.current;
      // Save to both Supabase and localStorage (offline fallback)
      saveToolData('care_plan', data).catch(() => {});
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [state, loaded]);

  const set = useCallback(
    <K extends keyof CarePlanState>(key: K, value: CarePlanState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ─── Derived values ──────────────────────────────────────────────────────

  const scoredCategories = state.scoringCategories.filter((c) => c.score > 0);
  const avgScore =
    scoredCategories.length > 0
      ? scoredCategories.reduce((s, c) => s + c.score, 0) / scoredCategories.length
      : 0;

  const totalVisits = state.phases.reduce((s, p) => s + p.visitsPerWeek * p.weeks, 0);
  const totalWeeks = state.phases.reduce((s, p) => s + p.weeks, 0);
  const totalMonths = Math.ceil(totalWeeks / 4);
  const grossTotal = totalVisits * state.perVisitFee;
  const discountAmount = Math.round(grossTotal * (state.discount / 100));
  const netTotal = grossTotal - discountAmount;

  const pifDiscount = Math.round(netTotal * 0.05);
  const pifTotal = netTotal - pifDiscount;
  const monthlyPayment = totalMonths > 0 ? Math.round(netTotal / totalMonths) : 0;
  const biWeeklyPeriods = Math.ceil(totalWeeks / 2);
  const biWeeklyPayment = biWeeklyPeriods > 0 ? Math.round(netTotal / biWeeklyPeriods) : 0;

  const selectedSupps = state.supplements.filter((s) => s.selected);
  const supplementTotal = selectedSupps.reduce((s, sup) => s + sup.price * sup.qty, 0);
  const supplementCareTotal = supplementTotal;

  const checkedLifestyle = state.lifestyleRecs.filter((l) => l.checked);

  const grandTotal = netTotal + supplementCareTotal;

  // ─── Navigation ──────────────────────────────────────────────────────────

  const goToStep = (step: number) => {
    setState((prev) => {
      const completed = [...prev.completedSteps];
      if (!completed.includes(prev.currentStep) && prev.currentStep < step) {
        completed.push(prev.currentStep);
      }
      return { ...prev, currentStep: step, completedSteps: completed };
    });
  };

  const canNavigate = (step: number) => {
    return step <= state.currentStep || state.completedSteps.includes(step);
  };

  const nextStep = () => {
    if (state.currentStep < 4) goToStep(state.currentStep + 1);
  };

  const prevStep = () => {
    if (state.currentStep > 1) goToStep(state.currentStep - 1);
  };

  const resetAll = () => {
    localStorage.removeItem(LS_KEY);
    saveToolData('care_plan', null).catch(() => {});
    setState({
      ...INITIAL_STATE,
      date: today(),
      scoringCategories: DEFAULT_SCORING.map((c) => ({ ...c, id: uid(), score: 0 })),
      phases: DEFAULT_PHASES.map((p) => ({ ...p, id: uid() })),
      supplements: DEFAULT_SUPPLEMENTS.map((s) => ({ ...s, id: uid(), selected: false })),
      lifestyleRecs: DEFAULT_LIFESTYLE.map((l) => ({ ...l, id: uid(), checked: false, details: "" })),
    });
  };

  // ─── Phase helpers ───────────────────────────────────────────────────────

  const updatePhase = (id: string, field: keyof PlanPhase, value: string | number) => {
    set(
      "phases",
      state.phases.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const addPhase = () => {
    set("phases", [
      ...state.phases,
      { id: uid(), name: `Phase ${state.phases.length + 1}`, visitsPerWeek: 1, weeks: 4 },
    ]);
  };

  const removePhase = (id: string) => {
    if (state.phases.length <= 1) return;
    set(
      "phases",
      state.phases.filter((p) => p.id !== id)
    );
  };

  // ─── Scoring helpers ─────────────────────────────────────────────────────

  const setScore = (id: string, score: number) => {
    set(
      "scoringCategories",
      state.scoringCategories.map((c) => (c.id === id ? { ...c, score } : c))
    );
  };

  const renameCategory = (id: string, name: string) => {
    set(
      "scoringCategories",
      state.scoringCategories.map((c) => (c.id === id ? { ...c, name } : c))
    );
  };

  const addCategory = () => {
    set("scoringCategories", [
      ...state.scoringCategories,
      { id: uid(), name: "New Category", score: 0 },
    ]);
  };

  const removeCategory = (id: string) => {
    if (state.scoringCategories.length <= 1) return;
    set(
      "scoringCategories",
      state.scoringCategories.filter((c) => c.id !== id)
    );
  };

  // ─── Supplement helpers ──────────────────────────────────────────────────

  const toggleSupplement = (id: string) => {
    set(
      "supplements",
      state.supplements.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const updateSupplement = (id: string, field: keyof Supplement, value: string | number | boolean) => {
    set(
      "supplements",
      state.supplements.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addSupplement = () => {
    set("supplements", [
      ...state.supplements,
      { id: uid(), name: "New Supplement", price: 30, qty: 1, selected: false },
    ]);
  };

  // ─── Lifestyle helpers ───────────────────────────────────────────────────

  const toggleLifestyle = (id: string) => {
    set(
      "lifestyleRecs",
      state.lifestyleRecs.map((l) => (l.id === id ? { ...l, checked: !l.checked } : l))
    );
  };

  const updateLifestyleDetails = (id: string, details: string) => {
    set(
      "lifestyleRecs",
      state.lifestyleRecs.map((l) => (l.id === id ? { ...l, details } : l))
    );
  };

  const addLifestyle = () => {
    set("lifestyleRecs", [
      ...state.lifestyleRecs,
      { id: uid(), label: "New recommendation", checked: false, details: "" },
    ]);
  };

  const renameLifestyle = (id: string, label: string) => {
    set(
      "lifestyleRecs",
      state.lifestyleRecs.map((l) => (l.id === id ? { ...l, label } : l))
    );
  };

  // ─── Print ───────────────────────────────────────────────────────────────

  const handlePrint = () => window.print();

  if (!loaded) return null;

  // ─── Step Tabs ───────────────────────────────────────────────────────────

  const StepTabs = () => (
    <div className="no-print flex rounded-2xl overflow-hidden border border-gray-200 mb-6">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const isActive = state.currentStep === step;
        const isCompleted = state.completedSteps.includes(step);
        const clickable = canNavigate(step);
        return (
          <button
            key={step}
            onClick={() => clickable && goToStep(step)}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold transition-all border-r last:border-r-0 border-gray-200 ${
              isActive
                ? "bg-neuro-navy text-white"
                : isCompleted
                ? "bg-green-600 text-white"
                : clickable
                ? "bg-white text-gray-500 hover:bg-gray-50 cursor-pointer"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {isCompleted && !isActive && <Check className="w-3.5 h-3.5" />}
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ─── Step Navigation Buttons ─────────────────────────────────────────────

  const NavButtons = () => (
    <div className="no-print flex justify-between mt-8">
      {state.currentStep > 1 ? (
        <button
          onClick={prevStep}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      ) : (
        <div />
      )}
      {state.currentStep < 4 ? (
        <button
          onClick={nextStep}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neuro-orange text-white text-sm font-bold hover:bg-neuro-orange/90 transition-colors"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <div />
      )}
    </div>
  );

  // ─── Timeline Bar (reusable) ─────────────────────────────────────────────

  const TimelineBar = ({ height = "h-12" }: { height?: string }) => (
    <div className={`timeline-bar flex rounded-xl overflow-hidden ${height} mb-4`}>
      {state.phases.map((phase, i) => {
        const pct = totalWeeks > 0 ? (phase.weeks / totalWeeks) * 100 : 100 / state.phases.length;
        return (
          <div
            key={phase.id}
            className="flex items-center justify-center text-white text-xs font-bold px-2"
            style={{
              width: `${pct}%`,
              backgroundColor: PHASE_COLORS[i % PHASE_COLORS.length],
              minWidth: "40px",
            }}
          >
            <span className="truncate">{phase.name}</span>
          </div>
        );
      })}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Patient & Scoring
  // ─────────────────────────────────────────────────────────────────────────

  const Step1 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Inputs */}
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-neuro-orange" /> Patient Information
          </h3>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Patient Name *</label>
            <input
              type="text"
              value={state.patientName}
              onChange={(e) => set("patientName", e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={state.date}
              onChange={(e) => set("date", e.target.value)}
              className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Doctor Name</label>
              <input
                type="text"
                value={state.doctorName}
                onChange={(e) => set("doctorName", e.target.value)}
                className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Practice Name</label>
              <input
                type="text"
                value={state.practiceName}
                onChange={(e) => set("practiceName", e.target.value)}
                className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Scoring Toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => set("useScoring", !state.useScoring)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-black text-neuro-navy uppercase tracking-wide">
              Use Dysfunction Scoring
            </span>
            {state.useScoring ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {state.useScoring && (
            <div className="px-5 pb-5 space-y-4">
              {state.scoringCategories.map((cat) => (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => renameCategory(cat.id, e.target.value)}
                      className="text-xs font-bold text-gray-600 uppercase tracking-wide bg-transparent border-b border-transparent focus:border-neuro-orange focus:outline-none"
                    />
                    {state.scoringCategories.length > 1 && (
                      <button
                        onClick={() => removeCategory(cat.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setScore(cat.id, cat.score === n ? 0 : n)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                          cat.score === n
                            ? "bg-neuro-navy text-white shadow-sm"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={addCategory}
                className="text-xs font-bold text-neuro-orange hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Category
              </button>

              {avgScore > 0 && (
                <div
                  className="rounded-xl p-5 text-center text-white"
                  style={{ backgroundColor: scoreColor(avgScore) }}
                >
                  <p className="text-xs uppercase tracking-wide opacity-70 mb-1">Average Score</p>
                  <p className="text-4xl font-black">{avgScore.toFixed(1)}</p>
                  <p className="text-sm mt-2 opacity-80">{getScoreRecommendation(avgScore)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit">
        <div className="bg-neuro-navy p-6">
          <p className="text-xs text-white/50 uppercase tracking-wide font-bold">Live Preview</p>
          <h2 className="text-xl font-heading font-black text-white mt-2">
            {state.patientName || "Patient Name"}
          </h2>
          <p className="text-white/60 text-sm mt-1">
            {state.date} &middot; {state.doctorName}
          </p>
          <p className="text-white/40 text-xs mt-1">{state.practiceName}</p>
        </div>
        {state.useScoring && avgScore > 0 && (
          <div className="p-6 border-b border-gray-100">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">
              Dysfunction Score
            </h4>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl"
                style={{ backgroundColor: scoreColor(avgScore) }}
              >
                {avgScore.toFixed(1)}
              </div>
              <div className="flex-1 space-y-1.5">
                {scoredCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-28 truncate">{cat.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(cat.score / 5) * 100}%`,
                          backgroundColor: scoreColor(cat.score),
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-600 w-4 text-right">{cat.score}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center italic">
              {getScoreRecommendation(avgScore)}
            </p>
          </div>
        )}
        {!state.useScoring && (
          <div className="p-8 text-center text-gray-300 text-sm">
            Patient info will appear in the final care plan.
            <br />
            Enable scoring to see a live assessment preview.
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Plan Builder
  // ─────────────────────────────────────────────────────────────────────────

  const Step2 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Phase Inputs */}
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide">Per-Visit Fee</h3>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input
              type="number"
              value={state.perVisitFee}
              onChange={(e) => set("perVisitFee", Number(e.target.value) || 0)}
              className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-neuro-navy uppercase tracking-wide mb-4">Care Phases</h3>
          <div className="space-y-3">
            {state.phases.map((phase, i) => {
              const phaseVisits = phase.visitsPerWeek * phase.weeks;
              const phaseCost = phaseVisits * state.perVisitFee;
              return (
                <div
                  key={phase.id}
                  className="border border-gray-200 rounded-xl p-4"
                  style={{ borderLeftWidth: "4px", borderLeftColor: PHASE_COLORS[i % PHASE_COLORS.length] }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={phase.name}
                      onChange={(e) => updatePhase(phase.id, "name", e.target.value)}
                      className="font-bold text-sm text-neuro-navy bg-transparent focus:outline-none border-b border-transparent focus:border-neuro-orange w-40"
                    />
                    {state.phases.length > 1 && (
                      <button
                        onClick={() => removePhase(phase.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Visits/Week</label>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        value={phase.visitsPerWeek}
                        onChange={(e) =>
                          updatePhase(phase.id, "visitsPerWeek", Math.max(1, Number(e.target.value) || 1))
                        }
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold focus:outline-none focus:border-neuro-orange mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Weeks</label>
                      <input
                        type="number"
                        min={1}
                        max={52}
                        value={phase.weeks}
                        onChange={(e) =>
                          updatePhase(phase.id, "weeks", Math.max(1, Number(e.target.value) || 1))
                        }
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold focus:outline-none focus:border-neuro-orange mt-1"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {phaseVisits} visits over {phase.weeks} weeks &middot;{" "}
                    <span className="font-bold text-neuro-navy">${fmt(phaseCost)}</span>
                  </p>
                </div>
              );
            })}
          </div>
          <button
            onClick={addPhase}
            className="mt-3 text-xs font-bold text-neuro-orange hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Phase
          </button>
        </div>

        {/* Advanced Options */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => set("showAdvanced", !state.showAdvanced)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Advanced Options
            </span>
            {state.showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {state.showAdvanced && (
            <div className="px-5 pb-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Care Plan Discount %
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={state.discount}
                  onChange={(e) => set("discount", Math.min(50, Math.max(0, Number(e.target.value) || 0)))}
                  className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Notes to Patient
                </label>
                <textarea
                  value={state.notesToPatient}
                  onChange={(e) => set("notesToPatient", e.target.value)}
                  rows={3}
                  placeholder="Any additional notes for the patient..."
                  className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide mb-4">
            Care Journey Timeline
          </h3>
          <TimelineBar />
        </div>

        <div className="p-6 space-y-3">
          {state.phases.map((phase, i) => {
            const pv = phase.visitsPerWeek * phase.weeks;
            const pc = pv * state.perVisitFee;
            return (
              <div key={phase.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                  style={{ backgroundColor: PHASE_COLORS[i % PHASE_COLORS.length] }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-neuro-navy text-sm">{phase.name}</p>
                  <p className="text-gray-400 text-xs">
                    {phase.visitsPerWeek}x/week for {phase.weeks} weeks
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-neuro-navy text-sm">{pv} visits</p>
                  <p className="text-gray-400 text-xs">${fmt(pc)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-6 space-y-2 border-t border-gray-100 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Visits</span>
            <span className="font-black text-neuro-navy">{totalVisits}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Duration</span>
            <span className="font-black text-neuro-navy">
              {totalWeeks} weeks / {totalMonths} months
            </span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
            <span className="font-bold text-neuro-navy">Total Investment</span>
            <span className="text-xl font-black text-neuro-navy">${fmt(netTotal)}</span>
          </div>
          {state.discount > 0 && (
            <p className="text-xs text-green-600 font-bold text-right">
              {state.discount}% discount saves ${fmt(discountAmount)}
            </p>
          )}
        </div>

        {/* Payment Options Preview */}
        <div className="px-6 pb-6 space-y-3">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wide">Payment Options</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="border-2 border-neuro-orange rounded-xl p-3 relative">
              <span className="absolute -top-2 left-2 bg-neuro-orange text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                Best Value
              </span>
              <p className="text-[10px] font-bold text-neuro-navy mt-1">Pay in Full</p>
              <p className="text-lg font-black text-neuro-navy">${fmt(pifTotal)}</p>
              <p className="text-[10px] text-green-600 font-bold">Save ${fmt(pifDiscount)}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-3">
              <p className="text-[10px] font-bold text-neuro-navy">Monthly</p>
              <p className="text-lg font-black text-neuro-navy">
                ${fmt(monthlyPayment)}
                <span className="text-[10px] text-gray-400 font-normal">/ea</span>
              </p>
              <p className="text-[10px] text-gray-400">{totalMonths} payments</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-3">
              <p className="text-[10px] font-bold text-neuro-navy">Bi-Weekly</p>
              <p className="text-lg font-black text-neuro-navy">
                ${fmt(biWeeklyPayment)}
                <span className="text-[10px] text-gray-400 font-normal">/2wk</span>
              </p>
              <p className="text-[10px] text-gray-400">{biWeeklyPeriods} payments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Add-Ons
  // ─────────────────────────────────────────────────────────────────────────

  const Step3 = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Supplements */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => set("useSupplements", !state.useSupplements)}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2">
            <Pill className="w-4 h-4 text-neuro-orange" /> Supplement Recommendations
          </span>
          <div
            className={`w-11 h-6 rounded-full relative transition-colors ${
              state.useSupplements ? "bg-neuro-orange" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                state.useSupplements ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>

        {state.useSupplements && (
          <div className="px-5 pb-5 space-y-3">
            {state.supplements.map((sup) => (
              <div
                key={sup.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  sup.selected ? "border-neuro-navy bg-neuro-navy/5" : "border-gray-200"
                }`}
              >
                <button
                  onClick={() => toggleSupplement(sup.id)}
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                    sup.selected ? "bg-neuro-navy border-neuro-navy" : "border-gray-300"
                  }`}
                >
                  {sup.selected && <Check className="w-3 h-3 text-white" />}
                </button>
                <input
                  type="text"
                  value={sup.name}
                  onChange={(e) => updateSupplement(sup.id, "name", e.target.value)}
                  className="flex-1 text-sm font-bold text-neuro-navy bg-transparent focus:outline-none border-b border-transparent focus:border-neuro-orange"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">$</span>
                  <input
                    type="number"
                    value={sup.price}
                    onChange={(e) =>
                      updateSupplement(sup.id, "price", Number(e.target.value) || 0)
                    }
                    className="w-14 text-sm font-bold text-right bg-transparent border-b border-gray-200 focus:outline-none focus:border-neuro-orange"
                  />
                  <span className="text-xs text-gray-400 mr-2">/ea</span>
                  <span className="text-xs text-gray-400">x</span>
                  <input
                    type="number"
                    min={1}
                    value={sup.qty}
                    onChange={(e) =>
                      updateSupplement(sup.id, "qty", Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-10 text-sm font-bold text-center bg-transparent border-b border-gray-200 focus:outline-none focus:border-neuro-orange"
                  />
                  {sup.qty > 1 && (
                    <span className="text-xs font-bold text-neuro-navy ml-1">= ${fmt(sup.price * sup.qty)}</span>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={addSupplement}
              className="text-xs font-bold text-neuro-orange hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Supplement
            </button>

            {selectedSupps.length > 0 && (
              <div className="bg-neuro-navy rounded-xl p-4 text-white mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/60">Supplement Total</span>
                  <span className="font-bold">${fmt(supplementTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">
                    Over {totalMonths} months of care
                  </span>
                  <span className="font-bold text-neuro-orange">${fmt(supplementCareTotal)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lifestyle Recommendations */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => set("useLifestyle", !state.useLifestyle)}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-black text-neuro-navy uppercase tracking-wide flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-neuro-orange" /> Lifestyle Recommendations
          </span>
          <div
            className={`w-11 h-6 rounded-full relative transition-colors ${
              state.useLifestyle ? "bg-neuro-orange" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                state.useLifestyle ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>

        {state.useLifestyle && (
          <div className="px-5 pb-5 space-y-2">
            {state.lifestyleRecs.map((rec) => (
              <div key={rec.id}>
                <div
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    rec.checked ? "border-neuro-navy bg-neuro-navy/5" : "border-gray-200"
                  }`}
                >
                  <button
                    onClick={() => toggleLifestyle(rec.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                      rec.checked ? "bg-neuro-navy border-neuro-navy" : "border-gray-300"
                    }`}
                  >
                    {rec.checked && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <input
                    type="text"
                    value={rec.label}
                    onChange={(e) => renameLifestyle(rec.id, e.target.value)}
                    className="flex-1 text-sm text-neuro-navy bg-transparent focus:outline-none border-b border-transparent focus:border-neuro-orange"
                  />
                </div>
                {rec.checked && (
                  <input
                    type="text"
                    value={rec.details}
                    onChange={(e) => updateLifestyleDetails(rec.id, e.target.value)}
                    placeholder="Add details or instructions..."
                    className="mt-1 ml-8 w-[calc(100%-2rem)] px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-neuro-orange bg-gray-50"
                  />
                )}
              </div>
            ))}
            <button
              onClick={addLifestyle}
              className="text-xs font-bold text-neuro-orange hover:underline flex items-center gap-1 mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add Recommendation
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Care Plan Output
  // ─────────────────────────────────────────────────────────────────────────

  const hasScoring = state.useScoring && avgScore > 0;
  const hasSupplements = state.useSupplements && selectedSupps.length > 0;
  const hasLifestyle = state.useLifestyle && checkedLifestyle.length > 0;
  const hasNotes = state.notesToPatient.trim().length > 0;

  const Step4 = () => (
    <div>
      {/* Action Buttons */}
      <div className="no-print flex items-center gap-3 mb-6">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-neuro-navy text-white text-sm font-bold rounded-xl hover:bg-neuro-navy/90 transition-colors"
        >
          <Printer className="w-4 h-4" /> Print for Patient
        </button>
        <button
          onClick={() => goToStep(2)}
          className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <FileText className="w-4 h-4" /> Edit Plan
        </button>
        <button
          onClick={resetAll}
          className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-sm font-bold text-gray-400 rounded-xl hover:bg-gray-50 hover:text-red-500 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Start New Plan
        </button>
      </div>

      {/* Print Report */}
      <div ref={printRef} className="print-area bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Report Header */}
        <div className="print-header bg-neuro-navy p-8 sm:p-10" style={{ backgroundColor: "#1a2744" }}>
          <p className="text-white/50 text-xs font-bold uppercase tracking-[0.2em]">
            {state.practiceName}
          </p>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-white mt-2">
            {state.patientName || "Patient"}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-white/60 text-sm">Personalized Care Plan</span>
            <span className="text-white/30">|</span>
            <span className="text-white/40 text-sm">{state.date}</span>
            <span className="text-white/30">|</span>
            <span className="text-white/40 text-sm">{state.doctorName}</span>
          </div>
        </div>

        <div className="print-body p-6 sm:p-10 space-y-6">
          {/* Assessment Section */}
          {hasScoring && (
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-neuro-orange/30">
                <div className="w-2 h-2 rounded-full bg-neuro-orange" />
                <h3 className="text-xs font-black text-neuro-orange uppercase tracking-widest">
                  Your Assessment
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div
                  className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: scoreColor(avgScore) }}
                >
                  <span className="text-3xl font-black">{avgScore.toFixed(1)}</span>
                  <span className="text-[10px] uppercase tracking-wide opacity-80">Score</span>
                </div>
                <div className="flex-1 space-y-2">
                  {scoredCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-32">{cat.name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{
                            width: `${(cat.score / 5) * 100}%`,
                            backgroundColor: scoreColor(cat.score),
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-700 w-6 text-right">{cat.score}/5</span>
                    </div>
                  ))}
                  <p className="text-sm text-gray-500 italic mt-2">
                    {getScoreRecommendation(avgScore)}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Care Journey Section */}
          <section>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-neuro-orange/30">
              <div className="w-2 h-2 rounded-full bg-neuro-orange" />
              <h3 className="text-xs font-black text-neuro-orange uppercase tracking-widest">
                Your Care Journey
              </h3>
            </div>

            <TimelineBar height="h-14" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {state.phases.map((phase, i) => {
                const pv = phase.visitsPerWeek * phase.weeks;
                const pc = pv * state.perVisitFee;
                return (
                  <div
                    key={phase.id}
                    className="rounded-xl p-4 border-2"
                    style={{ borderColor: PHASE_COLORS[i % PHASE_COLORS.length] + "40" }}
                  >
                    <p
                      className="text-xs font-black uppercase tracking-wide mb-1"
                      style={{ color: PHASE_COLORS[i % PHASE_COLORS.length] }}
                    >
                      {phase.name}
                    </p>
                    <p className="font-heading text-xl font-black text-neuro-navy">{pv} visits</p>
                    <p className="text-xs text-gray-500">
                      {phase.visitsPerWeek}x/week &middot; {phase.weeks} weeks
                    </p>
                    <p className="text-sm font-bold text-neuro-navy mt-1">${fmt(pc)}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-gray-50 rounded-xl p-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Visits</span>
                <span className="font-bold text-neuro-navy">{totalVisits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-bold text-neuro-navy">
                  {totalWeeks} weeks / {totalMonths} months
                </span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                <span className="font-bold text-neuro-navy">Total Investment</span>
                <span className="text-xl font-black text-neuro-navy">${fmt(netTotal)}</span>
              </div>
            </div>
          </section>

          {/* Investment Section */}
          <section>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-neuro-orange/30">
              <div className="w-2 h-2 rounded-full bg-neuro-orange" />
              <h3 className="text-xs font-black text-neuro-orange uppercase tracking-widest">
                Your Investment
              </h3>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                <span className="text-gray-600">Care Plan Subtotal ({totalVisits} visits x ${state.perVisitFee})</span>
                <span className="font-bold text-neuro-navy">${fmt(grossTotal)}</span>
              </div>
              {state.discount > 0 && (
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-green-600 font-bold">Care Plan Discount ({state.discount}%)</span>
                  <span className="text-green-600 font-bold">-${fmt(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                <span className="font-bold text-neuro-navy">Adjusted Total</span>
                <span className="font-bold text-neuro-navy">${fmt(netTotal)}</span>
              </div>
              {hasSupplements && (
                <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span className="text-gray-600">
                    Supplements ({selectedSupps.length} items)
                  </span>
                  <span className="font-bold text-neuro-navy">${fmt(supplementCareTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-base pt-2 border-t-2 border-neuro-navy">
                <span className="font-black text-neuro-navy">Grand Total</span>
                <span className="text-xl font-black text-neuro-navy">${fmt(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Option Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border-2 border-neuro-orange rounded-xl p-4 relative bg-neuro-orange/5">
                <span className="absolute -top-2.5 left-3 bg-neuro-orange text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  Best Value
                </span>
                <p className="font-bold text-neuro-navy text-sm mt-1">Pay in Full</p>
                <p className="text-2xl font-black text-neuro-navy mt-1">${fmt(pifTotal)}</p>
                <p className="text-xs text-green-600 font-bold mt-1">Save ${fmt(pifDiscount)}</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="font-bold text-neuro-navy text-sm">Monthly</p>
                <p className="text-2xl font-black text-neuro-navy mt-1">
                  ${fmt(monthlyPayment)}
                  <span className="text-xs text-gray-400 font-normal">/ea</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{totalMonths} payments</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="font-bold text-neuro-navy text-sm">Bi-Weekly</p>
                <p className="text-2xl font-black text-neuro-navy mt-1">
                  ${fmt(biWeeklyPayment)}
                  <span className="text-xs text-gray-400 font-normal">/2wk</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{biWeeklyPeriods} payments</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              Per visit: ${totalVisits > 0 ? fmt(Math.round(netTotal / totalVisits)) : 0}
            </p>
          </section>

          {/* Recommendations Section */}
          {(hasSupplements || hasLifestyle) && (
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-neuro-orange/30">
                <div className="w-2 h-2 rounded-full bg-neuro-orange" />
                <h3 className="text-xs font-black text-neuro-orange uppercase tracking-widest">
                  Recommendations
                </h3>
              </div>

              {hasSupplements && (
                <div className="mb-5">
                  <h4 className="text-sm font-bold text-neuro-navy mb-3">Supplements</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSupps.map((sup) => (
                      <div
                        key={sup.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">{sup.name}</span>
                        <span className="text-sm font-bold text-neuro-navy">
                          {sup.qty > 1 ? `${sup.qty} x $${sup.price} = $${fmt(sup.price * sup.qty)}` : `$${sup.price}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    Supplement Total: ${fmt(supplementTotal)}
                  </p>
                </div>
              )}

              {hasLifestyle && (
                <div>
                  <h4 className="text-sm font-bold text-neuro-navy mb-3">Lifestyle</h4>
                  <div className="space-y-2">
                    {checkedLifestyle.map((rec) => (
                      <div key={rec.id} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded bg-neuro-navy flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">{rec.label}</p>
                          {rec.details && (
                            <p className="text-xs text-gray-500 italic">{rec.details}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Doctor's Notes */}
          {hasNotes && (
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-neuro-orange/30">
                <div className="w-2 h-2 rounded-full bg-neuro-orange" />
                <h3 className="text-xs font-black text-neuro-orange uppercase tracking-widest">
                  Doctor&apos;s Notes
                </h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {state.notesToPatient}
              </p>
            </section>
          )}
        </div>

          {/* Signature Block */}
          <section className="pt-4 border-t-2 border-neuro-navy mt-6">
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              By signing below, I confirm that I have reviewed this care plan and understand the recommended treatment,
              visit schedule, and financial investment. I have had the opportunity to ask questions.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="sig-line border-b-2 border-neuro-navy h-8" />
                <p className="text-[10px] text-gray-400 mt-1">Patient Signature</p>
                <div className="border-b border-gray-300 h-6 mt-4" />
                <p className="text-[10px] text-gray-400 mt-1">Print Name</p>
              </div>
              <div>
                <div className="sig-line border-b-2 border-neuro-navy h-8" />
                <p className="text-[10px] text-gray-400 mt-1">Date</p>
                <div className="border-b border-gray-300 h-6 mt-4" />
                <p className="text-[10px] text-gray-400 mt-1">Doctor Signature / Date</p>
              </div>
            </div>
          </section>

        {/* Report Footer */}
        <div className="px-6 sm:px-10 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-center text-xs text-gray-400 italic mb-1">
            Your care plan is designed around your specific needs. Consistency is key to lasting correction.
          </p>
          <div className="flex justify-between text-[10px] text-gray-300">
            <span>{state.practiceName}</span>
            <span>{state.doctorName}</span>
            <span>{state.date}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="care-plan-wrapper p-4 md:p-8 max-w-6xl mx-auto">
      <style jsx global>{`
        @media print {
          /* Hide EVERYTHING except the report */
          .no-print,
          nav, header, footer, aside,
          [data-sidebar], [role="navigation"],
          button, .step-tabs-container {
            display: none !important;
          }

          /* Reset page */
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page { margin: 0.3in 0.4in; }

          /* Force colors to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Make the report fill the page cleanly */
          .print-area {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }

          /* The parent wrapper should be invisible */
          .care-plan-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }

          /* Tighten spacing for print */
          .print-area .print-section { margin-bottom: 14px !important; }
          .print-area .print-header { padding: 20px 24px !important; }
          .print-area .print-body { padding: 16px 24px !important; }
          .print-area .print-body > section { margin-bottom: 16px !important; }
          .print-area .phase-card { padding: 10px !important; }

          /* Prevent page breaks inside sections */
          section { page-break-inside: avoid; }

          /* Ensure timeline bar prints */
          .timeline-bar, .timeline-bar > div {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Signature lines */
          .sig-line { border-bottom: 1.5px solid #1a2744; height: 28px; }
        }
      `}</style>

      {/* Page Header */}
      <div className="no-print flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-black text-neuro-navy flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-neuro-orange" /> Care Plan Builder
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Build a professional care plan in 4 steps.
          </p>
        </div>
        <button
          onClick={resetAll}
          className="px-3 py-2 text-gray-400 hover:text-neuro-navy text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {StepTabs()}

      {state.currentStep === 1 && Step1()}
      {state.currentStep === 2 && Step2()}
      {state.currentStep === 3 && Step3()}
      {state.currentStep === 4 && Step4()}

      {state.currentStep < 4 && NavButtons()}
    </div>
  );
}
