import Link from 'next/link'
import { Card, Tag } from '@/components/founder/bits'
import { formatMoney, formatNumber } from '@/lib/founder/format'
import { loadStartsDashboard } from '@/lib/founder/patient-starts'

export async function StartsPulseCard() {
  const { totals } = await loadStartsDashboard()
  const ready = totals.totalEstRevenueUsd != null
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="fd-ui text-[17px] font-extrabold">Patients started</h2>
        {ready ? <Tag kind="estimate">Estimate</Tag> : <Tag kind="tracking">Revenue incomplete</Tag>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="fd-ui text-[11px] font-extrabold uppercase tracking-wide text-[#D66829]">Patients</p>
          <p className="fd-ui mt-1 text-[22px] font-extrabold tabular-nums">{formatNumber(totals.totalPatientsStarted)}</p>
        </div>
        <div>
          <p className="fd-ui text-[11px] font-extrabold uppercase tracking-wide text-[#D66829]">Est. revenue</p>
          <p className="fd-ui mt-1 text-[22px] font-extrabold tabular-nums">{ready ? formatMoney(totals.totalEstRevenueUsd) : '—'}</p>
        </div>
        <div>
          <p className="fd-ui text-[11px] font-extrabold uppercase tracking-wide text-[#D66829]">Doctors</p>
          <p className="fd-ui mt-1 text-[22px] font-extrabold tabular-nums">{formatNumber(totals.doctorCount)}</p>
        </div>
      </div>
      {!ready ? <p className="mt-3 text-[13px] text-[#5b6773]">Estimated revenue is incomplete until every report has a care plan value.</p> : null}
      <Link href="/admin/starts" className="mt-3 inline-flex min-h-11 items-center text-[13px] font-bold text-[#B4501A]">Open patients started</Link>
    </Card>
  )
}
