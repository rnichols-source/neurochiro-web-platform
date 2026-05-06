"use client";

import { useState, useEffect } from "react";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { getSavedDoctors } from "./actions";
import { Heart, MapPin, X, MessageSquare } from "lucide-react";
import Link from "next/link";

type Doctor = {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  clinic_name: string | null;
  slug: string;
  city: string | null;
  state: string | null;
  photo_url: string | null;
  specialties: string[] | null;
};

export default function SavedPage() {
  const { saved, toggleSave } = useUserPreferences();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = saved.doctors;
    if (ids.length === 0) {
      setDoctors([]);
      setLoading(false);
      return;
    }
    getSavedDoctors(ids)
      .then((data) => setDoctors(data as Doctor[]))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [saved.doctors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-[#D66829] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-white">
          Saved Doctors
        </h1>
        <p className="text-xs text-white/35 mt-1">Your bookmarked specialists for easy access.</p>
      </header>

      {doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="relative bg-gradient-to-b from-[#1a2e40] to-[#162231] p-5 rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 hover:border-[#D66829]/20 transition-all"
            >
              <button
                onClick={() => {
                  if (!confirm('Remove this doctor from your saved list?')) return;
                  toggleSave('doctors', doc.id.toString());
                  setDoctors(prev => prev.filter(d => d.id !== doc.id));
                }}
                className="absolute top-3 right-3 p-1.5 text-white/20 hover:text-red-400 transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-[#D66829]/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {doc.photo_url ? (
                    <img src={doc.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#D66829] font-black text-lg">{(doc.first_name?.[0] || 'D').toUpperCase()}</span>
                  )}
                </div>
                <div className="pr-6">
                  <h3 className="font-bold text-white">Dr. {doc.first_name} {doc.last_name}</h3>
                  {doc.clinic_name && <p className="text-xs text-white/40">{doc.clinic_name}</p>}
                  {(doc.city || doc.state) && (
                    <p className="text-xs text-white/35 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {[doc.city, doc.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              {doc.specialties && doc.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {doc.specialties.slice(0, 3).map((s: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-[#D66829]/10 text-[#D66829] text-[10px] font-bold rounded border border-[#D66829]/20">{s}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                {doc.user_id && (
                  <Link
                    href={`/portal/messages?to=${doc.user_id}`}
                    className="flex-1 text-center py-3 bg-[#D66829]/10 text-[#D66829] text-xs font-bold rounded-xl hover:bg-[#D66829]/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </Link>
                )}
                <Link
                  href={`/directory/${doc.slug}`}
                  className="flex-1 text-center py-3 bg-[#D66829] text-white text-xs font-bold rounded-xl hover:bg-[#e8834a] transition-colors shadow-lg shadow-[#D66829]/20"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-dashed border-white/[0.08]">
          <Heart className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white/30">
            You haven&apos;t saved any doctors yet.
          </h3>
          <p className="text-white/30 text-sm mt-2 mb-6">Browse the directory and bookmark your favorites.</p>
          <Link
            href="/directory"
            className="inline-block px-8 py-3 bg-[#D66829] text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-[#e8834a] transition-colors shadow-lg shadow-[#D66829]/20"
          >
            Browse Directory
          </Link>
        </div>
      )}
    </div>
  );
}
