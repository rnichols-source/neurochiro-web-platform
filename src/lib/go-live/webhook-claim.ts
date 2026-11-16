import { isMissingColumn } from '@/lib/leads/schema'
import { processedWebhookAction } from './plan.ts'

type WebhookDb = {
  from: (table: string) => any
}

export async function claimWebhookEvent(supabase: WebhookDb, event: { id: string; type: string }): Promise<'run' | 'skip'> {
  const inserted = await supabase.from('processed_webhooks').insert({
    id: event.id,
    status: 'processing',
    event_type: event.type,
  })
  if (!inserted.error) return 'run'
  if (isMissingColumn(inserted.error)) {
    const bare = await supabase.from('processed_webhooks').insert({ id: event.id })
    if (!bare.error) return 'run'
    return bare.error.code === '23505' ? 'skip' : 'run'
  }
  if (inserted.error.code !== '23505') return 'run'
  const existing = await supabase.from('processed_webhooks').select('id, status').eq('id', event.id).maybeSingle()
  if (existing.error && isMissingColumn(existing.error)) return 'skip'
  const action = processedWebhookAction(existing.data ? { status: existing.data.status ?? null } : { status: null })
  if (action === 'run') {
    await supabase.from('processed_webhooks').update({
      status: 'processing',
      event_type: event.type,
      updated_at: new Date().toISOString(),
    }).eq('id', event.id)
  }
  return action
}

export async function finishWebhookEvent(supabase: WebhookDb, eventId: string, status: 'completed' | 'failed'): Promise<void> {
  const updated = await supabase.from('processed_webhooks').update({
    status,
    updated_at: new Date().toISOString(),
  }).eq('id', eventId)
  if (updated.error && !isMissingColumn(updated.error)) {
    console.error('[go-live] webhook status update failed', updated.error.code || 'error')
  }
}
