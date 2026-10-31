import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';
import PageHeader from '@/components/portal/PageHeader';
import EmptyState from '@/components/portal/EmptyState';
import StatusPill from '@/components/portal/StatusPill';
import { ReferButton } from '@/components/portal/ReferralProvider';
import { getPortalContext } from '@/lib/portal/context';
import { listMyReferrals } from '@/lib/referrals/data';
import { statusLabel } from '@/lib/referrals/pure';
import type { ReferralRow } from '@/lib/referrals/data';

function tone(status: string) {
  if (status === 'scheduled' || status === 'accepted' || status === 'patient_contacted') return 'booked' as const;
  if (status === 'declined' || status === 'expired' || status === 'cancelled') return 'danger' as const;
  if (status === 'viewed') return 'info' as const;
  return 'new' as const;
}

function Rows({ rows, empty }: { rows: ReferralRow[]; empty: string }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={Users}
        title={empty}
        sentence={empty.startsWith('No referrals') ? 'When a doctor sends you a patient, it shows up here.' : 'Send a patient to a doctor you trust.'}
        action={{ label: 'Refer a patient', href: '/doctor/referrals?again=1' }}
      />
    );
  }
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.id}>
          <Link href={`/doctor/referrals/${row.id}`} className="min-h-11 flex items-center justify-between gap-3 bg-white border border-portal-border rounded-xl px-4 py-3">
            <span>
              <span className="block text-sm font-bold text-portal-ink">{row.patient_first_name} {row.patient_last_initial}.</span>
              <span className="block text-xs text-portal-muted">{row.other_name}</span>
            </span>
            <StatusPill label={statusLabel(row.status)} tone={tone(row.status)} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function ReferralsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await getPortalContext();
  if (!ctx?.doctor) redirect('/login');
  const tab = (await searchParams).tab === 'sent' ? 'sent' : 'received';
  const data = await listMyReferrals();
  const rows = tab === 'sent' ? data?.sent || [] : data?.received || [];
  const waiting = ctx.unreadReferrals;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Referrals"
        description={waiting ? `${waiting} waiting on you` : 'Patients you sent, and patients sent to you.'}
        action={<ReferButton />}
      />
      <div className="flex gap-2 mb-4">
        <Link href="/doctor/referrals?tab=received" className={`min-h-11 inline-flex items-center px-4 rounded-lg text-sm font-bold ${tab === 'received' ? 'bg-portal-ink text-white' : 'bg-white border border-portal-border'}`}>Received</Link>
        <Link href="/doctor/referrals?tab=sent" className={`min-h-11 inline-flex items-center px-4 rounded-lg text-sm font-bold ${tab === 'sent' ? 'bg-portal-ink text-white' : 'bg-white border border-portal-border'}`}>Sent</Link>
      </div>
      <Rows rows={rows} empty={tab === 'received' ? 'No referrals yet.' : "You haven't referred anyone yet."} />
    </div>
  );
}
