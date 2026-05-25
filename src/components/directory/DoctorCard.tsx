"use client";

import { useState } from "react";
import NextImage from "next/image";
import { ShieldCheck, ArrowRight, Heart, Phone, MapPin, Star, Sparkles, Navigation, Calendar } from "lucide-react";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { formatDistance } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { isProfileGated } from "@/lib/profile-gating";

interface DoctorCardProps {
  doc: any;
  index: number;
  onHover?: (docId: string | null) => void;
  dark?: boolean;
}

export default function DoctorCard({ doc, index, onHover, dark = false }: DoctorCardProps) {
  const { isSaved, toggleSave } = useUserPreferences();
  const docId = doc.id.toString();
  const saved = isSaved('doctors', docId);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [cardPhotoError, setCardPhotoError] = useState(false);
  const gated = isProfileGated(doc);

  const location = [doc.city, doc.state].filter(Boolean).join(", ");
  const specialties = (doc.specialties || []).slice(0, 3);
  const name = `Dr. ${doc.first_name || ''} ${doc.last_name || ''}`.replace(/^Dr\.\s+Dr\./i, 'Dr.').trim();
  const distanceMiles = doc.distance_miles as number | null;
  const hasBooking = !!doc.booking_url;
  const acceptingNew = doc.accepting_new_patients === true;

  const dirParts = [doc.address, doc.city, doc.state].filter(Boolean);
  const directionsUrl = dirParts.length > 0
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dirParts.join(', '))}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onMouseEnter={() => onHover?.(docId)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        "rounded-2xl p-5 transition-all group relative",
        dark
          ? "bg-white/8 border border-white/10 hover:bg-white/12"
          : "bg-white border border-gray-100 hover:shadow-lg hover:border-gray-200"
      )}
      id={`doctor-card-${docId}`}
    >
      {/* Distance Badge */}
      {distanceMiles != null && (
        <div className="absolute top-4 left-4 px-2 py-1 bg-neuro-orange/10 text-neuro-orange text-[10px] font-black rounded-lg border border-neuro-orange/20 z-10">
          {formatDistance(distanceMiles)}
        </div>
      )}

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
      <div className={`flex items-start gap-4 mb-4 ${distanceMiles != null ? 'mt-6' : ''}`}>
        <div className="relative w-14 h-14 rounded-xl bg-neuro-navy overflow-hidden shadow flex-shrink-0 flex items-center justify-center">
          {doc.photo_url && !cardPhotoError && !gated ? (
            <img
              src={doc.photo_url}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setCardPhotoError(true)}
            />
          ) : (
            <span className="text-white font-black text-xl">{(doc.first_name?.[0] || 'N').toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className={cn("font-bold transition-colors truncate", dark ? "text-white group-hover:text-neuro-orange" : "text-neuro-navy group-hover:text-neuro-orange")}>{name}</h3>
            {doc.verification_status === 'verified' && <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
            {doc.is_founding_member && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-neuro-orange/10 text-neuro-orange text-[9px] font-black rounded-md border border-neuro-orange/20 flex-shrink-0 uppercase tracking-wider">
                <Star className="w-2.5 h-2.5 fill-neuro-orange" /> Founder
              </span>
            )}
            {doc.membership_tier === 'pro' && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[9px] font-black rounded-md border border-violet-200 flex-shrink-0 uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" /> Pro
              </span>
            )}
          </div>
          <p className={cn("text-xs truncate", dark ? "text-white/50" : "text-gray-500")}>{doc.clinic_name || 'Private Practice'}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className={cn("w-3 h-3 flex-shrink-0", dark ? "text-white/30" : "text-gray-400")} />
                <span className={cn("text-xs", dark ? "text-white/40" : "text-gray-400")}>{location}</span>
              </div>
            )}
            {acceptingNew && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Accepting patients
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {specialties.map((s: string, i: number) => (
            <span key={i} className={cn("px-2.5 py-1 text-[10px] font-bold rounded-lg", dark ? "bg-neuro-orange/15 text-neuro-orange border border-neuro-orange/20" : "bg-neuro-orange/5 text-neuro-orange border border-neuro-orange/10")}>
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
          <div className={cn("w-full py-3 font-bold rounded-xl text-xs text-center transition-colors flex items-center justify-center gap-2",
            dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-neuro-navy text-white hover:bg-neuro-navy/90")}>
            View Profile <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
        {!gated && hasBooking && (
          <a
            href={doc.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-1 text-xs font-bold"
            aria-label="Book online"
          >
            <Calendar className="w-3.5 h-3.5" />
          </a>
        )}
        {!gated && doc.phone && (
          <a
            href={`tel:${doc.phone}`}
            className="py-3 px-3 bg-neuro-orange text-white rounded-xl hover:bg-neuro-orange/90 transition-colors flex items-center justify-center gap-1 text-xs font-bold"
            aria-label="Call doctor"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center text-xs font-bold"
            aria-label="Get directions"
          >
            <Navigation className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
