"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getSeminars } from "@/app/(public)/seminars/actions";
import { STUDENT_CONFIG } from "@/config/students";
import { memberTicketPrice } from "@/lib/seminars/utm";

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
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-heading font-bold text-portal-ink">Seminars</h1>
        <p className="text-xs text-portal-ink-2 mt-1">
          Browse upcoming seminars, workshops, and CE events. Learn new techniques and connect with the community in person.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-portal-ink-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, city, or instructor..."
          className="w-full pl-12 pr-4 py-3.5 bg-[#f7f8fa] border border-[#e3e8ed] rounded-2xl text-sm text-portal-ink placeholder:text-portal-muted focus:border-[#D66829]/40 outline-none"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-6 h-6 border-2 border-[#e3e8ed] border-t-[#D66829] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-portal-ink-2">Loading seminars...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-[#e3e8ed]">
          <Calendar className="w-12 h-12 text-portal-ink-2 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-portal-ink mb-1">No upcoming seminars</h3>
          <p className="text-portal-ink-2 text-sm mb-4">Check back soon — new events are added regularly.</p>
          <a href="/seminars" className="text-sm font-bold text-[#D66829] hover:underline">Browse all public seminars</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((sem) => {
            const location = [sem.city, sem.country].filter(Boolean).join(", ");
            return (
              <div
                key={sem.id}
                className="bg-white border border-[#e3e8ed] p-6 rounded-2xl border border-[#e3e8ed] shadow-lg shadow-black/20 hover:border-[#D66829]/20 transition-all group flex flex-col"
              >
                <h3 className="font-bold text-lg text-portal-ink group-hover:text-[#D66829] transition-colors mb-2">
                  {sem.title}
                </h3>
                {Number(sem.price) > 0 ? (
                  <p className="text-sm text-portal-ink-2 mb-2">
                    Member price: ${memberTicketPrice({
                      price: Number(sem.price),
                      isMember: true,
                      discountPct: STUDENT_CONFIG.seminars.studentDiscountPct,
                    }).amount}
                  </p>
                ) : null}
                {sem.instructor_name && (
                  <p className="text-sm text-portal-ink-2 mb-3">with {sem.instructor_name}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-portal-ink-2 mb-4">
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
                    className="inline-block px-6 py-3 bg-[#D66829] text-white font-bold rounded-xl text-xs tracking-widest hover:bg-[#e8834a] shadow-lg shadow-[#D66829]/20 transition-colors"
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
      <div className="bg-white rounded-2xl border border-[#e3e8ed] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-8">
        <div>
          <p className="text-[13px] font-semibold text-portal-ink">Looking for more career tools?</p>
          <p className="text-xs text-portal-ink-2">Check your career pipeline for what to do next.</p>
        </div>
        <Link
          href="/student/roadmap"
          className="w-full sm:w-auto px-5 py-2.5 bg-[#f7f8fa] text-portal-ink-2 rounded-lg hover:text-portal-ink hover:bg-[#f7f8fa] text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          Career Pipeline <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
