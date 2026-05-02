"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Briefcase, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getPublicJobs } from "@/app/(public)/careers/actions";
import { createClient } from "@/lib/supabase";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "salary">("newest");
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [appliedStages, setAppliedStages] = useState<Record<string, string>>({});

  useEffect(() => {
    getPublicJobs({}).then(setJobs).catch(console.error).finally(() => setLoading(false));
    // Fetch jobs this student has applied to
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('job_applications')
          .select('job_id')
          .eq('applicant_id', user.id);
        if (data) {
          setAppliedJobIds(new Set(data.map(a => a.job_id)));
        }
      } catch {}
      try {
        const { data: apps } = await (supabase as any)
          .from('applications')
          .select('job_id, stage')
          .eq('candidate_id', user.id);
        if (apps) {
          const stageMap: Record<string, string> = {};
          apps.forEach((a: any) => { stageMap[a.job_id] = a.stage || 'Applied'; });
          setAppliedStages(stageMap);
        }
      } catch {}
    });
  }, []);

  const filtered = useMemo(() => {
    let result = jobs;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.clinic_city?.toLowerCase().includes(q) ||
          j.city?.toLowerCase().includes(q) ||
          j.state?.toLowerCase().includes(q) ||
          j.clinic_name?.toLowerCase().includes(q)
      );
    }
    // Sort
    if (sortBy === "newest") {
      result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "salary") {
      result = [...result].sort((a, b) => (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0));
    }
    return result;
  }, [jobs, search, sortBy]);

  const fmtSalary = (min: number | null, max: number | null) =>
    min && max ? `$${min.toLocaleString()} - $${max.toLocaleString()}` : min ? `From $${min.toLocaleString()}` : max ? `Up to $${max.toLocaleString()}` : null;

  const fmtDate = (s: string) => {
    const diff = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
    if (diff < 1) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return diff < 30 ? `${Math.floor(diff / 7)}w ago` : new Date(s).toLocaleDateString();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-heading font-black text-neuro-navy">Jobs</h1>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, clinic, city, or state..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("newest")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === "newest" ? "bg-neuro-navy text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"}`}
          >
            Newest
          </button>
          <button
            onClick={() => setSortBy("salary")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === "salary" ? "bg-neuro-navy text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"}`}
          >
            Highest Pay
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-neuro-orange rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading jobs...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neuro-navy mb-1">No open positions right now.</h3>
          <p className="text-gray-400 text-sm">Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => {
            const salary = fmtSalary(job.salary_min, job.salary_max);
            const location = [job.city || job.clinic_city, job.state || job.clinic_state].filter(Boolean).join(", ");
            const hasApplied = appliedJobIds.has(job.id);
            return (
              <div
                key={job.id}
                className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group ${hasApplied ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-neuro-navy group-hover:text-neuro-orange transition-colors">
                      {job.title}
                    </h3>
                    {job.clinic_name && (
                      <p className="text-sm text-gray-500 mt-0.5">{job.clinic_name}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                      {job.employment_type && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" /> {job.employment_type}
                        </span>
                      )}
                      {salary && (
                        <span className="flex items-center gap-1 font-medium text-neuro-navy">
                          {salary}
                        </span>
                      )}
                      {location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {location}
                        </span>
                      )}
                      {job.created_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {fmtDate(job.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  {hasApplied ? (
                    <div className="shrink-0 flex flex-col items-center gap-1 px-5 py-2 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-1 text-green-700 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                      </div>
                      <span className="text-[10px] text-green-600 font-medium">{appliedStages[job.id] || 'New'}</span>
                    </div>
                  ) : (
                    <Link
                      href={`/careers/${job.id}`}
                      className="shrink-0 px-6 py-3 bg-neuro-navy text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-neuro-navy/90 transition-colors"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
