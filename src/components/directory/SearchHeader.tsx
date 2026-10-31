"use client";

import type { Ref } from "react";
import Link from "next/link";
import { Target, X } from "lucide-react";
import type { SearchFilters } from "./useDirectorySearch";

const PILLS = ["Accepting new patients", "Pediatric", "Prenatal", "Migraines", "Sciatica", "Upper Cervical", "Torque Release"];

export default function SearchHeader({
  collapsed,
  onExpand,
  location,
  placeholder,
  countryFlag,
  countryCode,
  summary,
  locating,
  suggestions,
  suggestOpen,
  filters,
  onLocation,
  onSubmit,
  onNearMe,
  onClear,
  onCountry,
  onFilters,
  onSpecialty,
  onPickCity,
  onPickDoctor,
  onSearchAll,
  inputRef,
}: {
  collapsed: boolean;
  onExpand: () => void;
  location: string;
  placeholder: string;
  countryFlag: string;
  countryCode: string;
  summary: string;
  locating: boolean;
  suggestions: { cities: { city: string; state: string; count?: number }[]; doctors: { name: string; slug: string; photo_url?: string; location?: string }[] };
  suggestOpen: boolean;
  filters: SearchFilters;
  onLocation: (value: string) => void;
  onSubmit: (value?: string) => void;
  onNearMe: () => void;
  onClear: () => void;
  onCountry: () => void;
  onFilters: () => void;
  onSpecialty: (specialty: string) => void;
  onPickCity: (label: string) => void;
  onPickDoctor: () => void;
  onSearchAll: () => void;
  inputRef: Ref<HTMLInputElement>;
}) {
  if (collapsed) {
    return (
      <button type="button" onClick={onExpand} className="min-h-11 w-full truncate rounded-xl bg-white/10 px-3 text-left text-sm font-semibold text-white">
        {summary}
      </button>
    );
  }

  const filterCount = [filters.newPatients, filters.telehealth, filters.walkins, filters.radius > 0, filters.name.length > 0].filter(Boolean).length + filters.specialties.length;

  return (
    <div>
      <div className="flex items-center gap-2">
        <Link href="/" className="flex h-11 w-11 shrink-0 items-center justify-center" aria-label="NeuroChiro home">
          <img src="/logo-white.png" alt="" className="h-5 w-5" />
        </Link>
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            value={location}
            onChange={(event) => onLocation(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit(event.currentTarget.value);
            }}
            placeholder={placeholder}
            aria-label="Location"
            data-testid="location-input"
            enterKeyHint="search"
            autoComplete="address-level2"
            inputMode="search"
            className="h-12 w-full rounded-xl border border-neuro-orange/40 bg-white/10 pl-3 pr-12 text-base font-semibold text-white placeholder:text-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neuro-orange"
          />
          {location ? (
            <button type="button" onClick={onClear} className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center text-white" aria-label="Clear location">
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button type="button" onClick={onNearMe} className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center text-neuro-orange" aria-label="Near me" disabled={locating}>
              <Target className="h-5 w-5" />
            </button>
          )}
        </div>
        <button type="button" onClick={onCountry} data-testid="country-chip" className="flex h-12 min-w-11 shrink-0 items-center gap-1 rounded-xl bg-white/10 px-3 text-sm font-bold text-white" aria-label={`Country ${countryCode}`}>
          <span aria-hidden>{countryFlag}</span> {countryCode} ▾
        </button>
      </div>
      {suggestOpen && (suggestions.cities.length > 0 || suggestions.doctors.length > 0) && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-xl bg-[#2c2c2e] p-2">
          {suggestions.cities.map((city) => {
            const label = city.city ? `${city.city}${city.state ? `, ${city.state}` : ""}` : city.state;
            return (
              <button key={label} type="button" onClick={() => onPickCity(label)} className="flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-left text-sm text-white">
                <span>{label}</span>
                {city.count != null && <span className="text-white/60">{city.count}</span>}
              </button>
            );
          })}
          {suggestions.doctors.map((doctor) => (
            <Link key={doctor.slug} href={`/directory/${doctor.slug}`} prefetch={false} onClick={onPickDoctor} className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-white">
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-neuro-orange/20 text-xs font-bold">
                {doctor.photo_url ? <img src={doctor.photo_url} alt="" className="h-full w-full object-cover" /> : (doctor.name || "?").replace(/^Dr\.\s*/i, "").charAt(0)}
              </span>
              <span>{doctor.name}</span>
            </Link>
          ))}
          <button type="button" onClick={onSearchAll} className="min-h-11 w-full rounded-lg px-2 text-left text-sm font-semibold text-neuro-orange">Search all countries</button>
        </div>
      )}
      <div className="mt-2 -mx-1 overflow-x-auto">
        <div className="flex gap-2 px-1">
          <button type="button" onClick={onFilters} className="min-h-11 shrink-0 rounded-full bg-white/10 px-3 text-sm font-bold text-white">
            Filters{filterCount > 0 ? ` (${filterCount})` : ""}
          </button>
          {PILLS.map((pill) => {
            const active = pill === "Accepting new patients" ? filters.newPatients : filters.specialties.includes(pill);
            return (
              <button key={pill} type="button" onClick={() => onSpecialty(pill)} className={`min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold ${active ? "bg-neuro-orange text-white" : "bg-white/10 text-white"}`}>
                {pill}{active ? " ✕" : ""}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
