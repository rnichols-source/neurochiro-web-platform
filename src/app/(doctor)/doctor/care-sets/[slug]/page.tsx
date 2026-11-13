import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/portal/PageHeader'
import { loadLibraryAssignees } from '@/lib/community/library-data'
import { libraryPlans } from '@/lib/community/library-content'
import { LIBRARY_COPY, planBySlug } from '@/lib/community/library-model'
import { isStoredCommunityRole } from '@/lib/community/logic'
import { loadHomeDoctorMembers } from '@/lib/community/phase-data'
import { getPortalContext } from '@/lib/portal/context'
import { AssignLibraryForm } from '../assign-library-form'

export const dynamic = 'force-dynamic'

export default async function CareSetPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  if (isStoredCommunityRole(ctx.role)) redirect('/portal')
  const { slug } = await params
  const plan = planBySlug(libraryPlans(), slug)
  if (!plan) notFound()
  const [members, assignedIds] = ctx.doctor?.id
    ? await Promise.all([
      loadHomeDoctorMembers(ctx.doctor.id),
      loadLibraryAssignees(ctx.doctor.id, plan.slug),
    ])
    : [[], []]

  return (
    <div className="space-y-6">
      <PageHeader title={plan.name} description={LIBRARY_COPY.doctorPreview} />
      <Link href="/doctor/care-sets" className="inline-flex min-h-11 items-center text-sm font-semibold text-neuro-orange">Back to the library</Link>
      <div className="rounded-2xl border border-portal-border bg-white p-4">
        {ctx.doctor?.id ? (
          <AssignLibraryForm slug={plan.slug} members={members} assignedIds={assignedIds} />
        ) : (
          <p className="text-sm text-portal-ink-2">A doctor profile is required.</p>
        )}
      </div>
      {plan.objective ? <p className="text-sm leading-6 text-portal-ink">{plan.objective}</p> : null}
      {plan.phases.map((phase) => (
        <section key={phase.key} className="rounded-2xl border border-portal-border bg-white p-4">
          <h2 className="text-lg font-bold text-portal-ink">{phase.name}</h2>
          <p className="mt-1 text-sm text-portal-ink-2">{phase.week}</p>
          {phase.goal ? <p className="mt-2 text-sm leading-6 text-portal-ink">{phase.goal}</p> : null}
          {phase.frequency ? <p className="mt-1 text-sm text-portal-ink">{phase.frequency}</p> : null}
          {phase.focus ? <p className="mt-1 text-sm text-portal-ink">{phase.focus}</p> : null}
          <ol className="mt-4 space-y-4">
            {phase.exercises.map((exercise) => (
              <li key={exercise.key}>
                <p className="text-sm font-bold text-portal-ink">{exercise.name}</p>
                {exercise.rx ? <p className="text-sm text-neuro-orange">{exercise.rx}</p> : null}
                <p className="mt-1 text-sm leading-6 text-portal-ink-2">{exercise.description}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
      {plan.lifestyle.length > 0 ? (
        <section className="rounded-2xl border border-portal-border bg-white p-4">
          <h2 className="text-lg font-bold text-portal-ink">{LIBRARY_COPY.lifestyleHeading}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-portal-ink">
            {plan.lifestyle.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ) : null}
      {plan.maintenance ? (
        <section className="rounded-2xl border border-portal-border bg-white p-4">
          <h2 className="text-lg font-bold text-portal-ink">{LIBRARY_COPY.maintenanceHeading}</h2>
          <p className="mt-2 text-sm leading-6 text-portal-ink">{plan.maintenance}</p>
        </section>
      ) : null}
    </div>
  )
}
