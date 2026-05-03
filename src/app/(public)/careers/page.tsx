"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getPublicJobs } from "./actions";
import LeadCaptureInline from "@/components/leads/LeadCaptureInline";

export default function CareersPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [empType, setEmpType] = useState("All");
  const [locationSearch, setLocationSearch] = useState("");

  useEffect(() => {
    getPublicJobs({}).then(setJobs).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = jobs;
    if (category !== "All") result = result.filter((j) => j.category === category);
    if (empType !== "All") result = result.filter((j) => j.employment_type === empType);
    if (locationSearch.trim()) {
      const q = locationSearch.toLowerCase();
      result = result.filter((j) =>
        j.city?.toLowerCase().includes(q) || j.state?.toLowerCase().includes(q) ||
        j.clinic_city?.toLowerCase().includes(q) || j.clinic_state?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [jobs, category, empType, locationSearch]);

  const fmtSalary = (min: number | null, max: number | null) =>
    min && max ? `$${min.toLocaleString()} - $${max.toLocaleString()}` : min ? `From $${min.toLocaleString()}` : max ? `Up to $${max.toLocaleString()}` : null;

  const fmtDate = (s: string) => {
    const diff = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
    if (diff < 1) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return diff < 30 ? `${Math.floor(diff / 7)}w ago` : new Date(s).toLocaleDateString();
  };

  const selectCls = "px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neuro-orange/20";

  return (
    <div className="min-h-dvh bg-neuro-cream pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-3 pt-8 pb-4">
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Careers in Chiropractic</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Browse open positions at nervous-system chiropractic clinics.</p>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            <option value="All">All Categories</option>
            <option value="Clinical">Clinical</option>
            <option value="Support Staff">Support Staff</option>
            <option value="Technical">Technical</option>
          </select>
          <select value={empType} onChange={(e) => setEmpType(e.target.value)} className={selectCls}>
            <option value="All">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
          </select>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Search by location..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/20"
            />
          </div>
        </div>

        {/* Job cards */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-neuro-orange rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading jobs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neuro-navy mb-1">No open positions right now</h3>
            <p className="text-gray-400 text-sm">Try adjusting your filters or check back soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => {
              const salary = fmtSalary(job.salary_min, job.salary_max);
              const location = [job.city || job.clinic_city, job.state || job.clinic_state].filter(Boolean).join(", ");
              return (
                <Link key={job.id} href={`/careers/${job.id}`} className="block bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-neuro-orange/20 transition-all group cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-neuro-navy group-hover:text-neuro-orange transition-colors">{job.title}</h3>
                        {job.category && <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{job.category}</span>}
                      </div>
                      <p className="text-sm text-gray-500">{job.clinic_name}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                        {job.employment_type && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {job.employment_type}</span>}
                        {salary && <span className="font-medium text-neuro-navy">{salary}</span>}
                        {location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {location}</span>}
                        {job.created_at && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {fmtDate(job.created_at)}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-xs uppercase tracking-widest group-hover:bg-neuro-orange/90 transition-colors flex items-center gap-2">
                      Apply Now <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Student Lead Capture */}
        <div className="mt-12 max-w-md mx-auto">
          <LeadCaptureInline
            source="careers_page"
            role="student"
            headline="Get notified about new positions"
            description="We'll email you when new jobs are posted that match your interests."
            buttonText="Subscribe"
            variant="card"
          />
        </div>

        {/* Bottom CTA */}
        <section className="mt-12 bg-neuro-orange rounded-2xl p-10 text-white text-center shadow-xl">
          <h2 className="text-2xl font-heading font-black mb-2">Hiring?</h2>
          <p className="opacity-90 mb-6">Members post for free. Non-members can post a single listing starting at $49.</p>
          <Link href="/careers/post" className="inline-flex items-center gap-2 px-8 py-3 bg-neuro-navy text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neuro-navy-light transition-all">
            Post a Listing <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
