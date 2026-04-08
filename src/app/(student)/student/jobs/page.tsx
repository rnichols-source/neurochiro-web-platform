"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Briefcase, Clock } from "lucide-react";
import Link from "next/link";
import { getJobs } from "@/app/(public)/jobs/actions";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getJobs().then(setJobs).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      (j) =>
        j.title?.toLowerCase().includes(q) ||
        j.clinic_city?.toLowerCase().includes(q) ||
        j.clinic_name?.toLowerCase().includes(q)
    );
  }, [jobs, search]);

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

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, clinic, or city..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 shadow-sm"
        />
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
            const location = [job.clinic_city, job.clinic_state].filter(Boolean).join(", ");
            return (
              <div
                key={job.id}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
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
                      {job.type && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" /> {job.type}
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
                  <Link
                    href={job.clinic_name ? `/directory?q=${encodeURIComponent(job.clinic_name)}` : '/directory'}
                    className="shrink-0 px-6 py-3 bg-neuro-navy text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-neuro-navy/90 transition-colors"
                  >
                    Contact Clinic
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
