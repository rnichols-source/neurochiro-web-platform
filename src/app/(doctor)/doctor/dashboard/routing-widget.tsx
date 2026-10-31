"use client";

import { useState, useEffect } from "react";
import { Send, TrendingUp, MapPin } from "lucide-react";
import { getMyRoutingStats } from "./actions";

interface RoutingData {
  last7: { city: string; state: string; date: string }[];
  last30Count: number;
  allTimeCount: number;
  clickCount: number;
}

export default function RoutingWidget() {
  const [data, setData] = useState<RoutingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyRoutingStats().then((d) => {
      setData(d as RoutingData | null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-5 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-40 mb-3" />
        <div className="h-8 bg-white/5 rounded w-20" />
      </div>
    );
  }

  if (!data || data.allTimeCount === 0) {
    return (
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Send className="w-4 h-4 text-[#D66829]" />
          <p className="text-xs font-bold text-white/25 tracking-widest">Patients Sent to You</p>
        </div>
        <p className="text-white/40 text-sm">No patients have been routed to you yet. When someone near you asks for a nervous system chiropractor, they will be sent here.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Send className="w-4 h-4 text-[#D66829]" />
        <p className="text-xs font-bold text-white/25 tracking-widest">Patients Sent to You</p>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 mb-4">
        <div>
          <p className="text-2xl font-bold text-white">{data.last30Count}</p>
          <p className="text-xs font-bold text-white/25 tracking-widest">Last 30 Days</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{data.allTimeCount}</p>
          <p className="text-xs font-bold text-white/25 tracking-widest">All Time</p>
        </div>
        {data.clickCount > 0 && (
          <div>
            <p className="text-2xl font-bold text-emerald-400">{data.clickCount}</p>
            <p className="text-xs font-bold text-white/25 tracking-widest">Clicked Profile</p>
          </div>
        )}
      </div>

      {/* Recent routings */}
      {data.last7.length > 0 && (
        <div>
          <p className="text-xs font-bold text-white/15 tracking-widest mb-2">Recent</p>
          <div className="space-y-1.5">
            {data.last7.slice(0, 5).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <MapPin className="w-3 h-3 text-white/20 shrink-0" />
                <span className="text-white/50">
                  Someone in {r.city}{r.state ? `, ${r.state}` : ''}
                </span>
                <span className="text-white/15 ml-auto text-xs">{r.date}</span>
              </div>
            ))}
            {data.last7.length > 5 && (
              <p className="text-xs text-white/20">+ {data.last7.length - 5} more this week</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
