"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Star, Heart, Briefcase, MessageSquare, ArrowRight, Filter, ChevronDown, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface Mentor {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  clinic_name: string;
  city: string;
  state: string;
  specialties: string[];
  bio: string;
  photo_url: string;
  rating: number;
  review_count: number;
  is_mentoring: boolean;
  is_hiring: boolean;
  region_code: string;
}

interface StudentProfile {
  city: string | null;
  state: string | null;
  region_code: string | null;
  interests: string[];
}

function computeMentorMatch(mentor: Mentor, profile: StudentProfile): number {
  let locationScore = 0;
  let techniqueScore = 0;

  // Location (50%)
  const mentorCity = (mentor.city || "").toLowerCase();
  const mentorState = (mentor.state || "").toLowerCase();
  const studentCity = (profile.city || "").toLowerCase();
  const studentState = (profile.state || "").toLowerCase();

  if (studentCity && mentorCity && studentCity === mentorCity) {
    locationScore = 100;
  } else if (studentState && mentorState && studentState === mentorState) {
    locationScore = 60;
  } else if (profile.region_code && mentor.region_code && profile.region_code === mentor.region_code) {
    locationScore = 30;
  }

  // Technique overlap (50%)
  if (profile.interests.length > 0 && mentor.specialties?.length > 0) {
    const mentorSpecs = mentor.specialties.map((s) => s.toLowerCase());
    const matches = profile.interests.filter((i) => mentorSpecs.some((s) => s.includes(i.toLowerCase()) || i.toLowerCase().includes(s)));
    techniqueScore = Math.min(Math.round((matches.length / profile.interests.length) * 100), 100);
  }

  return Math.round(locationScore * 0.5 + techniqueScore * 0.5);
}

export default function MentorDiscoveryPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"match" | "rating">("match");
  const [filterHiring, setFilterHiring] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [profile, setProfile] = useState<StudentProfile>({
    city: null, state: null, region_code: null, interests: [],
  });

  useEffect(() => {
    const supabase = createClient();

    // Fetch mentors
    supabase
      .from("doctors")
      .select("id, user_id, first_name, last_name, clinic_name, city, state, specialties, bio, photo_url, rating, review_count, is_mentoring, is_hiring, region_code")
      .eq("is_mentoring", true)
      .then(({ data }) => {
        if (data) setMentors(data as Mentor[]);
        setLoading(false);
      });

    // Fetch student profile
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: student } = await supabase
        .from("students")
        .select("location_city, region_code, interests")
        .eq("id", user.id)
        .single();
      if (student) {
        setProfile({
          city: (student as any).location_city || null,
          state: null,
          region_code: (student as any).region_code || null,
          interests: (student as any).interests || [],
        });
      }
    });
  }, []);

  const mentorsWithScores = useMemo(() => {
    return mentors.map((m) => ({
      ...m,
      matchScore: computeMentorMatch(m, profile),
    }));
  }, [mentors, profile]);

  const filtered = useMemo(() => {
    let result = mentorsWithScores;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
          m.clinic_name?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q) ||
          m.state?.toLowerCase().includes(q) ||
          m.specialties?.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterHiring) {
      result = result.filter((m) => m.is_hiring);
    }
    if (sortBy === "match") {
      result = [...result].sort((a, b) => b.matchScore - a.matchScore);
    } else {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return result;
  }, [mentorsWithScores, search, sortBy, filterHiring]);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-3">
          <Heart className="w-7 h-7 text-[#D66829]" />
          Find a Mentor
        </h1>
        <p className="text-xs text-white/35 mt-1">
          Connect with doctors who are open to mentoring, hosting externs, or hiring new graduates.
        </p>
      </header>

      {/* Search + Sort */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, clinic, city, or specialty..."
              className="w-full pl-12 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-white/20 focus:border-[#D66829]/40 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("match")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === "match" ? "bg-[#D66829] text-white" : "bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/60"}`}
            >
              Best Match
            </button>
            <button
              onClick={() => setSortBy("rating")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === "rating" ? "bg-[#D66829] text-white" : "bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/60"}`}
            >
              Highest Rated
            </button>
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
          <div className="bg-[#162231] rounded-2xl border border-white/[0.08] p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterHiring}
                onChange={(e) => setFilterHiring(e.target.checked)}
                className="w-4 h-4 rounded border-white/[0.08] text-[#D66829] focus:ring-[#D66829]"
              />
              <span className="text-sm font-bold text-white/50">Hiring New Graduates</span>
            </label>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-6 h-6 border-2 border-white/[0.08] border-t-[#D66829] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-white/40">Finding mentors...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#162231] rounded-2xl border border-dashed border-white/[0.08]">
          <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-1">No mentors match your filters</h3>
          <p className="text-white/40 text-sm max-w-md mx-auto mb-4">
            Try broadening your search or removing the hiring filter. New doctors join NeuroChiro every week.
          </p>
          <Link href="/student/profile" className="text-sm font-bold text-[#D66829] hover:underline">Add interests to your profile for better matches</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((mentor) => {
            const fullName = `Dr. ${mentor.first_name} ${mentor.last_name}`;
            const location = [mentor.city, mentor.state].filter(Boolean).join(", ");
            const matchScore = mentor.matchScore;

            return (
              <div
                key={mentor.id}
                className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-5 hover:border-[#D66829]/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {mentor.photo_url ? (
                      <img src={mentor.photo_url} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-semibold text-white">
                        {mentor.first_name?.[0]}{mentor.last_name?.[0]}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-white">{fullName}</h3>
                      {matchScore > 0 && (
                        <span className="text-[10px] text-white/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: matchScore >= 60 ? "#22c55e" : "#f59e0b" }} />
                          {matchScore}%
                        </span>
                      )}
                    </div>

                    {mentor.clinic_name && (
                      <p className="text-xs text-white/40 mb-1">{mentor.clinic_name}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-white/35 mb-3">
                      {location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {location}
                        </span>
                      )}
                      {mentor.rating > 0 && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" /> {mentor.rating.toFixed(1)}
                          {mentor.review_count > 0 && <span className="text-white/20">({mentor.review_count})</span>}
                        </span>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-[10px] font-medium bg-white/[0.06] text-white/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5" /> Open to Mentoring
                      </span>
                      {mentor.is_hiring && (
                        <span className="text-[10px] font-medium bg-white/[0.06] text-white/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Briefcase className="w-2.5 h-2.5" /> Hiring
                        </span>
                      )}
                    </div>

                    {/* Specialties */}
                    {mentor.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {mentor.specialties.slice(0, 4).map((spec) => (
                          <span key={spec} className="text-[10px] font-medium bg-white/[0.06] text-white/50 px-2 py-0.5 rounded-full">
                            {spec}
                          </span>
                        ))}
                        {mentor.specialties.length > 4 && (
                          <span className="text-[10px] text-white/30">+{mentor.specialties.length - 4} more</span>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    <Link
                      href={`/student/messages?to=${mentor.user_id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#D66829] text-white rounded-lg text-xs font-bold hover:bg-[#e8834a] shadow-lg shadow-[#D66829]/20 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Send Message
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pipeline CTA */}
      <div className="bg-[#162231] rounded-2xl border border-white/[0.08] p-5 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-white">Ready to start applying?</p>
          <p className="text-xs text-white/30">Browse matched job openings based on your profile.</p>
        </div>
        <Link
          href="/student/jobs"
          className="px-5 py-2.5 bg-white/[0.06] text-white/60 rounded-lg hover:text-white hover:bg-white/[0.1] text-xs font-bold transition-colors flex items-center gap-2"
        >
          Browse Jobs <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
