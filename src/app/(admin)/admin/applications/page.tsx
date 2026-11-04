import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'
import { listAdminApplications } from '@/lib/applications/store'
import { ApplicationsClient } from './ApplicationsClient'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPage() {
  try {
    await checkAdminAuth()
  } catch {
    redirect('/login?next=/admin/applications')
  }

  const { rows, error } = await listAdminApplications()
  return <ApplicationsClient rows={rows} loadError={error} />
}
