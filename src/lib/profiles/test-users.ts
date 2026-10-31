import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';

let cache: { at: number; ids: string[] } | null = null;

/** User ids with profiles.is_test. Empty when the column is not there yet. */
export async function hiddenTestUserIds(): Promise<string[]> {
  if (cache && Date.now() - cache.at < 5 * 60 * 1000) return cache.ids;
  const admin = createAdminClient() as any;
  const { data, error } = await admin.from('profiles').select('id').eq('is_test', true).limit(200);
  const ids = error ? [] : (data || []).map((row: { id: string }) => row.id).filter(Boolean);
  cache = { at: Date.now(), ids };
  return ids;
}
