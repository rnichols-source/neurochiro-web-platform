"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Calendar } from "lucide-react";
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
        <h1 className="text-2xl font-heading font-black text-neuro-navy">Seminars</h1>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, city, or instructor..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 shadow-sm"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-neuro-orange rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading seminars...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neuro-navy mb-1">No upcoming seminars</h3>
          <p className="text-gray-400 text-sm mb-4">Check back soon — new events are added regularly.</p>
          <a href="/seminars" className="text-sm font-bold text-neuro-orange hover:underline">Browse all public seminars</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((sem) => {
            const location = [sem.city, sem.country].filter(Boolean).join(", ");
            return (
              <div
                key={sem.id}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col"
              >
                <h3 className="font-bold text-lg text-neuro-navy group-hover:text-neuro-orange transition-colors mb-2">
                  {sem.title}
                </h3>
                {sem.instructor_name && (
                  <p className="text-sm text-gray-500 mb-3">with {sem.instructor_name}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-4">
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
                    className="inline-block px-6 py-3 bg-neuro-navy text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-neuro-navy/90 transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
