import { redirect } from 'next/navigation'
import { isApplicationFlowEnabled } from '@/lib/applications/flag'
import RegisterClient from './RegisterClient'

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const flow = isApplicationFlowEnabled()
  if (flow && one(params.role) === 'doctor' && !one(params.claim_id)) {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      const item = one(value)
      if (item) next.set(key, item)
    }
    next.set('role', 'doctor')
    redirect(`/get-started?${next.toString()}`)
  }
  return <RegisterClient applicationFlow={flow} />
}
