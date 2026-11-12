import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { formStepFromRequest } from '@/lib/applications/answers'
import { rememberApplicantReferral } from '@/lib/member-referrals/db'
import { MEMBER_REF_COOKIE, persistedRef } from '@/lib/member-referrals/logic'
import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import { loginPathWithReturn } from '@/lib/auth/safe-return-path'
import { loadApplyState } from './actions'
import { ApplyForm } from './ApplyForm'

export const dynamic = 'force-dynamic'

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string; ref?: string; step?: string; part?: string }>
}) {
  if (!isApplicationFlowEnabled()) redirect('/doctor/dashboard')
  const state = await loadApplyState()
  if (!state.enabled) redirect('/doctor/dashboard')
  if ('error' in state) redirect(loginPathWithReturn('/doctor/apply'))
  if (state.application && (state.application.cardOnFile || state.application.status !== 'draft')) {
    redirect('/doctor/dashboard')
  }

  const params = await searchParams
  const jar = await cookies()
  const requested = persistedRef({
    query: params.ref,
    cookie: jar.get(MEMBER_REF_COOKIE)?.value,
  })
  let referredBy: string | null = null
  let referralCode = requested || ''
  let referrerName = ''
  try {
    const saved = await rememberApplicantReferral({
      applicantDoctorId: state.doctorId,
      requestedSlug: requested,
    })
    referredBy = saved.displayName
    referralCode = saved.slug || ''
    referrerName = saved.referrerName || ''
  } catch {
    referredBy = null
  }
  const answers = state.application?.answers
  const restored = {
    practiceApproach: answers?.practiceApproach || '',
    techniques: answers?.techniques || '',
    usesNervousSystemScans: answers?.usesNervousSystemScans === true ? 'yes' : answers?.usesNervousSystemScans === false ? 'no' : '',
    scanTypes: answers?.scanTypes || '',
    yearsInPractice: answers?.yearsInPractice == null ? '' : String(answers.yearsInPractice),
    officeAddress: answers?.officeAddress || '',
    city: answers?.city || '',
    state: answers?.state || '',
    country: state.country,
    website: answers?.website || '',
    instagram: answers?.instagram || '',
    heardAbout: answers?.heardAbout || '',
    whyJoin: answers?.whyJoin || '',
    mobile: state.application?.mobileE164 || '',
    smsConsent: state.application?.smsConsent === true,
    referrerName,
  }
  return (
    <ApplyForm
      doctorName={state.doctorName}
      canceled={params.canceled === '1'}
      referralCode={referralCode}
      referredBy={referredBy}
      initialCountry={state.country}
      plans={state.plans.plans}
      currency={state.plans.currency}
      initialStep={formStepFromRequest({
        ...restored,
        yearsInPractice: answers?.yearsInPractice,
        usesNervousSystemScans: answers?.usesNervousSystemScans,
        mobile: restored.mobile,
      }, { step: params.step, part: params.part })}
      initial={restored}
    />
  )
}
