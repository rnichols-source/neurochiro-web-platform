'use server'

import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function queueAnnouncementBroadcast(title: string, audienceType: string) {
  try {
    await checkAdminAuth()
  } catch {
    return { error: 'Unauthorized' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('automation_queue').insert({
    event_type: 'broadcast_announcement',
    payload: { title, audience_type: audienceType || 'all' },
    status: 'pending',
  })
  if (error) return { error: 'Could not queue the announcement.' }
  return { ok: true as const }
}
