import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';

const sentToday = new Map<string, string>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Discord ping once per doctor per day. Does not write portal_login rows
 * into the doctor's notifications. Uses portal_logins when that table exists,
 * otherwise one send per server instance per day.
 */
export async function recordPortalLogin(input: {
  userId: string;
  name: string | null;
  city: string | null;
  clinic: string | null;
}): Promise<void> {
  const today = todayKey();
  if (sentToday.get(input.userId) === today) return;

  const admin = createAdminClient() as any;
  try {
    const existing = await admin
      .from('portal_logins')
      .select('id')
      .eq('user_id', input.userId)
      .eq('logged_on', today)
      .limit(1);
    if (!existing.error && existing.data?.length) {
      sentToday.set(input.userId, today);
      return;
    }
    if (!existing.error) {
      await admin.from('portal_logins').insert({ user_id: input.userId, logged_on: today });
    }
  } catch {
    // Table missing until the draft migration runs. Memory guard still applies.
  }

  sentToday.set(input.userId, today);
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;
  const who = input.name || 'A doctor';
  const where = input.city ? ` — ${input.city}` : '';
  const clinic = input.clinic ? `\n${input.clinic}` : '';
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `Doctor portal login\n${who}${where}${clinic}` }),
  }).catch(() => {});
}
