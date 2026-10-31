'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { acknowledgeContactRequest } from './actions';
import type { AttentionItem } from './home-types';

export default function AttentionList({ items }: { items: AttentionItem[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [pending, setPending] = useState<string | null>(null);

  if (!rows.length) {
    return (
      <section className="bg-white border border-portal-border rounded-xl p-4">
        <h2 className="text-lg font-bold text-portal-ink">Needs your reply</h2>
        <p className="mt-2 text-sm text-portal-ink-2">You are all caught up.</p>
      </section>
    );
  }

  async function act(id: string, action: 'called' | 'will_call') {
    setPending(id);
    try {
      await acknowledgeContactRequest(id, action);
      if (action === 'called') setRows((current) => current.filter((row) => row.id !== id));
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="bg-white border border-portal-border rounded-xl p-4">
      <h2 className="text-lg font-bold text-portal-ink">Needs your reply</h2>
      <p className="text-sm text-portal-ink-2 mb-3">Patients and doctors waiting on you.</p>
      <ul className="divide-y divide-portal-border">
        {rows.map((row) => (
          <li key={row.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-portal-ink">{row.title}</p>
              <p className="text-sm text-portal-ink-2">{row.detail}</p>
              {row.phone ? <a className="text-sm font-bold text-portal-accent" href={`tel:${row.phone}`}>{row.phone}</a> : null}
            </div>
            {row.kind === 'request' ? (
              <div className="flex gap-2">
                <button type="button" disabled={pending === row.id} onClick={() => act(row.id, 'called')} className="min-h-11 px-3 rounded-lg bg-portal-success text-white text-sm font-bold">I called them</button>
                <button type="button" disabled={pending === row.id} onClick={() => act(row.id, 'will_call')} className="min-h-11 px-3 rounded-lg border border-portal-border text-sm font-bold">I will call today</button>
              </div>
            ) : (
              <Link href={row.href || '/doctor/dashboard'} className="min-h-11 px-3 inline-flex items-center rounded-lg border border-portal-border text-sm font-bold">Open</Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
