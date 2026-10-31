'use client';

import { useEffect, useState } from 'react';
import { notifyComingSoon } from './actions';

export default function NotifyButton({ featureKey }: { featureKey: string }) {
  const storageKey = `nc_notify_${featureKey}`;
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setSaved(window.localStorage.getItem(storageKey) === '1');
  }, [storageKey]);

  if (saved) return <p className="text-sm font-bold text-portal-success">We will let you know</p>;

  return (
    <button
      type="button"
      className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold"
      onClick={async () => {
        await notifyComingSoon(featureKey);
        window.localStorage.setItem(storageKey, '1');
        setSaved(true);
      }}
    >
      Notify me
    </button>
  );
}
