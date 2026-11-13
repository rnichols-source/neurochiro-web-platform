import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DoctorBand } from '@/components/doctor/chrome'
import { PracticeView } from '@/components/doctor/practice-view'
import { getPortalContext } from '@/lib/portal/context'
import { loadToday } from '@/lib/doctor/portal-data'

export const dynamic = 'force-dynamic'

export default async function PracticePage() {
  const ctx = await getPortalContext()
  if (!ctx?.doctor) redirect('/login')
  const jar = await cookies()
  const today = await loadToday(ctx, jar.get('nc_doctor_skip_profile')?.value === '1')
  const views = `${(ctx.doctor.profile_views || 0).toLocaleString()} profile views`
  const plan = ctx.membership.isFounder
    ? 'Founding member'
    : ctx.membership.priceLabel || (ctx.membership.tier === 'pro' ? 'Pro' : 'Free')
  return (
    <div>
      <DoctorBand place="practice" title="Practice" subtitle="Profile, billing, and the tools for your office." />
      <PracticeView
        checklist={today.checklist}
        clinic={ctx.doctor.clinic_name || 'Your practice'}
        place={[ctx.doctor.city, ctx.doctor.state].filter(Boolean).join(', ')}
        plan={plan}
        views={views}
        hasPracticeTools={ctx.membership.hasPracticeTools}
        showNeuros={Boolean(ctx.doctor.neuros_tier)}
      />
    </div>
  )
}
