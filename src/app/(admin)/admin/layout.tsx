import { redirect } from 'next/navigation'
import { loadAdminActor } from '@/lib/admin-auth'
import { isAdminRole } from '@/lib/founder'
import { loadShellAlerts } from '@/lib/founder/alerts'
import { AdminShell } from './admin-shell'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'pdx1'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [actor, alerts] = await Promise.all([
    loadAdminActor().catch(() => null),
    loadShellAlerts().catch(() => []),
  ])
  if (!actor || !isAdminRole(actor.role)) redirect('/login?next=/admin')

  const role = actor.role
  const name = actor.name || actor.user.email || 'Admin'

  return (
    <AdminShell role={role} name={name} alerts={alerts}>
      {children}
    </AdminShell>
  )
}
