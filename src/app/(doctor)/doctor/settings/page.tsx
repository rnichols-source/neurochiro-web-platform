import { redirect } from 'next/navigation';
import { listBlockedPeople } from '@/app/actions/messaging-actions';
import { getPortalContext } from '@/lib/portal/context';
import { createAdminClient } from '@/lib/supabase-admin';
import SettingsClient from './SettingsClient';

type Prefs = {
  appointment_requests: boolean;
  referrals: boolean;
  messages: boolean;
  system_updates: boolean;
};

const DEFAULT_PREFS: Prefs = {
  appointment_requests: true,
  referrals: true,
  messages: true,
  system_updates: true,
};

export default async function SettingsPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect('/login');
  const admin = createAdminClient();
  const [prefsRes, blocked] = await Promise.all([
    admin.from('profiles').select('notification_preferences').eq('id', ctx.userId).maybeSingle(),
    listBlockedPeople(),
  ]);
  const stored = (prefsRes.data?.notification_preferences && typeof prefsRes.data.notification_preferences === 'object'
    ? prefsRes.data.notification_preferences
    : {}) as Partial<Prefs>;
  return (
    <SettingsClient
      email={ctx.email || ''}
      initialPrefs={{ ...DEFAULT_PREFS, ...stored }}
      initialBlocked={blocked}
    />
  );
}
