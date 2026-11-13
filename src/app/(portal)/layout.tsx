import { CommunityBanner } from '@/components/founder/live-banner'
import { SavedItemsSeed } from '@/components/portal/saved-seed'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import PortalFrame from './portal-frame'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'pdx1'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const chrome = await loadMemberChrome()
  return (
    <>
      <CommunityBanner />
      <SavedItemsSeed items={chrome?.saved || null} />
      <PortalFrame memberName={chrome?.fullName || null}>{children}</PortalFrame>
    </>
  )
}

async function loadMemberChrome(): Promise<{ fullName: string | null; saved: Record<string, unknown> | null } | null> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient() as any
  const [profile, saved] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    admin.from('doctor_tool_data').select('data').eq('user_id', user.id).eq('tool', 'saved_items').maybeSingle(),
  ])
  const data = saved.data?.data
  return {
    fullName: profile.data?.full_name || null,
    saved: data && typeof data === 'object' ? data as Record<string, unknown> : null,
  }
}
