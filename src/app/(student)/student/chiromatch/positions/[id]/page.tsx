"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, DollarSign, GraduationCap, CheckCircle2, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPositionDetail } from "../../actions";
import type { MatchPositionWithDoctor } from "@/types/chiromatch";

export default function PositionDetailPage() {
  const { id } = useParams();
  const [position, setPosition] = useState<MatchPositionWithDoctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getPositionDetail(id as string).then(p => { setPosition(p); setLoading(false); });
    }
  }, [id]);

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;
  }

  if (!position) {
    return (
      <div className="p-10 text-center">
        <p className="text-white/30">Position not found.</p>
        <Link href="/student/chiromatch/positions" className="text-neuro-orange text-sm mt-4 inline-block">Back to positions</Link>
      </div>
    );
  }

  const doc = position.doctor;

  return (
    <div className="p-4 md:p-10 max-w-3xl mx-auto space-y-6">
      <Link href="/student/chiromatch/positions" className="text-xs text-white/30 hover:text-neuro-orange transition-colors inline-flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> All Positions
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6 md:p-8">
        <div className="flex items-start gap-4 mb-4">
          {doc.photo_url ? (
            <img src={doc.photo_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-neuro-orange/10 flex items-center justify-center text-neuro-orange font-bold text-xl">
              {doc.first_name?.[0]}{doc.last_name?.[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{position.title}</h1>
            <p className="text-white/40">{doc.clinic_name}</p>
            <p className="text-white/30 text-sm">Dr. {doc.first_name} {doc.last_name}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-white/40">
          {position.city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{position.city}{position.state ? `, ${position.state}` : ''}</span>}
          {position.salary_min && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />${position.salary_min.toLocaleString()}{position.salary_max ? ` – $${position.salary_max.toLocaleString()}` : ''}</span>}
          {position.compensation_type && <span className="capitalize">{position.compensation_type}</span>}
          {position.mentorship_offered && <span className="flex items-center gap-1 text-green-400"><GraduationCap className="w-4 h-4" />Mentorship Offered</span>}
        </div>
      </div>

      {/* Description */}
      {position.description && (
        <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-6">
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-3">About This Position</h2>
          <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{position.description}</p>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {position.benefits && position.benefits.length > 0 && (
          <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-5">
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Benefits</h3>
            <ul className="space-y-2">
              {position.benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {position.requirements && position.requirements.length > 0 && (
          <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-5">
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Requirements</h3>
            <ul className="space-y-2">
              {position.requirements.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neuro-orange shrink-0" /> {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Specialties */}
      {doc.specialties && doc.specialties.length > 0 && (
        <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-5">
          <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Practice Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {doc.specialties.map((s, i) => (
              <span key={i} className="px-3 py-1 bg-neuro-orange/10 text-neuro-orange text-xs font-bold rounded-lg">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-r from-neuro-orange/10 to-transparent rounded-2xl border border-neuro-orange/20 p-5 flex items-center justify-between">
        <div>
          <p className="text-white font-bold">Interested in this position?</p>
          <p className="text-white/30 text-sm">Add it to your rankings to be considered on Match Day.</p>
        </div>
        <Link
          href="/student/chiromatch/rankings"
          className="px-5 py-2.5 bg-neuro-orange text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-neuro-orange/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Add to Rankings
        </Link>
      </div>
    </div>
  );
}
