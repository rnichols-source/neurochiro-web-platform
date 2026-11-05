"use client";

import { useEffect, useRef, useState } from "react";
import type { SearchFilters } from "./useDirectorySearch";
import { fill } from "@/i18n/config";
import { useDictionary } from "@/i18n/locale-context";

const SPECIALTIES = ["Pediatric", "Prenatal", "Migraines", "Sciatica", "Upper Cervical", "Torque Release", "Sports", "Gonstead"] as const;
const MILES = [10, 25, 50, 100, 0];

export default function FiltersSheet({
  open,
  onClose,
  value,
  unit,
  resultCount,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  value: SearchFilters;
  unit: "mi" | "km";
  resultCount: number;
  onApply: (next: SearchFilters) => void;
}) {
  const t = useDictionary();
  const specialtyLabel: Record<(typeof SPECIALTIES)[number], string> = {
    Pediatric: t.directory.pills.pediatric,
    Prenatal: t.directory.pills.prenatal,
    Migraines: t.directory.pills.migraines,
    Sciatica: t.directory.pills.sciatica,
    "Upper Cervical": t.directory.pills.upper,
    "Torque Release": t.directory.pills.torque,
    Sports: t.directory.pills.sports,
    Gonstead: t.directory.pills.gonstead,
  };
  const [draft, setDraft] = useState(value);
  const [wasOpen, setWasOpen] = useState(open);
  const ref = useRef<HTMLDivElement>(null);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (specialty: string) => {
    setDraft((current) => ({
      ...current,
      specialties: current.specialties.includes(specialty)
        ? current.specialties.filter((item) => item !== specialty)
        : [...current.specialties, specialty],
    }));
  };

  return (
    <div className="fixed inset-0 z-[240] bg-black/60" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t.directory.filters}
        className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-[#1c1c1e] p-4 text-white pb-[calc(16px+env(safe-area-inset-bottom))] lg:inset-auto lg:left-4 lg:top-28 lg:w-[380px] lg:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">{t.directory.filters}</h2>
        <label className="flex min-h-11 items-center justify-between gap-3 mb-4">
          <span>{t.directory.pills.accepting}</span>
          <input type="checkbox" checked={draft.newPatients} onChange={(event) => setDraft({ ...draft, newPatients: event.target.checked })} className="h-5 w-5 accent-neuro-orange" />
        </label>
        <p className="text-sm text-white/70 mb-2">{t.directory.distance}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {MILES.map((miles) => (
            <button key={miles} type="button" onClick={() => setDraft({ ...draft, radius: miles })} className={`min-h-11 rounded-full px-3 text-sm font-bold ${draft.radius === miles ? "bg-neuro-orange text-white" : "bg-white/10"}`}>
              {miles === 0 ? t.directory.any : unit === "km" ? `${Math.round(miles * 1.60934)} km` : `${miles} mi`}
            </button>
          ))}
        </div>
        <p className="text-sm text-white/70 mb-2">{t.directory.specialties}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {SPECIALTIES.map((specialty) => (
            <button key={specialty} type="button" onClick={() => toggle(specialty)} className={`min-h-11 rounded-full px-3 text-sm font-semibold ${draft.specialties.includes(specialty) ? "bg-neuro-orange text-white" : "bg-white/10"}`}>
              {specialtyLabel[specialty]}
            </button>
          ))}
        </div>
        <label className="flex min-h-11 items-center justify-between mb-2">
          <span>{t.directory.telehealth}</span>
          <input type="checkbox" checked={draft.telehealth} onChange={(event) => setDraft({ ...draft, telehealth: event.target.checked })} className="h-5 w-5 accent-neuro-orange" />
        </label>
        <label className="flex min-h-11 items-center justify-between mb-4">
          <span>{t.directory.walkins}</span>
          <input type="checkbox" checked={draft.walkins} onChange={(event) => setDraft({ ...draft, walkins: event.target.checked })} className="h-5 w-5 accent-neuro-orange" />
        </label>
        <p className="text-sm text-white/70 mb-2">{t.directory.sort}</p>
        <div className="flex gap-2 mb-4">
          {([["distance", t.directory.nearest], ["name", t.directory.az]] as const).map(([sort, label]) => (
            <button key={sort} type="button" onClick={() => setDraft({ ...draft, sort })} className={`min-h-11 rounded-full px-4 text-sm font-bold ${draft.sort === sort ? "bg-neuro-orange" : "bg-white/10"}`}>{label}</button>
          ))}
        </div>
        <label className="block text-sm text-white/70 mb-2" htmlFor="doctor-name-search">{t.directory.searchName}</label>
        <input
          id="doctor-name-search"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          className="mb-4 w-full min-h-11 rounded-xl bg-white/10 px-3 text-base text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-neuro-orange"
          placeholder={t.directory.namePlaceholder}
          enterKeyHint="search"
        />
        <div className="flex gap-2">
          <button type="button" onClick={() => { const cleared = { ...draft, specialties: [], newPatients: false, telehealth: false, walkins: false, radius: 0, sort: "distance" as const, name: "" }; setDraft(cleared); onApply(cleared); onClose(); }} className="min-h-11 rounded-xl bg-white/10 px-4 font-bold">{t.directory.reset}</button>
          <button type="button" onClick={() => { onApply(draft); onClose(); }} className="min-h-11 flex-1 rounded-xl bg-neuro-orange font-bold">{fill(t.directory.showCount, { count: resultCount })}</button>
        </div>
      </div>
    </div>
  );
}
