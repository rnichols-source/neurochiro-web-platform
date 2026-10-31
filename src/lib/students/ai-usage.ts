import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { missingSchema } from '@/lib/students/schema';

export async function aiUsesToday(userId: string, feature: string): Promise<number> {
  const admin = createAdminClient();
  const day = new Date().toISOString().slice(0, 10);
  const usage = await (admin as any).from('ai_usage').select('count').eq('user_id', userId).eq('feature', feature).eq('used_on', day).maybeSingle();
  if (!usage.error && usage.data) return Number((usage.data as { count?: number }).count || 0);
  if (usage.error && !missingSchema(usage.error)) return Number.MAX_SAFE_INTEGER;
  const start = `${day}T00:00:00.000Z`;
  const contracts = await admin.from('contracts').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', start);
  if (contracts.error) return 0;
  return contracts.count || 0;
}

export async function recordAiUse(userId: string, feature: string): Promise<void> {
  const admin = createAdminClient();
  const day = new Date().toISOString().slice(0, 10);
  const existing = await (admin as any).from('ai_usage').select('count').eq('user_id', userId).eq('feature', feature).eq('used_on', day).maybeSingle();
  if (existing.error && missingSchema(existing.error)) return;
  const count = Number((existing.data as { count?: number } | null)?.count || 0) + 1;
  await (admin as any).from('ai_usage').upsert({ user_id: userId, feature, used_on: day, count }, { onConflict: 'user_id,feature,used_on' });
}
