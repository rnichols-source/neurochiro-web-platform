"use client";

import { DollarSign, Users, Activity, Loader2, AlertCircle, Zap } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAdminDashboardStats } from "./actions";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getAdminDashboardStats();
      if (data) setStats(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const formatCurrency = (val: number) =>
    val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 });

  const formatTrend = (val: number) => `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  const cards = [
    { label: "Total Revenue", value: stats ? formatCurrency(stats.revenue) : "$0", trend: stats ? formatTrend(stats.revenueTrend) : "+0%", icon: DollarSign, color: "text-green-500" },
    { label: "Active Doctors", value: stats ? stats.doctors.toString() : "0", trend: stats ? formatTrend(stats.doctorTrend) : "+0%", icon: Users, color: "text-neuro-orange" },
    { label: "Talent Network", value: stats ? stats.talent.toString() : "0", trend: stats ? formatTrend(stats.talentTrend) : "+0%", icon: Users, color: "text-blue-500" },
    { label: "Platform Score", value: stats ? `${stats.marketHealth}%` : "0%", trend: stats ? formatTrend(stats.marketTrend) : "+0%", icon: Activity, color: "text-purple-500" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Overview of platform activity.</p>
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            const data = await getAdminDashboardStats();
            if (data) setStats(data);
            setLoading(false);
          }}
          disabled={loading}
          className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {/* Pending Verifications Alert */}
      {stats?.pendingVerifications > 0 && (
        <Link href="/admin/moderation" className="block bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 hover:bg-yellow-500/15 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-300">{stats.pendingVerifications} doctor{stats.pendingVerifications !== 1 ? 's' : ''} pending verification</span>
            </div>
            <span className="text-xs text-yellow-400 font-bold">Review now &rarr;</span>
          </div>
        </Link>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((item, i) => (
          <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${item.trend.startsWith("-") ? "text-red-500 bg-red-500/10" : "text-green-500 bg-green-500/10"}`}>
                {item.trend}
              </span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
            <p className="text-xl font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Actions */}
      <section className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent Actions</h2>
          <Link href="/admin/logs" className="text-xs text-gray-500 hover:text-white transition-colors">
            View all logs
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
            </div>
          ) : stats?.adminLogs?.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">No recent actions.</div>
          ) : (
            stats?.adminLogs?.map((log: any) => (
              <div key={log.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 shrink-0">
                    {log.severity === "High" || log.severity === "Critical" ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{log.event}</p>
                    <p className="text-xs text-gray-500 truncate">{log.user} &rarr; {log.target}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-600 shrink-0">
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
