import { PlaceHeader } from '@/components/founder/header'
import { SettingsForm } from '@/components/founder/settings-form'
import { founderTablesReady } from '@/lib/founder/audit'
import { loadFounderSettings } from '@/lib/founder/settings'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [settings, tables] = await Promise.all([loadFounderSettings(), founderTablesReady()])
  return (
    <div>
      <PlaceHeader place="pulse" title="Settings" subtitle="Your figures, and the switches that message real people." />
      <div className="mx-auto max-w-xl px-4 py-4">
        <SettingsForm figures={settings.figures} automations={settings.automations} />
        <div className="mt-6 rounded-2xl bg-white p-4 text-[13px] text-[#5b6773]">
          <p>Broadcast log: {tables.broadcasts ? 'ready' : 'waiting on the founder migration'}</p>
          <p>Banners: {tables.banners ? 'ready' : 'waiting on the founder migration'}</p>
          <p>Office-visit question: {tables.officeVisit ? 'ready' : 'waiting on the founder migration'}</p>
          <p>Audit table: {tables.audit ? 'ready' : 'using a temporary settings buffer'}</p>
        </div>
      </div>
    </div>
  )
}
