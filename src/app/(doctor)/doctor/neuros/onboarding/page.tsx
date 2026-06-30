"use client";

import { useState, useEffect } from "react";
import { Check, ArrowRight, ArrowLeft, Upload, Plus, X, Trash2 } from "lucide-react";
import { loadPracticeConfig, savePracticeConfig, markOnboardingComplete, loadDoctorInfo } from "./actions";
import { useRouter } from "next/navigation";

const STEPS = [
  { num: 1, label: "Practice Info" },
  { num: 2, label: "Fee Schedules" },
  { num: 3, label: "Supplements" },
  { num: 4, label: "Branding" },
  { num: 5, label: "Confirmation" },
];

const DEFAULT_PAYERS = [
  { code: "BCBS", name: "Blue Cross Blue Shield", enabled: false },
  { code: "AETNA", name: "Aetna", enabled: false },
  { code: "CIGNA", name: "Cigna", enabled: false },
  { code: "UNITED", name: "United Healthcare", enabled: false },
  { code: "MEDICARE", name: "Medicare", enabled: false },
  { code: "CASH", name: "Cash / Self-Pay", enabled: true },
];

const DEFAULT_SUPPLEMENTS = [
  { name: "Omega-3 Fish Oil", price: 3500, enabled: true },
  { name: "Vitamin D3 (5000 IU)", price: 2200, enabled: true },
  { name: "Magnesium Glycinate", price: 2800, enabled: true },
  { name: "Probiotics (50B CFU)", price: 4200, enabled: false },
  { name: "Turmeric / Curcumin", price: 3200, enabled: false },
  { name: "B-Complex", price: 2400, enabled: false },
  { name: "Collagen Peptides", price: 3800, enabled: false },
  { name: "CBD Oil (1000mg)", price: 6500, enabled: false },
];

interface PracticeConfig {
  practice_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  provider_npi: string;
  default_visit_fee: number;
  insurance_profiles: typeof DEFAULT_PAYERS;
  supplement_catalog: typeof DEFAULT_SUPPLEMENTS;
  practice_logo_url: string;
  practice_colors: { primary: string; secondary: string; accent: string };
}

export default function NeurOSOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PracticeConfig>({
    practice_name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    provider_npi: "",
    default_visit_fee: 6500,
    insurance_profiles: DEFAULT_PAYERS,
    supplement_catalog: DEFAULT_SUPPLEMENTS,
    practice_logo_url: "",
    practice_colors: { primary: "#1E2D3B", secondary: "#D66829", accent: "#F5F3EF" },
  });

  useEffect(() => {
    Promise.all([loadPracticeConfig(), loadDoctorInfo()]).then(([existing, doctor]) => {
      if (existing) {
        setConfig(prev => ({
          ...prev,
          practice_name: existing.practice_name || prev.practice_name,
          address: existing.address || prev.address,
          city: existing.city || prev.city,
          state: existing.state || prev.state,
          zip: existing.zip || prev.zip,
          phone: existing.phone || prev.phone,
          provider_npi: existing.provider_npi || prev.provider_npi,
          default_visit_fee: existing.default_visit_fee || prev.default_visit_fee,
          insurance_profiles: (existing.insurance_profiles as any) || prev.insurance_profiles,
          supplement_catalog: (existing.supplement_catalog as any) || prev.supplement_catalog,
          practice_logo_url: existing.practice_logo_url || prev.practice_logo_url,
          practice_colors: (existing.practice_colors as any) || prev.practice_colors,
        }));
      }
      if (doctor && !existing?.practice_name) {
        setConfig(prev => ({
          ...prev,
          practice_name: doctor.clinic_name || "",
          address: doctor.address || "",
          city: doctor.city || "",
          state: doctor.state || "",
          phone: doctor.phone || "",
        }));
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await savePracticeConfig(config);
    setSaving(false);
  };

  const handleComplete = async () => {
    setSaving(true);
    await savePracticeConfig(config);
    await markOnboardingComplete();
    setSaving(false);
    router.push("/doctor/neuros?setup=complete");
  };

  const updateField = (field: keyof PracticeConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const togglePayer = (index: number) => {
    const updated = [...config.insurance_profiles];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    updateField("insurance_profiles", updated);
  };

  const toggleSupplement = (index: number) => {
    const updated = [...config.supplement_catalog];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    updateField("supplement_catalog", updated);
  };

  const updateSupplementPrice = (index: number, price: number) => {
    const updated = [...config.supplement_catalog];
    updated[index] = { ...updated[index], price };
    updateField("supplement_catalog", updated);
  };

  const addSupplement = () => {
    updateField("supplement_catalog", [...config.supplement_catalog, { name: "", price: 0, enabled: true }]);
  };

  const removeSupplement = (index: number) => {
    updateField("supplement_catalog", config.supplement_catalog.filter((_, i) => i !== index));
  };

  const updateSupplementName = (index: number, name: string) => {
    const updated = [...config.supplement_catalog];
    updated[index] = { ...updated[index], name };
    updateField("supplement_catalog", updated);
  };

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-[#1E2D3B] mb-2">Practice Setup</h1>
      <p className="text-sm text-gray-500 mb-6">Configure NeurOS for your practice. This information is used across all your tools.</p>

      {/* Step tabs */}
      <div className="flex gap-0 bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        {STEPS.map((s) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`flex-1 py-3 text-xs font-bold text-center transition-all border-r border-gray-200 last:border-r-0 ${
              step === s.num ? "bg-[#1E2D3B] text-white" :
              s.num < step ? "bg-green-500 text-white" : "text-gray-400"
            }`}
          >
            {s.num < step ? <Check className="w-3 h-3 inline mr-1" /> : null}
            {s.label}
          </button>
        ))}
      </div>

      {/* Step 1: Practice Info */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#1E2D3B]">Practice Information</h2>
          <div>
            <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Practice Name *</label>
            <input value={config.practice_name} onChange={e => updateField("practice_name", e.target.value)}
              className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" placeholder="e.g., AlignLife Chiropractic" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Phone</label>
              <input value={config.phone} onChange={e => updateField("phone", e.target.value)}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">NPI Number</label>
              <input value={config.provider_npi} onChange={e => updateField("provider_npi", e.target.value)}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" placeholder="1234567890" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Street Address</label>
            <input value={config.address} onChange={e => updateField("address", e.target.value)}
              className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">City</label>
              <input value={config.city} onChange={e => updateField("city", e.target.value)}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">State</label>
              <input value={config.state} onChange={e => updateField("state", e.target.value)}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">ZIP</label>
              <input value={config.zip} onChange={e => updateField("zip", e.target.value)}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Default Visit Fee (Cash)</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-400">$</span>
              <input type="number" value={config.default_visit_fee / 100} onChange={e => updateField("default_visit_fee", Math.round(parseFloat(e.target.value || "0") * 100))}
                className="w-32 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" step="0.01" />
              <span className="text-xs text-gray-400">per visit</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Fee Schedules */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#1E2D3B]">Insurance Payers</h2>
          <p className="text-sm text-gray-500">Select the insurance carriers you accept. NeurOS will use these for care plan billing calculations.</p>
          <div className="space-y-2">
            {config.insurance_profiles.map((payer, i) => (
              <button key={payer.code} onClick={() => togglePayer(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  payer.enabled ? "border-[#1E2D3B] bg-[#1E2D3B]/5" : "border-gray-200"
                }`}>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                  payer.enabled ? "bg-[#1E2D3B] border-[#1E2D3B]" : "border-gray-300"
                }`}>
                  {payer.enabled && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <span className="text-sm font-bold text-[#1E2D3B]">{payer.name}</span>
                  <span className="text-xs text-gray-400 ml-2">({payer.code})</span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">Fee schedules for selected payers will be pre-loaded from our database. You can customize individual CPT code rates during your onboarding call with Dr. Ray.</p>
        </div>
      )}

      {/* Step 3: Supplements */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#1E2D3B]">Supplement Catalog</h2>
          <p className="text-sm text-gray-500">These supplements will appear in your care plans. Toggle on the ones you sell, adjust prices to match your retail pricing.</p>
          <div className="space-y-2">
            {config.supplement_catalog.map((supp, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                supp.enabled ? "border-[#1E2D3B] bg-[#1E2D3B]/5" : "border-gray-200"
              }`}>
                <button onClick={() => toggleSupplement(i)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                    supp.enabled ? "bg-[#1E2D3B] border-[#1E2D3B]" : "border-gray-300"
                  }`}>
                  {supp.enabled && <Check className="w-3 h-3 text-white" />}
                </button>
                <input value={supp.name} onChange={e => updateSupplementName(i, e.target.value)}
                  className="flex-1 text-sm font-semibold text-[#1E2D3B] bg-transparent outline-none" placeholder="Supplement name" />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">$</span>
                  <input type="number" value={(supp.price / 100).toFixed(2)} onChange={e => updateSupplementPrice(i, Math.round(parseFloat(e.target.value || "0") * 100))}
                    className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-right outline-none focus:border-[#1E2D3B]" step="0.01" />
                </div>
                <button onClick={() => removeSupplement(i)} className="text-gray-300 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addSupplement} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">
            <Plus className="w-4 h-4" /> Add Supplement
          </button>
        </div>
      )}

      {/* Step 4: Branding */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#1E2D3B]">Practice Branding</h2>
          <p className="text-sm text-gray-500">Your logo and colors appear on care plans, scan reports, and all patient-facing documents.</p>
          <div>
            <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Practice Logo URL</label>
            <input value={config.practice_logo_url} onChange={e => updateField("practice_logo_url", e.target.value)}
              className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none" placeholder="https://your-site.com/logo.png" />
            <p className="text-xs text-gray-400 mt-1">Enter a direct URL to your logo image, or upload one during your onboarding call.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Primary Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={config.practice_colors.primary} onChange={e => updateField("practice_colors", { ...config.practice_colors, primary: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer" />
                <input value={config.practice_colors.primary} onChange={e => updateField("practice_colors", { ...config.practice_colors, primary: e.target.value })}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-mono outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Secondary Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={config.practice_colors.secondary} onChange={e => updateField("practice_colors", { ...config.practice_colors, secondary: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer" />
                <input value={config.practice_colors.secondary} onChange={e => updateField("practice_colors", { ...config.practice_colors, secondary: e.target.value })}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-mono outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#1E2D3B] uppercase tracking-wider">Accent Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={config.practice_colors.accent} onChange={e => updateField("practice_colors", { ...config.practice_colors, accent: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer" />
                <input value={config.practice_colors.accent} onChange={e => updateField("practice_colors", { ...config.practice_colors, accent: e.target.value })}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-mono outline-none" />
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
            <div style={{ background: config.practice_colors.primary }} className="px-6 py-4 flex items-center gap-3">
              {config.practice_logo_url && <img src={config.practice_logo_url} alt="Logo" className="h-8 w-auto" />}
              <span className="text-white font-bold text-sm">{config.practice_name || "Your Practice Name"}</span>
            </div>
            <div style={{ background: config.practice_colors.accent }} className="px-6 py-3">
              <span style={{ color: config.practice_colors.secondary }} className="text-sm font-bold">Care Plan Preview</span>
              <p className="text-xs text-gray-600 mt-1">This is how your care plans will look with your branding.</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-black text-[#1E2D3B]">Your NeurOS Is Ready</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">Your practice is configured. You can always update these settings later from Practice Setup.</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Practice</span><span className="font-bold text-[#1E2D3B]">{config.practice_name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-bold text-[#1E2D3B]">{config.city}, {config.state}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Visit Fee</span><span className="font-bold text-[#1E2D3B]">{formatCents(config.default_visit_fee)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Insurance Payers</span><span className="font-bold text-[#1E2D3B]">{config.insurance_profiles.filter(p => p.enabled).length} configured</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Supplements</span><span className="font-bold text-[#1E2D3B]">{config.supplement_catalog.filter(s => s.enabled).length} active</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Branding</span><span className="font-bold text-[#1E2D3B]">{config.practice_logo_url ? "Logo uploaded" : "No logo yet"}</span></div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <button onClick={() => { handleSave(); setStep(step - 1); }}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold text-[#1E2D3B] hover:bg-gray-50">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}

        {step < 5 ? (
          <button onClick={() => { handleSave(); setStep(step + 1); }}
            className="flex items-center gap-2 px-6 py-3 bg-[#1E2D3B] rounded-xl text-sm font-bold text-white hover:bg-[#2a3f52]">
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleComplete} disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Launch NeurOS"} <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
