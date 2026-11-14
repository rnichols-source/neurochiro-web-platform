'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { buildBackfillBatches, importIgPaste } from '@/lib/instagram/queue'
import { createAdminClient } from '@/lib/supabase-admin'

export async function importInstagramWaitlist(text: string) {
  await checkAdminAuth()
  const result = await importIgPaste(text)
  revalidatePath('/admin/instagram')
  return result
}

export async function createInstagramBackfill() {
  await checkAdminAuth()
  const result = await buildBackfillBatches()
  revalidatePath('/admin/instagram')
  return result
}

export async function markInstagramSent(itemId: string, sent: boolean) {
  await checkAdminAuth()
  const admin = createAdminClient() as any
  await admin.from('ig_dm_items').update({ sent_at: sent ? new Date().toISOString() : null }).eq('id', itemId)
  revalidatePath('/admin/instagram')
}
