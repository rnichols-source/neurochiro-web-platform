"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, MapPin, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { saveStudentOnboarding } from "./actions";

const INTEREST_OPTIONS = [
  "Pediatrics",
  "Sports Performance",
  "Prenatal / Postnatal",
  "Neurology",
  "Rehabilitation",
  "Nutrition",
  "Upper Cervical",
  "Extremities",
  "Functional Medicine",
  "Practice Management",
];

export default function StudentWelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    school: "",
    gradYear: "",
    city: "",
    interests: [] as string[],
  });

  const update = (key: string, value: any) =>
    setForm((p) => ({ ...p, [key]: value }));

  const toggleInterest = (interest: string) => {
    setForm((p) => ({
      ...p,
      interests: p.interests.includes(interest)
        ? p.interests.filter((i) => i !== interest)
        : [...p.interests, interest],
    }));
  };

  const handleFinish = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append("school", form.school);
    fd.append("gradYear", form.gradYear);
    fd.append("city", form.city);
    fd.append("interests", form.interests.join(","));
    await saveStudentOnboarding(fd);
    router.push("/student/dashboard");
  };

  const handleSkip = () => {
    router.push("/student/dashboard");
  };

  const canAdvance =
    step === 0
      ? form.school.trim() && form.gradYear.trim()
      : step === 1
      ? true
      : true;

  const inputClass =
    "w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 focus:border-[#D66829]/40 focus:ring-1 focus:ring-[#D66829]/20 outline-none transition-colors";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-[#D66829]" : "bg-white/[0.08]"
              }`}
            />
          ))}
        </div>

        {/* Step 0: School */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-[#D66829]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-[#D66829]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Welcome to NeuroChiro
              </h1>
              <p className="text-white/40 text-sm">
                Let&apos;s set up your profile so we can match you with the right jobs and mentors.
              </p>
            </div>

            <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                  Chiropractic School
                </label>
                <input
                  className={inputClass}
                  value={form.school}
                  onChange={(e) => update("school", e.target.value)}
                  placeholder="e.g. Life University"
                  maxLength={200}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                  Expected Graduation Year
                </label>
                <input
                  className={inputClass}
                  type="number"
                  min="2024"
                  max="2035"
                  value={form.gradYear}
                  onChange={(e) => update("gradYear", e.target.value)}
                  placeholder="e.g. 2027"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-[#D66829]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-[#D66829]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Where are you based?
              </h1>
              <p className="text-white/40 text-sm">
                We&apos;ll match you with jobs and mentors near you.
              </p>
            </div>

            <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6">
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                City
              </label>
              <input
                className={inputClass}
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="e.g. Atlanta, GA"
                maxLength={100}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-[#D66829]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-[#D66829]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                What interests you?
              </h1>
              <p className="text-white/40 text-sm">
                Pick as many as you want. This helps us personalize your experience.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const selected = form.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all border ${
                      selected
                        ? "bg-[#D66829] text-white border-[#D66829] shadow-lg shadow-[#D66829]/20"
                        : "bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 space-y-3">
          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance}
              className="w-full py-3.5 bg-[#D66829] text-white font-semibold rounded-lg hover:bg-[#e8834a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#D66829]/20"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full py-3.5 bg-[#D66829] text-white font-semibold rounded-lg hover:bg-[#e8834a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#D66829]/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Setting up...
                </>
              ) : (
                <>
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          <button
            onClick={handleSkip}
            className="w-full py-2.5 text-white/30 text-sm hover:text-white/50 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
