"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MembershipTier } from '@/types/directory';

interface DoctorTierContextType {
  tier: MembershipTier;
  setTier: (tier: MembershipTier) => void;
  isMember: boolean;
  isGrowth: boolean;
  isPro: boolean;
}

const DoctorTierContext = createContext<DoctorTierContextType | undefined>(undefined);

export function DoctorTierProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<MembershipTier>('growth');

  useEffect(() => {
    const saved = localStorage.getItem("nc_doctor_tier") as MembershipTier;
    if (saved) setTierState(saved);
  }, []);

  const setTier = (t: MembershipTier) => {
    setTierState(t);
    localStorage.setItem("nc_doctor_tier", t);
  };

  const isMember = tier === 'starter' || tier === 'growth' || tier === 'pro';
  const isGrowth = tier === 'growth' || tier === 'pro';
  const isPro = tier === 'pro';

  return (
    <DoctorTierContext.Provider value={{ tier, setTier, isMember, isGrowth, isPro }}>
      {children}
    </DoctorTierContext.Provider>
  );
}

export function useDoctorTier() {
  const context = useContext(DoctorTierContext);
  if (context === undefined) {
    throw new Error('useDoctorTier must be used within a DoctorTierProvider');
  }
  return context;
}
