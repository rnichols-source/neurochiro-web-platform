"use client";

import { useState, useEffect } from "react";
import { Users, GraduationCap, MapPin, Loader2, Compass, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

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
    const supabase = createClient();

    async function fetchData() {
      try {
        // Get all students (aggregate only — no individual data)
        const { data: students } = await supabase
          .from("students")
          .select("school, graduation_year, interests, region_code");

        if (!students) {
          setLoading(false);
          return;
        }

        setTotalStudents(students.length);

        // Aggregate by school
        const schoolMap = new Map<string, { count: number; interests: string[] }>();
        for (const s of students) {
          const school = (s as any).school || "Unknown";
          if (school === "Unknown") continue;
          const existing = schoolMap.get(school) || { count: 0, interests: [] };
          existing.count++;
          if ((s as any).interests) {
            existing.interests.push(...(s as any).interests);
          }
          schoolMap.set(school, existing);
        }

        const schoolStats: SchoolStats[] = Array.from(schoolMap.entries())
          .map(([school, data]) => {
            // Get top 3 interests
            const interestCount = new Map<string, number>();
            for (const i of data.interests) {
              interestCount.set(i, (interestCount.get(i) || 0) + 1);
            }
            const topInterests = Array.from(interestCount.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([name]) => name);

            return { school, count: data.count, topInterests };
          })
          .sort((a, b) => b.count - a.count);

        setSchools(schoolStats);

        // Aggregate by graduation year
        const yearMap = new Map<number, number>();
        for (const s of students) {
          const year = (s as any).graduation_year;
          if (!year) continue;
          yearMap.set(year, (yearMap.get(year) || 0) + 1);
        }
        const yearStats: YearStats[] = Array.from(yearMap.entries())
          .map(([year, count]) => ({ year, count }))
          .sort((a, b) => a.year - b.year);
        setYears(yearStats);

        // Get current student's region for "near you" count
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: studentData } = await supabase
            .from("students")
            .select("region_code")
            .eq("id", user.id)
            .single();
          if (studentData && (studentData as any).region_code) {
            const region = (studentData as any).region_code;
            setStudentRegion(region);
            const nearby = students.filter((s) => (s as any).region_code === region).length;
            setNearbyCount(nearby);
          }
        }
      } catch (e) {
        console.error("Community data error:", e);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D66829]/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#D66829] animate-spin" />
          </div>
          <p className="text-sm font-semibold text-[#1E2D3B]/40">Loading community...</p>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-heading font-semibold text-[#1E2D3B] flex items-center gap-3">
          <Users className="w-7 h-7 text-[#D66829]" />
          Student Network
        </h1>
        <p className="text-xs text-[#1E2D3B]/40 mt-1">
          You&apos;re not alone. See who else is on the platform.
        </p>
      </header>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <Users className="w-8 h-8 text-[#1E2D3B] mx-auto mb-2" />
          <p className="text-3xl font-light text-[#1E2D3B]">{totalStudents}</p>
          <p className="text-xs text-[#1E2D3B]/40">Students on NeuroChiro</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <GraduationCap className="w-8 h-8 text-[#1E2D3B] mx-auto mb-2" />
          <p className="text-3xl font-light text-[#1E2D3B]">{schools.length}</p>
          <p className="text-xs text-[#1E2D3B]/40">Schools Represented</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <MapPin className="w-8 h-8 text-[#D66829] mx-auto mb-2" />
          <p className="text-3xl font-light text-[#1E2D3B]">{nearbyCount}</p>
          <p className="text-xs text-[#1E2D3B]/40">
            {studentRegion ? "In Your Region" : "Near You"}
          </p>
        </div>
      </div>

      {/* Schools */}
      {schools.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#1E2D3B] mb-4">Schools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {schools.map((school) => (
              <div
                key={school.school}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F3EF] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-[#1E2D3B]" />
                  </div>
                  <span className="text-2xl font-light text-[#1E2D3B]">{school.count}</span>
                </div>
                <h3 className="font-semibold text-[#1E2D3B] text-sm mb-1 line-clamp-1">{school.school}</h3>
                <p className="text-[10px] text-[#1E2D3B]/40 mb-2">
                  {school.count === 1 ? "1 student" : `${school.count} students`}
                </p>
                {school.topInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {school.topInterests.map((interest) => (
                      <span
                        key={interest}
                        className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
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
          <h2 className="text-sm font-semibold text-[#1E2D3B] mb-4">By Graduation Year</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-end gap-2 h-32">
              {years.map((y) => {
                const maxCount = Math.max(...years.map((yr) => yr.count));
                const height = maxCount > 0 ? (y.count / maxCount) * 100 : 0;
                const isCurrentOrPast = y.year <= currentYear;

                return (
                  <div key={y.year} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-[#1E2D3B]/40">{y.count}</span>
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${Math.max(height, 4)}%`,
                        backgroundColor: isCurrentOrPast ? "#1E2D3B" : "#1E2D3B50",
                      }}
                    />
                    <span className={`text-[10px] font-bold ${isCurrentOrPast ? "text-[#1E2D3B]" : "text-[#1E2D3B]/40"}`}>
                      &apos;{y.year.toString().slice(-2)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-[#1E2D3B]/40">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#1E2D3B]" /> Graduated
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#1E2D3B]/30" /> Upcoming
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Pipeline CTA */}
      <div className="bg-[#F5F3EF] rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1E2D3B]">Want to find a mentor?</p>
          <p className="text-xs text-[#1E2D3B]/40">Connect with doctors who are ready to help you grow.</p>
        </div>
        <Link
          href="/student/mentors"
          className="px-5 py-2.5 bg-[#D66829] text-white rounded-xl text-xs font-bold hover:bg-[#D66829]/90 transition-colors flex items-center gap-2"
        >
          Find Mentors <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
