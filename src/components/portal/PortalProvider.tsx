'use client';

import { createContext, useContext } from 'react';
import type { PortalContextValue } from '@/lib/portal/types';

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({ value, children }: { value: PortalContextValue; children: React.ReactNode }) {
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal(): PortalContextValue {
  const value = useContext(PortalContext);
  if (!value) throw new Error('usePortal must be used inside the doctor portal');
  return value;
}
