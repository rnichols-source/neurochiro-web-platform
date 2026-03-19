"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

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

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<SavedItems>({
    doctors: [],
    jobs: [],
    vendors: [],
    seminars: [],
    articles: []
  });
  const [lastLocation, setLastLocationState] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("nc_saved_items");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setTimeout(() => setSaved(parsed), 0);
      } catch (e) {
        console.error("Failed to parse saved items", e);
      }
    }

    const savedLocation = localStorage.getItem("nc_last_location");
    if (savedLocation) {
      setLastLocationState(savedLocation);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("nc_saved_items", JSON.stringify(saved));
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
    saved,
    toggleSave,
    isSaved,
    lastLocation,
    setLastLocation
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
