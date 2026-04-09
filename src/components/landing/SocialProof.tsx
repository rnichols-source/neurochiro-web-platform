"use client";

import { useEffect, useState } from "react";
import { Users, Globe, ShieldCheck, MapPin } from "lucide-react";

interface SocialProofProps {
  doctorCount?: number;
  variant?: "hero" | "inline";
}

export default function SocialProof({ variant = "hero" }: SocialProofProps) {
  const [stats, setStats] = useState({ doctors: 140, countries: 6 });

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.doctors) setStats({ doctors: d.doctors, countries: d.countries || 6 });
      })
      .catch(() => {});
  }, []);

  const items = [
    { icon: Users, label: `${stats.doctors}+ Verified Doctors` },
    { icon: MapPin, label: `${stats.countries} Countries` },
    { icon: ShieldCheck, label: "100% Verified Profiles" },
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
