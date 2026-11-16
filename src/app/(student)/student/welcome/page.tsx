"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { US_STATES } from "@/lib/quiz/options";
import { TECHNIQUE_NAMES, YEAR_IN_SCHOOL_OPTIONS } from "@/lib/students/onboarding-fields";
import { saveStudentOnboarding } from "./actions";

const inputClass =
  "w-full min-h-11 px-4 py-3 bg-white border border-[#ECE8E1] rounded-xl text-sm text-[#15202B] placeholder:text-[#8a95a1] focus:border-[#D66829] focus:ring-2 focus:ring-[#D66829]/20 outline-none";

export default function StudentWelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    school: "",
    yearInSchool: "",
    gradYear: "",
    city: "",
    state: "",
    techniques: [] as string[],
  });

  function update(key: "school" | "yearInSchool" | "gradYear" | "city" | "state", value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleTechnique(name: string) {
    setForm((current) => ({
      ...current,
      techniques: current.techniques.includes(name)
        ? current.techniques.filter((item) => item !== name)
        : [...current.techniques, name],
    }));
  }

  const canAdvance =
    step === 0
      ? form.school.trim().length >= 2 && form.yearInSchool && form.gradYear.trim().length === 4
      : step === 1
        ? form.city.trim().length >= 2 && form.state
        : form.techniques.length > 0;

  async function handleFinish() {
    setSaving(true);
    setError(null);
    const body = new FormData();
    body.append("school", form.school);
    body.append("yearInSchool", form.yearInSchool);
    body.append("gradYear", form.gradYear);
    body.append("city", form.city);
    body.append("state", form.state);
    for (const technique of form.techniques) body.append("techniques", technique);
    const result = await saveStudentOnboarding(body);
    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    router.push("/student/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="flex gap-1.5 mb-8" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <div key={item} className={`h-1 flex-1 rounded-full ${item <= step ? "bg-[#D66829]" : "bg-[#ECE8E1]"}`} />
          ))}
        </div>
        <p className="sr-only">Step {step + 1} of 3</p>

        {error ? (
          <p role="alert" className="mb-4 rounded-xl border border-[#D66829] bg-[#FCEBDF] px-4 py-3 text-sm font-semibold text-[#B4501A]">
            {error}
          </p>
        ) : null}

        {step === 0 ? (
          <section className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#15202B] mb-2">Welcome to NeuroChiro</h1>
              <p className="text-sm text-[#3d4a57]">Your school and class year help doctors and the monthly call know where you are.</p>
            </div>
            <div className="bg-white border border-[#ECE8E1] rounded-2xl p-6 space-y-4">
              <label className="block text-sm font-semibold text-[#15202B]">
                Chiropractic school
                <input className={`${inputClass} mt-1.5`} value={form.school} onChange={(event) => update("school", event.target.value)} placeholder="Life University" maxLength={200} autoFocus required />
              </label>
              <label className="block text-sm font-semibold text-[#15202B]">
                Current trimester
                <select className={`${inputClass} mt-1.5`} value={form.yearInSchool} onChange={(event) => update("yearInSchool", event.target.value)} required>
                  <option value="">Choose one</option>
                  {YEAR_IN_SCHOOL_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#15202B]">
                Graduation year
                <input className={`${inputClass} mt-1.5`} type="number" inputMode="numeric" min={2020} max={2040} value={form.gradYear} onChange={(event) => update("gradYear", event.target.value)} placeholder="2028" required />
              </label>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#15202B] mb-2">Where are you based?</h1>
              <p className="text-sm text-[#3d4a57]">City and state are used for associateships and doctors near you.</p>
            </div>
            <div className="bg-white border border-[#ECE8E1] rounded-2xl p-6 space-y-4">
              <label className="block text-sm font-semibold text-[#15202B]">
                City
                <input className={`${inputClass} mt-1.5`} value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="Marietta" maxLength={80} autoFocus required />
              </label>
              <label className="block text-sm font-semibold text-[#15202B]">
                State
                <select className={`${inputClass} mt-1.5`} value={form.state} onChange={(event) => update("state", event.target.value)} required>
                  <option value="">Choose a state</option>
                  {US_STATES.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}
                </select>
              </label>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#15202B] mb-2">Which techniques interest you?</h1>
              <p className="text-sm text-[#3d4a57]">Pick every technique you want to learn or already use.</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Techniques">
              {TECHNIQUE_NAMES.map((name) => {
                const selected = form.techniques.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleTechnique(name)}
                    className={`min-h-11 px-4 py-2 rounded-full text-sm font-semibold border ${selected ? "bg-[#D66829] text-white border-[#D66829]" : "bg-white text-[#3d4a57] border-[#ECE8E1]"}`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="mt-8 flex gap-3">
          {step > 0 ? (
            <button type="button" onClick={() => { setError(null); setStep(step - 1); }} className="min-h-11 px-4 rounded-lg border border-[#ECE8E1] bg-white text-sm font-semibold text-[#15202B]">
              Back
            </button>
          ) : null}
          {step < 2 ? (
            <button type="button" onClick={() => setStep(step + 1)} disabled={!canAdvance} className="min-h-11 flex-1 rounded-lg bg-[#D66829] text-white text-sm font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2">
              Continue <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button type="button" onClick={handleFinish} disabled={saving || !canAdvance} className="min-h-11 flex-1 rounded-lg bg-[#D66829] text-white text-sm font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="w-4 h-4" aria-hidden="true" />}
              {saving ? "Saving" : "Save and continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
