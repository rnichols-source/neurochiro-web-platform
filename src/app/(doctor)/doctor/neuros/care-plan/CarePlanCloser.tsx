"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Printer, Save, Download } from "lucide-react";
import { saveCareplan, loadCareplan, loadPracticeConfig, lookupFeeSchedule } from "./actions";
import { CPT_CODES, VISIT_BUNDLES, getCptsByCategory } from "./cpt-codes";
import { getFeeForCode } from "./fee-schedule-data";

// ============================================
// TYPES
// ============================================
interface Phase {
  name: string;
  visitsPerWeek: number;
  weeks: number;
  cptCodes: string[];
  feePerVisit: number; // cents
}

interface Supplement {
  name: string;
  price: number; // cents
  quantity: number;
  enabled: boolean;
}

interface ScoringCategory {
  label: string;
  key: string;
  score: number; // 1-5
}

interface CarePlanState {
  id?: string;
  // Step 1
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  date: string;
  case_type: "cash" | "insurance" | "pi" | "hybrid";
  insurance_payer: string;
  care_track: "corrective" | "relief";
  // Step 2
  scoring: ScoringCategory[];
  complaints: string[];
  goals: string[];
  // Step 3
  phases: Phase[];
  // Step 4
  supplements: Supplement[];
  lifestyle_recs: string[];
  // Step 5
  notes: string;
  status: "draft" | "presented" | "accepted" | "archived";
}

const STEP_LABELS = ["Patient Info", "Assessment", "Build Plan", "Add-Ons", "Review & Output"];

const INITIAL_SCORING: ScoringCategory[] = [
  { label: "Structural / Alignment", key: "structural", score: 0 },
  { label: "Neurological / Scans", key: "neurological", score: 0 },
  { label: "Muscular / ROM", key: "muscular", score: 0 },
  { label: "Postural / Balance", key: "postural", score: 0 },
  { label: "Functional / Daily Impact", key: "functional", score: 0 },
];

const DEFAULT_PHASES_CORRECTIVE: Phase[] = [
  { name: "Initial Intensive", visitsPerWeek: 3, weeks: 8, cptCodes: ["98941"], feePerVisit: 0 },
  { name: "Corrective", visitsPerWeek: 2, weeks: 8, cptCodes: ["98941"], feePerVisit: 0 },
  { name: "Protective", visitsPerWeek: 1, weeks: 8, cptCodes: ["98941"], feePerVisit: 0 },
];

const DEFAULT_PHASES_RELIEF: Phase[] = [
  { name: "Relief Care", visitsPerWeek: 3, weeks: 4, cptCodes: ["98941"], feePerVisit: 0 },
];

const COMMON_COMPLAINTS = [
  "Low Back Pain", "Neck Pain", "Headaches", "Migraines", "Mid/Upper Back Pain",
  "Shoulder Pain", "Hip Pain", "Sciatica", "Numbness/Tingling", "Disc Issues",
  "Muscle Spasms", "Morning Stiffness", "Poor Posture", "Scoliosis", "Arthritis",
  "TMJ/Jaw Pain", "Vertigo/Dizziness", "Fatigue", "Sleep Issues", "Digestive Issues",
  "Stress/Anxiety", "Brain Fog", "Auto Accident Injury", "Sports Injury", "Pregnancy Related",
];

const COMMON_GOALS = [
  "Sleep without pain", "Get out of bed without stiffness", "Work a full day without pain",
  "Pick up kids/grandkids safely", "Exercise without paying for it the next day",
  "Stop relying on medication", "Feel like myself again", "Be present for my family",
  "Avoid surgery", "Stop feeling older than I am", "Get my energy back",
  "Be active and independent as I age",
];

const DEFAULT_LIFESTYLE = [
  "Drink half body weight in ounces of water daily",
  "Walk 20-30 minutes daily",
  "Ice 15 minutes after adjustments",
  "Practice prescribed stretches 2x daily",
  "Improve sleep posture (supportive pillow, back sleeping)",
  "Reduce inflammatory foods (sugar, processed, alcohol)",
  "Take supplements as recommended",
];

// ============================================
// COMPONENT
// ============================================
interface CarePlanCloserProps {
  editId?: string | null;
}

export default function CarePlanCloser({ editId }: CarePlanCloserProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [practiceConfig, setPracticeConfig] = useState<any>(null);
  const [state, setState] = useState<CarePlanState>({
    patient_name: "", patient_email: "", patient_phone: "",
    date: new Date().toISOString().split("T")[0],
    case_type: "cash", insurance_payer: "", care_track: "corrective",
    scoring: INITIAL_SCORING.map(s => ({ ...s })),
    complaints: [], goals: [],
    phases: DEFAULT_PHASES_CORRECTIVE.map(p => ({ ...p })),
    supplements: [], lifestyle_recs: [...DEFAULT_LIFESTYLE],
    notes: "", status: "draft",
  });

  // Load practice config on mount
  useEffect(() => {
    loadPracticeConfig().then(config => {
      if (config) {
        setPracticeConfig(config);
        // Pre-populate supplements from practice catalog
        const catalog = (config.supplement_catalog as any[]) || [];
        setState(prev => ({
          ...prev,
          supplements: catalog.map((s: any) => ({
            name: s.name, price: s.price, quantity: 1, enabled: s.enabled,
          })),
          phases: prev.phases.map(p => ({
            ...p, feePerVisit: p.feePerVisit || config.default_visit_fee || 6500,
          })),
        }));
      }
    });
  }, []);

  // Load existing care plan if editing
  useEffect(() => {
    if (!editId) return;
    loadCareplan(editId).then(plan => {
      if (!plan) return;
      setState({
        id: plan.id,
        patient_name: plan.patient_name,
        patient_email: plan.patient_email || "",
        patient_phone: plan.patient_phone || "",
        date: plan.date,
        case_type: plan.case_type as any,
        insurance_payer: plan.insurance_payer || "",
        care_track: plan.care_track as any,
        scoring: (plan.scoring_data as any)?.categories || INITIAL_SCORING,
        complaints: (plan.scoring_data as any)?.complaints || [],
        goals: (plan.scoring_data as any)?.goals || [],
        phases: (plan.phases as any) || [],
        supplements: (plan.supplements as any) || [],
        lifestyle_recs: (plan.lifestyle_recs as any) || [],
        notes: plan.notes || "",
        status: plan.status as any,
      });
    });
  }, [editId]);

  // Update phases when care track changes
  const handleCareTrackChange = (track: "corrective" | "relief") => {
    const fee = practiceConfig?.default_visit_fee || 6500;
    setState(prev => ({
      ...prev,
      care_track: track,
      phases: (track === "corrective" ? DEFAULT_PHASES_CORRECTIVE : DEFAULT_PHASES_RELIEF)
        .map(p => ({ ...p, feePerVisit: fee })),
    }));
  };

  // Calculate totals
  const totalVisits = state.phases.reduce((sum, p) => sum + p.visitsPerWeek * p.weeks, 0);
  const totalWeeks = state.phases.reduce((sum, p) => sum + p.weeks, 0);

  const calculateVisitRevenue = (phase: Phase) => {
    if (state.case_type === "cash" || state.case_type === "pi") {
      return phase.feePerVisit * phase.visitsPerWeek * phase.weeks;
    }
    // Insurance: sum allowed amounts for all CPT codes in the phase
    let perVisit = 0;
    for (const code of phase.cptCodes) {
      const fee = getFeeForCode(state.insurance_payer || "BCBS", code);
      perVisit += fee || 0;
    }
    return perVisit * phase.visitsPerWeek * phase.weeks;
  };

  const totalPlanValue = state.phases.reduce((sum, p) => sum + calculateVisitRevenue(p), 0);
  const totalSupplementsMonthly = state.supplements
    .filter(s => s.enabled)
    .reduce((sum, s) => sum + s.price * s.quantity, 0);

  const dysfunctionScore = state.scoring.reduce((sum, s) => sum + s.score, 0);
  const maxScore = state.scoring.length * 5;

  // Toggle helpers
  const toggleComplaint = (c: string) => {
    setState(prev => ({
      ...prev,
      complaints: prev.complaints.includes(c) ? prev.complaints.filter(x => x !== c) : [...prev.complaints, c],
    }));
  };

  const toggleGoal = (g: string) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.includes(g) ? prev.goals.filter(x => x !== g) : [...prev.goals, g],
    }));
  };

  const toggleLifestyle = (l: string) => {
    setState(prev => ({
      ...prev,
      lifestyle_recs: prev.lifestyle_recs.includes(l) ? prev.lifestyle_recs.filter(x => x !== l) : [...prev.lifestyle_recs, l],
    }));
  };

  const updatePhase = (index: number, field: keyof Phase, value: any) => {
    setState(prev => ({
      ...prev,
      phases: prev.phases.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  const addPhase = () => {
    setState(prev => ({
      ...prev,
      phases: [...prev.phases, { name: "New Phase", visitsPerWeek: 1, weeks: 4, cptCodes: ["98941"], feePerVisit: practiceConfig?.default_visit_fee || 6500 }],
    }));
  };

  const removePhase = (index: number) => {
    setState(prev => ({ ...prev, phases: prev.phases.filter((_, i) => i !== index) }));
  };

  const togglePhaseCpt = (phaseIndex: number, code: string) => {
    setState(prev => ({
      ...prev,
      phases: prev.phases.map((p, i) => {
        if (i !== phaseIndex) return p;
        return {
          ...p,
          cptCodes: p.cptCodes.includes(code) ? p.cptCodes.filter(c => c !== code) : [...p.cptCodes, code],
        };
      }),
    }));
  };

  // Save
  const handleSave = async (newStatus?: string) => {
    setSaving(true);
    const result = await saveCareplan({
      id: state.id,
      patient_name: state.patient_name,
      patient_email: state.patient_email,
      patient_phone: state.patient_phone,
      date: state.date,
      case_type: state.case_type,
      insurance_payer: state.insurance_payer,
      care_track: state.care_track,
      scoring_data: { categories: state.scoring, complaints: state.complaints, goals: state.goals, dysfunctionScore },
      phases: state.phases,
      supplements: state.supplements.filter(s => s.enabled),
      lifestyle_recs: state.lifestyle_recs,
      payment_options: { totalPlanValue, totalSupplementsMonthly, totalVisits, totalWeeks },
      billing_sheet: { phases: state.phases.map(p => ({ ...p, revenue: calculateVisitRevenue(p) })) },
      notes: state.notes,
      status: newStatus || state.status,
      total_value: totalPlanValue,
    });
    if (result.id) setState(prev => ({ ...prev, id: result.id }));
    setSaving(false);
  };

  const formatCents = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-[#1E2D3B] mb-2">The Care Plan Closer</h1>
      <p className="text-sm text-gray-500 mb-6">Build professional care plans with insurance billing intelligence.</p>

      {/* Step tabs */}
      <div className="flex gap-0 bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        {STEP_LABELS.map((label, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`flex-1 py-3 text-[11px] font-bold text-center transition-all border-r border-gray-200 last:border-r-0 ${
              step === i ? "bg-[#1E2D3B] text-white" : i < step ? "bg-green-500 text-white" : "text-gray-400"
            }`}>
            {i < step ? <Check className="w-3 h-3 inline mr-1" /> : null}{label}
          </button>
        ))}
      </div>

      {/* ===== STEP 0: Patient Info ===== */}
      {step === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#1E2D3B]">Patient Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Patient Name *</label>
              <input value={state.patient_name} onChange={e => setState(p => ({ ...p, patient_name: e.target.value }))}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Date</label>
              <input type="date" value={state.date} onChange={e => setState(p => ({ ...p, date: e.target.value }))}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Email</label>
              <input value={state.patient_email} onChange={e => setState(p => ({ ...p, patient_email: e.target.value }))}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Phone</label>
              <input value={state.patient_phone} onChange={e => setState(p => ({ ...p, patient_phone: e.target.value }))}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" />
            </div>
          </div>

          {/* Case Type */}
          <div>
            <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Case Type</label>
            <div className="flex gap-0 bg-gray-100 rounded-xl overflow-hidden mt-1">
              {(["cash", "insurance", "pi", "hybrid"] as const).map(t => (
                <button key={t} onClick={() => setState(p => ({ ...p, case_type: t }))}
                  className={`flex-1 py-3 text-xs font-bold text-center transition-all capitalize ${
                    state.case_type === t ? "bg-[#1E2D3B] text-white" : "text-gray-500"
                  }`}>{t === "pi" ? "Personal Injury" : t}</button>
              ))}
            </div>
          </div>

          {/* Insurance payer */}
          {(state.case_type === "insurance" || state.case_type === "hybrid") && (
            <div>
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Insurance Payer</label>
              <select value={state.insurance_payer} onChange={e => setState(p => ({ ...p, insurance_payer: e.target.value }))}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none">
                <option value="">Select payer...</option>
                {(practiceConfig?.insurance_profiles as any[] || []).filter((p: any) => p.enabled).map((p: any) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
                <option value="BCBS">BCBS</option>
                <option value="AETNA">Aetna</option>
                <option value="CIGNA">Cigna</option>
                <option value="UNITED">United Healthcare</option>
                <option value="MEDICARE">Medicare</option>
              </select>
            </div>
          )}

          {/* Care Track */}
          <div>
            <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Care Track</label>
            <div className="flex gap-0 bg-gray-100 rounded-xl overflow-hidden mt-1">
              <button onClick={() => handleCareTrackChange("corrective")}
                className={`flex-1 py-3 text-xs font-bold text-center transition-all ${state.care_track === "corrective" ? "bg-[#1E2D3B] text-white" : "text-gray-500"}`}>
                Corrective
              </button>
              <button onClick={() => handleCareTrackChange("relief")}
                className={`flex-1 py-3 text-xs font-bold text-center transition-all ${state.care_track === "relief" ? "bg-[#1E2D3B] text-white" : "text-gray-500"}`}>
                Relief
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {state.care_track === "corrective"
                ? "Corrective: 3-phase plan (Intensive, Corrective, Protective) to address root cause dysfunction."
                : "Relief: Shorter plan focused on symptom relief and stabilization."}
            </p>
          </div>
        </div>
      )}

      {/* ===== STEP 1: Assessment ===== */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Dysfunction Scoring */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1E2D3B] mb-4">Dysfunction Score</h2>
            <div className="space-y-3">
              {state.scoring.map((cat, ci) => (
                <div key={cat.key} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#1E2D3B] w-44 flex-shrink-0">{cat.label}</span>
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => {
                        const updated = [...state.scoring];
                        updated[ci] = { ...updated[ci], score: n };
                        setState(p => ({ ...p, scoring: updated }));
                      }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          cat.score === n ? "bg-[#1E2D3B] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}>{n}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-[#1E2D3B] rounded-xl p-4 text-center text-white">
              <div className="text-4xl font-black">{dysfunctionScore}<span className="text-lg text-white/40">/{maxScore}</span></div>
              <div className="text-xs text-white/50 mt-1">
                {dysfunctionScore <= 10 ? "Mild Dysfunction" : dysfunctionScore <= 15 ? "Moderate Dysfunction" : dysfunctionScore <= 20 ? "Significant Dysfunction" : "Severe Dysfunction"}
              </div>
            </div>
          </div>

          {/* Complaints */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1E2D3B] mb-3">Complaints</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
              {COMMON_COMPLAINTS.map(c => (
                <button key={c} onClick={() => toggleComplaint(c)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all ${
                    state.complaints.includes(c) ? "bg-[#1E2D3B] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}>
                  <div className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center ${
                    state.complaints.includes(c) ? "bg-white/20 border-white/30" : "border-gray-300"
                  }`}>{state.complaints.includes(c) && <Check className="w-2.5 h-2.5" />}</div>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1E2D3B] mb-3">Patient Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {COMMON_GOALS.map(g => (
                <button key={g} onClick={() => toggleGoal(g)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all ${
                    state.goals.includes(g) ? "bg-[#D66829] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}>
                  <div className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center ${
                    state.goals.includes(g) ? "bg-white/20 border-white/30" : "border-gray-300"
                  }`}>{state.goals.includes(g) && <Check className="w-2.5 h-2.5" />}</div>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 2: Build Plan ===== */}
      {step === 2 && (
        <div className="space-y-4">
          {state.phases.map((phase, pi) => (
            <div key={pi} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <input value={phase.name} onChange={e => updatePhase(pi, "name", e.target.value)}
                  className="text-lg font-bold text-[#1E2D3B] bg-transparent outline-none border-b-2 border-transparent focus:border-blue-400" />
                {state.phases.length > 1 && (
                  <button onClick={() => removePhase(pi)} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Visits/Week</label>
                  <input type="number" min={1} max={7} value={phase.visitsPerWeek} onChange={e => updatePhase(pi, "visitsPerWeek", parseInt(e.target.value) || 1)}
                    className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold text-center outline-none focus:border-[#1E2D3B]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Weeks</label>
                  <input type="number" min={1} max={52} value={phase.weeks} onChange={e => updatePhase(pi, "weeks", parseInt(e.target.value) || 1)}
                    className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold text-center outline-none focus:border-[#1E2D3B]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {state.case_type === "cash" || state.case_type === "pi" ? "Fee/Visit" : "Est. Reimb/Visit"}
                  </label>
                  {state.case_type === "cash" || state.case_type === "pi" ? (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-400">$</span>
                      <input type="number" value={(phase.feePerVisit / 100).toFixed(0)} onChange={e => updatePhase(pi, "feePerVisit", Math.round(parseFloat(e.target.value || "0") * 100))}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold text-center outline-none focus:border-[#1E2D3B]" />
                    </div>
                  ) : (
                    <div className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm font-bold text-center text-green-600">
                      {formatCents(phase.cptCodes.reduce((sum, code) => sum + (getFeeForCode(state.insurance_payer || "BCBS", code) || 0), 0))}
                    </div>
                  )}
                </div>
              </div>

              {/* CPT Code Selection */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">CPT Codes for This Phase</label>
                <div className="flex flex-wrap gap-1.5">
                  {getCptsByCategory("cmt").concat(getCptsByCategory("therapy")).concat(getCptsByCategory("modality")).map(cpt => (
                    <button key={cpt.code} onClick={() => togglePhaseCpt(pi, cpt.code)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        phase.cptCodes.includes(cpt.code) ? "bg-[#1E2D3B] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}>
                      {cpt.code}
                      {(state.case_type === "insurance" || state.case_type === "hybrid") && (
                        <span className="ml-1 opacity-60">{formatCents(getFeeForCode(state.insurance_payer || "BCBS", cpt.code) || 0)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase summary */}
              <div className="mt-4 bg-gray-50 rounded-xl p-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">{phase.visitsPerWeek * phase.weeks} visits over {phase.weeks} weeks</span>
                <span className="font-bold text-[#1E2D3B]">{formatCents(calculateVisitRevenue(phase))}</span>
              </div>
            </div>
          ))}

          <button onClick={addPhase} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-bold text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all">
            + Add Phase
          </button>

          {/* Plan total */}
          <div className="bg-[#1E2D3B] rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Total Plan</div>
                <div className="text-sm text-white/70 mt-1">{totalVisits} visits over {totalWeeks} weeks ({state.phases.length} phases)</div>
              </div>
              <div className="text-3xl font-black">{formatCents(totalPlanValue)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 3: Add-Ons ===== */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Supplements */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1E2D3B] mb-4">Supplements</h2>
            <div className="space-y-2">
              {state.supplements.map((supp, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                  supp.enabled ? "border-[#1E2D3B] bg-[#1E2D3B]/5" : "border-gray-200"
                }`}>
                  <button onClick={() => {
                    const updated = [...state.supplements];
                    updated[i] = { ...updated[i], enabled: !updated[i].enabled };
                    setState(p => ({ ...p, supplements: updated }));
                  }}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                      supp.enabled ? "bg-[#1E2D3B] border-[#1E2D3B]" : "border-gray-300"
                    }`}>
                    {supp.enabled && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className="flex-1 text-sm font-semibold text-[#1E2D3B]">{supp.name}</span>
                  <span className="text-xs text-gray-400">{formatCents(supp.price)}/mo</span>
                  <span className="text-xs text-gray-400">x</span>
                  <input type="number" min={1} max={10} value={supp.quantity} onChange={e => {
                    const updated = [...state.supplements];
                    updated[i] = { ...updated[i], quantity: parseInt(e.target.value) || 1 };
                    setState(p => ({ ...p, supplements: updated }));
                  }}
                    className="w-12 px-2 py-1 border border-gray-200 rounded-lg text-xs text-center outline-none" />
                </div>
              ))}
            </div>
            {totalSupplementsMonthly > 0 && (
              <div className="mt-3 bg-[#1E2D3B] rounded-xl p-3 flex justify-between text-sm text-white">
                <span>Monthly supplement cost</span>
                <span className="font-bold text-[#D66829]">{formatCents(totalSupplementsMonthly)}/mo</span>
              </div>
            )}
          </div>

          {/* Lifestyle Recommendations */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1E2D3B] mb-4">Lifestyle Recommendations</h2>
            <div className="space-y-1.5">
              {DEFAULT_LIFESTYLE.map(l => (
                <button key={l} onClick={() => toggleLifestyle(l)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all ${
                    state.lifestyle_recs.includes(l) ? "bg-green-50 text-green-800" : "bg-gray-50 text-gray-500"
                  }`}>
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${
                    state.lifestyle_recs.includes(l) ? "bg-green-500 border-green-500" : "border-gray-300"
                  }`}>{state.lifestyle_recs.includes(l) && <Check className="w-2.5 h-2.5 text-white" />}</div>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 4: Review & Output ===== */}
      {step === 4 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" id="care-plan-output">
            {/* Header */}
            <div style={{ background: practiceConfig?.practice_colors?.primary || "#1E2D3B" }} className="px-8 py-6 text-white">
              {practiceConfig?.practice_logo_url && (
                <img src={practiceConfig.practice_logo_url} alt="Logo" className="h-8 mb-3" />
              )}
              <div className="text-sm font-bold opacity-60">{practiceConfig?.practice_name || "Care Plan"}</div>
              <div className="text-2xl font-black mt-1">{state.patient_name || "Patient Name"}</div>
              <div className="text-sm opacity-50 mt-1">{state.date} | {state.care_track === "corrective" ? "Corrective Care" : "Relief Care"} | {state.case_type.toUpperCase()}</div>
            </div>

            <div className="p-8 space-y-6">
              {/* Dysfunction Score */}
              <div>
                <div className="text-xs font-bold text-[#D66829] uppercase tracking-wider mb-2">Dysfunction Score</div>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-black text-[#1E2D3B]">{dysfunctionScore}<span className="text-lg text-gray-400">/{maxScore}</span></div>
                  <div className="text-xs text-gray-500">
                    {dysfunctionScore <= 10 ? "Mild" : dysfunctionScore <= 15 ? "Moderate" : dysfunctionScore <= 20 ? "Significant" : "Severe"} Dysfunction
                  </div>
                </div>
              </div>

              {/* Complaints & Goals */}
              {state.complaints.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-[#D66829] uppercase tracking-wider mb-2">Areas of Concern</div>
                  <div className="flex flex-wrap gap-1.5">
                    {state.complaints.map(c => (
                      <span key={c} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {state.goals.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-[#D66829] uppercase tracking-wider mb-2">Your Goals</div>
                  <ul className="space-y-1">
                    {state.goals.map(g => (
                      <li key={g} className="text-sm text-gray-700 flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Phase Timeline */}
              <div>
                <div className="text-xs font-bold text-[#D66829] uppercase tracking-wider mb-2">Care Plan Timeline</div>
                <div className="flex gap-0 rounded-xl overflow-hidden h-12 mb-3">
                  {state.phases.map((p, i) => {
                    const colors = ["#1E2D3B", "#D66829", "#22c55e", "#3b82f6"];
                    const width = (p.weeks / totalWeeks) * 100;
                    return (
                      <div key={i} style={{ width: `${width}%`, background: colors[i % colors.length] }}
                        className="flex items-center justify-center text-white text-[11px] font-bold px-2 text-center">
                        {p.name}
                      </div>
                    );
                  })}
                </div>
                {state.phases.map((p, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-gray-100 text-sm last:border-0">
                    <span className="font-semibold text-[#1E2D3B]">{p.name}</span>
                    <span className="text-gray-500">{p.visitsPerWeek}x/week for {p.weeks} weeks ({p.visitsPerWeek * p.weeks} visits)</span>
                    <span className="font-bold text-[#1E2D3B]">{formatCents(calculateVisitRevenue(p))}</span>
                  </div>
                ))}
              </div>

              {/* Financial Summary */}
              <div className="bg-[#1E2D3B] rounded-xl p-5 text-white">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Financial Summary</div>
                <div className="flex justify-between py-2 border-b border-white/10 text-sm">
                  <span className="text-white/70">Total Visits</span>
                  <span className="font-bold">{totalVisits}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10 text-sm">
                  <span className="text-white/70">Duration</span>
                  <span className="font-bold">{totalWeeks} weeks ({Math.ceil(totalWeeks / 4)} months)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10 text-sm">
                  <span className="text-white/70">Care Plan Value</span>
                  <span className="font-bold">{formatCents(totalPlanValue)}</span>
                </div>
                {totalSupplementsMonthly > 0 && (
                  <div className="flex justify-between py-2 border-b border-white/10 text-sm">
                    <span className="text-white/70">Supplements ({Math.ceil(totalWeeks / 4)} months)</span>
                    <span className="font-bold">{formatCents(totalSupplementsMonthly * Math.ceil(totalWeeks / 4))}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 text-lg">
                  <span className="text-white/70">Total Investment</span>
                  <span className="font-black text-[#D66829]">
                    {formatCents(totalPlanValue + totalSupplementsMonthly * Math.ceil(totalWeeks / 4))}
                  </span>
                </div>
                {state.case_type === "cash" && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Pay-In-Full (10% discount)</span>
                      <span className="font-bold text-green-400">{formatCents(Math.round((totalPlanValue + totalSupplementsMonthly * Math.ceil(totalWeeks / 4)) * 0.9))}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-white/50">Monthly ({Math.ceil(totalWeeks / 4)} payments)</span>
                      <span className="font-bold">{formatCents(Math.round((totalPlanValue + totalSupplementsMonthly * Math.ceil(totalWeeks / 4)) / Math.ceil(totalWeeks / 4)))}/mo</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Lifestyle */}
              {state.lifestyle_recs.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-[#D66829] uppercase tracking-wider mb-2">Lifestyle Recommendations</div>
                  <ul className="space-y-1">
                    {state.lifestyle_recs.map(l => (
                      <li key={l} className="text-sm text-gray-700 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D66829] mt-2 flex-shrink-0" />{l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Additional Notes</label>
                <textarea value={state.notes} onChange={e => setState(p => ({ ...p, notes: e.target.value }))}
                  className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none resize-none"
                  rows={3} placeholder="Any additional notes for this care plan..." />
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-3 border-t border-gray-100 flex justify-between text-[10px] text-gray-400">
              <span>{practiceConfig?.practice_name} | {practiceConfig?.phone}</span>
              <span>Generated by NeurOS</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => handleSave("draft")} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold text-[#1E2D3B] hover:bg-gray-50 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Draft"}
            </button>
            <button onClick={() => handleSave("presented")} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
              <Check className="w-4 h-4" /> Mark as Presented
            </button>
            <button onClick={() => handleSave("accepted")} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 rounded-xl text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
              <Check className="w-4 h-4" /> Patient Accepted
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-3 bg-[#1E2D3B] rounded-xl text-sm font-bold text-white hover:bg-[#2a3f52]">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)}
            className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold text-[#1E2D3B] hover:bg-gray-50">
            Back
          </button>
        ) : <div />}
        {step < STEP_LABELS.length - 1 && (
          <button onClick={() => setStep(step + 1)}
            className="px-6 py-3 bg-[#1E2D3B] rounded-xl text-sm font-bold text-white hover:bg-[#2a3f52]">
            Next
          </button>
        )}
      </div>
    </div>
  );
}
