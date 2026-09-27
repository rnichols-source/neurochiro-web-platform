import ReferralsClient from './ReferralsClient'
import { getReferralPageData } from './actions'

export const dynamic = 'force-dynamic'

export default async function ReferralsPage() {
  const data = await getReferralPageData()
  return <ReferralsClient data={data} />
}
