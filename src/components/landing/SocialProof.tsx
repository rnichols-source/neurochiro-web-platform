"use client";

import { useEffect, useState } from "react";
import { Users, Globe, ShieldCheck, MapPin } from "lucide-react";

interface SocialProofProps {
  doctorCount?: number;
  variant?: "hero" | "inline";
}

export default function SocialProof({ variant = "hero" }: SocialProofProps) {
  const [stats, setStats] = useState<{ doctors: number; countries: number } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.doctors !== undefined) setStats({ doctors: d.doctors, countries: d.countries || 1 });
      })
      .catch(() => setStats({ doctors: 0, countries: 0 }));
  }, []);

  if (!stats) return null; // Don't show until real data loads

  const items = [
    ...(stats.doctors > 0 ? [{ icon: Users, label: `${stats.doctors}+ Verified Doctors` }] : []),
    ...(stats.countries > 1 ? [{ icon: MapPin, label: `${stats.countries} Countries` }] : []),
    { icon: ShieldCheck, label: "Every Profile Reviewed" },
  ];

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap justify-center gap-6">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-gray-500">
            <item.icon className="w-4 h-4 text-neuro-orange" />
            <span className="text-sm font-bold">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-8 mt-12 max-w-2xl mx-auto">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-gray-400">
          <item.icon className="w-4 h-4 text-neuro-orange" />
          <span className="text-sm font-bold">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
