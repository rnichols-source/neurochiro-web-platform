'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/portal/PageHeader';
import { usePortal } from '@/components/portal/PortalProvider';
import { Suspense } from 'react';
import { sendHelpMessage } from './actions';
import { ONBOARDING_CONFIG } from '@/lib/onboarding-config';
import { REPLY_TO } from '@/lib/leads/config';

const TOPICS = ['Profile', 'Visit requests', 'Billing', 'Seminars', 'Bug', 'Other'];

const FAQ = [
  { q: 'How do I get requests?', a: 'Finish your profile on neurochiro.co. People search by city and request you from that page. New requests show on Today and in People.', href: '/doctor/profile', link: 'Edit your profile' },
  { q: 'What do the stages mean?', a: 'Requested means they just asked. Contacted means you reached them. Scheduled means a visit is on the books. Started care means they began. Not a fit, No answer, and Went elsewhere close the request.', href: '/doctor/people', link: 'Open People' },
  { q: 'How do I send a home plan?', a: 'Open the person in People, tap Send a home plan, then tap the plan. It shows on Home plans after that.', href: '/doctor/people', link: 'Open People' },
  { q: 'What do the colors mean?', a: 'On Home plans, green is on track, yellow is falling behind, and red is stopped. The words are on the row too.', href: '/doctor/care-sets', link: 'Open Home plans' },
  { q: 'How do I add my front desk?', a: 'Settings has a front desk email. They get the same request email you do. Sending a home plan stays on your login.', href: '/doctor/settings', link: 'Open Settings' },
  { q: 'How do I change alerts?', a: 'Settings lets you pick email, text, or both, and the mobiles that get the text.', href: '/doctor/settings', link: 'Open Settings' },
  { q: 'How do I update my card?', a: 'Open Billing, then Update card and receipts. That opens Stripe, where the card and receipts live.', href: '/doctor/billing', link: 'Open Billing' },
  { q: 'How do I edit my profile?', a: 'Profile is the photo, hours, and the page people see on neurochiro.co.', href: '/doctor/profile', link: 'Edit your profile' },
  { q: 'Why is something locked?', a: 'Some office tools open with Pro. The lock says Activate Pro and goes to Billing.', href: '/doctor/billing', link: 'Open Billing' },
  { q: 'How do I contact NeuroChiro?', a: 'Use the form on this page, or email support@neurochirodirectory.com. We reply within 24 hours.', href: '#help-form', link: 'Write to us' },
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
        <form id="help-form" onSubmit={onSubmit} className="bg-white border border-portal-border rounded-xl p-4 space-y-3">
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
            <Link href={item.href} className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-[#8C3A12]">{item.link}</Link>
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
