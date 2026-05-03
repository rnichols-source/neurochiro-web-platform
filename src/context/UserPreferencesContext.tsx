"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";

interface SavedItems {
  doctors: string[];
  jobs: string[];
  vendors: string[];
  seminars: string[];
  articles: string[];
}

interface UserPreferencesContextType {
  saved: SavedItems;
  toggleSave: (type: keyof SavedItems, id: string) => void;
  isSaved: (type: keyof SavedItems, id: string) => boolean;
  lastLocation: string;
  setLastLocation: (location: string) => void;
}

const EMPTY_SAVED: SavedItems = { doctors: [], jobs: [], vendors: [], seminars: [], articles: [] };
const LS_KEY = "nc_saved_items";

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<SavedItems>(EMPTY_SAVED);
  const [lastLocation, setLastLocationState] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);

  // Load from Supabase (localStorage fallback)
  useEffect(() => {
    async function load() {
      // Try localStorage first for instant display
      try {
        const local = localStorage.getItem(LS_KEY);
        if (local) setSaved({ ...EMPTY_SAVED, ...JSON.parse(local) });
      } catch {}

      // Then try Supabase for authoritative data
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await (supabase as any)
            .from('doctor_tool_data')
            .select('data')
            .eq('user_id', user.id)
            .eq('tool', 'saved_items')
            .maybeSingle();
          if (data?.data) {
            const cloud = { ...EMPTY_SAVED, ...data.data };
            setSaved(cloud);
            // Sync cloud to localStorage
            try { localStorage.setItem(LS_KEY, JSON.stringify(cloud)); } catch {}
          }
        }
      } catch {}
      loaded.current = true;
    }
    load();

    const savedLocation = localStorage.getItem("nc_last_location");
    if (savedLocation) setLastLocationState(savedLocation);
  }, []);

  // Save to Supabase + localStorage (debounced)
  useEffect(() => {
    if (!loaded.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // localStorage (always)
      try { localStorage.setItem(LS_KEY, JSON.stringify(saved)); } catch {}
      // Supabase (if authenticated)
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          (supabase as any)
            .from('doctor_tool_data')
            .upsert({
              user_id: user.id,
              tool: 'saved_items',
              data: saved,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,tool' })
            .then(() => {});
        }
      }).catch(() => {});
    }, 1000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [saved]);

  const setLastLocation = useCallback((location: string) => {
    setLastLocationState(location);
    localStorage.setItem("nc_last_location", location);
  }, []);

  const toggleSave = useCallback((type: keyof SavedItems, id: string) => {
    setSaved(prev => {
      const current = prev[type];
      const next = current.includes(id)
        ? current.filter(itemId => itemId !== id)
        : [...current, id];
      return { ...prev, [type]: next };
    });
  }, []);

  const isSaved = useCallback((type: keyof SavedItems, id: string) => {
    return saved[type].includes(id);
  }, [saved]);

  const value = useMemo(() => ({
    saved, toggleSave, isSaved, lastLocation, setLastLocation
  }), [saved, toggleSave, isSaved, lastLocation, setLastLocation]);

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
  }
  return context;
}
