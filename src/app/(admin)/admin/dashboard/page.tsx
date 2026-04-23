"use client";

import { DollarSign, Users, Activity, Loader2, AlertCircle, Zap, Calendar, Briefcase, ShoppingCart, UserPlus, LogIn, Bell, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAdminDashboardStats, getActivityFeed, getQuickStats } from "./actions";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<string>("all");

  async function fetchAll() {
    setLoading(true);
    const [dashData, actData, qData] = await Promise.all([
      getAdminDashboardStats(),
      getActivityFeed(50),
      getQuickStats(),
    ]);
    if (dashData) setStats(dashData);
    setActivity(actData);
    setQuickStats(qData);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

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

  const todayCards = quickStats ? [
    { label: "Signups Today", value: quickStats.todaySignups, icon: UserPlus, color: "text-green-400" },
    { label: "Leads Today", value: quickStats.todayLeads, icon: Bell, color: "text-neuro-orange" },
    { label: "Logins Today", value: quickStats.todayLogins, icon: LogIn, color: "text-blue-400" },
    { label: "Total Patients", value: quickStats.totalPatients, icon: Users, color: "text-purple-400" },
  ] : [];

  const filterTypes = [
    { key: "all", label: "All" },
    { key: "signup", label: "Signups" },
    { key: "lead", label: "Leads" },
    { key: "login", label: "Logins" },
    { key: "purchase", label: "Purchases" },
    { key: "job", label: "Jobs" },
    { key: "seminar", label: "Seminars" },
  ];

  const filteredActivity = activityFilter === "all"
    ? activity
    : activity.filter(a => a.type === activityFilter || (activityFilter === "lead" && ["lead", "appointment", "job_application"].includes(a.type)));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-white">Command Center</h1>
          <p className="text-gray-400 text-sm mt-1">Everything happening on the platform, right now.</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
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

      {/* 30-Day Stat Cards */}
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

      {/* Today's Pulse */}
      {todayCards.length > 0 && (
        <div>
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Today&apos;s Pulse</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {todayCards.map((item, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <div>
                  <p className="text-lg font-bold text-white">{item.value}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <section className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Live Activity Feed</h2>
            <Link href="/admin/logs" className="text-xs text-gray-500 hover:text-white transition-colors">
              Full logs &rarr;
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterTypes.map(f => (
              <button
                key={f.key}
                onClick={() => setActivityFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activityFilter === f.key
                    ? 'bg-neuro-orange text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {f.label}
                {f.key !== "all" && (
                  <span className="ml-1 opacity-60">
                    {activity.filter(a => f.key === "lead" ? ["lead", "appointment", "job_application"].includes(a.type) : a.type === f.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
            </div>
          ) : filteredActivity.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">No activity in the last 7 days.</div>
          ) : (
            filteredActivity.map((item) => (
              <div key={item.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 truncate">{item.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {item.link && (
                    <Link href={item.link} className="text-[10px] text-neuro-orange font-bold hover:underline hidden sm:block">
                      View
                    </Link>
                  )}
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* System Health */}
      {stats?.health && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Database</p>
            <p className={`text-sm font-bold ${stats.health.database === 'Optimal' ? 'text-green-400' : 'text-red-400'}`}>
              {stats.health.database === 'Optimal' ? '● ' : '○ '}{stats.health.database}
            </p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Automations</p>
            <p className={`text-sm font-bold ${stats.health.automation === 'Idle' ? 'text-green-400' : stats.health.automation === 'Processing' ? 'text-yellow-400' : 'text-red-400'}`}>
              {stats.health.automation === 'Idle' ? '● ' : '◐ '}{stats.health.automation}
              {stats.health.pendingTasks > 0 && <span className="text-gray-500 font-normal"> ({stats.health.pendingTasks} queued)</span>}
            </p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Auth</p>
            <p className="text-sm font-bold text-green-400">● {stats.health.auth}</p>
          </div>
        </div>
      )}
    </div>
  );
}
