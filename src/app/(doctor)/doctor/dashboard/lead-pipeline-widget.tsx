"use client";

import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";

interface Props {
  stages: { new: number; contacted: number; scheduled: number; converted: number };
}

const STAGE_COLORS = {
  new: { bg: "bg-blue-500", label: "New" },
  contacted: { bg: "bg-amber-500", label: "Contacted" },
  scheduled: { bg: "bg-violet-500", label: "Scheduled" },
  converted: { bg: "bg-emerald-500", label: "Converted" },
};

export default function LeadPipelineWidget({ stages }: Props) {
  const total = stages.new + stages.contacted + stages.scheduled + stages.converted;

  return (
    <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-neuro-orange" />
          <h3 className="text-sm font-bold text-white">Patient Leads</h3>
        </div>
        <Link href="/doctor/leads" className="text-[10px] font-bold text-neuro-orange hover:underline flex items-center gap-1">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {total === 0 ? (
        <p className="text-xs text-white/30">No leads yet. As patients find your profile, they&apos;ll appear here.</p>
      ) : (
        <>
          <div className="flex h-3 rounded-full overflow-hidden mb-4">
            {(Object.entries(STAGE_COLORS) as [keyof typeof stages, typeof STAGE_COLORS[keyof typeof STAGE_COLORS]][]).map(([key, config]) => {
              const count = stages[key];
              if (count === 0) return null;
              const width = (count / total) * 100;
              return <div key={key} className={`${config.bg} transition-all`} style={{ width: `${width}%` }} />;
            })}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(STAGE_COLORS) as [keyof typeof stages, typeof STAGE_COLORS[keyof typeof STAGE_COLORS]][]).map(([key, config]) => (
              <div key={key} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <div className={`w-2 h-2 rounded-full ${config.bg}`} />
                  <span className="text-lg font-bold text-white">{stages[key]}</span>
                </div>
                <p className="text-[10px] text-white/30">{config.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
