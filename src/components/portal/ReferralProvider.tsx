'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ReferPatientDrawer from '@/components/portal/ReferPatientDrawer';

type OpenArgs = { doctorId?: string; userId?: string };

type ReferralApi = {
  openReferral: (args?: OpenArgs) => void;
};

const ReferralContext = createContext<ReferralApi | null>(null);

export function useReferralOptional() {
  return useContext(ReferralContext);
}

export function useReferral() {
  const ctx = useContext(ReferralContext);
  if (!ctx) throw new Error('ReferralProvider is missing');
  return ctx;
}

export default function ReferralProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [doctorId, setDoctorId] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const api = useMemo<ReferralApi>(() => ({
    openReferral(args) {
      setDoctorId(args?.doctorId);
      setUserId(args?.userId);
      setOpen(true);
    },
  }), []);

  return (
    <ReferralContext.Provider value={api}>
      {children}
      {open ? (
        <ReferPatientDrawer
          key={`${doctorId || ''}:${userId || ''}`}
          initialDoctorId={doctorId}
          initialUserId={userId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </ReferralContext.Provider>
  );
}

export function OpenReferralFromQuery() {
  const params = useSearchParams();
  const referral = useReferral();
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    const doctorId = params.get('to') || undefined;
    const userId = params.get('toUser') || undefined;
    if (doctorId || userId || params.get('again')) {
      opened.current = true;
      referral.openReferral({ doctorId, userId });
    }
  }, [params, referral]);
  return null;
}

export function ReferButton({
  label = 'Refer a patient',
  className,
  doctorId,
  userId,
}: {
  label?: string;
  className?: string;
  doctorId?: string;
  userId?: string;
}) {
  const referral = useReferral();
  return (
    <button
      type="button"
      onClick={() => referral.openReferral({ doctorId, userId })}
      className={className || 'min-h-11 inline-flex items-center justify-center px-4 rounded-lg bg-portal-accent text-sm font-bold text-white'}
    >
      {label}
    </button>
  );
}
