"use client";

import { DollarSign, TrendingUp } from "lucide-react";

interface Props {
  estimatedMonthlyRevenue: number;
  membershipCost: number;
  roi: number;
  confirmedLeadsThisMonth: number;
  averageCaseValue: number;
}

export default function RevenueWidget(props: Props) {
  return (
    <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-bold text-white">Revenue Intelligence</h3>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <span className="text-3xl font-black text-white">${props.estimatedMonthlyRevenue.toLocaleString()}</span>
        <span className="text-sm text-white/20 pb-1">estimated this month</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">{props.confirmedLeadsThisMonth} confirmed lead{props.confirmedLeadsThisMonth !== 1 ? 's' : ''} × ${props.averageCaseValue.toLocaleString()} avg case value</span>
        </div>

        <div className="flex items-center justify-between bg-white/[0.03] rounded-xl p-3">
          <div>
            <p className="text-xs text-white/40">Membership cost</p>
            <p className="text-sm font-bold text-white">${props.membershipCost}/mo</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">Estimated ROI</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-lg font-black text-emerald-400">{props.roi}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
