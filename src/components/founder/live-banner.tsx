import { createAdminClient } from '@/lib/supabase-admin'

export async function CommunityBanner() {
  const admin = createAdminClient() as any
  const rows = await admin.from('founder_banners').select('id, title, body, href, audience_key, starts_at, ends_at, active').eq('active', true).limit(8)
  if (rows.error || !rows.data?.length) return null
  const now = new Date().toISOString()
  const banner = rows.data.find((row: { audience_key?: string; starts_at?: string | null; ends_at?: string | null }) => {
    if (row.audience_key !== 'members' && row.audience_key !== 'everyone') return false
    if (row.starts_at && row.starts_at > now) return false
    if (row.ends_at && row.ends_at < now) return false
    return true
  })
  if (!banner) return null
  const inner = (
    <span className="block px-4 py-3 text-center text-[14px] text-white" style={{ background: '#7A4A94' }}>
      <strong>{banner.title}</strong> {banner.body}
    </span>
  )
  if (banner.href) return <a href={banner.href}>{inner}</a>
  return inner
}
