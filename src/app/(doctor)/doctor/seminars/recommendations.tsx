"use client";

import { useEffect, useState } from "react";
import { MapPin, Calendar, Award } from "lucide-react";
import Link from "next/link";
import { getRecommendedSeminars } from "./actions";

export default function SeminarRecommendations({ initial }: { initial?: any[] }) {
  const [seminars, setSeminars] = useState<any[]>(initial || []);
  const [loading, setLoading] = useState(initial == null);

  useEffect(() => {
    if (initial) return;
    getRecommendedSeminars().then((data) => {
      setSeminars(data);
      setLoading(false);
    });
  }, [initial]);

  if (loading) return null;

  if (seminars.length === 0) {
    return (
      <Link href="/seminars" className="inline-flex items-center min-h-11 text-sm font-bold text-portal-accent">
        Browse all seminars →
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-portal-border overflow-hidden">
      <div className="px-4 py-3 border-b border-portal-border">
        <h2 className="text-lg font-bold text-portal-ink">Recommended for you</h2>
      </div>
      <div className="divide-y divide-portal-border">
        {seminars.map((sem) => (
          <Link
            key={sem.id}
            href={`/seminars/${sem.id}`}
            className="block px-4 py-3 hover:bg-portal-surface transition-colors"
          >
            <p className="font-bold text-portal-ink">{sem.title}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-portal-ink-2">
              {sem.dates ? (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4" aria-hidden />
                  {sem.dates}
                </span>
              ) : null}
              {sem.city ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" aria-hidden />
                  {sem.city}
                </span>
              ) : null}
            </div>
            {Array.isArray(sem.chips) && sem.chips.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {sem.chips.map((chip: string) => (
                  <span key={chip} className="inline-flex items-center gap-1 rounded-full bg-portal-surface px-2 py-1 text-sm text-portal-ink">
                    {chip.includes("CE") ? <Award className="w-3.5 h-3.5" aria-hidden /> : null}
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </Link>
        ))}
      </div>
      <Link href="/seminars" className="flex items-center min-h-11 px-4 text-sm font-bold text-portal-accent">
        Browse all seminars →
      </Link>
    </div>
  );
}
