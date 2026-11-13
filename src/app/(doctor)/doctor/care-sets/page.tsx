import { redirect } from 'next/navigation'
import { DoctorBand } from '@/components/doctor/chrome'
import { CareDesk, type CarePreview } from '@/components/doctor/care-desk'
import { AssignForm } from './assign-form'
import { loadHomeDoctorMembers } from '@/lib/community/phase-data'
import { libraryPlans } from '@/lib/community/library-content'
import { CATEGORY_LABELS, LIBRARY_COPY, LIBRARY_PLAN_COUNT, categoriesInUse } from '@/lib/community/library-model'
import { isStoredCommunityRole } from '@/lib/community/logic'
import { getPortalContext } from '@/lib/portal/context'
import { loadCareUsage } from '@/lib/doctor/portal-data'

export const dynamic = 'force-dynamic'

export default async function CareSetsPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  if (isStoredCommunityRole(ctx.role)) redirect('/portal')
  const member = (await searchParams).member
  const plans = libraryPlans()
  const [members, usage] = ctx.doctor?.id
    ? await Promise.all([loadHomeDoctorMembers(ctx.doctor.id), loadCareUsage(ctx.doctor.id)])
    : [[], {}]
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
        title="Care sets"
        subtitle="Pick a plan, preview it, assign it."
      >
        <span className="hidden rounded-2xl bg-white/20 px-3 py-2 text-center dp-ui text-[22px] font-extrabold leading-none lg:block">
          {LIBRARY_PLAN_COUNT}
          <span className="mt-1 block text-[12px] font-bold">plans</span>
        </span>
      </DoctorBand>
      <p className="mt-4 text-[14px] text-[#5b6773]">
        {inUse ? `${inUse} plans in use. ` : ''}{LIBRARY_COPY.doctorIntro}
      </p>
      <CareDesk plans={previews} categories={categories} members={members} usage={usage} initialMember={member} />
      <div className="mt-8 rounded-2xl bg-white p-4">
        <h2 className="dp-ui text-[18px] font-extrabold text-[#15202B]">{LIBRARY_COPY.customSet}</h2>
        <p className="mb-4 mt-1 text-[14px] text-[#5b6773]">{LIBRARY_COPY.customHint}</p>
        {ctx.doctor?.id ? <AssignForm members={members} /> : <p className="text-[14px] text-[#5b6773]">A doctor profile is required.</p>}
      </div>
    </div>
  )
}
