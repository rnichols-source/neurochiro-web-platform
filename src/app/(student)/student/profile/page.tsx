"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
      <Loader2 className="w-8 h-8 text-neuro-orange animate-spin" />
    </div>
  );

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-neuro-orange/20 focus:border-neuro-orange outline-none transition-colors";

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-neuro-navy text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-heading font-black text-neuro-navy">Profile</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Personal Info</h2>
          <label className="block text-sm font-medium text-neuro-navy mb-1">Full Name</label>
          <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>

        {/* Education */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Education</h2>
          <div>
            <label className="block text-sm font-medium text-neuro-navy mb-1">School</label>
            <input className={inputClass} value={form.school} onChange={(e) => update("school", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neuro-navy mb-1">Graduation Year</label>
            <input className={inputClass} inputMode="numeric" value={form.gradYear} onChange={(e) => update("gradYear", e.target.value)} />
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Location</h2>
          <label className="block text-sm font-medium text-neuro-navy mb-1">City</label>
          <input className={inputClass} value={form.city} onChange={(e) => update("city", e.target.value)} />
        </div>

        {/* Interests */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Interests</h2>
          <label className="block text-sm font-medium text-neuro-navy mb-1">Clinical Interests</label>
          <input className={inputClass} placeholder="Pediatrics, Sports Performance" value={form.interests} onChange={(e) => update("interests", e.target.value)} />
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Skills</h2>
          <label className="block text-sm font-medium text-neuro-navy mb-1">Skills</label>
          <input className={inputClass} placeholder="Diversified, Activator, Dry Needling" value={form.skills} onChange={(e) => update("skills", e.target.value)} />
        </div>

        {/* Mentorship */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Mentorship</h2>
            <p className="text-sm font-medium text-neuro-navy">Looking for mentorship</p>
          </div>
          <button
            type="button"
            onClick={() => update("mentorship", !form.mentorship)}
            className={`w-11 h-6 rounded-full transition-colors relative ${form.mentorship ? "bg-neuro-orange" : "bg-gray-300"}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.mentorship ? "left-6" : "left-1"}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save
        </button>
      </form>
    </div>
  );
}
