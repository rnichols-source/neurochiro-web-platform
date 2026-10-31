'use client';

import { useState } from 'react';
import { getOrCreateReferralCode } from '@/app/actions/referral-program';

export default function InviteColleague({ initialCode }: { initialCode: string | null }) {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const link = code ? `https://neurochiro.co/join?ref=${code}` : '';

  return (
    <section className="bg-white border border-portal-border rounded-xl p-4">
      <h2 className="text-lg font-bold text-portal-ink">Invite a colleague</h2>
      <p className="mt-1 text-sm text-portal-ink-2">Know a doctor who should be in the network? Send them your link. You earn free months on your membership when they join.</p>
      {code ? (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <code className="flex-1 min-h-11 px-3 inline-flex items-center rounded-lg bg-portal-surface text-sm break-all">{link}</code>
          <button
            type="button"
            className="min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold"
            onClick={() => {
              navigator.clipboard.writeText(link).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              }).catch(() => {});
            }}
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="mt-3 min-h-11 px-4 rounded-lg bg-portal-accent text-white text-sm font-bold"
          onClick={async () => {
            const result = await getOrCreateReferralCode();
            if (result && typeof result === 'object' && 'code' in result) setCode(String((result as { code: string }).code));
            else if (typeof result === 'string') setCode(result);
          }}
        >
          Get your link
        </button>
      )}
    </section>
  );
}
