"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Briefcase, Clock, CheckCircle2, Star, Filter, ArrowRight, ChevronDown, Zap } from "lucide-react";
import Link from "next/link";
import { getPublicJobs } from "@/app/(public)/careers/actions";
import { createClient } from "@/lib/supabase";

interface StudentProfile {
  city: string | null;
  state: string | null;
  region_code: string | null;
  interests: string[];
  graduation_year: number | null;
  is_looking_for_mentorship: boolean;
}

function computeMatchScore(job: any, profile: StudentProfile): { total: number; breakdown: Record<string, number> } {
  let locationScore = 0;
  let techniqueScore = 0;
  let gradScore = 0;
  let mentorScore = 0;

  // Location match (40%)
  const jobCity = (job.city || job.clinic_city || "").toLowerCase();
  const jobState = (job.state || job.clinic_state || "").toLowerCase();
  const studentCity = (profile.city || "").toLowerCase();
  const studentState = (profile.state || "").toLowerCase();

  if (studentCity && jobCity && studentCity === jobCity) {
    locationScore = 100;
  } else if (studentState && jobState && studentState === jobState) {
    locationScore = 60;
  } else if (profile.region_code && job.region_code && profile.region_code === job.region_code) {
    locationScore = 30;
  }

  // Technique alignment (30%)
  if (profile.interests.length > 0) {
    const jobText = `${job.title || ""} ${job.description || ""} ${job.requirements || ""}`.toLowerCase();
    const matches = profile.interests.filter((i) => jobText.includes(i.toLowerCase()));
    techniqueScore = profile.interests.length > 0 ? Math.min(Math.round((matches.length / profile.interests.length) * 100), 100) : 0;
  }

  // Graduation timing (20%)
  if (profile.graduation_year) {
    const currentYear = new Date().getFullYear();
    const yearsUntilGrad = profile.graduation_year - currentYear;
    if (yearsUntilGrad <= 0) gradScore = 100; // Already graduated
    else if (yearsUntilGrad <= 1) gradScore = 80;
    else if (yearsUntilGrad <= 2) gradScore = 40;
  }

  // Mentorship bonus (10%)
  if (profile.is_looking_for_mentorship && job.mentorship_available) {
    mentorScore = 100;
  }

  const total = Math.round(
    locationScore * 0.4 +
    techniqueScore * 0.3 +
    gradScore * 0.2 +
    mentorScore * 0.1
  );

  return {
    total,
    breakdown: {
      location: locationScore,
      technique: techniqueScore,
      graduation: gradScore,
      mentorship: mentorScore,
    },
  };
}

function getMatchColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#9ca3af";
}

function getMatchLabel(score: number): string {
  if (score >= 80) return "Strong Match";
  if (score >= 50) return "Good Match";
  if (score > 0) return "Partial Match";
  return "";
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"match" | "newest" | "salary">("match");
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [appliedStages, setAppliedStages] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<StudentProfile>({
    city: null, state: null, region_code: null, interests: [], graduation_year: null, is_looking_for_mentorship: false,
  });
  const [filterEmployment, setFilterEmployment] = useState<string>("all");
  const [filterMentor, setFilterMentor] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getPublicJobs({}).then(setJobs).catch(console.error).finally(() => setLoading(false));
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      // Fetch student profile for matching
      const { data: student } = await supabase
        .from("students")
        .select("location_city, region_code, interests, graduation_year, is_looking_for_mentorship")
        .eq("id", user.id)
        .single();
      if (student) {
        setProfile({
          city: (student as any).location_city || null,
          state: null,
          region_code: (student as any).region_code || null,
          interests: (student as any).interests || [],
          graduation_year: (student as any).graduation_year || null,
          is_looking_for_mentorship: (student as any).is_looking_for_mentorship || false,
        });
      }
      // Fetch applied jobs
      const { data } = await supabase
        .from("job_applications")
        .select("job_id")
        .eq("applicant_id", user.id);
      if (data) setAppliedJobIds(new Set(data.map((a) => a.job_id)));
      const { data: apps } = await supabase
        .from("applications")
        .select("job_id, stage")
        .eq("candidate_id", user.id);
      if (apps) {
        const stageMap: Record<string, string> = {};
        apps.forEach((a: any) => { stageMap[a.job_id] = a.stage || "Applied"; });
        setAppliedStages(stageMap);
      }
    });
  }, []);

  const jobsWithScores = useMemo(() => {
    return jobs.map((job) => ({
      ...job,
      matchScore: computeMatchScore(job, profile),
    }));
  }, [jobs, profile]);

  const filtered = useMemo(() => {
    let result = jobsWithScores;
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
    if (filterEmployment !== "all") {
      result = result.filter((j) => j.employment_type?.toLowerCase() === filterEmployment.toLowerCase());
    }
    if (filterMentor) {
      result = result.filter((j) => j.mentorship_available);
    }
    // Sort
    if (sortBy === "match") {
      result = [...result].sort((a, b) => b.matchScore.total - a.matchScore.total);
    } else if (sortBy === "newest") {
      result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "salary") {
      result = [...result].sort((a, b) => (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0));
    }
    return result;
  }, [jobsWithScores, search, sortBy, filterEmployment, filterMentor]);

  const topMatches = useMemo(() => {
    return jobsWithScores
      .filter((j) => j.matchScore.total >= 50 && !appliedJobIds.has(j.id))
      .sort((a, b) => b.matchScore.total - a.matchScore.total)
      .slice(0, 3);
  }, [jobsWithScores, appliedJobIds]);

  const fmtSalary = (min: number | null, max: number | null) =>
    min && max ? `$${min.toLocaleString()} - $${max.toLocaleString()}` : min ? `From $${min.toLocaleString()}` : max ? `Up to $${max.toLocaleString()}` : null;

  const fmtDate = (s: string) => {
    const diff = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
    if (diff < 1) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return diff < 30 ? `${Math.floor(diff / 7)}w ago` : new Date(s).toLocaleDateString();
  };

  const employmentTypes = useMemo(() => {
    const types = new Set(jobs.map((j) => j.employment_type).filter(Boolean));
    return Array.from(types);
  }, [jobs]);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-[#D66829]" />
            Jobs
          </h1>
          <p className="text-xs text-white/35 mt-1">Matched to your profile, interests, and goals</p>
        </div>
      </header>

      {/* Best Matches Section */}
      {topMatches.length > 0 && (
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[#D66829]" />
            <h2 className="text-sm font-semibold text-white">
              Best Matches For You
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topMatches.map((job) => {
              const salary = fmtSalary(job.salary_min, job.salary_max);
              const location = [job.city || job.clinic_city, job.state || job.clinic_state].filter(Boolean).join(", ");
              return (
                <Link
                  key={job.id}
                  href={`/careers/${job.id}`}
                  className="bg-[#162231] rounded-2xl p-4 hover:border-[#D66829]/20 transition-all group border border-white/[0.08]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getMatchColor(job.matchScore.total) }} />
                      {job.matchScore.total}%
                    </span>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-[#D66829] transition-colors" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{job.title}</h3>
                  {job.clinic_name && <p className="text-white/35 text-xs mb-2">{job.clinic_name}</p>}
                  <div className="flex flex-wrap gap-2 text-[10px] text-white/30">
                    {location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {location}</span>}
                    {salary && <span className="font-semibold text-white/50">{salary}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Search + Sort + Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, clinic, city, or state..."
              className="w-full pl-12 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-white/20 focus:border-[#D66829]/40 outline-none"
            />
          </div>
          <div className="flex gap-2">
            {(["match", "newest", "salary"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === s ? "bg-[#D66829] text-white" : "bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/60"}`}
              >
                {s === "match" ? "Best Match" : s === "newest" ? "Newest" : "Highest Pay"}
              </button>
            ))}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${showFilters ? "bg-[#D66829] text-white" : "bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/60"}`}
            >
              <Filter className="w-3.5 h-3.5" /> Filters
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-[#162231] rounded-2xl border border-white/[0.08] p-4 flex flex-wrap gap-4">
            <div>
              <label className="text-[10px] font-semibold text-white/30 block mb-1.5">Employment Type</label>
              <select
                value={filterEmployment}
                onChange={(e) => setFilterEmployment(e.target.value)}
                className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-[#D66829]/40 outline-none"
              >
                <option value="all">All Types</option>
                {employmentTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterMentor}
                  onChange={(e) => setFilterMentor(e.target.checked)}
                  className="w-4 h-4 rounded border-white/[0.08] text-[#D66829] focus:ring-[#D66829]"
                />
                <span className="text-sm font-bold text-white/50">Mentorship Available</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Job List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-6 h-6 border-2 border-white/[0.08] border-t-[#D66829] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-white/40">Loading jobs...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#162231] rounded-2xl border border-dashed border-white/[0.08]">
          <Briefcase className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-1">No open positions match your filters.</h3>
          <p className="text-white/40 text-sm">Try adjusting your search or check back soon.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => {
            const salary = fmtSalary(job.salary_min, job.salary_max);
            const location = [job.city || job.clinic_city, job.state || job.clinic_state].filter(Boolean).join(", ");
            const hasApplied = appliedJobIds.has(job.id);
            const matchScore = job.matchScore.total;
            const matchColor = getMatchColor(matchScore);
            const matchLabel = getMatchLabel(matchScore);

            return (
              <div
                key={job.id}
                className={`p-5 md:p-6 rounded-2xl border shadow-lg shadow-black/20 transition-all group ${hasApplied ? "bg-[#162231] border-green-500/20" : "bg-gradient-to-b from-[#1a2e40] to-[#162231] border-white/[0.08] hover:border-[#D66829]/20"}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg text-white group-hover:text-[#D66829] transition-colors">
                        {job.title}
                      </h3>
                      {matchScore > 0 && (
                        <span className="text-[10px] text-white/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: matchColor }} />
                          {matchScore}%
                        </span>
                      )}
                    </div>
                    {job.clinic_name && (
                      <p className="text-sm text-white/40 mt-0.5">{job.clinic_name}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-white/35">
                      {job.employment_type && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" /> {job.employment_type}
                        </span>
                      )}
                      {salary && (
                        <span className="flex items-center gap-1 font-medium text-white">{salary}</span>
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
                    <div className="shrink-0 flex flex-col items-center gap-1 px-5 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                      </div>
                      <span className="text-[10px] text-green-400/70 font-medium">{appliedStages[job.id] || "New"}</span>
                    </div>
                  ) : (
                    <Link
                      href={`/careers/${job.id}`}
                      className="shrink-0 px-6 py-3 bg-[#D66829] text-white font-bold rounded-lg text-xs hover:bg-[#e8834a] shadow-lg shadow-[#D66829]/20 transition-colors flex items-center gap-2"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pipeline CTA */}
      <div className="bg-[#162231] rounded-2xl border border-white/[0.08] p-5 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-white">Applied to a job?</p>
          <p className="text-xs text-white/30">Head to Contract Lab to review your offer before signing.</p>
        </div>
        <Link
          href="/student/contract-lab"
          className="px-5 py-2.5 bg-white/[0.06] text-white/60 rounded-lg hover:text-white hover:bg-white/[0.1] text-xs font-bold transition-colors flex items-center gap-2"
        >
          Contract Lab <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
