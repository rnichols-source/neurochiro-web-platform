import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import { activeUsdDoctorPlan } from '@/lib/pricing'
import GetStartedClient from './GetStartedClient'

export const revalidate = 3600

export default function GetStartedPage() {
  const plan = activeUsdDoctorPlan()
  return (
    <GetStartedClient
      applicationFlow={isApplicationFlowEnabled()}
      monthlyLabel={plan.perMonth}
      annualLabel={plan.perYear}
    />
  )
}
