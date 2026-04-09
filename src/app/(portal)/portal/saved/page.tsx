"use client";

import { useState, useEffect } from "react";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { getSavedDoctors } from "./actions";
import { Heart, MapPin, X } from "lucide-react";
import Link from "next/link";

type Doctor = {
  id: string;
  first_name: string;
  last_name: string;
  clinic_name: string | null;
  slug: string;
  city: string | null;
  state: string | null;
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
        <div className="w-10 h-10 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          Saved Doctors
        </h1>
      </header>

      {doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"
            >
              <button
                onClick={() => { toggleSave('doctors', doc.id.toString()); setDoctors(prev => prev.filter(d => d.id !== doc.id)); }}
                className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-bold text-neuro-navy">
                Dr. {doc.first_name} {doc.last_name}
              </h3>
              {doc.clinic_name && (
                <p className="text-sm text-gray-500 mt-1">{doc.clinic_name}</p>
              )}
              {(doc.city || doc.state) && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {[doc.city, doc.state].filter(Boolean).join(", ")}
                </p>
              )}
              <Link
                href={`/directory/${doc.slug}`}
                className="mt-4 inline-block px-6 py-2.5 bg-neuro-navy text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-neuro-orange transition-colors"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neuro-navy">
            You haven&apos;t saved any doctors yet.
          </h3>
          <Link
            href="/directory"
            className="mt-6 inline-block px-8 py-3 bg-neuro-navy text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-neuro-orange transition-colors"
          >
            Browse Directory
          </Link>
        </div>
      )}
    </div>
  );
}
