"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { getStudentProfile, updateStudentProfile } from "./actions";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    school: "",
    gradYear: "",
    city: "",
    interests: "",
    skills: "",
    mentorship: false,
  });

  useEffect(() => {
    getStudentProfile().then((data) => {
      if (data) {
        setForm({
          name: data.full_name || "",
          school: data.school || "",
          gradYear: data.graduation_year?.toString() || "",
          city: data.location_city || "",
          interests: (data.interests || []).join(", "),
          skills: (data.skills || []).join(", "),
          mentorship: data.is_looking_for_mentorship || false,
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("full_name", form.name);
      fd.append("school", form.school);
      fd.append("gradYear", form.gradYear);
      fd.append("location_city", form.city);
      fd.append("interests", form.interests);
      fd.append("skills", form.skills);
      fd.append("is_looking_for_mentorship", form.mentorship.toString());
      await updateStudentProfile(fd);
      setToast("Profile saved");
      setTimeout(() => setToast(null), 2500);
    } catch {
      setToast("Error saving profile");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof typeof form, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }));

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-[#D66829] animate-spin" />
    </div>
  );

  const inputClass =
    "w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:border-[#D66829]/40 focus:ring-1 focus:ring-[#D66829]/20 outline-none transition-colors";

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#D66829] text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-[#D66829]/20">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-[#D66829]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-xs text-white/35">
            Powers job matching, mentor discovery, and your Career Readiness Score.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Personal Info */}
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-4">Personal Info</h2>
          <label className="block text-[12px] font-medium text-white/60 mb-1.5">Full Name <span className="text-[#D66829]">*</span></label>
          <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>

        {/* Education */}
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6 space-y-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-2">Education</h2>
          <div>
            <label className="block text-[12px] font-medium text-white/60 mb-1.5">School <span className="text-[#D66829]">*</span></label>
            <input className={inputClass} value={form.school} onChange={(e) => update("school", e.target.value)} />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-white/60 mb-1.5">Graduation Year <span className="text-[#D66829]">*</span></label>
            <input className={inputClass} type="number" min="2020" max="2035" value={form.gradYear} onChange={(e) => update("gradYear", e.target.value)} placeholder="e.g. 2027" />
          </div>
        </div>

        {/* Location */}
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-4">Location</h2>
          <label className="block text-[12px] font-medium text-white/60 mb-1.5">City</label>
          <p className="text-[11px] text-white/25 mb-2">Used to match you with nearby jobs and mentors.</p>
          <input className={inputClass} value={form.city} onChange={(e) => update("city", e.target.value)} />
        </div>

        {/* Interests */}
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-4">Interests</h2>
          <label className="block text-[12px] font-medium text-white/60 mb-1.5">Clinical Interests</label>
          <p className="text-[11px] text-white/25 mb-2">Comma-separated. Matches you with jobs and mentors who share these interests.</p>
          <input className={inputClass} placeholder="Pediatrics, Sports Performance" value={form.interests} onChange={(e) => update("interests", e.target.value)} />
        </div>

        {/* Skills */}
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-4">Skills</h2>
          <label className="block text-[12px] font-medium text-white/60 mb-1.5">Skills</label>
          <p className="text-[11px] text-white/25 mb-2">Comma-separated techniques you know. Helps employers see what you bring to their practice.</p>
          <input className={inputClass} placeholder="Diversified, Activator, Dry Needling" value={form.skills} onChange={(e) => update("skills", e.target.value)} />
        </div>

        {/* Mentorship */}
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829]">Mentorship</h2>
              <p className="text-xs text-white/35 mt-1">Are you looking for a mentor?</p>
            </div>
            <button
              type="button"
              onClick={() => update("mentorship", !form.mentorship)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.mentorship ? 'bg-[#D66829]' : 'bg-white/[0.08]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.mentorship ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-[#D66829] text-white font-semibold rounded-lg hover:bg-[#e8834a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#D66829]/20"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Profile
        </button>
      </form>

      {/* Pipeline CTA */}
      <div className="bg-[#162231] rounded-2xl border border-white/[0.08] p-5 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-white">Profile updated?</p>
          <p className="text-xs text-white/30">See how it affects your Career Readiness Score.</p>
        </div>
        <Link
          href="/student/dashboard"
          className="px-5 py-2.5 bg-white/[0.06] text-white/60 rounded-lg text-xs font-semibold hover:text-white hover:bg-white/[0.1] transition-all flex items-center gap-2"
        >
          Dashboard <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
