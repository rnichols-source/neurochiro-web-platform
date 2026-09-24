"use client";

import Link from "next/link";
import { MapPin, Phone, ShieldCheck, Calendar, Navigation, ArrowRight, CheckCircle } from "lucide-react";
import { formatDistance } from "@/lib/geo";

interface CityDoctor {
  id: string;
  first_name: string;
  last_name: string;
  slug: string;
  clinic_name: string;
  city: string;
  state: string;
  phone: string | null;
  booking_url: string | null;
  photo_url: string | null;
  bio: string | null;
  specialties: string[];
  accepting_new_patients: boolean;
  distance_miles: number;
  offers_telehealth: boolean;
  accepts_walkins: boolean;
  accepted_payment: string[] | null;
}

export default function CityDoctorCard({ doc, searchCity }: { doc: CityDoctor; searchCity: string }) {
  const name = `Dr. ${doc.first_name} ${doc.last_name}`;
  const isInCity = doc.city.toLowerCase() === searchCity.toLowerCase();
  const distLabel = isInCity
    ? formatDistance(doc.distance_miles)
    : `${formatDistance(doc.distance_miles)} from ${searchCity}`;

  const dirParts = [doc.city, doc.state].filter(Boolean);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dirParts.join(', '))}`;
  const profileUrl = `/directory/${doc.slug}`;

  const specialties = (doc.specialties || [])
    .flatMap((s: string) => s.split(/\n/).map(t => t.trim()))
    .filter((s: string) => s.length > 0 && s.length <= 45)
    .slice(0, 3);

  return (
    <Link href={profileUrl} className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange focus-visible:ring-offset-2" aria-label={`View profile for ${name}`}>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all">
        <div className="flex gap-5 items-start">
          <div className="w-16 h-16 rounded-2xl bg-neuro-navy flex-shrink-0 overflow-hidden flex items-center justify-center">
            {doc.photo_url ? (
              <img src={doc.photo_url} alt={name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <span className="text-white font-black text-xl">{doc.first_name?.[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="font-heading font-black text-neuro-navy text-lg">{name}</h2>
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-md border border-blue-200">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            </div>
            {doc.clinic_name && <p className="text-sm text-gray-500 font-medium">{doc.clinic_name}</p>}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3" /> {doc.city}, {doc.state}
              </span>
              <span className="text-xs text-neuro-orange font-bold">{distLabel}</span>
              {doc.accepting_new_patients && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                  <CheckCircle className="w-3 h-3" /> Accepting patients
                </span>
              )}
            </div>
          </div>
        </div>

        {doc.bio && <p className="text-sm text-gray-500 mt-3 line-clamp-2 leading-relaxed">{doc.bio}</p>}

        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {specialties.map((s: string, i: number) => (
              <span key={i} className="px-2.5 py-1 bg-neuro-orange/5 text-neuro-orange text-[10px] font-bold rounded-lg border border-neuro-orange/10">{s}</span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
          {doc.offers_telehealth && <span>Telehealth available</span>}
          {doc.accepts_walkins && <span>Walk-ins welcome</span>}
          {doc.accepted_payment?.includes('HSA/FSA') && <span>HSA/FSA accepted</span>}
        </div>

        <div className="flex gap-2 mt-4" onClick={(e) => e.preventDefault()}>
          {doc.booking_url ? (
            <a href={doc.booking_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="flex-1 py-3 bg-neuro-orange text-white rounded-xl hover:bg-neuro-orange/90 transition-colors flex items-center justify-center gap-2 text-xs font-bold min-h-[44px]"
              aria-label={`Book online with ${name}`}>
              <Calendar className="w-3.5 h-3.5" /> Book Online
            </a>
          ) : (
            <span className="flex-1 py-3 bg-neuro-navy text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold min-h-[44px]">
              View Profile <ArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
          {doc.phone && (
            <a href={`tel:${doc.phone}`} onClick={(e) => e.stopPropagation()}
              className="py-3 px-4 bg-neuro-navy/10 text-neuro-navy rounded-xl hover:bg-neuro-navy/20 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold min-h-[44px]"
              aria-label={`Call ${name}`}>
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
          )}
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="py-3 px-4 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold min-h-[44px]"
            aria-label={`Get directions to ${name}`}>
            <Navigation className="w-3.5 h-3.5" /> Map
          </a>
          {doc.booking_url && (
            <span className="py-3 px-4 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold min-h-[44px]">
              Profile <ArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
