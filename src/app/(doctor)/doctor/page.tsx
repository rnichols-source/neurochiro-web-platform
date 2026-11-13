import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TodayView } from '@/components/doctor/today-view'
import { getPortalContext } from '@/lib/portal/context'
import { loadToday } from '@/lib/doctor/portal-data'

export const dynamic = 'force-dynamic'

export default async function DoctorHomePage() {
  const ctx = await getPortalContext()
  if (!ctx?.doctor) redirect('/login')
  const jar = await cookies()
  const data = await loadToday(ctx, jar.get('nc_doctor_skip_profile')?.value === '1')
  return <TodayView data={data} />
}
