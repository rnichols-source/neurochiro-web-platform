import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { countAttention } from '@/lib/leads/attention-count'
import { AdminShell } from './admin-shell'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user: { id: string; email?: string | null }
  try {
    user = await checkAdminAuth()
  } catch {
    redirect('/login?next=/admin')
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  let leadAttention: number | null = null
  try {
    leadAttention = await countAttention()
  } catch (err) {
    console.error('admin lead badge', err instanceof Error ? err.name : 'error')
    leadAttention = null
  }

  const role = profile?.role || ''
  const name = profile?.full_name || user.email || 'Admin'

  return (
    <AdminShell role={role} name={name} leadAttention={leadAttention}>
      {children}
    </AdminShell>
  )
}
