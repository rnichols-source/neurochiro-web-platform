import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'
import { listAdminApplications } from '@/lib/applications/store'
import { ApplicationsClient } from './ApplicationsClient'

export const dynamic = 'force-dynamic'

function safeNotice(value: string | undefined): string {
  if (!value) return ''
  const text = value.slice(0, 400)
  if (!text.includes('did not send')) return ''
  return text
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; queue?: string }>
}) {
  try {
    await checkAdminAuth()
  } catch {
    redirect('/login?next=/admin/applications')
  }

  const params = await searchParams
  const queue = params.queue === 'progress' || params.queue === 'all' || params.queue === 'decision' ? params.queue : 'decision'
  const { rows, error } = await listAdminApplications()
  return <ApplicationsClient rows={rows} loadError={error} initialNotice={safeNotice(params.notice)} initialQueue={queue} />
}
