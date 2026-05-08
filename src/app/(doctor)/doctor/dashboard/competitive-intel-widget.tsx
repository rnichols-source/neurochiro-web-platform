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
  const trendColor = props.trend === 'up' ? 'text-green-400' : props.trend === 'down' ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-neuro-orange" />
        <h3 className="text-sm font-bold text-neuro-navy">Your Market Position</h3>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-neuro-orange/10 border border-neuro-orange/20 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-neuro-orange">#{props.cityRank}</span>
        </div>
        <div>
          <p className="text-sm text-neuro-navy font-bold">in {props.city}, {props.state}</p>
          <p className="text-xs text-gray-400">Top {props.topPercentile}% of {props.totalInCity} doctors</p>
        </div>
      </div>

      {/* Views Comparison */}
      <div className="bg-gray-50 rounded-xl p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Your views</span>
          <span className="font-bold text-neuro-navy flex items-center gap-1">
            {props.doctorViews} <TrendIcon className={`w-3 h-3 ${trendColor}`} />
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-gray-500">Area average</span>
          <span className="text-gray-500">{props.areaAverageViews}</span>
        </div>
      </div>
    </div>
  );
}
