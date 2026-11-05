"use client";

import { formatDistance } from "@/lib/geo";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { useDictionary } from "@/i18n/locale-context";

export type PeekDoctor = {
  name?: string;
  slug?: string;
  doctorId?: string;
  city?: string;
  state?: string;
  photo_url?: string;
  distance_miles?: number | null;
};

export default function MapPeekCard({
  doctor,
  unit,
  onClose,
}: {
  doctor: PeekDoctor;
  unit: "mi" | "km";
  onClose: () => void;
}) {
  const t = useDictionary();
  const name = doctor.name || t.directory.doctorFallback;
  const slug = doctor.slug || doctor.doctorId;
  const miles = doctor.distance_miles as number | null | undefined;
  return (
    <div className="absolute inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[30] rounded-2xl bg-[#1c1c1e] p-4 text-white shadow-2xl lg:hidden" role="dialog" aria-label={name}>
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 overflow-hidden rounded-xl bg-neuro-navy">
          {doctor.photo_url ? <img src={doctor.photo_url} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold">{name}</p>
          <p className="text-sm text-white/70">{[doctor.city, doctor.state].filter(Boolean).join(", ")}{miles != null ? ` · ${formatDistance(miles, unit)}` : ""}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link href={`/directory/${slug}#appointment-form`} prefetch={false} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-neuro-orange text-sm font-bold">{t.directory.request}</Link>
        <Link href={`/directory/${slug}`} prefetch={false} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/10 px-3 text-sm font-bold">{t.directory.viewProfile}</Link>
        <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-xl bg-white/10" aria-label={t.directory.closePreview}>✕</button>
      </div>
    </div>
  );
}
