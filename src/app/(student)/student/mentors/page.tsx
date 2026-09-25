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
      .select("id, user_id, first_name, last_name, clinic_name, city, state, specialties, bio, photo_url, rating, review_count, is_mentoring, is_hiring, region_code, spotlight_youtube_url")
      .eq("verification_status", "verified")
      .not("latitude", "eq", 0)
      .limit(100)
      .then(({ data }: any) => {
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
        .maybeSingle();
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
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-bold text-[#16222D] flex items-center gap-3">
          <Heart className="w-7 h-7 text-[#D66829]" />
          Find a Mentor
        </h1>
        <p className="text-xs text-[#5A6873] mt-1">
          Message doctors who are open to students. Browse the rest for their profiles and Spotlight interviews.
        </p>
      </header>

      {/* Search + Sort */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A6873]/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, clinic, city, or specialty..."
              className="w-full pl-12 pr-4 py-3.5 bg-[#F7F8F9] border border-[#DDE2E5] rounded-2xl text-sm text-[#16222D] placeholder-[#5A6873]/40 focus:border-[#D66829]/40 outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
            <button
              onClick={() => setSortBy("match")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${sortBy === "match" ? "bg-[#D66829] text-[#16222D]" : "bg-[#F7F8F9] border border-[#DDE2E5] text-[#5A6873] hover:text-[#5A6873]"}`}
            >
              Best Match
            </button>
            <button
              onClick={() => setSortBy("rating")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${sortBy === "rating" ? "bg-[#D66829] text-[#16222D]" : "bg-[#F7F8F9] border border-[#DDE2E5] text-[#5A6873] hover:text-[#5A6873]"}`}
            >
              Highest Rated
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${showFilters ? "bg-[#D66829] text-[#16222D]" : "bg-[#F7F8F9] border border-[#DDE2E5] text-[#5A6873] hover:text-[#5A6873]"}`}
            >
              <Filter className="w-3.5 h-3.5" /> Filters
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-[#F7F8F9] rounded-2xl border border-[#DDE2E5] p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterHiring}
                onChange={(e) => setFilterHiring(e.target.checked)}
                className="w-4 h-4 rounded border-[#DDE2E5] text-[#D66829] focus:ring-[#D66829]"
              />
              <span className="text-sm font-bold text-[#5A6873]">Hiring New Graduates</span>
            </label>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-6 h-6 border-2 border-[#DDE2E5] border-t-[#D66829] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#5A6873]">Finding mentors...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#F7F8F9] rounded-2xl border border-dashed border-[#DDE2E5]">
          <Users className="w-12 h-12 text-[#5A6873]/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#16222D] mb-1">No doctors match those filters</h3>
          <p className="text-[#5A6873] text-sm max-w-md mx-auto mb-4">
            Try clearing a filter.
          </p>
        </div>
      ) : (<MentorResults filtered={filtered} />)}

      {/* Pipeline CTA */}
      <div className="bg-[#F7F8F9] rounded-2xl border border-[#DDE2E5] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-[#16222D]">Ready to apply?</p>
          <p className="text-xs text-[#5A6873]">See who's hiring.</p>
        </div>
        <Link
          href="/student/jobs"
          className="w-full sm:w-auto px-5 py-2.5 bg-[#EFF1F2] text-[#5A6873] rounded-lg hover:text-[#16222D] hover:bg-[#DDE2E5] text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          Browse Jobs <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function MentorResults({ filtered }: { filtered: any[] }) {
  const openToMentoring = filtered.filter((m: any) => m.is_mentoring);
  const inNetwork = filtered.filter((m: any) => !m.is_mentoring);

  const renderCard = (mentor: any, canMessage: boolean) => {
          const fullName = `Dr. ${mentor.first_name} ${mentor.last_name}`;
          const location = [mentor.city, mentor.state].filter(Boolean).join(", ");
          const matchScore = mentor.matchScore;
          const hasSpotlight = !!(mentor as any).spotlight_youtube_url;

          return (
            <div
              key={mentor.id}
              className="bg-[#F7F8F9] rounded-2xl border border-[#DDE2E5] p-5 hover:border-[#D66829]/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EFF1F2] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {mentor.photo_url ? (
                    <img src={mentor.photo_url} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold text-[#16222D]">
                      {mentor.first_name?.[0]}{mentor.last_name?.[0]}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-[#16222D]">{fullName}</h3>
                    {matchScore > 0 && (
                      <span className="text-[10px] text-[#5A6873] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: matchScore >= 60 ? "#22c55e" : "#f59e0b" }} />
                        {matchScore}%
                      </span>
                    )}
                  </div>

                  {mentor.clinic_name && (
                    <p className="text-xs text-[#5A6873] mb-1">{mentor.clinic_name}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-[#5A6873] mb-3">
                    {location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {location}
                      </span>
                    )}
                    {mentor.rating > 0 && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" /> {mentor.rating.toFixed(1)}
                        {mentor.review_count > 0 && <span className="text-[#5A6873]/40">({mentor.review_count})</span>}
                      </span>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {canMessage && (
                        <span className="text-[10px] font-medium bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5" /> Open to Students
                        </span>
                      )}
                      {mentor.is_hiring && (
                        <span className="text-[10px] font-medium bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Briefcase className="w-2.5 h-2.5" /> Hiring
                        </span>
                      )}
                      {hasSpotlight && (
                        <span className="text-[10px] font-medium bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">
                          Spotlight Interview
                        </span>
                      )}
                    </div>

                    {/* Specialties */}
                    {mentor.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {mentor.specialties.slice(0, 4).map((spec: string) => (
                          <span key={spec} className="text-[10px] font-medium bg-[#EFF1F2] text-[#5A6873] px-2 py-0.5 rounded-full">
                            {spec}
                          </span>
                        ))}
                        {mentor.specialties.length > 4 && (
                          <span className="text-[10px] text-[#5A6873]">+{mentor.specialties.length - 4} more</span>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    <div className="flex gap-2">
                      {canMessage && mentor.user_id && (
                        <Link
                          href={`/student/messages?to=${mentor.user_id}`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D66829] text-[#16222D] rounded-lg text-xs font-bold hover:bg-[#e8834a] transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Message
                        </Link>
                      )}
                      <Link
                        href={`/directory/${mentor.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EFF1F2] text-[#5A6873] rounded-lg text-xs font-bold hover:bg-[#DDE2E5] transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          };

        return (
          <div className="space-y-8">
            {openToMentoring.length > 0 && (
              <div>
                <h2 className="text-xs font-black text-green-400/60 uppercase tracking-widest mb-3">Open to Mentoring ({openToMentoring.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {openToMentoring.map(m => renderCard(m, true))}
                </div>
              </div>
            )}
            {inNetwork.length > 0 && (
              <div>
                <h2 className="text-xs font-black text-[#5A6873]/40 uppercase tracking-widest mb-3">In the Network ({inNetwork.length})</h2>
                <p className="text-[11px] text-[#5A6873]/60 mb-3">These doctors haven't opted in to student messages yet. You can still watch their interviews and read their profiles.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inNetwork.map(m => renderCard(m, false))}
                </div>
              </div>
            )}
          </div>
  );
}

// MentorResults helper component ends above
