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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-bold text-neuro-navy">Revenue Intelligence</h3>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <span className="text-3xl font-black text-neuro-navy">${props.estimatedMonthlyRevenue.toLocaleString()}</span>
        <span className="text-sm text-gray-400 pb-1">estimated this month</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">{props.confirmedLeadsThisMonth} confirmed lead{props.confirmedLeadsThisMonth !== 1 ? 's' : ''} × ${props.averageCaseValue.toLocaleString()} avg case value</span>
        </div>

        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
          <div>
            <p className="text-xs text-gray-500">Membership cost</p>
            <p className="text-sm font-bold text-neuro-navy">${props.membershipCost}/mo</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Estimated ROI</p>
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
