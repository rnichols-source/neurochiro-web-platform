'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/portal/PageHeader';
import { usePortal } from '@/components/portal/PortalProvider';
import { Suspense } from 'react';

const TOPICS = ['Profile', 'Patient requests', 'Billing', 'Seminars', 'Bug', 'Other'];

const FAQ = [
  { q: 'How do patients find me?', a: 'Your profile is on neurochiro.co. Patients search by city, then request an appointment from your page.' },
  { q: 'When do I see a patient request?', a: 'Requests show under Patient requests. Call them back while they are still deciding.' },
  { q: 'How do I change my plan?', a: 'Open Plan and billing and use Manage billing. You can update the card or cancel there.' },
  { q: 'How do seminars work?', a: 'Create one, share the link, and see who registered. Hosting prices are on the Seminars page.' },
  { q: 'Who do I email?', a: 'Email support@neurochirodirectory.com. We read every message.' },
  { q: 'Can I preview what patients see?', a: 'Open My profile and use View live profile. It opens your directory page in a new tab.' },
];

function HelpForm() {
  const ctx = usePortal();
  const params = useSearchParams();
  const topic = params.get('topic') || '';
  const initialTopic = useMemo(() => {
    const match = TOPICS.find((item) => item.toLowerCase() === topic.toLowerCase());
    return match || (topic ? 'Other' : 'Profile');
  }, [topic]);
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.email,
        first_name: ctx.fullName,
        source: 'contact_form',
        role: 'contact',
        location: ctx.doctor?.clinic_name || null,
        metadata: {
          subject: String(form.get('topic') || initialTopic),
          message: String(form.get('message') || ''),
          clinic: ctx.doctor?.clinic_name || '',
        },
      }),
    });
    setStatus('sent');
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Help" description="Ask us anything about your account." />
      <p className="text-sm">Email us: <a className="text-portal-accent font-bold" href="mailto:support@neurochirodirectory.com">support@neurochirodirectory.com</a></p>
      {status === 'sent' ? (
        <p className="bg-white border border-portal-border rounded-xl p-4 text-sm">Message received. We will reply within 24 hours.</p>
      ) : (
        <form onSubmit={onSubmit} className="bg-white border border-portal-border rounded-xl p-4 space-y-3">
          <label className="block text-sm font-bold">Name
            <input name="name" defaultValue={ctx.fullName || ''} className="mt-1 w-full min-h-11 px-3 rounded-lg border border-portal-border text-base" />
          </label>
          <label className="block text-sm font-bold">Email
            <input name="email" type="email" defaultValue={ctx.email || ''} className="mt-1 w-full min-h-11 px-3 rounded-lg border border-portal-border text-base" />
          </label>
          <label className="block text-sm font-bold">Clinic
            <input name="clinic" defaultValue={ctx.doctor?.clinic_name || ''} className="mt-1 w-full min-h-11 px-3 rounded-lg border border-portal-border text-base" />
          </label>
          <label className="block text-sm font-bold">Topic
            <select name="topic" defaultValue={initialTopic} className="mt-1 w-full min-h-11 px-3 rounded-lg border border-portal-border text-base bg-white">
              {TOPICS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold">Message
            <textarea name="message" required rows={5} className="mt-1 w-full px-3 py-2 rounded-lg border border-portal-border text-base" />
          </label>
          <button type="submit" className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold">Send</button>
        </form>
      )}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Common questions</h2>
        {FAQ.map((item) => (
          <article key={item.q} className="bg-white border border-portal-border rounded-xl p-4">
            <h3 className="font-bold">{item.q}</h3>
            <p className="mt-1 text-sm text-portal-ink-2">{item.a}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<p className="text-sm text-portal-muted">Loading help…</p>}>
      <HelpForm />
    </Suspense>
  );
}
