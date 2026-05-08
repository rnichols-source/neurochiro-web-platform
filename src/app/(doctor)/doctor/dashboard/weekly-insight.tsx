"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import { getAIWeeklyInsight } from "./ai-actions";

export default function WeeklyInsight() {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAIWeeklyInsight().then(text => { setInsight(text); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-neuro-orange/5 to-white rounded-2xl border border-neuro-orange/20 p-5">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-neuro-orange animate-spin" />
          <span className="text-xs text-gray-400">Generating your weekly insight...</span>
        </div>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="bg-gradient-to-r from-neuro-orange/5 to-white rounded-2xl border border-neuro-orange/20 p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-neuro-orange/10 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4 text-neuro-orange" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neuro-orange font-semibold mb-1">Weekly Insight</p>
          <p className="text-sm text-neuro-navy leading-relaxed">{insight}</p>
        </div>
      </div>
    </div>
  );
}
