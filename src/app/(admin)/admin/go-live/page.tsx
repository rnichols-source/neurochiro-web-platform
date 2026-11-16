import { PlaceHeader } from '@/components/founder/header'
import { Card, Tag } from '@/components/founder/bits'
import { requireAdminPage } from '@/lib/founder/guard'
import { GO_LIVE_STEPS, loadRecentGoLiveSteps, type GoLiveStepRow } from '@/lib/go-live/log'
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
        title="Doctor go-live"
        subtitle="Each paid membership runs seven steps. Failed steps can be retried. Test doctors do not email or text anyone."
      />
      <div className="space-y-4 px-4 py-4 lg:px-8">
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
                return (
                  <li key={step} className="flex flex-wrap items-start justify-between gap-3 border-t border-[#EFECE7] pt-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="fd-ui text-[14px] font-extrabold">{label(step)}</p>
                        <Tag kind={row?.status === 'failed' ? 'tracking' : 'live'}>{row?.status || 'not run'}</Tag>
                      </div>
                      <p className="mt-1 text-[13px] text-[#5b6773]">{row?.reason || 'This step has not run.'}</p>
                    </div>
                    {step === 'welcome' || row?.status === 'failed' ? <RetryStepButton doctorId={doctorId} step={step} welcome={step === 'welcome'} /> : null}
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
