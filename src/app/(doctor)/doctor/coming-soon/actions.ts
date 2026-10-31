'use server';

import { PORTAL_FEATURES } from '@/config/portal-features';
import { getPortalContext } from '@/lib/portal/context';
import { createAdminClient } from '@/lib/supabase-admin';

export async function notifyComingSoon(featureKey: string): Promise<{ ok: boolean }> {
  const feature = PORTAL_FEATURES.find((item) => item.key === featureKey);
  const ctx = await getPortalContext();
  if (!feature || !ctx) return { ok: false };
  const admin = createAdminClient() as any;
  const admins = await admin.from('profiles').select('id').in('role', ['founder', 'super_admin']).limit(5);
  const label = feature.label;
  const who = ctx.fullName || 'A doctor';
  if (!admins.error && admins.data?.length) {
    await admin.from('notifications').insert(admins.data.map((adminUser: { id: string }) => ({
      user_id: adminUser.id,
      title: 'Coming soon interest',
      body: `${who} wants to know when ${label} opens.`,
      type: 'coming_soon_interest',
      priority: 'info',
    })));
    return { ok: true };
  }
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `${who} wants to know when ${label} opens.` }),
    }).catch(() => {});
  }
  return { ok: true };
}
