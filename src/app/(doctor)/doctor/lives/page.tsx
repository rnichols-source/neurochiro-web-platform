import { redirect } from 'next/navigation'
import { loadLiveQuestions } from '@/lib/community/phase-data'
import { getPortalContext } from '@/lib/portal/context'
import WeeklyShow from './show'

export const dynamic = 'force-dynamic'

export default async function WeeklyAdjustmentPage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  const questions = ctx.doctor?.id ? await loadLiveQuestions() : []

  return (
    <div className="space-y-6">
      <WeeklyShow />
      <section className="rounded-2xl border border-portal-border bg-white p-6">
        <h2 className="text-base font-bold text-portal-ink">Questions from community members</h2>
        <p className="mt-1 text-sm text-portal-ink-2">For The Weekly Adjustment. Names are not shown. A question is not a visit and not a chart.</p>
        {questions.length === 0 ? <p className="mt-4 text-sm text-portal-ink-2">None yet.</p> : (
          <ul className="mt-4 space-y-3">
            {questions.map((question, index) => (
              <li key={`${question.createdAt}-${index}`} className="text-sm text-portal-ink">{question.body}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
