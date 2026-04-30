"use client";

import { useState } from "react";
import NextImage from "next/image";
import { ShieldCheck, ArrowRight, Heart, Phone, MapPin, Star } from "lucide-react";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface DoctorCardProps {
  doc: any;
  index: number;
}

export default function DoctorCard({ doc, index }: DoctorCardProps) {
  const { isSaved, toggleSave } = useUserPreferences();
  const docId = doc.id.toString();
  const saved = isSaved('doctors', docId);
  const [showToast, setShowToast] = useState<string | null>(null);

  const location = [doc.city, doc.state].filter(Boolean).join(", ");
  const specialties = (doc.specialties || []).slice(0, 3);
  const name = `Dr. ${doc.first_name || ''} ${doc.last_name || ''}`.replace(/^Dr\.\s+Dr\./i, 'Dr.').trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all group relative"
    >
      {/* Save Button */}
      <button
        onClick={(e) => {
          e.preventDefault(); e.stopPropagation();
          const wasSaved = saved;
          toggleSave('doctors', docId);
          setShowToast(wasSaved ? "Removed" : "Saved!");
          setTimeout(() => setShowToast(null), 2000);
        }}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-50 z-10"
        aria-label={saved ? "Unsave doctor" : "Save doctor"}
      >
        <Heart className={`w-5 h-5 ${saved ? 'text-red-500 fill-red-500' : 'text-gray-200 hover:text-gray-400'} transition-colors`} />
        <AnimatePresence>
          {showToast && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-7 right-0 text-xs font-bold text-neuro-navy bg-white border border-gray-200 rounded-lg px-2 py-1 shadow whitespace-nowrap"
            >
              {showToast}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Doctor Info */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-14 h-14 rounded-xl bg-neuro-navy overflow-hidden shadow flex-shrink-0 flex items-center justify-center">
          {doc.photo_url ? (
            <NextImage
              src={doc.photo_url}
              alt={name}
              fill
              className="object-cover"
              sizes="56px"
              loading="lazy"
            />
          ) : (
            <span className="text-white font-black text-xl">{(doc.first_name?.[0] || 'N').toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors truncate">{name}</h3>
            <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
            {doc.is_founding_member && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-neuro-orange/10 text-neuro-orange text-[9px] font-black rounded-md border border-neuro-orange/20 flex-shrink-0 uppercase tracking-wider">
                <Star className="w-2.5 h-2.5 fill-neuro-orange" /> Founder
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{doc.clinic_name || 'Private Practice'}</p>
          {location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400">{location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {specialties.map((s: string, i: number) => (
            <span key={i} className="px-2.5 py-1 bg-neuro-orange/5 text-neuro-orange text-[10px] font-bold rounded-lg border border-neuro-orange/10">
              {s}
            </span>
          ))}
          {(doc.specialties || []).length > 3 && (
            <span className="px-2.5 py-1 text-gray-400 text-[10px] font-bold">
              +{doc.specialties.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/directory/${doc.slug || doc.id}`} className="flex-1">
          <div className="w-full py-3 bg-neuro-navy text-white font-bold rounded-xl text-xs text-center hover:bg-neuro-navy/90 transition-colors flex items-center justify-center gap-2">
            View Profile <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
        {doc.phone && (
          <a
            href={`tel:${doc.phone}`}
            className="py-3 px-4 bg-neuro-orange text-white rounded-xl hover:bg-neuro-orange/90 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold"
            aria-label="Call doctor"
          >
            <Phone className="w-3.5 h-3.5" /> Call
          </a>
        )}
      </div>
    </motion.div>
  );
}
