'use client';

import { useState } from 'react';
import { PRO_PRICE_LABEL } from '@/lib/portal/membership';

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' });
          const data = await res.json();
          if (data.url) window.location.href = data.url;
          else alert(data.error || 'Failed to open billing portal.');
        } catch {
          alert('An error occurred. Please try again.');
        } finally {
          setLoading(false);
        }
      }}
      className="min-h-11 w-full px-4 rounded-lg bg-portal-ink text-white text-sm font-bold sm:w-auto"
    >
      {loading ? 'Opening…' : 'Manage billing'}
    </button>
  );
}

export function ActivateProButtons() {
  const [loading, setLoading] = useState(false);
  async function start(cycle: 'monthly' | 'annual') {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/upgrade-to-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycle }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert('Unable to start checkout. Please try again or contact support.');
    } catch {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex flex-col gap-3 max-w-xs">
      <button type="button" disabled={loading} onClick={() => start('monthly')} className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold">
        {loading ? 'Redirecting…' : `Activate Pro — ${PRO_PRICE_LABEL}`}
      </button>
      <button type="button" disabled={loading} onClick={() => start('annual')} className="min-h-11 px-4 rounded-lg border border-portal-border text-sm font-bold">
        Annual — $490/yr
      </button>
    </div>
  );
}
