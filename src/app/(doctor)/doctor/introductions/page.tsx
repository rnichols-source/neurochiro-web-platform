import { redirect } from 'next/navigation'
import PageHeader from '@/components/portal/PageHeader'
import EmptyState from '@/components/portal/EmptyState'
import { Heart } from 'lucide-react'
import { markIntroductionSeen } from '@/lib/community/phase-actions'
import { loadDoctorIntroductions } from '@/lib/community/phase-data'
import { passportDoctorView } from '@/lib/community/phases'
import { getPortalContext } from '@/lib/portal/context'

export const dynamic = 'force-dynamic'

export default async function IntroductionsPage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  if (ctx.role === 'patient') redirect('/portal')
  const loaded = ctx.doctor?.id ? await loadDoctorIntroductions(ctx.doctor.id) : { ready: true, rows: [] }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Introductions"
        description="A community member on the road can introduce themselves with only what they chose to share. This is not a chart."
      />
      {!loaded.ready ? <p className="text-sm text-portal-ink-2">Introductions save with the latest database update.</p> : null}
      {loaded.ready && loaded.rows.length === 0 ? (
        <EmptyState icon={Heart} title="No introductions" sentence="When a community member sends you a passport introduction, it shows up here." />
      ) : null}
      <ul className="space-y-3">
        {loaded.rows.map((row) => {
          const view = passportDoctorView({
            place: row.place,
            when: row.when,
            sharedFirstName: row.sharedFirstName,
            homeClinicLabel: row.homeClinicLabel,
            familyFirstNames: row.familyFirstNames,
            exerciseTitles: row.exerciseTitles,
            note: row.note,
          })
          return (
            <li key={row.id} className="rounded-2xl border border-portal-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-portal-ink">{view.title}</p>
                  <p className="mt-1 text-xs text-portal-ink-2">{new Date(row.createdAt).toLocaleString()} · {row.status}</p>
                </div>
                {row.status === 'sent' ? (
                  <form action={markIntroductionSeen}>
                    <input type="hidden" name="id" value={row.id} />
                    <SeenButton />
                  </form>
                ) : null}
              </div>
              <div className="mt-3 space-y-1 text-sm text-portal-ink">
                {view.lines.map((line) => <p key={line}>{line}</p>)}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SeenButton() {
  return (
    <button type="submit" className="min-h-11 rounded-lg border border-portal-border px-3 text-sm font-bold text-portal-ink">
      Mark seen
    </button>
  )
}
