"use client";

import { useState, useEffect } from "react";
import { Search, X, MapPin, GraduationCap, Loader2 } from "lucide-react";
import Link from "next/link";
import { searchStudents } from "./actions";

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    searchStudents(searchTerm || undefined)
      .then((data) => {
        const normalized = (data || []).map((s: any) => ({
          id: s.id,
          user_id: s.user_id || s.id,
          name: s.name || s.full_name || "Student",
          school: s.school || "",
          gradYear: s.graduation_year ? String(s.graduation_year) : "",
          interests: s.interests || [],
          location: s.location_city || "",
          email: s.email,
          bio: s.bio || "",
          isSeeking: s.is_looking_for_mentorship,
        }));
        setStudents(normalized);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [searchTerm]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-heading font-black text-neuro-navy">Students</h1>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, school, city, or interest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neuro-orange/20"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', '2025', '2026', '2027', '2028'].map((year) => (
            <button
              key={year}
              onClick={() => setSearchTerm(year === 'All' ? '' : year)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                (year === 'All' && !searchTerm) || searchTerm === year
                  ? 'bg-neuro-navy text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {year === 'All' ? 'All Students' : `Class of ${year}`}
            </button>
          ))}
        </div>
      </div>

      {/* Student Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>No students found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className="bg-white border border-gray-200 rounded-lg p-5 text-left hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                  {student.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{student.name}</h3>
                  {student.school && (
                    <p className="text-xs text-gray-500">{student.school}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                {student.gradYear && <span>Class of {student.gradYear}</span>}
                {student.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {student.location}
                  </span>
                )}
              </div>
              {student.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {student.interests.slice(0, 4).map((interest: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">{selectedStudent.name}</h2>
              <button onClick={() => setSelectedStudent(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {selectedStudent.school && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">School</p>
                  <p className="text-sm text-gray-900">{selectedStudent.school}</p>
                </div>
              )}
              {selectedStudent.gradYear && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Graduation Year</p>
                  <p className="text-sm text-gray-900">{selectedStudent.gradYear}</p>
                </div>
              )}
              {selectedStudent.location && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Location</p>
                  <p className="text-sm text-gray-900">{selectedStudent.location}</p>
                </div>
              )}
              {selectedStudent.interests.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudent.interests.map((interest: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedStudent.bio && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">About</p>
                  <p className="text-sm text-gray-700">{selectedStudent.bio}</p>
                </div>
              )}
              {selectedStudent.user_id ? (
                <Link
                  href={`/doctor/messages?to=${selectedStudent.user_id}`}
                  className="block w-full text-center py-2.5 bg-neuro-orange text-white rounded-lg hover:bg-neuro-orange/90 transition-colors text-sm font-bold"
                >
                  Send Message
                </Link>
              ) : selectedStudent.email ? (
                <a
                  href={`mailto:${selectedStudent.email}`}
                  className="block w-full text-center py-2.5 bg-neuro-navy text-white rounded-lg hover:bg-neuro-navy/90 transition-colors text-sm font-bold"
                >
                  Email Student
                </a>
              ) : (
                <p className="text-center text-xs text-gray-400">No contact info available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
