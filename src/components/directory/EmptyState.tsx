"use client";

import Link from "next/link";
import { formatDistance } from "@/lib/geo";
import type { DirectoryDoctor } from "./useDirectorySearch";

export default function EmptyState({
  location,
  radius,
  unit,
  unknownPlace,
  suggestion,
  nearest,
  onSuggest,
  onWiden,
  error,
  onRetry,
}: {
  location: string;
  radius: number;
  unit: "mi" | "km";
  unknownPlace: boolean;
  suggestion: string;
  nearest: DirectoryDoctor[];
  onSuggest: (value: string) => void;
  onWiden: () => void;
  error: boolean;
  onRetry: () => void;
}) {
  if (error) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-white font-bold mb-3">Something went wrong</p>
        <button type="button" onClick={onRetry} className="min-h-11 rounded-xl bg-neuro-orange px-5 font-bold text-white">Retry</button>
      </div>
    );
  }

  if (unknownPlace) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#1c1c1e] p-6 text-white">
        <p className="font-bold">We couldn&apos;t find &apos;{location}&apos;.</p>
        {suggestion && (
          <button type="button" onClick={() => onSuggest(suggestion)} className="mt-3 min-h-11 text-left font-semibold text-neuro-orange">
            Did you mean {suggestion}?
          </button>
        )}
      </div>
    );
  }

  const distance = radius > 0 ? (unit === "km" ? `${Math.round(radius * 1.60934)} km` : `${radius} mi`) : "this area";
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1c1c1e] p-5 text-white">
      <h2 className="text-lg font-bold">No NeuroChiro doctor within {distance} of {location || "this search"} yet.</h2>
      {nearest.length > 0 && (
        <ul className="mt-4 space-y-2">
          {nearest.map((doc) => (
            <li key={doc.id}>
              <Link href={`/directory/${doc.slug || doc.id}`} prefetch={false} className="block rounded-xl bg-white/5 p-3">
                <span className="font-bold">Dr. {doc.first_name} {doc.last_name}</span>
                <span className="block text-sm text-white/70">{[doc.city, doc.state].filter(Boolean).join(", ")}{doc.distance_miles != null ? ` · ${formatDistance(doc.distance_miles, unit)}` : ""}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={onWiden} className="min-h-11 rounded-xl bg-white/10 font-bold">Widen to {unit === "km" ? "160 km" : "100 mi"}</button>
        <Link href={`/list?source=directory_empty${location ? `&zip=${encodeURIComponent(location)}` : ""}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neuro-orange font-bold text-white">
          Get notified when one joins
        </Link>
      </div>
    </div>
  );
}
