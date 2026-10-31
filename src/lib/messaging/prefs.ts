import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';

export type NotificationPrefs = {
  messages: boolean;
  referrals: boolean;
  emailEnabled: boolean;
  raw: Record<string, unknown>;
};

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const admin = createAdminClient() as any;
  const profile = await admin.from('profiles').select('notification_preferences').eq('id', userId).maybeSingle();
  const raw = profile.data?.notification_preferences && typeof profile.data.notification_preferences === 'object'
    ? profile.data.notification_preferences as Record<string, unknown>
    : {};
  const table = await admin.from('notification_preferences').select('email_enabled, referral_alerts').eq('user_id', userId).maybeSingle();
  const messages = typeof raw.messages === 'boolean' ? raw.messages : true;
  const referrals = typeof raw.referrals === 'boolean' ? raw.referrals : (table.data?.referral_alerts ?? true);
  return {
    messages,
    referrals,
    emailEnabled: table.data?.email_enabled ?? true,
    raw,
  };
}
