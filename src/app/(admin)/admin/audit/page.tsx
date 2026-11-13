import { PlaceHeader } from '@/components/founder/header'
import { Card, Tag } from '@/components/founder/bits'
import { listAudit } from '@/lib/founder/audit'
import { requireAdminPage } from '@/lib/founder/guard'

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
  await requireAdminPage()
  const audit = await listAudit()
  return (
    <div>
      <PlaceHeader place="broadcast" title="Audit log" subtitle="Every broadcast and every view-as-doctor, plus nudges and setting changes." />
      <div className="px-4 py-4 lg:px-8">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="fd-ui font-extrabold">Recent events</h2>
            <Tag kind={audit.source === 'empty' ? 'tracking' : 'live'}>{audit.source === 'empty' ? 'Starts tracking now' : audit.source === 'buffer' ? 'Saved in settings until the migration' : 'Live data'}</Tag>
          </div>
          {audit.rows.length === 0 ? (
            <p className="text-[14px] text-[#5b6773]">Nothing has been logged yet. A broadcast, a nudge, or “view as doctor” will show up here.</p>
          ) : audit.rows.map((row) => (
            <div key={row.id} className="border-t border-[#EFECE7] py-3">
              <p className="fd-ui text-[14px] font-extrabold">{row.summary}</p>
              <p className="text-[12px] text-[#6b7785]">{row.action} · {row.createdAt ? new Date(row.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York' }) : ''}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
