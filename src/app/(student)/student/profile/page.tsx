"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { US_STATES } from "@/lib/quiz/options";
import { TECHNIQUE_NAMES, YEAR_IN_SCHOOL_OPTIONS } from "@/lib/students/onboarding-fields";
import { getStudentProfile, updateStudentProfile } from "./actions";

const inputClass =
  "w-full min-h-11 px-4 py-3 bg-white border border-[#ECE8E1] rounded-xl text-sm text-[#15202B] placeholder:text-[#8a95a1] focus:border-[#D66829] focus:ring-2 focus:ring-[#D66829]/20 outline-none";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    name: "",
    school: "",
    yearInSchool: "",
    gradYear: "",
    city: "",
    state: "",
    techniques: [] as string[],
  });

  useEffect(() => {
    getStudentProfile().then((result) => {
      if (result.error) setError(result.error);
      if (result.profile) {
        setEmail(result.profile.email);
        setForm({
          name: result.profile.fullName || "",
          school: result.profile.school || "",
          yearInSchool: result.profile.yearInSchool || "",
          gradYear: result.profile.graduationYear ? String(result.profile.graduationYear) : "",
          city: result.profile.city || "",
          state: result.profile.state || "",
          techniques: result.profile.techniques || [],
        });
      }
      setLoading(false);
    });
  }, []);

  function update(key: "name" | "school" | "yearInSchool" | "gradYear" | "city" | "state", value: string) {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleTechnique(name: string) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      techniques: current.techniques.includes(name)
        ? current.techniques.filter((item) => item !== name)
        : [...current.techniques, name],
    }));
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const body = new FormData();
    body.append("full_name", form.name);
    body.append("school", form.school);
    body.append("yearInSchool", form.yearInSchool);
    body.append("gradYear", form.gradYear);
    body.append("city", form.city);
    body.append("state", form.state);
    for (const technique of form.techniques) body.append("techniques", technique);
    const result = await updateStudentProfile(body);
    if (result.error) setError(result.error);
    else setSaved(true);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-[#D66829] animate-spin" aria-label="Loading profile" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#15202B]">Profile</h1>
        <p className="text-sm text-[#3d4a57] mt-1">Doctors see your school, city, and techniques when you connect or apply.</p>
        {email ? <p className="text-sm text-[#8a95a1] mt-1">{email}</p> : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-[#D66829] bg-[#FCEBDF] px-4 py-3 text-sm font-semibold text-[#B4501A]">{error}</p>
      ) : null}
      {saved ? (
        <p role="status" className="rounded-xl border border-[#0E857A] bg-[#DCF1EE] px-4 py-3 text-sm font-semibold text-[#0A6159]">Profile saved.</p>
      ) : null}

      <form onSubmit={handleSave} className="space-y-4">
        <section className="bg-white rounded-2xl border border-[#ECE8E1] p-6 space-y-4">
          <h2 className="text-sm font-extrabold tracking-wide text-[#B4501A]">About you</h2>
          <label className="block text-sm font-semibold text-[#15202B]">
            Full name
            <input className={`${inputClass} mt-1.5`} value={form.name} onChange={(event) => update("name", event.target.value)} maxLength={100} required />
          </label>
          <label className="block text-sm font-semibold text-[#15202B]">
            Chiropractic school
            <input className={`${inputClass} mt-1.5`} value={form.school} onChange={(event) => update("school", event.target.value)} maxLength={200} required />
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
            <input className={`${inputClass} mt-1.5`} type="number" inputMode="numeric" min={2020} max={2040} value={form.gradYear} onChange={(event) => update("gradYear", event.target.value)} required />
          </label>
        </section>

        <section className="bg-white rounded-2xl border border-[#ECE8E1] p-6 space-y-4">
          <h2 className="text-sm font-extrabold tracking-wide text-[#1F4F8C]">Where you are</h2>
          <label className="block text-sm font-semibold text-[#15202B]">
            City
            <input className={`${inputClass} mt-1.5`} value={form.city} onChange={(event) => update("city", event.target.value)} maxLength={80} required />
          </label>
          <label className="block text-sm font-semibold text-[#15202B]">
            State
            <select className={`${inputClass} mt-1.5`} value={form.state} onChange={(event) => update("state", event.target.value)} required>
              <option value="">Choose a state</option>
              {US_STATES.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}
            </select>
          </label>
        </section>

        <section className="bg-white rounded-2xl border border-[#ECE8E1] p-6">
          <h2 className="text-sm font-extrabold tracking-wide text-[#5C3473] mb-3">Techniques</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Techniques">
            {TECHNIQUE_NAMES.map((name) => {
              const selected = form.techniques.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleTechnique(name)}
                  className={`min-h-11 px-4 py-2 rounded-full text-sm font-semibold border ${selected ? "bg-[#7A4A94] text-white border-[#7A4A94]" : "bg-[#F5F3EF] text-[#3d4a57] border-[#ECE8E1]"}`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </section>

        <button type="submit" disabled={saving} className="w-full min-h-11 rounded-lg bg-[#D66829] text-white font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
          Save profile
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-[#ECE8E1] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-[#3d4a57]">Billing and the monthly call stay in the menu.</p>
        <Link href="/student/billing" className="min-h-11 inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-[#1E2D3B] text-white text-sm font-semibold">
          Billing <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
