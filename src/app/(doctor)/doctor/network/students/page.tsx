import { redirect } from 'next/navigation'
import { NetworkFrame } from '@/components/doctor/network-frame'
import { StudentsDesk } from '@/components/doctor/students-desk'
import { getPortalContext } from '@/lib/portal/context'
import { loadStudentDesk } from '@/lib/doctor/portal-data'

export const dynamic = 'force-dynamic'

export default async function NetworkStudentsPage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  const desk = await loadStudentDesk(ctx.doctor?.city || null)
  const pro = ctx.membership.tier === 'pro' || ctx.membership.tier === 'neuros' || ctx.membership.isFounder
  return (
    <NetworkFrame active="/doctor/network/students">
      <StudentsDesk students={pro ? desk.students : []} open={desk.open} pro={pro} />
    </NetworkFrame>
  )
}
