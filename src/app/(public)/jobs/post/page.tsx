'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MEMBER_UPSELL } from '@/lib/jobs/posting-pure';
import { submitOutsidePost } from './actions';

export default function PostJobPage() {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    const data = new FormData(event.currentTarget);
    const result = await submitOutsidePost(data);
    if (result && 'posted' in result && result.posted) {
      window.location.href = '/doctor/jobs?posted=success';
      return;
    }
    if (result && 'checkoutUrl' in result && result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }
    setError(result && 'error' in result && result.error ? result.error : 'Something went wrong.');
    setPending(false);
  }

  return (
    <div className="min-h-dvh bg-[#F7F8FA] px-4 pb-16 pt-24">
      <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
        <h1 className="font-heading text-3xl font-bold text-[#14212E]">Post an associateship</h1>
        <p className="text-base text-[#3d4d5c]">
          Outside clinics pay $149. We review the post within 1 business day. It stays up for 60 days after approval.
        </p>
        <Field name="clinicName" label="Clinic" required />
        <Field name="contactName" label="Your name" required />
        <Field name="email" label="Email" type="email" required />
        <Field name="phone" label="Phone" type="tel" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="city" label="City" required />
          <Field name="state" label="State" required />
        </div>
        <Field name="title" label="Title" required />
        <label className="block text-sm text-[#3d4d5c]">
          Description
          <textarea name="description" required maxLength={5000} rows={6} className="mt-1 w-full rounded-lg border border-[#e3e8ed] px-3 py-2 text-base" />
        </label>
        <label className="block text-sm text-[#3d4d5c]">
          Type
          <select name="type" className="mt-1 min-h-11 w-full rounded-lg border border-[#e3e8ed] bg-white px-3 text-base">
            <option>Associate</option>
            <option>Intern</option>
            <option>Locum</option>
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="payMin" label="Pay minimum" type="number" />
          <Field name="payMax" label="Pay maximum" type="number" />
        </div>
        <Field name="startDate" label="Start date" type="date" />
        <Field name="techniques" label="Technique tags, separated by commas" />
        <Field name="applyMethod" label="How to apply" />
        {error ? <p className="text-base text-[#B4501A]">{error}</p> : null}
        <button type="submit" disabled={pending} className="min-h-11 w-full rounded-lg bg-[#D66829] text-base font-bold text-white disabled:opacity-60">
          {pending ? 'Saving…' : 'Continue to payment'}
        </button>
        <p className="text-base text-[#3d4d5c]">
          {MEMBER_UPSELL}{' '}
          <Link href="/pricing/doctors" className="font-bold text-[#B4501A]">Join NeuroChiro</Link>
        </p>
      </form>
    </div>
  );
}

function Field({ name, label, type = 'text', required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="block text-sm text-[#3d4d5c]">
      {label}
      <input name={name} type={type} required={required} className="mt-1 min-h-11 w-full rounded-lg border border-[#e3e8ed] px-3 text-base" />
    </label>
  );
}
