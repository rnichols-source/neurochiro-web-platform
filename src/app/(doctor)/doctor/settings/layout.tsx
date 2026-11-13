import { MemberInviteSection } from '@/components/portal/MemberInviteSection';
import { listBlockedPeople } from '@/app/actions/messaging-actions';
import { getPortalContext } from '@/lib/portal/context';
import { createAdminClient } from '@/lib/supabase-admin';
import FeatureGate from '../FeatureGate';
import { SettingsSeed } from './seed';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const ctx = await getPortalContext();
  const chrome = ctx ? await loadSettingsChrome(ctx.userId) : null
  return (
    <FeatureGate feature="settings">
      <div className="mb-6">
        <MemberInviteSection doctorId={ctx?.doctor?.id} />
      </div>
      <SettingsSeed email={ctx?.email || ''} prefs={chrome?.prefs || null} blocked={chrome?.blocked || []}>
        {children}
      </SettingsSeed>
    </FeatureGate>
  );
}

async function loadSettingsChrome(userId: string) {
  const admin = createAdminClient() as any
  const [profile, blocked] = await Promise.all([
    admin.from('profiles').select('notification_preferences').eq('id', userId).maybeSingle(),
    listBlockedPeople().catch(() => []),
  ])
  const prefs = profile.data?.notification_preferences
  return {
    prefs: prefs && typeof prefs === 'object' ? prefs as Record<string, boolean> : null,
    blocked: Array.isArray(blocked) ? blocked : [],
  }
}
