import { redirect } from 'next/navigation'
import PageHeader from '@/components/portal/PageHeader'
import { loadHomeDoctorMembers } from '@/lib/community/phase-data'
import { getPortalContext } from '@/lib/portal/context'
import { AssignForm } from './assign-form'

export const dynamic = 'force-dynamic'

export default async function CareSetsPage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  if (ctx.role === 'patient') redirect('/portal')
  const members = ctx.doctor?.id ? await loadHomeDoctorMembers(ctx.doctor.id) : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Care sets"
        description="Assign a set you wrote, to a community member who chose you as their home doctor. They decide whether a reminder is on, and whether the title can travel in a passport."
      />
      <div className="rounded-2xl border border-portal-border bg-white p-4">
        {ctx.doctor?.id ? <AssignForm members={members} /> : <p className="text-sm text-portal-ink-2">A doctor profile is required.</p>}
      </div>
    </div>
  )
}
