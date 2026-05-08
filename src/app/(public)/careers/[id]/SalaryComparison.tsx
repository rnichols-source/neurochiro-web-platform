"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  salaryMin: number | null;
  salaryMax: number | null;
  roleType: string | null;
  state: string | null;
}

export default function SalaryComparison({ salaryMin, salaryMax, roleType, state }: Props) {
  const [marketAvg, setMarketAvg] = useState<number | null>(null);

  useEffect(() => {
    if (!salaryMin) return;
    const params = new URLSearchParams();
    if (roleType) params.set("role_type", roleType);
    if (state) params.set("state", state);
    fetch(`/api/salaries?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.summary?.avg) setMarketAvg(d.summary.avg);
      })
      .catch(() => {});
  }, [salaryMin, roleType, state]);

  if (!salaryMin || !marketAvg) return null;

  const offerMid = Math.round(((salaryMin || 0) + (salaryMax || salaryMin)) / 2);
  const diff = offerMid - marketAvg;
  const pct = Math.round((diff / marketAvg) * 100);
  const isAbove = pct > 3;
  const isBelow = pct < -3;

  return (
    <div className={`rounded-xl p-4 border flex items-center gap-3 ${
      isAbove ? 'bg-green-50 border-green-200' : isBelow ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
    }`}>
      {isAbove ? (
        <TrendingUp className="w-5 h-5 text-green-600 shrink-0" />
      ) : isBelow ? (
        <TrendingDown className="w-5 h-5 text-red-600 shrink-0" />
      ) : (
        <Minus className="w-5 h-5 text-blue-600 shrink-0" />
      )}
      <div>
        <p className={`text-sm font-bold ${isAbove ? 'text-green-700' : isBelow ? 'text-red-700' : 'text-blue-700'}`}>
          {isAbove ? `${pct}% above` : isBelow ? `${Math.abs(pct)}% below` : 'At'} market average
        </p>
        <p className={`text-xs ${isAbove ? 'text-green-600' : isBelow ? 'text-red-600' : 'text-blue-600'}`}>
          Market avg for {roleType || 'this role'}{state ? ` in ${state}` : ''}: ${marketAvg.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
