"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

interface Props {
  salaryMin: number;
  salaryMax: number;
  roleType: string;
}

export default function SalaryInsight({ salaryMin, salaryMax, roleType }: Props) {
  const [marketAvg, setMarketAvg] = useState<number | null>(null);

  useEffect(() => {
    if (!salaryMin || salaryMin <= 0) { setMarketAvg(null); return; }
    const params = new URLSearchParams();
    if (roleType) params.set("role_type", roleType);
    fetch(`/api/salaries?${params}`)
      .then(r => r.json())
      .then(d => { if (d.summary?.avg) setMarketAvg(d.summary.avg); })
      .catch(() => {});
  }, [salaryMin, roleType]);

  if (!marketAvg || !salaryMin || salaryMin <= 0) return null;

  const offerMid = Math.round((salaryMin + (salaryMax || salaryMin)) / 2);
  const diff = offerMid - marketAvg;
  const pct = Math.round((diff / marketAvg) * 100);
  const isAbove = pct > 3;
  const isBelow = pct < -3;

  return (
    <div className={`rounded-xl p-3 border flex items-center gap-2 text-sm ${
      isAbove ? 'bg-green-50 border-green-200' : isBelow ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
    }`}>
      {isAbove ? (
        <TrendingUp className="w-4 h-4 text-green-600 shrink-0" />
      ) : isBelow ? (
        <TrendingDown className="w-4 h-4 text-amber-600 shrink-0" />
      ) : (
        <Minus className="w-4 h-4 text-blue-600 shrink-0" />
      )}
      <span className={`font-bold ${isAbove ? 'text-green-700' : isBelow ? 'text-amber-700' : 'text-blue-700'}`}>
        {isAbove ? `${pct}% above market` : isBelow ? `${Math.abs(pct)}% below market` : 'At market rate'}
      </span>
      <span className="text-gray-400 text-xs ml-auto">
        <BarChart3 className="w-3 h-3 inline mr-1" />
        Avg: ${marketAvg.toLocaleString()}
      </span>
    </div>
  );
}
