import { redirect } from 'next/navigation'
import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import { loadApplyState } from './actions'
import { ApplyForm } from './ApplyForm'

export const dynamic = 'force-dynamic'

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string; ref?: string }>
}) {
  if (!isApplicationFlowEnabled()) redirect('/doctor/dashboard')
  const state = await loadApplyState()
  if (!state.enabled) redirect('/doctor/dashboard')
  if ('error' in state) redirect('/login?next=/doctor/apply')

  const params = await searchParams
  const answers = state.application?.answers
  return (
    <ApplyForm
      doctorName={state.doctorName}
      canceled={params.canceled === '1'}
      referralCode={params.ref || ''}
      initialCountry={state.country}
      plans={state.plans.plans}
      currency={state.plans.currency}
      initial={{
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
      }}
    />
  )
}
