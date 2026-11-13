"use client";

import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
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
  seedSaved: (items: SavedItems) => void;
}

const EMPTY_SAVED: SavedItems = { doctors: [], jobs: [], vendors: [], seminars: [], articles: [] };
const LS_KEY = "nc_saved_items";
const SAVED_KEYS = ["doctors", "jobs", "vendors", "seminars", "articles"] as const;

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeSaved(value: Partial<SavedItems> | null | undefined): SavedItems {
  return {
    doctors: stringList(value?.doctors),
    jobs: stringList(value?.jobs),
    vendors: stringList(value?.vendors),
    seminars: stringList(value?.seminars),
    articles: stringList(value?.articles),
  };
}

function sameSaved(a: SavedItems, b: SavedItems): boolean {
  return SAVED_KEYS.every((key) => a[key].length === b[key].length && a[key].every((id, index) => id === b[key][index]));
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<SavedItems>(EMPTY_SAVED);
  const [lastLocation, setLastLocationState] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);
  const seeded = useRef(false);
  const acknowledged = useRef<SavedItems>(EMPTY_SAVED);

  const seedSaved = useCallback((items: SavedItems) => {
    const next = normalizeSaved(items);
    acknowledged.current = next;
    seeded.current = true;
    loaded.current = true;
    setSaved(next);
  }, []);

  // Server layouts seed this before the effect below, so the browser does not
  // call auth or doctor_tool_data on every portal page.
  useLayoutEffect(() => {
    if (seeded.current) loaded.current = true;
  }, []);

  useEffect(() => {
    if (seeded.current) return;
    async function load() {
      // Try localStorage first for instant display
      try {
        const local = localStorage.getItem(LS_KEY);
        if (local) {
          const next = normalizeSaved(JSON.parse(local));
          acknowledged.current = next;
          setSaved(next);
        }
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
            const cloud = normalizeSaved(data.data);
            acknowledged.current = cloud;
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
    if (sameSaved(saved, acknowledged.current)) return;
    const snapshot = normalizeSaved(saved);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      acknowledged.current = snapshot;
      try { localStorage.setItem(LS_KEY, JSON.stringify(snapshot)); } catch {}
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          (supabase as any)
            .from('doctor_tool_data')
            .upsert({
              user_id: user.id,
              tool: 'saved_items',
              data: snapshot,
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
      const isSaving = !current.includes(id);
      const next = isSaving
        ? [...current, id]
        : current.filter(itemId => itemId !== id);

      // Notify doctor when a patient saves their profile
      if (type === 'doctors' && isSaving) {
        import('@/app/actions/notify-save').then(({ notifyDoctorSaved }) => {
          notifyDoctorSaved(id).catch(() => {});
        });
      }

      return { ...prev, [type]: next };
    });
  }, []);

  const isSaved = useCallback((type: keyof SavedItems, id: string) => {
    return saved[type].includes(id);
  }, [saved]);

  const value = useMemo(() => ({
    saved, toggleSave, isSaved, lastLocation, setLastLocation, seedSaved
  }), [saved, toggleSave, isSaved, lastLocation, setLastLocation, seedSaved]);

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
