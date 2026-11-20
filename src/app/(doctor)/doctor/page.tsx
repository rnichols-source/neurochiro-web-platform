import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TodayView } from '@/components/doctor/today-view'
import { GettingStarted } from '@/components/doctor/getting-started'
import { MemberReferralBanner } from '@/components/portal/MemberReferralInvite'
import { loadMemberInvite } from '@/lib/member-referrals/invite'
import { getPortalContext } from '@/lib/portal/context'
import { loadToday } from '@/lib/doctor/portal-data'
import { createAdminClient } from '@/lib/supabase-admin'
import { isMissingColumn } from '@/lib/leads/schema'

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
  const admin = createAdminClient() as any
  const [instagram, dismissedColumn] = await Promise.all([
    admin.from('doctors').select('instagram_url').eq('id', ctx.doctor.id).maybeSingle(),
    admin.from('doctors').select('getting_started_dismissed_at').eq('id', ctx.doctor.id).maybeSingle(),
  ])
  const dismissed = jar.get('nc_getting_started_dismissed')?.value === '1'
    || (!isMissingColumn(dismissedColumn.error) && Boolean(dismissedColumn.data?.getting_started_dismissed_at))
  return (
    <>
      <Suspense fallback={null}>
        <ReferralBanner invite={invite} />
      </Suspense>
      {dismissed ? null : (
        <GettingStarted
          profileDone={data.checklist.complete}
          instagramDone={Boolean(instagram.data?.instagram_url)}
        />
      )}
      <TodayView data={data} />
    </>
  )
}
