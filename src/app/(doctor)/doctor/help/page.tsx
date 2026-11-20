'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/portal/PageHeader';
import { usePortal } from '@/components/portal/PortalProvider';
import { Suspense } from 'react';
import { sendHelpMessage } from './actions';
import { ONBOARDING_CONFIG } from '@/lib/onboarding-config';
import { REPLY_TO } from '@/lib/leads/config';

const TOPICS = ['Profile', 'Visit requests', 'Billing', 'Seminars', 'Bug', 'Other'];

const FAQ = [
  { q: 'How do community members find me?', a: 'Your profile is on neurochiro.co. Community members search by city, then request a visit from your page.' },
  { q: 'When do I see a visit request?', a: 'Requests show under People, and the full list is on Visit requests. Call them back while they are still deciding.' },
  { q: 'How do I change my plan?', a: "If you pay by card, open Billing and tap Manage billing to update your card, see invoices or cancel. Founding members have Pro included, so there's nothing to manage. Email support@neurochirodirectory.com with any plan question." },
  { q: 'How do seminars work?', a: 'Create one, share the link, and see who registered. Hosting prices are on the Seminars page.' },
  { q: 'Who do I email?', a: 'Email support@neurochirodirectory.com. We read every message.' },
  { q: 'Can I preview what community members see?', a: 'Open Profile and use View public profile. It opens your directory page in a new tab.' },
];

function HelpForm() {
  const ctx = usePortal();
  const params = useSearchParams();
  const topic = params.get('topic') || '';
  const initialTopic = useMemo(() => {
    const match = TOPICS.find((item) => item.toLowerCase() === topic.toLowerCase());
    return match || (topic ? 'Other' : 'Profile');
  }, [topic]);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true);
    setError('');
    try {
      const result = await sendHelpMessage({
        name: String(form.get('name') || ''),
        email: String(form.get('email') || ''),
        clinic: String(form.get('clinic') || ''),
        topic: String(form.get('topic') || initialTopic),
        message: String(form.get('message') || ''),
      });
      setSending(false);
      if (!result.ok) {
        setStatus('error');
        setError(result.error);
        return;
      }
      setStatus('sent');
    } catch {
      setSending(false);
      setStatus('error');
      setError('The message was not sent. Try again.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Help" description="Ask us anything about your account." />
      <p className="text-sm">
        <a className="font-bold text-portal-accent" href={ONBOARDING_CONFIG.CALENDLY_SPOTLIGHT} target="_blank" rel="noreferrer">Book a Spotlight interview</a>
      </p>
      <p className="text-sm">Email us: <a className="text-portal-accent font-bold" href={`mailto:${REPLY_TO}`}>{REPLY_TO}</a></p>
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
          <button type="submit" disabled={sending} className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold disabled:opacity-60">{sending ? 'Sending…' : 'Send'}</button>
          {status === 'error' ? <p className="text-sm text-neuro-orange" role="alert">{error}</p> : null}
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
