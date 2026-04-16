"use client";

import { useState, useRef } from "react";
import { Calculator, Printer, RotateCcw, ChevronDown, ChevronUp, Heart } from "lucide-react";

interface PlanPhase {
  name: string;
  visitsPerWeek: number;
  weeks: number;
}

const DEFAULT_PHASES: PlanPhase[] = [
  { name: "Intensive", visitsPerWeek: 3, weeks: 4 },
  { name: "Corrective", visitsPerWeek: 2, weeks: 8 },
  { name: "Stabilization", visitsPerWeek: 1, weeks: 12 },
];

export default function CarePlanCalculator() {
  const [perVisitFee, setPerVisitFee] = useState(65);
  const [phases, setPhases] = useState<PlanPhase[]>(DEFAULT_PHASES);
  const [patientName, setPatientName] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [showPaymentOptions, setShowPaymentOptions] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const totalVisits = phases.reduce((sum, p) => sum + p.visitsPerWeek * p.weeks, 0);
  const totalWeeks = phases.reduce((sum, p) => sum + p.weeks, 0);
  const grossTotal = totalVisits * perVisitFee;
  const discountAmount = Math.round(grossTotal * (discount / 100));
  const netTotal = grossTotal - discountAmount;
  const perVisitEffective = totalVisits > 0 ? Math.round(netTotal / totalVisits) : 0;

  const paymentOptions = [
    { name: "Pay in Full", amount: netTotal, savings: discount > 0 ? discountAmount : Math.round(netTotal * 0.05), note: discount > 0 ? `${discount}% discount applied` : "5% additional discount" },
    { name: "Monthly", amount: Math.round(netTotal / Math.ceil(totalWeeks / 4)), periods: Math.ceil(totalWeeks / 4), note: `${Math.ceil(totalWeeks / 4)} payments` },
    { name: "Bi-Weekly", amount: Math.round(netTotal / Math.ceil(totalWeeks / 2)), periods: Math.ceil(totalWeeks / 2), note: `${Math.ceil(totalWeeks / 2)} payments` },
  ];

  const payInFullTotal = discount > 0 ? netTotal : netTotal - Math.round(netTotal * 0.05);

  const updatePhase = (index: number, field: keyof PlanPhase, value: string | number) => {
    setPhases(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addPhase = () => {
    setPhases(prev => [...prev, { name: `Phase ${prev.length + 1}`, visitsPerWeek: 1, weeks: 4 }]);
  };

  const removePhase = (index: number) => {
    if (phases.length <= 1) return;
    setPhases(prev => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setPhases(DEFAULT_PHASES);
    setPerVisitFee(65);
    setPatientName("");
    setDiscount(0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <style jsx global>{`
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; }
          body * { display: none !important; }
          [data-print-area],
          [data-print-area] * { display: revert !important; visibility: visible !important; }
          [data-print-area] {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            padding: 24px 32px !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            font-size: 11px !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          [data-print-area] .bg-neuro-navy { background: #f8f8f8 !important; color: #1a1a2e !important; }
          [data-print-area] .text-white { color: #1a1a2e !important; }
          [data-print-area] .text-gray-300 { color: #666 !important; }
          [data-print-area] .p-6 { padding: 10px !important; }
          [data-print-area] .p-4 { padding: 8px !important; }
          [data-print-area] .space-y-6 > * + * { margin-top: 10px !important; }
          [data-print-area] .space-y-3 > * + * { margin-top: 4px !important; }
          [data-print-area] .mb-3 { margin-bottom: 4px !important; }
          [data-print-area] .mb-6 { margin-bottom: 8px !important; }
          [data-print-area] .pt-5 { padding-top: 8px !important; }
          [data-print-area] .gap-3 { gap: 4px !important; }
          [data-print-area] .gap-4 { gap: 6px !important; }
          [data-print-area] .text-2xl { font-size: 16px !important; }
          [data-print-area] .text-xl { font-size: 14px !important; }
          [data-print-area] .text-lg { font-size: 13px !important; }
          [data-print-area] .w-10 { width: 28px !important; height: 28px !important; }
          [data-print-area] .rounded-2xl { border-radius: 6px !important; }
          [data-print-area] .rounded-xl { border-radius: 6px !important; }
        }
      `}</style>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-black text-neuro-navy flex items-center gap-3">
            <Calculator className="w-7 h-7 text-neuro-orange" /> Care Plan Builder
          </h1>
          <p className="text-gray-500 text-sm mt-1">Build a care plan in 30 seconds. Show patients exactly what their investment looks like.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="px-3 py-2 text-gray-400 hover:text-neuro-navy text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-neuro-navy text-white text-xs font-bold rounded-lg hover:bg-neuro-navy/90 transition-colors flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print for Patient
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Name (optional) */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Patient Name (optional)</label>
            <input
              type="text"
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-neuro-orange transition-colors"
            />
          </div>

          {/* Per Visit Fee */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Per Visit Fee</label>
            <div className="mt-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input
                type="number"
                value={perVisitFee}
                onChange={e => setPerVisitFee(Number(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange transition-colors"
              />
            </div>
          </div>

          {/* Care Phases */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Care Phases</label>
            <div className="space-y-3">
              {phases.map((phase, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={phase.name}
                      onChange={e => updatePhase(i, 'name', e.target.value)}
                      className="font-bold text-sm text-neuro-navy bg-transparent focus:outline-none border-b border-transparent focus:border-neuro-orange w-40"
                    />
                    {phases.length > 1 && (
                      <button onClick={() => removePhase(i)} className="text-gray-300 hover:text-red-400 text-xs font-bold transition-colors">Remove</button>
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
                        onChange={e => updatePhase(i, 'visitsPerWeek', Number(e.target.value) || 1)}
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
                        onChange={e => updatePhase(i, 'weeks', Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold focus:outline-none focus:border-neuro-orange mt-1"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{phase.visitsPerWeek * phase.weeks} visits over {phase.weeks} weeks</p>
                </div>
              ))}
            </div>
            <button onClick={addPhase} className="mt-3 text-xs font-bold text-neuro-orange hover:underline">+ Add Phase</button>
          </div>

          {/* Advanced */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Advanced Options
          </button>
          {showAdvanced && (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Care Plan Discount %</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                  className="mt-1 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-neuro-orange"
                />
                <p className="text-[10px] text-gray-400 mt-1">Applied when patient commits to the full plan</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showPayment"
                  checked={showPaymentOptions}
                  onChange={e => setShowPaymentOptions(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="showPayment" className="text-xs font-bold text-gray-500">Show payment options on printout</label>
              </div>
            </div>
          )}
        </div>

        {/* Right: Output (printable) */}
        <div className="lg:col-span-3">
          <div ref={printRef} data-print-area className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-neuro-navy p-6 text-white print:!bg-white print:!text-neuro-navy print:!border-b print:!border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">Your Care Plan</h2>
                  {patientName && <p className="text-gray-300 print:text-gray-500 text-sm mt-0.5">Prepared for {patientName}</p>}
                </div>
                <Heart className="w-6 h-6 text-neuro-orange" />
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Phase Breakdown */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Your Journey</h3>
                <div className="space-y-3">
                  {phases.map((phase, i) => {
                    const phaseVisits = phase.visitsPerWeek * phase.weeks;
                    const phaseCost = phaseVisits * perVisitFee;
                    return (
                      <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-neuro-orange/10 flex items-center justify-center text-neuro-orange font-black text-sm flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-neuro-navy text-sm">{phase.name}</p>
                          <p className="text-gray-400 text-xs">{phase.visitsPerWeek}x per week for {phase.weeks} weeks</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-neuro-navy">{phaseVisits} visits</p>
                          <p className="text-gray-400 text-xs">${phaseCost.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Total Visits</span>
                  <span className="font-black text-neuro-navy">{totalVisits}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Duration</span>
                  <span className="font-black text-neuro-navy">{totalWeeks} weeks ({Math.round(totalWeeks / 4.3)} months)</span>
                </div>
                {discount > 0 && (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Subtotal</span>
                      <span className="text-gray-400 line-through">${grossTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-green-600 font-bold">Care Plan Discount ({discount}%)</span>
                      <span className="text-green-600 font-bold">-${discountAmount.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="font-bold text-neuro-navy">Total Investment</span>
                  <span className="text-2xl font-black text-neuro-navy">${netTotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 text-right mt-1">${perVisitEffective} per visit</p>
              </div>

              {/* Payment Options */}
              {showPaymentOptions && (
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Payment Options</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Pay in Full */}
                    <div className="border-2 border-neuro-orange rounded-xl p-4 relative">
                      <span className="absolute -top-2.5 left-3 bg-neuro-orange text-white text-[10px] font-black px-2 py-0.5 rounded-full">Best Value</span>
                      <p className="font-bold text-neuro-navy text-sm mt-1">Pay in Full</p>
                      <p className="text-xl font-black text-neuro-navy mt-1">${payInFullTotal.toLocaleString()}</p>
                      <p className="text-[10px] text-green-600 font-bold mt-1">
                        Save ${(netTotal - payInFullTotal).toLocaleString()}
                      </p>
                    </div>
                    {/* Monthly */}
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="font-bold text-neuro-navy text-sm">Monthly</p>
                      <p className="text-xl font-black text-neuro-navy mt-1">${paymentOptions[1].amount.toLocaleString()}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
                      <p className="text-[10px] text-gray-400 mt-1">{paymentOptions[1].note}</p>
                    </div>
                    {/* Bi-Weekly */}
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="font-bold text-neuro-navy text-sm">Bi-Weekly</p>
                      <p className="text-xl font-black text-neuro-navy mt-1">${paymentOptions[2].amount.toLocaleString()}<span className="text-xs text-gray-400 font-normal">/2wk</span></p>
                      <p className="text-[10px] text-gray-400 mt-1">{paymentOptions[2].note}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-[10px] text-gray-300">Your care plan is designed around your nervous system's specific needs. Consistency is key to lasting correction.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
