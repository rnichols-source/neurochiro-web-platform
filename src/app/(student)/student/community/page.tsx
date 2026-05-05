"use client";

import { useState, useEffect } from "react";
import { Users, GraduationCap, MapPin, Loader2, Compass, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getCommunityData } from "./actions";

interface SchoolStats {
  school: string;
  count: number;
  topInterests: string[];
}

interface YearStats {
  year: number;
  count: number;
}

export default function CommunityPage() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [schools, setSchools] = useState<SchoolStats[]>([]);
  const [years, setYears] = useState<YearStats[]>([]);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [studentRegion, setStudentRegion] = useState<string | null>(null);

  useEffect(() => {
    getCommunityData()
      .then((data) => {
        setTotalStudents(data.totalStudents);
        setSchools(data.schools);
        setYears(data.years);
        setNearbyCount(data.nearbyCount);
        setStudentRegion(data.studentRegion);
      })
      .catch((e) => {
        console.error("Community data error:", e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D66829]/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#D66829] animate-spin" />
          </div>
          <p className="text-sm font-semibold text-white/35">Loading community...</p>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-3">
          <Users className="w-7 h-7 text-[#D66829]" />
          Student Network
        </h1>
        <p className="text-xs text-white/35 mt-1">
          See which schools, graduation years, and regions are represented. You&apos;re not alone on this journey.
        </p>
      </header>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6 text-center">
          <Users className="w-8 h-8 text-white mx-auto mb-2" />
          <p className="text-3xl font-light text-white">{totalStudents}</p>
          <p className="text-xs text-white/35">Students on NeuroChiro</p>
        </div>
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6 text-center">
          <GraduationCap className="w-8 h-8 text-white mx-auto mb-2" />
          <p className="text-3xl font-light text-white">{schools.length}</p>
          <p className="text-xs text-white/35">Schools Represented</p>
        </div>
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6 text-center">
          <MapPin className="w-8 h-8 text-[#D66829] mx-auto mb-2" />
          <p className="text-3xl font-light text-white">{nearbyCount}</p>
          <p className="text-xs text-white/35">
            {studentRegion ? "In Your Region" : "Near You"}
          </p>
        </div>
      </div>

      {/* Schools */}
      {schools.length > 0 && (
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-4">Schools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {schools.map((school) => (
              <div
                key={school.school}
                className="bg-[#162231] rounded-2xl border border-white/[0.08] p-5 hover:border-[#D66829]/20 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white/50" />
                  </div>
                  <span className="text-2xl font-light text-white">{school.count}</span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{school.school}</h3>
                <p className="text-[10px] text-white/30 mb-2">
                  {school.count === 1 ? "1 student" : `${school.count} students`}
                </p>
                {school.topInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {school.topInterests.map((interest) => (
                      <span
                        key={interest}
                        className="text-[10px] font-medium bg-white/[0.06] text-white/50 px-2 py-0.5 rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Graduation Years */}
      {years.length > 0 && (
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-4">By Graduation Year</h2>
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6">
            <div className="flex items-end gap-2 h-32">
              {years.map((y) => {
                const maxCount = Math.max(...years.map((yr) => yr.count));
                const height = maxCount > 0 ? (y.count / maxCount) * 100 : 0;
                const isCurrentOrPast = y.year <= currentYear;

                return (
                  <div key={y.year} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-white/30">{y.count}</span>
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${Math.max(height, 4)}%`,
                        backgroundColor: isCurrentOrPast ? "#D66829" : "rgba(214,104,41,0.3)",
                      }}
                    />
                    <span className={`text-[10px] font-bold ${isCurrentOrPast ? "text-white" : "text-white/30"}`}>
                      &apos;{y.year.toString().slice(-2)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-white/30">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#D66829]" /> Graduated
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#D66829]/30" /> Upcoming
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Pipeline CTA */}
      <div className="bg-[#162231] rounded-2xl border border-white/[0.08] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-white">Want to find a mentor?</p>
          <p className="text-xs text-white/30">Connect with doctors who are ready to help you grow.</p>
        </div>
        <Link
          href="/student/mentors"
          className="w-full sm:w-auto px-5 py-2.5 bg-white/[0.06] text-white/60 rounded-lg hover:text-white hover:bg-white/[0.1] text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          Find Mentors <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
