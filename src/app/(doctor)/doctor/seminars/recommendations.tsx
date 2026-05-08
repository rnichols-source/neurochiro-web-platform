"use client";

import { useEffect, useState } from "react";
import { Sparkles, MapPin, Calendar, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getRecommendedSeminars } from "./actions";

export default function SeminarRecommendations() {
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendedSeminars().then((data) => { setSeminars(data); setLoading(false); });
  }, []);

  if (loading || seminars.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-50 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-neuro-orange" />
        <h2 className="font-heading font-black text-neuro-navy">Recommended For You</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {seminars.slice(0, 3).map((sem) => (
          <Link
            key={sem.id}
            href={`/seminars/${sem.id}`}
            className="block p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-neuro-navy text-sm truncate group-hover:text-neuro-orange transition-colors">{sem.title}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                  {sem.dates && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{sem.dates}</span>}
                  {sem.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{sem.city}</span>}
                  {sem.ce_hours && <span className="flex items-center gap-1 text-blue-500"><Award className="w-3 h-3" />{sem.ce_hours} CE</span>}
                </div>
              </div>
              {sem.matchScore > 0 && (
                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-200 shrink-0">
                  {sem.matchScore}% match
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
      <Link href="/seminars" className="block p-3 text-center text-xs font-bold text-neuro-orange hover:bg-neuro-orange/5 transition-colors">
        View All Seminars <ArrowRight className="w-3 h-3 inline" />
      </Link>
    </div>
  );
}
