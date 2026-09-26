"use client";

import { Users, Loader2, AlertCircle, RefreshCw, DollarSign, Eye, EyeOff, MapPin, AlertTriangle, Globe } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAdminDashboardStats, getActivityFeed, getActionList, ActionItem, getFunnelMetrics, FunnelMetrics } from "./actions";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [funnel, setFunnel] = useState<FunnelMetrics | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllActions, setShowAllActions] = useState(false);

  async function fetchAll() {
    setLoading(true);
    const [dashData, actionData, funnelData, actData] = await Promise.all([
      getAdminDashboardStats(),
      getActionList(),
      getFunnelMetrics(),
      getActivityFeed(40),
    ]);
    if (dashData) setStats(dashData);
    setActions(actionData);
    setFunnel(funnelData);
    setActivity(actData);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  const d = stats?.doctors || { active: 0, pending: 0, invisible: 0, international: 0, statesCovered: 0 };
  const s = stats?.subscribers || { confirmed: 0, pending: 0 };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-white">Dashboard</h1>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {/* Pending Verifications */}
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

      {/* Invisible doctors alert */}
      {d.invisible > 0 && (
        <Link href="/admin/invisible-doctors" className="block bg-red-500/10 border border-red-500/20 rounded-xl p-4 hover:bg-red-500/15 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-bold text-red-300">{d.invisible} doctor{d.invisible !== 1 ? 's' : ''} invisible to patient search</span>
            </div>
            <span className="text-xs text-red-400 font-bold">Fix now &rarr;</span>
          </div>
        </Link>
      )}

      {/* ── What needs me today ── */}
      <section>
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">What Needs You Today</h2>
        {actions.length === 0 ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
            <p className="text-sm font-bold text-green-400">Nothing needs your attention right now.</p>
            <p className="text-xs text-green-400/50 mt-1">All verifications, payments, and profiles are current.</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {(showAllActions ? actions : actions.slice(0, 8)).map(item => (
                <Link key={item.id} href={item.link}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    item.urgency === 1 ? 'bg-red-500' :
                    item.urgency === 2 ? 'bg-amber-500' :
                    item.urgency === 3 ? 'bg-blue-400' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white truncate">{item.title}</span>
                      <span className="text-[10px] text-white/20 font-bold uppercase tracking-wider shrink-0">{item.category}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{item.who}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[11px] font-bold ${item.waitingDays > 30 ? 'text-red-400' : item.waitingDays > 7 ? 'text-amber-400' : 'text-gray-500'}`}>
                      {item.waitingDays === 0 ? 'Today' : item.waitingDays === 1 ? '1 day' : `${item.waitingDays}d`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            {actions.length > 8 && (
              <button onClick={() => setShowAllActions(!showAllActions)}
                className="w-full py-2.5 text-xs font-bold text-neuro-orange hover:bg-white/5 transition-colors border-t border-white/5">
                {showAllActions ? 'Show less' : `Show all ${actions.length} items`}
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── Directory ── */}
      <section>
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Directory</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Active Doctors" value={d.active} sub="Verified, searchable by patients" color="text-green-400" />
          <StatCard label="Pending" value={d.pending} sub="Awaiting verification" color="text-amber-400" />
          <StatCard label="States" value={d.statesCovered} sub="With at least one doctor" color="text-blue-400" />
          <StatCard label="Waitlist" value={s.confirmed} sub={`${s.pending} pending confirmation`} color="text-purple-400" />
        </div>
        {d.international > 0 && (
          <p className="text-[10px] text-white/30 mt-2 flex items-center gap-1">
            <Globe className="w-3 h-3" /> {d.international} international doctors (CA, GB, NZ)
          </p>
        )}
      </section>

      {/* ── Revenue ── */}
      <section>
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Revenue</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="MRR" value={`$${Math.round(stats?.mrr || 0).toLocaleString()}`} sub="Monthly recurring revenue" color="text-green-400" large />
          <StatCard label="Subscriptions" value={`${(stats?.monthlySubscriptions || 0) + (stats?.annualSubscriptions || 0)}`}
            sub={`${stats?.monthlySubscriptions || 0} monthly, ${stats?.annualSubscriptions || 0} annual`} color="text-blue-400" />
          <StatCard label="Failed Payments" value={stats?.failedPayments || 0}
            sub={stats?.failedPayments > 0 ? "Need attention" : "None"} color={stats?.failedPayments > 0 ? "text-red-400" : "text-green-400"} />
          <StatCard label="Job Board" value={`${stats?.activeJobPostings || 0} active`}
            sub={`$${stats?.jobPostRevenue || 0} total job post revenue`} color="text-purple-400" />
        </div>
      </section>

      {/* ── Referrals ── */}
      {(stats?.totalReferrals > 0 || (stats?.referralBreakdown && stats.referralBreakdown.length > 0)) && (
        <section>
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Patient Introductions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Referrals" value={stats.totalReferrals} sub="Patients pointed toward a doctor" color="text-cyan-400" />
            <div className="bg-white/5 rounded-xl p-3 col-span-1 sm:col-span-3">
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-2">By Doctor</p>
              {stats.referralBreakdown.length > 0 ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {stats.referralBreakdown.map((r: any, i: number) => (
                    <span key={i} className="text-xs text-white/70">
                      <span className="font-bold">{r.name}</span>
                      <span className="text-cyan-400 ml-1">{r.count}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/30">No referrals yet</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Patient Funnel ── */}
      {funnel && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Patient Funnel</h2>
            {funnel.dataStartDate && (
              <span className="text-[10px] text-white/20">Tracking since {new Date(funnel.dataStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <FunnelCard label="Searches" d7={funnel.searches7d} d30={funnel.searches30d} />
            <FunnelCard label="Profile Views" d7={funnel.profileViews7d} d30={funnel.profileViews30d} />
            <FunnelCard label="Book Clicks" d7={funnel.bookClicks7d} d30={funnel.bookClicks30d} />
            <FunnelCard label="Inquiries" d7={funnel.inquiries7d} d30={funnel.inquiries30d} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <StatCard label="Empty Search Rate" value={`${funnel.emptySearchRate7d}%`}
              sub={`${funnel.emptySearches7d} of ${funnel.searches7d} returned nothing (7d)`}
              color={funnel.emptySearchRate7d > 30 ? 'text-red-400' : funnel.emptySearchRate7d > 15 ? 'text-amber-400' : 'text-green-400'} />
            <StatCard label="Waitlist" value={funnel.waitlistConfirmed + funnel.waitlistPending}
              sub={`${funnel.waitlistConfirmed} confirmed, ${funnel.waitlistPending} pending`} color="text-purple-400" />
            <StatCard label="New Signups" value={funnel.waitlistNew7d}
              sub={`Last 7 days (${funnel.waitlistNew30d} in 30d)`} color="text-blue-400" />
            <StatCard label="Call Clicks" value={funnel.callClicks7d}
              sub={`Last 7 days (${funnel.callClicks30d} in 30d)`} color="text-green-400" />
          </div>

          {funnel.topGaps.length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
              <p className="text-[10px] text-rose-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Recruiting Gaps
              </p>
              <p className="text-[10px] text-white/40 mb-2">Waitlist subscribers with no doctor within 50 miles</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {funnel.topGaps.map((g, i) => (
                  <span key={i} className="text-xs text-white/80">
                    <span className="font-bold">{g.city}, {g.state}</span>
                    <span className="text-rose-400 ml-1">{g.confirmed + g.pending}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Activity Feed ── */}
      <section className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Recent Activity</h2>
          <Link href="/admin/logs" className="text-xs text-gray-500 hover:text-white transition-colors">
            Full logs &rarr;
          </Link>
        </div>
        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="w-5 h-5 text-gray-500 animate-spin" /></div>
          ) : activity.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">No activity in the last 7 days.</div>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 truncate">{item.detail}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {item.link && (
                    <Link href={item.link} className="text-[10px] text-neuro-orange font-bold hover:underline hidden sm:block">View</Link>
                  )}
                  <span className="text-[11px] text-gray-600 whitespace-nowrap">
                    {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub, color, large }: { label: string; value: string | number; sub?: string; color: string; large?: boolean }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-xl p-4">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`${large ? 'text-2xl' : 'text-xl'} font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-white/25 mt-0.5 leading-tight">{sub}</p>}
    </div>
  );
}

function FunnelCard({ label, d7, d30 }: { label: string; d7: number; d30: number }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-xl p-4">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{d7}</p>
      <p className="text-[10px] text-white/25 mt-0.5">Last 7 days ({d30} in 30d)</p>
    </div>
  );
}
