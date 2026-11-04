import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { readSmsConfig } from './config.ts'
import { releaseHeld } from './engine.ts'
import { supabaseSmsStore } from './store.ts'

export async function releaseHeldTexts(): Promise<{ released: number; canceled: number; failed: number; skipped?: 'disabled' }> {
  const runtime = readSmsConfig()
  if (!runtime.enabled) return { released: 0, canceled: 0, failed: 0, skipped: 'disabled' }
  try {
    const db = createAdminClient()
    return await releaseHeld({
      store: supabaseSmsStore(db as unknown as Parameters<typeof supabaseSmsStore>[0]),
      runtime,
    })
  } catch {
    console.warn('[SMS] held texts were not released')
    return { released: 0, canceled: 0, failed: 0 }
  }
}
