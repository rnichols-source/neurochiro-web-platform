import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TodayView } from '@/components/doctor/today-view'
import { MemberReferralBanner } from '@/components/portal/MemberReferralInvite'
import { loadMemberInvite } from '@/lib/member-referrals/invite'
import { getPortalContext } from '@/lib/portal/context'
import { loadToday } from '@/lib/doctor/portal-data'

async function ReferralBanner({ invite }: { invite: ReturnType<typeof loadMemberInvite> }) {
  const loaded = await invite
  if (!loaded || loaded.dismissed) return null
  return <MemberReferralBanner title={loaded.title} body={loaded.body} message={loaded.message} />
}

export const dynamic = 'force-dynamic'

export default async function DoctorHomePage() {
  const ctx = await getPortalContext()
  if (!ctx?.doctor) redirect('/login')
  const jar = await cookies()
  const invite = loadMemberInvite(ctx.doctor.id)
  const data = await loadToday(ctx, jar.get('nc_doctor_skip_profile')?.value === '1')
  return (
    <>
      <Suspense fallback={null}>
        <ReferralBanner invite={invite} />
      </Suspense>
      <TodayView data={data} />
    </>
  )
}
