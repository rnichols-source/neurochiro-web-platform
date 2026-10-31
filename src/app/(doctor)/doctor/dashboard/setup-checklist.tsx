'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SetupFields } from './home-types';

const KEY = 'nc_setup_dismissed';

export default function SetupChecklist({ fields, profileUrl }: { fields: SetupFields; profileUrl: string }) {
  const [dismissed, setDismissed] = useState(true);
  const [copied, setCopied] = useState(false);

  const steps = [
    { id: 'photo', label: 'Add photo', href: '/doctor/profile?tab=photos', done: fields.photo },
    { id: 'bio', label: 'Write bio', href: '/doctor/profile?tab=about', done: fields.bio },
    { id: 'address', label: 'Confirm address and phone', href: '/doctor/profile?tab=basics', done: fields.address },
    { id: 'services', label: 'Services and insurance', href: '/doctor/profile?tab=insurance', done: fields.services },
    { id: 'preview', label: 'Preview public profile', href: profileUrl, done: false, external: true },
    { id: 'alerts', label: 'Turn on request alerts', href: '/doctor/settings', done: false },
  ];
  const done = steps.filter((step) => step.done).length;
  const complete = steps.filter((step) => step.id !== 'preview' && step.id !== 'alerts').every((step) => step.done);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(KEY) === '1' || complete);
  }, [complete]);

  if (dismissed) return null;

  return (
    <section className="bg-white border border-portal-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-portal-ink">Finish setting up</h2>
          <p className="text-sm text-portal-ink-2">{done} of {steps.length + 1} done</p>
        </div>
        <button type="button" className="min-h-11 px-3 text-sm font-bold text-portal-ink-2" onClick={() => { window.localStorage.setItem(KEY, '1'); setDismissed(true); }}>
          Dismiss
        </button>
      </div>
      <div className="mt-3 h-2 rounded-full bg-portal-surface overflow-hidden">
        <div className="h-full bg-portal-accent" style={{ width: `${Math.round((done / (steps.length + 1)) * 100)}%` }} />
      </div>
      <ul className="mt-3 divide-y divide-portal-border">
        {steps.map((step) => (
          <li key={step.id}>
            <Link href={step.href} target={step.external ? '_blank' : undefined} className="min-h-11 flex items-center justify-between gap-3 text-sm">
              <span className={step.done ? 'text-portal-muted line-through' : 'text-portal-ink'}>{step.label}</span>
              <span className="text-portal-muted">{step.done ? 'Done' : 'Open'}</span>
            </Link>
          </li>
        ))}
        <li className="min-h-11 flex items-center justify-between gap-3">
          <span className="text-sm text-portal-ink">Share your profile link</span>
          <button
            type="button"
            className="min-h-11 px-3 rounded-lg bg-portal-surface text-sm font-bold"
            onClick={() => {
              navigator.clipboard.writeText(profileUrl).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              }).catch(() => {});
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </li>
      </ul>
    </section>
  );
}
