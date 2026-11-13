import { redirect } from 'next/navigation'
import PageHeader from '@/components/portal/PageHeader'
import { loadHomeDoctorMembers } from '@/lib/community/phase-data'
import { libraryPlans } from '@/lib/community/library-content'
import { CATEGORY_LABELS, LIBRARY_COPY, categoriesInUse, librarySummaries } from '@/lib/community/library-model'
import { isStoredCommunityRole } from '@/lib/community/logic'
import { getPortalContext } from '@/lib/portal/context'
import { AssignForm } from './assign-form'
import { LibraryBrowser } from './library-browser'

export const dynamic = 'force-dynamic'

export default async function CareSetsPage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  if (isStoredCommunityRole(ctx.role)) redirect('/portal')
  const plans = libraryPlans()
  const members = ctx.doctor?.id ? await loadHomeDoctorMembers(ctx.doctor.id) : []
  const categories = categoriesInUse(plans).map((id) => ({ id, label: CATEGORY_LABELS[id] }))

  return (
    <div className="space-y-8">
      <PageHeader title="Care sets" description={LIBRARY_COPY.doctorIntro} />
      <LibraryBrowser plans={librarySummaries(plans)} categories={categories} />
      <div className="rounded-2xl border border-portal-border bg-white p-4">
        <h2 className="text-lg font-bold text-portal-ink">{LIBRARY_COPY.customSet}</h2>
        <p className="mt-1 mb-4 text-sm text-portal-ink-2">{LIBRARY_COPY.customHint}</p>
        {ctx.doctor?.id ? <AssignForm members={members} /> : <p className="text-sm text-portal-ink-2">A doctor profile is required.</p>}
      </div>
    </div>
  )
}
