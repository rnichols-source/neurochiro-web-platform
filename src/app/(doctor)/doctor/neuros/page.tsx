"use client";

import { useState, useEffect } from "react";
import { Calculator, TrendingUp, DollarSign, Activity, Award, Receipt, Target, Smartphone, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface CarePlanStats {
  total: number;
  thisMonth: number;
  totalValue: number;
  accepted: number;
}

export default function NeurOSDashboard() {
  const [stats, setStats] = useState<CarePlanStats>({ total: 0, thisMonth: 0, totalValue: 0, accepted: 0 });
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient() as any;
    supabase.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!user) { setLoading(false); return; }

      // Check onboarding status
      const { data: config } = await supabase
        .from("neuros_practice_config")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      setOnboardingDone(config?.onboarding_completed || false);

      // Get care plan stats
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: plans } = await supabase
        .from("neuros_care_plans")
        .select("id, status, total_value, created_at")
        .eq("user_id", user.id);

      if (plans) {
        const thisMonth = plans.filter((p: any) => p.created_at >= monthStart);
        setStats({
          total: plans.length,
          thisMonth: thisMonth.length,
          totalValue: plans.reduce((sum: number, p: any) => sum + (p.total_value || 0), 0),
          accepted: plans.filter((p: any) => p.status === "accepted").length,
        });
      }

      setLoading(false);
    });
  }, []);

  const tools = [
    { name: "Care Plan Closer", desc: "Build professional care plans with insurance billing intelligence", href: "/doctor/neuros/care-plan", icon: Calculator, color: "bg-orange-500/10 text-orange-500" },
    { name: "Profit Pulse", desc: "Monthly P&L tracking built for chiropractic", href: "/doctor/pl-analyzer", icon: DollarSign, color: "bg-green-500/10 text-green-500" },
    { name: "Daily Scorecard", desc: "Track visits, collections, and KPIs in 60 seconds", href: "/doctor/kpi", icon: TrendingUp, color: "bg-blue-500/10 text-blue-500" },
    { name: "Patient Converter", desc: "Generate patient-facing scan reports", href: "/doctor/scan-report", icon: Activity, color: "bg-purple-500/10 text-purple-500" },
    { name: "Compliance Shield", desc: "CE tracking with renewal reminders", href: "/doctor/ce-tracker", icon: Award, color: "bg-yellow-500/10 text-yellow-500" },
    { name: "Revenue Maximizer", desc: "Insurance fee schedules and billing intelligence", href: "/doctor/billing-guide", icon: Receipt, color: "bg-cyan-500/10 text-cyan-500" },
  ];

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);
  };

  return (
    <div>
      {/* Onboarding CTA */}
      {!loading && !onboardingDone && (
        <Link href="/doctor/neuros/onboarding">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Complete Your Practice Setup</h3>
                <p className="text-blue-200 text-sm mt-1">Configure your fee schedules, supplements, and branding so your NeurOS tools are customized for your practice.</p>
              </div>
              <ArrowRight className="w-6 h-6 text-blue-200" />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Circle className="w-3 h-3 text-blue-300" />
              <span className="text-xs text-blue-200">Takes about 10 minutes</span>
            </div>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Care Plans</p>
          <p className="text-3xl font-black text-[#1E2D3B] mt-1">{stats.thisMonth}</p>
          <p className="text-xs text-gray-400 mt-1">this month ({stats.total} total)</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Value</p>
          <p className="text-3xl font-black text-green-600 mt-1">{formatCurrency(stats.totalValue)}</p>
          <p className="text-xs text-gray-400 mt-1">all care plans presented</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Accepted</p>
          <p className="text-3xl font-black text-blue-600 mt-1">{stats.accepted}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.total > 0 ? `${Math.round((stats.accepted / stats.total) * 100)}%` : "0%"} acceptance rate</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Plan Value</p>
          <p className="text-3xl font-black text-[#D66829] mt-1">{stats.total > 0 ? formatCurrency(stats.totalValue / stats.total) : "$0"}</p>
          <p className="text-xs text-gray-400 mt-1">per care plan</p>
        </div>
      </div>

      {/* Tools Grid */}
      <h2 className="text-lg font-black text-[#1E2D3B] mb-4">Your NeurOS Tools</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer h-full">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tool.color}`}>
                <tool.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#1E2D3B] text-sm">{tool.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{tool.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
