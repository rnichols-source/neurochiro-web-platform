import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Tabs } from '@/components/admin/ui/Tabs'
import ClipsPage from '../clips/page'
import SpotlightPage from '../spotlight/page'
import AnnouncementsPage from '../announcements/page'
import ContentTrackerPage from '../content-tracker/page'

export const dynamic = 'force-dynamic'

const TABS = [
  { id: 'clips', label: 'Clips' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'tracker', label: 'Content tracker' },
] as const

type TabId = (typeof TABS)[number]['id']

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  try {
    await checkAdminAuth()
  } catch {
    redirect('/login?next=/admin')
  }
  const params = await searchParams
  const requested = params.tab || 'clips'
  const active: TabId = TABS.some((tab) => tab.id === requested) ? requested as TabId : 'clips'

  return (
    <div className="space-y-4 px-4 py-6">
      <PageHeader title="Content" description="Clips, Spotlight, announcements, and the content tracker." />
      <Tabs
        active={active}
        items={TABS.map((tab) => ({ id: tab.id, label: tab.label, href: `/admin/content?tab=${tab.id}` }))}
      />
      {active === 'clips' ? <ClipsPage /> : null}
      {active === 'spotlight' ? <SpotlightPage /> : null}
      {active === 'announcements' ? <AnnouncementsPage /> : null}
      {active === 'tracker' ? <ContentTrackerPage /> : null}
    </div>
  )
}
