import { Suspense } from 'react'
import { PlaceHeader } from '@/components/founder/header'
import { AdminRouteSkeleton } from '@/components/loading/route-skeletons'
import { Card, Tag } from '@/components/founder/bits'
import { CouldNotLoad } from '@/components/founder/load-error'
import { founderTablesReady } from '@/lib/founder/audit'
import { loadDoctorBilling } from '@/lib/founder/money'
import { loadFounderRoster } from '@/lib/founder/roster'
import { loadFounderSettings } from '@/lib/founder/settings'
import { readSmsConfig } from '@/lib/sms/config'
import { requireAdminPage } from '@/lib/founder/guard'

export const dynamic = 'force-dynamic'

export default async function HealthPage() {
  await requireAdminPage()
  return (
    <div>
      <PlaceHeader place="pulse" title="System health" subtitle="What this command center can reach right now." />
      <Suspense fallback={<AdminRouteSkeleton />}>
        <HealthBody />
      </Suspense>
    </div>
  )
}

async function HealthBody() {
  let roster
  try {
    roster = await loadFounderRoster()
  } catch {
    return <CouldNotLoad what="system health" />
  }
  const [billing, tables, settings] = await Promise.all([
    loadDoctorBilling(),
    founderTablesReady(),
    loadFounderSettings(),
  ])
  const sms = readSmsConfig()
  const rows = [
    ['Database', roster.doctors.length > 0 ? 'Doctors loaded' : 'No doctors came back', roster.doctors.length > 0],
    ['Demand asks', roster.mentionsOk ? `${roster.demandCount.toLocaleString('en-US')} mentions` : 'Demand table did not load', roster.mentionsOk],
    ['Stripe', billing.stripeOk ? 'Subscriptions answered' : 'Stripe did not answer', billing.stripeOk],
    ['Quo texting', sms.enabled && sms.apiKey ? 'Configured' : 'Switched off or missing a key', Boolean(sms.enabled && sms.apiKey)],
    ['Broadcast log', tables.broadcasts ? 'Table is present' : 'Migration not applied', tables.broadcasts],
    ['Office-visit columns', tables.officeVisit ? 'Present' : 'Migration not applied', tables.officeVisit],
    ['Did you get in?', settings.automations.didYouGetIn ? 'On' : 'Off', settings.automations.didYouGetIn, true],
    ['Auto-nudge', settings.automations.autoNudge ? 'On' : 'Off', settings.automations.autoNudge, true],
    ['Monday digest', settings.automations.mondayDigest ? 'On' : 'Off', settings.automations.mondayDigest, true],
  ] as const

  return (
      <div className="grid gap-3 px-4 py-4 md:grid-cols-2 lg:px-8">
        {rows.map(([label, detail, ok, isSwitch]) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <h2 className="fd-ui font-extrabold">{label}</h2>
              <Tag kind={ok ? 'live' : 'tracking'}>{isSwitch ? (ok ? 'On' : 'Off') : ok ? 'OK' : 'Needs a look'}</Tag>
            </div>
            <p className="mt-2 text-[14px] text-[#5b6773]">{detail}</p>
          </Card>
        ))}
      </div>
  )
}
