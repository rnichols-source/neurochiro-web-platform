import 'server-only'

import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'

/**
 * Page-level admin check. The admin layout already checks, but layouts and
 * pages render in parallel, so every founder page checks on its own too.
 */
export async function requireAdminPage(): Promise<{ id: string; email?: string | null }> {
  let user: { id: string; email?: string | null } | null = null
  try {
    user = await checkAdminAuth()
  } catch {
    user = null
  }
  if (!user) redirect('/login?next=/admin')
  return user
}
