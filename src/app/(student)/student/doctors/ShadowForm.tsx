'use client';

import { useState } from 'react';
import { STUDENT_CONFIG } from '@/config/students';
import { requestShadow } from './actions';

export default function ShadowForm({ doctorId }: { doctorId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(formData: FormData) {
    setError('');
    const result = await requestShadow({
      doctorId,
      dates: [String(formData.get('date1') || ''), String(formData.get('date2') || ''), String(formData.get('date3') || '')],
      message: String(formData.get('message') || ''),
      isAdult: formData.get('adult') === 'yes',
      acceptedWaiver: formData.get('waiver') === 'yes',
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="mt-3 min-h-11 rounded-lg border border-portal-border px-4 text-sm font-bold text-portal-ink">Request a shadow day</button>;
  }
  if (done) return <p className="mt-3 text-base text-portal-ink">Request sent. The doctor will answer in their portal.</p>;

  return (
    <form action={submit} className="mt-3 space-y-2">
      <input type="date" name="date1" required className="min-h-11 w-full rounded-lg border border-portal-border px-3 text-base" />
      <input type="date" name="date2" className="min-h-11 w-full rounded-lg border border-portal-border px-3 text-base" />
      <input type="date" name="date3" className="min-h-11 w-full rounded-lg border border-portal-border px-3 text-base" />
      <textarea name="message" required minLength={10} maxLength={500} placeholder="Why you want to visit, in a few sentences" className="min-h-24 w-full rounded-lg border border-portal-border px-3 py-2 text-base" />
      <label className="flex items-start gap-2 text-base text-portal-ink"><input type="checkbox" name="adult" value="yes" /> I am 18 or older.</label>
      <label className="flex items-start gap-2 text-base text-portal-ink"><input type="checkbox" name="waiver" value="yes" /> {STUDENT_CONFIG.shadowWaiver}</label>
      {error ? <p className="text-sm text-portal-danger">{error}</p> : null}
      <button type="submit" className="min-h-11 rounded-lg bg-portal-accent px-4 text-base font-bold text-white">Send request</button>
    </form>
  );
}
