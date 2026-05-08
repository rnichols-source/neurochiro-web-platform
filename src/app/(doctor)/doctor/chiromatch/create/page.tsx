"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createMatchPosition } from "../actions";

const PRACTICE_TYPES = ["Solo Practice", "Group Practice", "Multi-Disciplinary", "Pediatric Focus", "Sports Performance", "Family Wellness", "Neurological Focus"];

export default function CreateMatchPositionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await createMatchPosition({
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      compensation_type: fd.get("compensation_type") as string,
      salary_min: fd.get("salary_min") ? parseInt(fd.get("salary_min") as string) : null,
      salary_max: fd.get("salary_max") ? parseInt(fd.get("salary_max") as string) : null,
      benefits: fd.get("benefits") as string,
      requirements: fd.get("requirements") as string,
      city: fd.get("city") as string,
      state: fd.get("state") as string,
      practice_type: fd.get("practice_type") as string,
      mentorship_offered: fd.get("mentorship_offered") === "on",
    });
    if (result.error) { setError(result.error); setLoading(false); return; }
    router.push("/doctor/chiromatch");
  }

  return (
    <div className="p-4 md:p-10 max-w-2xl mx-auto">
      <Link href="/doctor/chiromatch" className="text-xs text-white/30 hover:text-neuro-orange transition-colors mb-6 inline-flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Back to ChiroMatch
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">Create Match Position</h1>
      <p className="text-white/30 text-sm mb-8">This position will be listed in the current ChiroMatch cycle for students to rank.</p>

      <form onSubmit={handleSubmit} className="bg-[#162231] rounded-2xl border border-white/[0.06] p-6 space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Position Title</label>
          <input name="title" required placeholder="e.g., Associate Doctor — Full Time" className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Description</label>
          <textarea name="description" rows={4} placeholder="Describe the role, your practice philosophy, and what makes this opportunity unique..." className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm resize-none focus:outline-none focus:border-neuro-orange" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">City</label>
            <input name="city" className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">State</label>
            <input name="state" placeholder="e.g., GA" className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Practice Type</label>
          <select name="practice_type" className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange">
            <option value="">Select</option>
            {PRACTICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Compensation Type</label>
          <select name="compensation_type" className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange">
            <option value="salary">Salary</option>
            <option value="production">Production-Based</option>
            <option value="hybrid">Hybrid (Base + Production)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Salary Min</label>
            <input name="salary_min" type="number" placeholder="60000" className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Salary Max</label>
            <input name="salary_max" type="number" placeholder="95000" className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Benefits (comma-separated)</label>
          <input name="benefits" placeholder="Health Insurance, CE Allowance, PTO, Malpractice Coverage" className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Requirements (comma-separated)</label>
          <input name="requirements" placeholder="DC License, Technique proficiency, 1+ year experience" className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-neuro-orange" />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input name="mentorship_offered" type="checkbox" className="w-4 h-4 rounded border-white/20 text-neuro-orange focus:ring-neuro-orange bg-white/[0.04]" />
          <span className="text-sm text-white/60">Mentorship offered with this position</span>
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="w-full py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Match Position"}
        </button>
      </form>
    </div>
  );
}
