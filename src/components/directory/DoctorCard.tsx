"use client";

import { useState } from "react";
import { ShieldCheck, Heart, Phone, MapPin, Calendar } from "lucide-react";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { formatDistance } from "@/lib/geo";
import type { DirectoryDoctor } from "@/components/directory/useDirectorySearch";
import { cn } from "@/lib/utils";

function trackConversion(doctorId: string, eventType: string) {
  const sessionId = typeof window !== "undefined"
    ? (sessionStorage.getItem("nc_sid") || (() => { const id = crypto.randomUUID(); sessionStorage.setItem("nc_sid", id); return id; })())
    : "";
  navigator.sendBeacon?.("/api/conversion", JSON.stringify({
    doctor_id: doctorId,
    event_type: eventType,
    source_page: typeof window !== "undefined" ? window.location.pathname : "/directory",
    session_id: sessionId,
  }));
}

interface DoctorCardProps {
  doc: DirectoryDoctor;
  index: number;
  onHover?: (docId: string | null) => void;
  onNavigate?: () => void;
  dark?: boolean;
  distanceUnit?: "mi" | "km";
}

export default function DoctorCard({ doc, index, onHover, onNavigate, dark = false, distanceUnit = "mi" }: DoctorCardProps) {
  const { isSaved, toggleSave } = useUserPreferences();
  const reduce = useReducedMotion();
  const docId = doc.id.toString();
  const saved = isSaved("doctors", docId);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [cardPhotoError, setCardPhotoError] = useState(false);

  const location = [doc.city, doc.state].filter(Boolean).join(", ");
  const rawSpecialties = (doc.specialties || []) as string[];
  const specialties = rawSpecialties
    .flatMap((s: string) => s.split(/\n|(?<=[a-z])(?=[A-Z][a-z].*(?:Care|Support|Wellness|Chiropractic|Restoration))/).map((t) => t.trim()))
    .filter((s: string) => s.length > 0 && s.length <= 45)
    .slice(0, 2);
  const name = `Dr. ${doc.first_name || ""} ${doc.last_name || ""}`.replace(/^Dr\.\s+Dr\./i, "Dr.").trim();
  const distanceMiles = doc.distance_miles as number | null;
  const profileUrl = `/directory/${doc.slug || doc.id}`;
  const initials = `${doc.first_name?.[0] || "N"}${doc.last_name?.[0] || ""}`.toUpperCase();

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { delay: Math.min(index, 8) * 0.03 }}
      onMouseEnter={() => onHover?.(docId)}
      onMouseLeave={() => onHover?.(null)}
      data-testid="doctor-card"
      id={`doctor-card-${docId}`}
      className={cn(
        "relative rounded-2xl p-4",
        dark ? "bg-white/8 border border-white/10" : "bg-white border border-gray-100"
      )}
    >
      <Link
        href={profileUrl}
        prefetch={false}
        onClick={() => { trackConversion(doc.id, "profile_view"); onNavigate?.(); }}
        className="relative z-10 flex items-start gap-3 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neuro-orange"
        aria-label={`View profile for ${name}`}
      >
        <div className="w-14 h-14 rounded-xl bg-neuro-navy overflow-hidden flex items-center justify-center shrink-0">
          {doc.photo_url && !cardPhotoError ? (
            <img src={doc.photo_url} alt="" className="w-full h-full object-cover" onError={() => setCardPhotoError(true)} />
          ) : (
            <span className="text-white font-bold text-lg">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1 pr-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className={cn("font-bold truncate", dark ? "text-white" : "text-neuro-navy")}>{name}</h3>
            {doc.verification_status === "verified" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/15 text-blue-300">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <p className={cn("text-sm truncate", dark ? "text-white/70" : "text-gray-600")}>{doc.clinic_name || "Private practice"}</p>
          <p className={cn("text-sm mt-0.5", dark ? "text-white/70" : "text-gray-600")}>
            {distanceMiles != null && <span className="text-neuro-orange font-bold">{formatDistance(distanceMiles, distanceUnit)} · </span>}
            {location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</span>}
          </p>
          {doc.accepting_new_patients && (
            <p className="text-sm font-semibold text-green-400 mt-1">Accepting new patients</p>
          )}
          {specialties.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {specialties.map((specialty) => (
                <span key={specialty} className="px-2.5 py-1 text-xs font-bold rounded-lg bg-neuro-orange/15 text-neuro-orange">{specialty}</span>
              ))}
            </div>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={() => {
          const wasSaved = saved;
          toggleSave("doctors", docId);
          setShowToast(wasSaved ? "Removed" : "Saved");
          setTimeout(() => setShowToast(null), 1600);
        }}
        className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-neuro-orange"
        aria-label={saved ? "Unsave doctor" : "Save doctor"}
      >
        <Heart className={cn("w-5 h-5", saved ? "text-red-500 fill-red-500" : "text-white/70")} />
        {showToast && <span className="sr-only">{showToast}</span>}
      </button>

      <div className="relative z-10 mt-3 flex flex-wrap gap-2">
        <Link
          href={`${profileUrl}#appointment-form`}
          prefetch={false}
          onClick={() => { trackConversion(doc.id, "request_click"); onNavigate?.(); }}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-neuro-orange px-4 text-sm font-bold text-white hover:bg-[#B8551F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Calendar className="w-4 h-4" /> Request appointment
        </Link>
        {doc.phone && (
          <a
            href={`tel:${doc.phone}`}
            onClick={() => trackConversion(doc.id, "call")}
            className="inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-neuro-orange"
            aria-label={`Call ${name}`}
          >
            <Phone className="w-4 h-4" /> Call
          </a>
        )}
        {doc.booking_url && (
          <a
            href={doc.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackConversion(doc.id, "book")}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/10 px-4 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-neuro-orange"
          >
            Book online
          </a>
        )}
      </div>
    </motion.article>
  );
}
