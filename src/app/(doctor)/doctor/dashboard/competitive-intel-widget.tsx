"use client";

import { TrendingUp, TrendingDown, Minus, MapPin } from "lucide-react";

interface Props {
  cityRank: number;
  totalInCity: number;
  topPercentile: number;
  areaAverageViews: number;
  doctorViews: number;
  city: string;
  state: string;
  trend: 'up' | 'down' | 'flat';
}

export default function CompetitiveIntelWidget(props: Props) {
  const TrendIcon = props.trend === 'up' ? TrendingUp : props.trend === 'down' ? TrendingDown : Minus;
  const trendColor = props.trend === 'up' ? 'text-green-400' : props.trend === 'down' ? 'text-red-400' : 'text-white/30';

  return (
    <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-neuro-orange" />
        <h3 className="text-sm font-bold text-white">Your Market Position</h3>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-neuro-orange/10 border border-neuro-orange/20 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-neuro-orange">#{props.cityRank}</span>
        </div>
        <div>
          <p className="text-sm text-white font-bold">in {props.city}, {props.state}</p>
          <p className="text-xs text-white/30">Top {props.topPercentile}% of {props.totalInCity} doctors</p>
        </div>
      </div>

      <div className="bg-white/[0.04] rounded-xl p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Your views</span>
          <span className="font-bold text-white flex items-center gap-1">
            {props.doctorViews} <TrendIcon className={`w-3 h-3 ${trendColor}`} />
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-white/40">Area average</span>
          <span className="text-white/50">{props.areaAverageViews}</span>
        </div>
      </div>
    </div>
  );
}
