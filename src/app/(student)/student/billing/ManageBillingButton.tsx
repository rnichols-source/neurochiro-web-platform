'use client';

import { useState } from 'react';

export default function ManageBillingButton() {
  const [error, setError] = useState('');

  async function openPortal() {
    setError('');
    const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setError('Billing portal is not available yet. Contact NeuroChiro at https://neurochiro.co/contact.');
  }

  return (
    <div>
      <button type="button" onClick={openPortal} className="min-h-11 w-full rounded-lg bg-portal-ink px-4 text-base font-bold text-white">
        Manage billing
      </button>
      {error ? <p className="mt-2 text-sm text-portal-danger">{error}</p> : null}
    </div>
  );
}
