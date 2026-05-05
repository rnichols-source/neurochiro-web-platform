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
        <h1 className="text-2xl font-heading font-black text-neuro-navy flex items-center gap-3">
          <Heart className="w-7 h-7 text-neuro-orange" />
          Find a Mentor
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Connect with doctors who are open to mentoring, hosting externs, or hiring new graduates.
        </p>
      </header>

      {/* Search + Sort */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, clinic, city, or specialty..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-orange/20 shadow-sm text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("match")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === "match" ? "bg-neuro-navy text-white" : "bg-white border border-gray-200 text-gray-500"}`}
            >
              Best Match
            </button>
            <button
              onClick={() => setSortBy("rating")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === "rating" ? "bg-neuro-navy text-white" : "bg-white border border-gray-200 text-gray-500"}`}
            >
              Highest Rated
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${showFilters ? "bg-neuro-orange text-white" : "bg-white border border-gray-200 text-gray-500"}`}
            >
              <Filter className="w-3.5 h-3.5" /> Filters
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterHiring}
                onChange={(e) => setFilterHiring(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-neuro-orange focus:ring-neuro-orange"
              />
              <span className="text-sm font-bold text-gray-600">Hiring New Graduates</span>
            </label>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-neuro-orange rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Finding mentors...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neuro-navy mb-1">No mentors found</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            No mentors match your current filters. Try expanding your search or check back — we&apos;re growing every week.
          </p>
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
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-neuro-navy/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {mentor.photo_url ? (
                      <img src={mentor.photo_url} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-neuro-navy">
                        {mentor.first_name?.[0]}{mentor.last_name?.[0]}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-neuro-navy">{fullName}</h3>
                      {matchScore > 0 && (
                        <span
                          className="text-[10px] font-black px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: matchScore >= 60 ? "#22c55e15" : "#f59e0b15",
                            color: matchScore >= 60 ? "#22c55e" : "#f59e0b",
                          }}
                        >
                          {matchScore}% match
                        </span>
                      )}
                    </div>

                    {mentor.clinic_name && (
                      <p className="text-xs text-gray-500 mb-1">{mentor.clinic_name}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-3">
                      {location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {location}
                        </span>
                      )}
                      {mentor.rating > 0 && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3 h-3 fill-amber-400" /> {mentor.rating.toFixed(1)}
                          {mentor.review_count > 0 && <span className="text-gray-300">({mentor.review_count})</span>}
                        </span>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5" /> Open to Mentoring
                      </span>
                      {mentor.is_hiring && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Briefcase className="w-2.5 h-2.5" /> Hiring
                        </span>
                      )}
                    </div>

                    {/* Specialties */}
                    {mentor.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {mentor.specialties.slice(0, 4).map((spec) => (
                          <span key={spec} className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {spec}
                          </span>
                        ))}
                        {mentor.specialties.length > 4 && (
                          <span className="text-[10px] text-gray-400">+{mentor.specialties.length - 4} more</span>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    <Link
                      href={`/student/messages?to=${mentor.user_id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-neuro-navy text-white rounded-xl text-xs font-bold hover:bg-neuro-navy/90 transition-colors"
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
      <div className="bg-gray-50 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-neuro-navy">Ready to start applying?</p>
          <p className="text-xs text-gray-400">Browse matched job openings based on your profile.</p>
        </div>
        <Link
          href="/student/jobs"
          className="px-5 py-2.5 bg-neuro-orange text-white rounded-xl text-xs font-bold hover:bg-neuro-orange/90 transition-colors flex items-center gap-2"
        >
          Browse Jobs <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
