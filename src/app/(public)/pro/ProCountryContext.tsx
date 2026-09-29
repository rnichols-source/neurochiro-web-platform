"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const CountryContext = createContext<{
  country: string;
  setCountry: (c: string) => void;
}>({ country: "US", setCountry: () => {} });

export function ProCountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState("US");
  return (
    <CountryContext.Provider value={{ country, setCountry }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useProCountry() {
  return useContext(CountryContext);
}
