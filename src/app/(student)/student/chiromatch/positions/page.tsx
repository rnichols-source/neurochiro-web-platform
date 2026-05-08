"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, DollarSign, GraduationCap, Loader2, ArrowRight, Heart } from "lucide-react";
import Link from "next/link";
import { getActiveCycleForStudent, getAvailablePositions } from "../actions";
import type { MatchPositionWithDoctor } from "@/types/chiromatch";

export default function BrowsePositionsPage() {
  const [positions, setPositions] = useState<MatchPositionWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getActiveCycleForStudent().then(async (cycle) => {
      if (cycle) {
        const data = await getAvailablePositions(cycle.id);
        setPositions(data);
      }
      setLoading(false);
    });
  }, []);

  const filtered = positions.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) ||
      p.doctor.clinic_name.toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q) ||
      (p.state || '').toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neuro-orange" /></div>;
  }

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/student/chiromatch" className="text-xs text-white/30 hover:text-neuro-orange transition-colors mb-4 inline-block">&larr; Back to ChiroMatch</Link>
        <h1 className="text-2xl font-bold text-white">Available Positions</h1>
        <p className="text-white/30 text-sm mt-1">{positions.length} position{positions.length !== 1 ? 's' : ''} in the current cycle</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, clinic, or location..."
          className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-neuro-orange"
        />
      </div>

      {/* Position Cards */}
      {filtered.length === 0 ? (
        <div className="bg-[#162231] rounded-2xl border border-white/[0.06] p-8 text-center">
          <p className="text-white/30 text-sm">No positions found. Check back as more doctors list positions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(pos => (
            <Link
              key={pos.id}
              href={`/student/chiromatch/positions/${pos.id}`}
              className="block bg-[#162231] rounded-2xl border border-white/[0.06] p-5 hover:border-neuro-orange/20 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {pos.doctor.photo_url ? (
                      <img src={pos.doctor.photo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-neuro-orange/10 flex items-center justify-center text-neuro-orange font-bold text-sm">
                        {pos.doctor.first_name?.[0]}{pos.doctor.last_name?.[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-white">{pos.title}</h3>
                      <p className="text-xs text-white/40">{pos.doctor.clinic_name} — Dr. {pos.doctor.first_name} {pos.doctor.last_name}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-white/30 mt-3">
                    {pos.city && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{pos.city}{pos.state ? `, ${pos.state}` : ''}</span>
                    )}
                    {pos.salary_min && (
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${pos.salary_min.toLocaleString()}{pos.salary_max ? ` – $${pos.salary_max.toLocaleString()}` : ''}</span>
                    )}
                    {pos.mentorship_offered && (
                      <span className="flex items-center gap-1 text-green-400"><GraduationCap className="w-3 h-3" />Mentorship</span>
                    )}
                    {pos.practice_type && (
                      <span className="text-white/20">{pos.practice_type}</span>
                    )}
                  </div>
                </div>

                <span className="text-neuro-orange text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 mt-2">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
