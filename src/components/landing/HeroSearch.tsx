"use client";

import { FormEvent, ReactNode, useState } from "react";
import Link from "next/link";
import { Crosshair } from "lucide-react";
import { useRegion } from "@/context/RegionContext";
import RegionSwitcher from "@/components/layout/RegionSwitcher";
import type { PublicDirectoryCounts } from "@/lib/directory/public-counts";
import type { RegionCode } from "@/lib/regions";

export type TrustFace = { name: string; photo: string };

const PLACEHOLDERS: Partial<Record<RegionCode, string>> = {
  US: "City or ZIP code",
  CA: "City or postal code",
  UK: "Town or postcode",
  NZ: "Town or postcode",
  AU: "Town or postcode",
  EU: "Town or postcode",
};

const CHIPS = [
  { label: "Kids & babies", href: "/directory?specialties=Pediatric" },
  { label: "Pregnancy", href: "/directory?specialties=Prenatal" },
  { label: "Migraines & headaches", href: "/directory?specialties=Migraines" },
  { label: "Sciatica & back pain", href: "/directory?specialties=Sciatica" },
  { label: "Not sure? Take the 60-sec quiz", href: "/quiz" },
];

function eyebrowText(counts: PublicDirectoryCounts, code: RegionCode, label: string) {
  if (code === "US") {
    if (counts.total <= 0 || counts.countries <= 0) return null;
    return `Free for patients · ${counts.total} verified doctors in ${counts.countries} countries`;
  }
  const count = counts.byCountry[code] || 0;
  if (count <= 0) return null;
  return `${count} verified doctors in ${label}`;
}

export default function HeroSearch({
  counts,
  faces,
  children,
}: {
  counts: PublicDirectoryCounts;
  faces: TrustFace[];
  children: ReactNode;
}) {
  const { region } = useRegion();
  const [location, setLocation] = useState("");
  const [hint, setHint] = useState("");
  const placeholder = PLACEHOLDERS[region.code] || "City or postal code";
  const eyebrow = eyebrowText(counts, region.code, region.label);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    const value = location.trim();
    if (!value) {
      event.preventDefault();
      setHint("Type a city or ZIP, or use your location");
      document.getElementById("hero-location")?.focus();
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
      {eyebrow && (
        <p className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-left text-xs font-bold leading-snug text-gray-300">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" aria-hidden />
          <span>{eyebrow}</span>
        </p>
      )}

      {children}

      <form action="/directory" method="get" onSubmit={submit} className="mt-4 rounded-2xl bg-white p-3 text-left shadow-xl shadow-black/20">
        <label htmlFor="hero-location" className="sr-only">
          {placeholder}
        </label>
        <div className="relative">
          <input
            id="hero-location"
            name="location"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="postal-code"
            value={location}
            onChange={(event) => {
              setLocation(event.target.value);
              if (hint) setHint("");
            }}
            placeholder={placeholder}
            aria-invalid={hint ? true : undefined}
            aria-describedby={hint ? "hero-location-hint" : undefined}
            className="h-[54px] w-full rounded-xl border border-gray-200 bg-white pl-4 pr-[4.5rem] text-[17px] font-bold text-neuro-navy placeholder:font-medium placeholder:text-gray-500 focus:border-neuro-orange-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-neuro-orange-ink scroll-mt-28"
          />
          <input type="hidden" name="country" value={region.code} />
          <div className="absolute inset-y-0 right-1 flex items-center">
            <RegionSwitcher compact tone="light" />
          </div>
        </div>
        {hint && (
          <p id="hero-location-hint" className="mt-2 text-sm font-semibold text-neuro-orange-ink" role="alert">
            {hint}
          </p>
        )}
        <button
          type="submit"
          className="mt-2 flex h-[52px] w-full items-center justify-center rounded-xl bg-neuro-orange-ink px-4 text-base font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neuro-navy"
        >
          Find doctors near me
        </button>
        <Link
          href={`/directory?near=1&country=${region.code}`}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-neuro-cream px-4 text-base font-bold text-neuro-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neuro-orange-ink"
        >
          <Crosshair className="h-5 w-5 shrink-0" aria-hidden />
          Use my current location
        </Link>
        {/* TODO: directory search does not support focus=name. Send people to /directory until that exists. */}
        <Link
          href="/directory"
          className="mt-1 flex min-h-11 items-center justify-center text-sm font-bold text-neuro-orange-ink lg:justify-start"
        >
          Search by doctor or clinic name →
        </Link>
      </form>

      <div className="mt-4">
        <p id="popular-searches-label" className="mb-2 text-xs font-bold text-gray-300 lg:text-left">
          Popular searches:
        </p>
        <nav aria-labelledby="popular-searches-label" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {CHIPS.map((chip) => {
            const href = chip.href.startsWith("/directory")
              ? `${chip.href}&country=${region.code}`
              : chip.href;
            return (
              <Link
                key={chip.label}
                href={href}
                className="inline-flex h-11 shrink-0 items-center rounded-full border border-white/70 px-4 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {chip.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <p className="mt-4 flex items-center justify-center gap-3 text-left text-sm leading-snug text-gray-300 lg:justify-start">
          {faces.length > 0 && (
            <span className="flex shrink-0 -space-x-2">
              {faces.map((face) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={face.photo}
                  src={face.photo}
                  alt={face.name}
                  width={36}
                  height={36}
                  sizes="36px"
                  className="h-9 w-9 rounded-full border-2 border-neuro-navy object-cover"
                />
              ))}
            </span>
          )}
          <span>
            <strong className="font-bold text-white">Every doctor is verified.</strong> Offices usually reply within 1 business day.
          </span>
        </p>
    </div>
  );
}
