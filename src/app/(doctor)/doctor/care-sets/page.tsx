import { redirect } from 'next/navigation'
import { DoctorBand } from '@/components/doctor/chrome'
import { CareDesk, type CarePreview } from '@/components/doctor/care-desk'
import { FollowThroughView } from '@/components/doctor/follow-through-view'
import { AssignForm } from './assign-form'
import { loadHomeDoctorMembers } from '@/lib/community/phase-data'
import { libraryPlans } from '@/lib/community/library-content'
import { CATEGORY_LABELS, LIBRARY_COPY, LIBRARY_PLAN_COUNT, categoriesInUse } from '@/lib/community/library-model'
import { isStoredCommunityRole } from '@/lib/community/logic'
import { getPortalContext } from '@/lib/portal/context'
import { loadCareUsage } from '@/lib/doctor/portal-data'
import { loadFollowThrough } from '@/lib/doctor/follow-data'
import { getDoctorTimezone } from '@/lib/doctor-timezone'

export const dynamic = 'force-dynamic'

export default async function CareSetsPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  if (isStoredCommunityRole(ctx.role)) redirect('/portal')
  const member = (await searchParams).member
  const plans = libraryPlans()
  const timeZone = getDoctorTimezone(ctx.doctor?.state ?? null, ctx.doctor?.country ?? null, 'America/New_York') || 'America/New_York'
  const [members, usage, follow] = ctx.doctor?.id
    ? await Promise.all([
      loadHomeDoctorMembers(ctx.doctor.id),
      loadCareUsage(ctx.doctor.id),
      loadFollowThrough(ctx.doctor.id, new Date(), timeZone),
    ])
    : [[], {}, { rows: [], counts: { all: 0, onTrack: 0, falling: 0, stopped: 0 }, ready: false }]
  const categories = categoriesInUse(plans).map((id) => ({ id, label: CATEGORY_LABELS[id] }))
  const previews: CarePreview[] = plans.map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    category: plan.category,
    categoryLabel: CATEGORY_LABELS[plan.category],
    objective: plan.objective,
    exerciseCount: plan.phases.reduce((sum, phase) => sum + phase.exercises.length, 0),
    phases: plan.phases.map((phase) => ({
      name: phase.name,
      exercises: phase.exercises.map((exercise) => exercise.name),
    })),
  }))
  const inUse = Object.keys(usage).length

  return (
    <div>
      <DoctorBand
        place="care"
        title="Home plans"
        subtitle="Send a home plan, then see who is on track."
      >
        <span className="hidden rounded-2xl bg-white/20 px-3 py-2 text-center dp-ui text-[22px] font-extrabold leading-none lg:block">
          {LIBRARY_PLAN_COUNT}
          <span className="mt-1 block text-[12px] font-bold">plans</span>
        </span>
      </DoctorBand>
      <FollowThroughView rows={follow.rows} counts={follow.counts} nowIso={new Date().toISOString()} timeZone={timeZone} />
      <details className="mt-4 rounded-2xl bg-white p-4">
        <summary className="dp-ui cursor-pointer text-[16px] font-extrabold text-[#15202B]">Browse the library ({LIBRARY_PLAN_COUNT} plans)</summary>
        <p className="mt-2 text-[14px] text-[#5b6773]">
          {inUse ? `${inUse} plans in use. ` : ''}Preview a plan here. Sending from a person's card in People is the faster way.
        </p>
        <CareDesk plans={previews} categories={categories} members={members} usage={usage} initialMember={member} />
        <div className="mt-6 border-t border-[#ECEAE5] pt-4">
          <h2 className="dp-ui text-[18px] font-extrabold text-[#15202B]">Or write a short home plan</h2>
          <p className="mb-4 mt-1 text-[14px] text-[#5b6773]">{LIBRARY_COPY.customHint}</p>
          {ctx.doctor?.id ? <AssignForm members={members} /> : <p className="text-[14px] text-[#5b6773]">A doctor profile is required.</p>}
        </div>
      </details>
    </div>
  )
}
