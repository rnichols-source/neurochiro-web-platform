"use client";

import DoctorCard from "./DoctorCard";
import EmptyState from "./EmptyState";
import { DoctorCardSkeleton } from "./DirectorySkeleton";
import type { DirectoryDoctor } from "./useDirectorySearch";

export default function ResultsList({
  doctors,
  loading,
  error,
  location,
  locationLabel,
  radius,
  unit,
  unknownPlace,
  suggestion,
  nearest,
  onSuggest,
  onWiden,
  onRetry,
  onHover,
  onNavigate,
}: {
  doctors: DirectoryDoctor[];
  loading: boolean;
  error: boolean;
  location: string;
  locationLabel: string;
  radius: number;
  unit: "mi" | "km";
  unknownPlace: boolean;
  suggestion: string;
  nearest: DirectoryDoctor[];
  onSuggest: (value: string) => void;
  onWiden: () => void;
  onRetry: () => void;
  onHover: (id: string | null) => void;
  onNavigate: () => void;
}) {
  const summary = locationLabel || (location ? `${doctors.length} doctors near ${location}` : `${doctors.length} doctors`);
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-white" aria-live="polite">{doctors.length} doctors{location ? ` near ${location}` : ""}{locationLabel ? `. ${summary}` : ""}</p>
      {loading && doctors.length === 0 && [1, 2, 3].map((item) => <DoctorCardSkeleton key={item} />)}
      {!loading && (error || doctors.length === 0) && (
        <EmptyState
          location={location}
          radius={radius}
          unit={unit}
          unknownPlace={unknownPlace}
          suggestion={suggestion}
          nearest={doctors.length === 0 ? nearest : []}
          onSuggest={onSuggest}
          onWiden={onWiden}
          error={error}
          onRetry={onRetry}
        />
      )}
      {doctors.map((doc, index) => (
        <DoctorCard key={doc.id} doc={doc} index={index} dark distanceUnit={unit} onHover={onHover} onNavigate={onNavigate} />
      ))}
    </div>
  );
}
