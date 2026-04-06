"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { MembershipTier } from '@/types/directory';
import { createClient } from '@/lib/supabase';

interface DoctorTierContextType {
  tier: MembershipTier;
  setTier: (tier: MembershipTier) => void;
  isMember: boolean;
  isGrowth: boolean;
  isPro: boolean;
  loading: boolean;
}

const DoctorTierContext = createContext<DoctorTierContextType | undefined>(undefined);

export function DoctorTierProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<MembershipTier>('starter');
  const [loading, setLoading] = useState(true);

  // Load tier from database via client-side Supabase query (not server action)
  // This avoids the server action cookie issues that break hydration
  useEffect(() => {
    async function loadTier() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) { setLoading(false); return; }

        const [profileRes, doctorRes] = await Promise.all([
          supabase.from('profiles').select('role').eq('id', user.id).single(),
          supabase.from('doctors').select('membership_tier').eq('user_id', user.id).single()
        ]);

        const role = profileRes.data?.role || 'doctor';
        const isAdmin = ['admin', 'super_admin', 'founder', 'regional_admin'].includes(role);
        const dbTier = (doctorRes.data?.membership_tier as MembershipTier) || 'starter';

        setTierState(isAdmin ? 'pro' : dbTier);
      } catch {
        setTierState('starter');
      } finally {
        setLoading(false);
      }
    }
    loadTier();
  }, []);

  const setTier = useCallback((t: MembershipTier) => {
    setTierState(t);
  }, []);

  const value = useMemo(() => ({
    tier,
    setTier,
    isMember: tier === 'starter' || tier === 'growth' || tier === 'pro',
    isGrowth: tier === 'growth' || tier === 'pro',
    isPro: tier === 'pro',
    loading,
  }), [tier, setTier, loading]);

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
