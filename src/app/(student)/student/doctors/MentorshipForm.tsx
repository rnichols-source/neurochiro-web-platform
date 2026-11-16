'use client';

import { useState } from 'react';
import { requestMentorship } from './actions';

export default function MentorshipForm({ doctorId }: { doctorId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(formData: FormData) {
    setError('');
    const result = await requestMentorship({
      doctorId,
      message: String(formData.get('message') || ''),
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 min-h-11 rounded-lg border border-portal-border px-4 text-sm font-bold text-portal-ink">
        Ask about mentorship
      </button>
    );
  }
  if (done) return <p className="mt-3 text-base text-portal-ink">Request sent. The doctor can answer from their portal, and you will get a message if they say yes.</p>;

  return (
    <form action={submit} className="mt-3 space-y-2">
      <label className="block text-sm font-semibold text-portal-ink">
        What do you want to learn?
        <textarea name="message" required minLength={10} maxLength={500} placeholder="A short note about the kind of practice you want to learn" className="mt-1 min-h-24 w-full rounded-lg border border-portal-border px-3 py-2 text-base" />
      </label>
      {error ? <p role="alert" className="text-sm font-semibold text-[#B4501A]">{error}</p> : null}
      <button type="submit" className="min-h-11 rounded-lg bg-[#1E2D3B] px-4 text-sm font-bold text-white">Send request</button>
    </form>
  );
}
