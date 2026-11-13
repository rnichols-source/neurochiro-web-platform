import { redirect } from 'next/navigation'
import PageHeader from '@/components/portal/PageHeader'
import EmptyState from '@/components/portal/EmptyState'
import { Users } from 'lucide-react'
import { loadNearbyInterest } from '@/lib/community/phase-data'
import { WORK_PATH_LABELS } from '@/lib/community/phases'
import { getPortalContext } from '@/lib/portal/context'
import { ConnectButton } from './connect-button'

export const dynamic = 'force-dynamic'

export default async function CommunityInterestPage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  if (ctx.role === 'patient') redirect('/portal')
  const loaded = ctx.doctor
    ? await loadNearbyInterest({ state: ctx.doctor.state, country: ctx.doctor.country })
    : { ready: true, rows: [] }
  const located = Boolean(ctx.doctor?.state || ctx.doctor?.country)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Community interest"
        description="People who already use Your NeuroChiro can raise a hand for CA, front desk, or a student path. You see interest near your office. Connecting does not share health details."
      />
      {!ctx.doctor?.id ? <p className="text-sm text-portal-ink-2">A doctor profile is required.</p> : null}
      {ctx.doctor?.id && !located ? <p className="text-sm text-portal-ink-2">Add a state on your profile so interest near your office can show up here.</p> : null}
      {!loaded.ready ? <p className="text-sm text-portal-ink-2">This saves with the latest database update.</p> : null}
      {loaded.ready && located && loaded.rows.length === 0 ? (
        <EmptyState icon={Users} title="No open interest nearby" sentence="When a community member near your office raises a hand, it shows up here." />
      ) : null}
      <ul className="space-y-3">
        {loaded.rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-portal-border bg-white p-4">
            <p className="text-sm font-bold text-portal-ink">{WORK_PATH_LABELS[row.path]} · {row.place}</p>
            <p className="mt-1 text-sm text-portal-ink-2">{row.label}{row.email ? ` · ${row.email}` : ' · contact not shared'}</p>
            {row.note ? <p className="mt-2 text-sm text-portal-ink">{row.note}</p> : null}
            <div className="mt-3">
              <ConnectButton interestId={row.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
