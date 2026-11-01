import Link from 'next/link'
import { redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Tabs } from '@/components/admin/ui/Tabs'
import ContactRequestsPage from '../contact-requests/page'
import AdminListPage from '../list/page'
import ReferralsPage from '../referrals/page'
import RecommendationsPage from '../stats/recommendations/page'
import AdminMatchPage from '../match/page'
import CapturedLeads from './captured'

export const dynamic = 'force-dynamic'

const TABS = [
  { id: 'requests', label: 'Requests' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'introductions', label: 'Introductions' },
  { id: 'matching', label: 'Matching' },
  { id: 'captured', label: 'Captured' },
] as const

type TabId = (typeof TABS)[number]['id']

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; view?: string }>
}) {
  try {
    await checkAdminAuth()
  } catch {
    redirect('/login?next=/admin')
  }
  const params = await searchParams
  const requested = params.tab || 'requests'
  const active: TabId = TABS.some((tab) => tab.id === requested) ? requested as TabId : 'requests'
  const showStats = active === 'introductions' && params.view === 'stats'

  return (
    <div className="space-y-4 px-4 py-6">
      <PageHeader
        title="Leads"
        description="Requests, the patient waitlist, introductions, matching, and the older captured-leads list."
      />
      <Tabs
        active={active}
        items={TABS.map((tab) => ({ id: tab.id, label: tab.label, href: `/admin/leads?tab=${tab.id}` }))}
      />
      {active === 'introductions' ? (
        <p className="text-sm">
          {showStats ? (
            <Link className="inline-flex min-h-11 items-center text-neuro-orange-ink" href="/admin/leads?tab=introductions">Back to introductions</Link>
          ) : (
            <Link className="inline-flex min-h-11 items-center text-neuro-orange-ink" href="/admin/leads?tab=introductions&view=stats">Recommendation stats</Link>
          )}
        </p>
      ) : null}
      {active === 'requests' ? <ContactRequestsPage /> : null}
      {active === 'waitlist' ? <AdminListPage /> : null}
      {active === 'introductions' && showStats ? <RecommendationsPage /> : null}
      {active === 'introductions' && !showStats ? <ReferralsPage /> : null}
      {active === 'matching' ? <AdminMatchPage /> : null}
      {active === 'captured' ? <CapturedLeads /> : null}
    </div>
  )
}
