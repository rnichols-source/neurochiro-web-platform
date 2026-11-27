import Link from 'next/link'
import { PlaceHeader } from '@/components/founder/header'
import { Card, Tag } from '@/components/founder/bits'
import { requireAdminPage } from '@/lib/founder/guard'
import { GO_LIVE_STEPS, loadRecentGoLiveSteps, type GoLiveStepRow } from '@/lib/go-live/log'
import { goLiveStepRetry } from '@/lib/go-live/plan'
import { RetryStepButton } from './retry-button'

export const dynamic = 'force-dynamic'

export default async function GoLivePage() {
  await requireAdminPage()
  const board = await loadRecentGoLiveSteps()
  const byDoctor = new Map<string, { name: string; steps: GoLiveStepRow[] }>()
  for (const row of board.rows) {
    const group = byDoctor.get(row.doctorId) || { name: row.doctorName, steps: [] }
    group.steps.push(row)
    byDoctor.set(row.doctorId, group)
  }

  return (
    <div>
      <PlaceHeader
        place="people"
        title="New doctor setup"
        subtitle="Research the profile, then watch the seven go-live steps. Test doctors do not email or text anyone."
      />
      <div className="space-y-4 px-4 py-4 lg:px-8">
        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/admin/profile-builds" className="rounded-[22px] bg-white p-4">
            <p className="fd-ui text-[12px] font-extrabold uppercase tracking-wide text-[#0A6159]">Step 1</p>
            <h2 className="fd-ui text-[16px] font-extrabold">Profile research</h2>
            <p className="text-[13px] text-[#5b6773]">Fill a new listing from the public site. Failed research waits here.</p>
          </Link>
          <div className="rounded-[22px] border border-[#D7DEE6] bg-white p-4">
            <p className="fd-ui text-[12px] font-extrabold uppercase tracking-wide text-[#0A6159]">Step 2</p>
            <h2 className="fd-ui text-[16px] font-extrabold">Go live</h2>
            <p className="text-[13px] text-[#5b6773]">Each paid membership runs seven steps. Failed steps can be retried below.</p>
          </div>
        </div>
        {!board.ready ? (
          <Card>
            <h2 className="fd-ui text-[17px] font-extrabold">The log is not on yet</h2>
            <p className="mt-2 text-[14px] text-[#5b6773]">Apply supabase/migrations/20261116043000_doctor_go_live_log.sql, then new signups will show up here.</p>
          </Card>
        ) : null}
        {board.ready && byDoctor.size === 0 ? (
          <Card>
            <h2 className="fd-ui text-[17px] font-extrabold">No go-live runs yet</h2>
            <p className="mt-2 text-[14px] text-[#5b6773]">A paid doctor checkout, or Approve and publish, writes a step log here.</p>
          </Card>
        ) : null}
        {Array.from(byDoctor.entries()).map(([doctorId, group]) => (
          <Card key={doctorId}>
            <h2 className="fd-ui text-[17px] font-extrabold">{group.name}</h2>
            <ul className="mt-3 space-y-3">
              {GO_LIVE_STEPS.map((step) => {
                const row = group.steps.find((item) => item.step === step)
                const retry = goLiveStepRetry(step, row?.status)
                return (
                  <li key={step} className="flex flex-wrap items-start justify-between gap-3 border-t border-[#EFECE7] pt-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="fd-ui text-[14px] font-extrabold">{label(step)}</p>
                        <Tag kind={row?.status === 'failed' ? 'tracking' : 'live'}>{row?.status || 'not run'}</Tag>
                      </div>
                      <p className="mt-1 text-[13px] text-[#5b6773]">{row?.reason || 'This step has not run.'}</p>
                    </div>
                    {retry ? <RetryStepButton doctorId={doctorId} step={step} welcome={retry === 'welcome'} portal={retry === 'portal'} /> : null}
                  </li>
                )
              })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}

function label(step: string): string {
  if (step === 'checkout') return '1. Checkout recorded'
  if (step === 'profile') return '2. Profile'
  if (step === 'portal') return '3. Portal account'
  if (step === 'welcome') return '4. Welcome email and text'
  if (step === 'waitlist') return '5. Waitlist alerts'
  if (step === 'instagram') return '6. Instagram queue'
  return '7. Admin summary'
}
