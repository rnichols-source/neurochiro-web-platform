"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, MapPin, Users, ArrowRight, DollarSign } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/landing/Footer";

interface SalaryData {
  summary: { avg: number; median: number; min: number; max: number; percentile25: number; percentile75: number; count: number } | null;
  byState: { state: string; avg: number; count: number; min: number; max: number }[];
  byRole: { role: string; avg: number; count: number; min: number; max: number }[];
}

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

function formatSalary(n: number) {
  return `$${(n / 1000).toFixed(0)}K`;
}

export default function SalaryExplorerPage() {
  const [data, setData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (stateFilter) params.set("state", stateFilter);
    if (roleFilter) params.set("role_type", roleFilter);
    fetch(`/api/salaries?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [stateFilter, roleFilter]);

  const maxAvg = data?.byState ? Math.max(...data.byState.map(s => s.avg), 1) : 1;
  const maxRoleAvg = data?.byRole ? Math.max(...data.byRole.map(r => r.avg), 1) : 1;

  return (
    <div className="min-h-dvh bg-neuro-cream">
      {/* Hero */}
      <section className="bg-neuro-navy text-white pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-3">Salary Data</p>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4">
            Chiropractic Salary Transparency
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Real compensation data from job postings on NeuroChiro. Updated weekly. No guessing.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        {/* Summary Stats */}
        {data?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <DollarSign className="w-5 h-5 text-neuro-orange mx-auto mb-2" />
              <p className="text-2xl font-black text-neuro-navy">{formatSalary(data.summary.avg)}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Salary</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-neuro-navy">{formatSalary(data.summary.percentile75)}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">75th Percentile</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <BarChart3 className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-neuro-navy">{formatSalary(data.summary.median)}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Median</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <Users className="w-5 h-5 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-neuro-navy">{data.summary.count}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data Points</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">State</label>
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-neuro-orange">
              <option value="">All States</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Role Type</label>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-neuro-orange">
              <option value="">All Roles</option>
              <option value="Associate">Associate Doctor</option>
              <option value="Independent Contractor">Independent Contractor</option>
              <option value="Clinical">Clinical Staff</option>
              <option value="Support Staff">Support Staff</option>
            </select>
          </div>
          {(stateFilter || roleFilter) && (
            <button onClick={() => { setStateFilter(""); setRoleFilter(""); }} className="self-end px-4 py-2.5 text-xs font-bold text-neuro-orange hover:underline">
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !data?.summary ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neuro-navy mb-2">Not enough data yet</h3>
            <p className="text-gray-400 text-sm mb-6">As more jobs are posted with salary data, this page will populate with real insights.</p>
            <Link href="/careers/post" className="px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm inline-flex items-center gap-2">
              Post a Job <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* By State */}
            {data.byState.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-heading font-black text-neuro-navy">By State</h2>
                </div>
                <div className="space-y-3">
                  {data.byState.slice(0, 15).map(s => (
                    <div key={s.state}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-neuro-navy">{s.state}</span>
                        <span className="text-sm font-bold text-neuro-navy">{formatSalary(s.avg)}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-neuro-orange to-neuro-orange-light"
                          style={{ width: `${(s.avg / maxAvg) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{s.count} posting{s.count !== 1 ? 's' : ''} · Range: {formatSalary(s.min)} – {formatSalary(s.max)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By Role */}
            {data.byRole.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5 text-neuro-orange" />
                  <h2 className="text-lg font-heading font-black text-neuro-navy">By Role</h2>
                </div>
                <div className="space-y-3">
                  {data.byRole.map(r => (
                    <div key={r.role}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-neuro-navy">{r.role}</span>
                        <span className="text-sm font-bold text-neuro-navy">{formatSalary(r.avg)}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                          style={{ width: `${(r.avg / maxRoleAvg) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{r.count} posting{r.count !== 1 ? 's' : ''} · Range: {formatSalary(r.min)} – {formatSalary(r.max)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-neuro-navy py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-heading font-black text-white mb-4">Help Build Salary Transparency</h2>
          <p className="text-gray-400 mb-6">Every job posted with salary data makes this resource more accurate for the entire profession.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/careers/post" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
              Post a Job <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/careers" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
