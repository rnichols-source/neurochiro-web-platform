"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { RegionCode, RegionConfig, REGIONS, DEFAULT_REGION } from "@/lib/regions";

interface RegionContextType {
  region: RegionConfig;
  setRegion: (code: RegionCode) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [region, setRegionState] = useState<RegionConfig>(DEFAULT_REGION);

  // Initialize from localStorage on mount, then auto-detect from timezone
  useEffect(() => {
    const saved = localStorage.getItem("nc_region") as RegionCode;
    if (saved && REGIONS[saved]) {
      setTimeout(() => setRegionState(REGIONS[saved]), 0);
      return;
    }

    // Auto-detect from browser timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.startsWith('Australia')) { setRegionState(REGIONS.AU); localStorage.setItem("nc_region", "AU"); }
      else if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Edmonton') || tz.includes('Winnipeg')) { setRegionState(REGIONS.CA); localStorage.setItem("nc_region", "CA"); }
      else if (tz === 'Europe/London') { setRegionState(REGIONS.UK); localStorage.setItem("nc_region", "UK"); }
      else if (tz.startsWith('Pacific/Auckland')) { setRegionState(REGIONS.NZ); localStorage.setItem("nc_region", "NZ"); }
      else if (tz.startsWith('Europe/') && tz !== 'Europe/London') { setRegionState(REGIONS.EU); localStorage.setItem("nc_region", "EU"); }
    } catch {}
  }, []);

  const setRegion = useCallback((code: RegionCode) => {
    const newRegion = REGIONS[code];
    setRegionState(newRegion);
    localStorage.setItem("nc_region", code);
    
    // Optionally trigger a refresh or broadcast event for data refetching
    console.log(`[REGION] Switched to ${code}`);
  }, []);

  const value = useMemo(() => ({ region, setRegion }), [region, setRegion]);

  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error("useRegion must be used within a RegionProvider");
  }
  return context;
}
