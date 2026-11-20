'use client';

import { useState } from 'react';
import { PRO_PRICE_LABEL } from '@/lib/portal/membership';

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  return (
    <div>
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' });
          const data = await res.json();
          if (data.url) window.location.href = data.url;
          else setNote(data.error || 'The billing page did not open. Try again. That page is where you update the card and open receipts.');
        } catch {
          setNote('The billing page did not open. Try again in a minute.');
        } finally {
          setLoading(false);
        }
      }}
      className="min-h-11 w-full px-4 rounded-lg bg-portal-ink text-white text-sm font-bold sm:w-auto"
    >
      {loading ? 'Opening…' : 'Update card and receipts'}
    </button>
    {note ? <p className="mt-2 text-sm text-portal-ink" role="alert">{note}</p> : <p className="mt-2 text-sm text-portal-ink-2">Opens Stripe, where you update the card and open receipts.</p>}
    </div>
  );
}

export function ActivateProButtons() {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
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
      else setNote('Checkout did not open. Try again. You can upgrade from this page. You do not need to email support.');
    } catch {
      setNote('Checkout did not open. Try again in a minute.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <div className="flex flex-col gap-3 max-w-xs">
        <button type="button" disabled={loading} onClick={() => start('monthly')} className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold">
          {loading ? 'Redirecting…' : `Activate Pro, ${PRO_PRICE_LABEL}`}
        </button>
        <button type="button" disabled={loading} onClick={() => start('annual')} className="min-h-11 px-4 rounded-lg border border-portal-border text-sm font-bold">
          Annual, $990/yr
        </button>
      </div>
      {note ? <p className="mt-2 text-sm text-portal-ink" role="alert">{note}</p> : null}
    </>
  );
}
