"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
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

  const setTier = useCallback((t: MembershipTier) => {
    setTierState(t);
    localStorage.setItem("nc_doctor_tier", t);
  }, []);

  const value = useMemo(() => ({
    tier,
    setTier,
    isMember: tier === 'starter' || tier === 'growth' || tier === 'pro',
    isGrowth: tier === 'growth' || tier === 'pro',
    isPro: tier === 'pro'
  }), [tier, setTier]);

  return (
    <DoctorTierContext.Provider value={value}>
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
