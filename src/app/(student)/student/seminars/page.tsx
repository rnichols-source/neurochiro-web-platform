"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getSeminars } from "@/app/(public)/seminars/actions";

export default function SeminarsPage() {
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getSeminars();
        setSeminars(data);
      } catch (e) {
        console.error("Failed to load seminars:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return seminars;
    const q = search.toLowerCase();
    return seminars.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.instructor_name?.toLowerCase().includes(q)
    );
  }, [seminars, search]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-heading font-bold text-white">Seminars</h1>
        <p className="text-xs text-white/35 mt-1">
          Browse upcoming seminars, workshops, and CE events. Learn new techniques and connect with the community in person.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, city, or instructor..."
          className="w-full pl-12 pr-4 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-white/20 focus:border-[#D66829]/40 outline-none"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-6 h-6 border-2 border-white/[0.08] border-t-[#D66829] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-white/40">Loading seminars...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#162231] rounded-2xl border border-dashed border-white/[0.08]">
          <Calendar className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-1">No upcoming seminars</h3>
          <p className="text-white/40 text-sm mb-4">Check back soon — new events are added regularly.</p>
          <a href="/seminars" className="text-sm font-bold text-[#D66829] hover:underline">Browse all public seminars</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((sem) => {
            const location = [sem.city, sem.country].filter(Boolean).join(", ");
            return (
              <div
                key={sem.id}
                className="bg-gradient-to-b from-[#1a2e40] to-[#162231] p-6 rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 hover:border-[#D66829]/20 transition-all group flex flex-col"
              >
                <h3 className="font-bold text-lg text-white group-hover:text-[#D66829] transition-colors mb-2">
                  {sem.title}
                </h3>
                {sem.instructor_name && (
                  <p className="text-sm text-white/40 mb-3">with {sem.instructor_name}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-white/35 mb-4">
                  {sem.dates && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {sem.dates}
                    </span>
                  )}
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {location}
                    </span>
                  )}
                </div>
                <div className="mt-auto pt-4">
                  <Link
                    href={`/seminars/${sem.id}`}
                    className="inline-block px-6 py-3 bg-[#D66829] text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-[#e8834a] shadow-lg shadow-[#D66829]/20 transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pipeline CTA */}
      <div className="bg-[#162231] rounded-2xl border border-white/[0.08] p-5 flex items-center justify-between mt-8">
        <div>
          <p className="text-[13px] font-semibold text-white">Looking for more career tools?</p>
          <p className="text-xs text-white/30">Check your career pipeline for what to do next.</p>
        </div>
        <Link
          href="/student/career-pipeline"
          className="px-5 py-2.5 bg-white/[0.06] text-white/60 rounded-lg hover:text-white hover:bg-white/[0.1] text-xs font-bold transition-colors flex items-center gap-2"
        >
          Career Pipeline <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
