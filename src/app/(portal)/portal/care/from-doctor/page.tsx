import { redirect } from 'next/navigation'
import { claimCareSetInvite } from '@/lib/community/library-actions'
import { Card, Kicker } from '@/components/community/ui'

export const dynamic = 'force-dynamic'

export default async function CareFromDoctorPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token || ''
  if (!token) redirect('/portal/care')
  const result = await claimCareSetInvite(token)
  return (
    <Card>
      <Kicker>Care set</Kicker>
      <p className="text-[15px] text-[#15202B]">{result.ok ? 'Your care set is waiting on your Care page.' : result.error}</p>
      {result.ok ? <a href="/portal/care/exercises" className="mt-3 inline-flex min-h-11 items-center font-bold text-[#0E857A]">Open Care</a> : null}
    </Card>
  )
}
