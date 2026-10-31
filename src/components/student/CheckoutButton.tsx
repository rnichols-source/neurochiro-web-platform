'use client';

import { useState } from 'react';
import { createStudentCheckout } from '@/app/(auth)/actions/student-checkout';

export default function CheckoutButton({ plan, label }: { plan: 'monthly' | 'annual'; label: string }) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    setError('');
    const result = await createStudentCheckout(plan);
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    setError(result.error || 'Checkout did not start.');
    setPending(false);
  }

  return (
    <div>
      <button type="button" onClick={start} disabled={pending} className="min-h-11 w-full rounded-lg bg-portal-accent px-4 text-base font-bold text-white disabled:opacity-60">
        {pending ? 'Opening checkout' : label}
      </button>
      {error ? <p className="mt-2 text-sm text-portal-danger">{error}</p> : null}
    </div>
  );
}
