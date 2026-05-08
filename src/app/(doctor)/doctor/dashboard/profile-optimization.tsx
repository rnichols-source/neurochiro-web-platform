"use client";

import { useEffect, useState } from "react";
import { Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getAIProfileOptimization } from "./ai-actions";

export default function ProfileOptimization() {
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAIProfileOptimization().then(data => { setSuggestions(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading || !suggestions || suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-[#D66829]" />
        <h3 className="text-sm font-bold text-white">Profile Optimization</h3>
      </div>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="w-5 h-5 rounded-full bg-[#D66829]/10 text-[#D66829] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            <p className="text-white/50">{s}</p>
          </div>
        ))}
      </div>
      <Link href="/doctor/profile" className="text-xs font-bold text-[#D66829] hover:underline mt-3 inline-flex items-center gap-1">
        Edit Profile <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
