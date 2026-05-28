"use client";

import { useEffect, useState } from "react";

interface Stats {
  doctors: number;
  cities: number;
  states: number;
  countries: number;
}

/**
 * Dynamic network stats — fetches from /api/stats, caches client-side.
 *
 * Usage:
 *   <NetworkStats />                          → "190 Verified Doctors · 32 Cities · 6 Countries"
 *   <NetworkStats format="doctors" />          → "190+"
 *   <NetworkStats format="doctors-label" />    → "190+ Verified Doctors"
 *   <NetworkStats format="full-sentence" />    → "Join 190+ nervous system chiropractors..."
 */
export default function NetworkStats({ format = "inline", className }: { format?: "inline" | "doctors" | "doctors-label" | "full-sentence"; className?: string }) {
  const [stats, setStats] = useState<Stats>({ doctors: 140, cities: 30, states: 25, countries: 6 });

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const d = stats.doctors;

  if (format === "doctors") {
    return <span className={className}>{d}+</span>;
  }
  if (format === "doctors-label") {
    return <span className={className}>{d}+ Verified Doctors</span>;
  }
  if (format === "full-sentence") {
    return <span className={className}>Join {d}+ nervous system chiropractors</span>;
  }
  // inline (default)
  return <span className={className}>{d} Verified Doctors · {stats.cities} Cities · {stats.countries} Countries</span>;
}

/** Server-side helper — use in metadata or static text where client component isn't needed */
export async function getNetworkStats(): Promise<Stats> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_URL || 'https://neurochiro.co'}/api/stats`, { next: { revalidate: 300 } });
    return await res.json();
  } catch {
    return { doctors: 140, cities: 30, states: 25, countries: 6 };
  }
}
