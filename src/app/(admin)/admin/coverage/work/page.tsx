import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function Page() {
  try {
    await checkAdminAuth()
  } catch {
    redirect('/login?next=/admin')
  }
  redirect('/admin/coverage/reply')
}
