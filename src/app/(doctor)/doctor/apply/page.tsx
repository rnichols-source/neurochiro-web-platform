import { redirect } from 'next/navigation'
import { formStepFromRequest } from '@/lib/applications/answers'
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
  }
  return (
    <ApplyForm
      doctorName={state.doctorName}
      canceled={params.canceled === '1'}
      referralCode={params.ref || ''}
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
