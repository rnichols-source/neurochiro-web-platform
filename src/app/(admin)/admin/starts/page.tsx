import Link from 'next/link'
import { PlaceHeader } from '@/components/founder/header'
import { Card, Tag } from '@/components/founder/bits'
import { requireAdminPage } from '@/lib/founder/guard'
import { formatMoney, formatNumber } from '@/lib/founder/format'
import { formatRoiMultiple, roiMultiple } from '@/lib/founder/patient-starts-calc'
import { loadStartsDashboard, type DoctorStartGroup, type StartsTotals } from '@/lib/founder/patient-starts'
import { AddStartForm, DoctorReports } from './starts-forms'

export const dynamic = 'force-dynamic'

export default async function StartsPage() {
  await requireAdminPage()
  const data = await loadStartsDashboard()
  return (
    <div>
      <PlaceHeader
        place="people"
        title="Patients started"
        subtitle="Patients who started care after a NeuroChiro introduction, and the estimated revenue those starts represent."
      />
      <div className="space-y-4 px-4 py-4 lg:px-8">
        <NetworkCard totals={data.totals} />
        <Card>
          <h2 className="fd-ui mb-3 text-[17px] font-extrabold">Add a report</h2>
          <p className="mb-4 text-[13px] text-[#5b6773]">Leave the care plan value blank if you do not have a real number yet. Do not invent one.</p>
          <AddStartForm />
        </Card>
        {data.doctors.length === 0 ? (
          <Card>
            <p className="text-[14px] text-[#5b6773]">No patient-started reports yet.</p>
          </Card>
        ) : data.doctors.map((group) => (
          <DoctorCard key={group.doctorId} group={group} />
        ))}
      </div>
    </div>
  )
}

function NetworkCard({ totals }: { totals: StartsTotals }) {
  const revenueReady = totals.totalEstRevenueUsd != null
  return (
    <section className="rounded-[22px] border-t-[6px] border-[#D66829] bg-white p-5 shadow-[0_10px_26px_-20px_rgba(21,32,43,0.45)] md:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="fd-ui text-[20px] font-extrabold text-[#15202B]">Network total</h2>
        {revenueReady ? <Tag kind="estimate">Estimate</Tag> : <Tag kind="tracking">Revenue incomplete</Tag>}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="fd-ui text-[12px] font-extrabold uppercase tracking-wide text-[#D66829]">Patients started</p>
          <p className="fd-ui mt-1 text-[36px] font-extrabold tabular-nums leading-none">{formatNumber(totals.totalPatientsStarted)}</p>
        </div>
        <div>
          <p className="fd-ui text-[12px] font-extrabold uppercase tracking-wide text-[#D66829]">Est. revenue</p>
          <p className="fd-ui mt-1 text-[36px] font-extrabold tabular-nums leading-none">{revenueReady ? formatMoney(totals.totalEstRevenueUsd) : '—'}</p>
        </div>
        <div>
          <p className="fd-ui text-[12px] font-extrabold uppercase tracking-wide text-[#D66829]">Doctors reporting</p>
          <p className="fd-ui mt-1 text-[36px] font-extrabold tabular-nums leading-none">{formatNumber(totals.doctorCount)}</p>
        </div>
      </div>
      {!revenueReady ? (
        <p className="mt-4 text-[14px] text-[#5b6773]">Estimated revenue is incomplete until every report has a care plan value.</p>
      ) : (
        <p className="mt-4 text-[14px] text-[#5b6773]">Use this total when recruiting. Values marked estimate use a typical care plan until a doctor gives a real number.</p>
      )}
    </section>
  )
}

function DoctorCard({ group }: { group: DoctorStartGroup }) {
  const place = [group.city, group.state].filter(Boolean).join(', ')
  const roi = group.estRevenueUsd != null && group.membership.annualUsd != null
    ? roiMultiple(group.estRevenueUsd, group.membership.annualUsd)
    : null
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="fd-ui text-[17px] font-extrabold">{group.doctorName}</h2>
          <p className="text-[13px] text-[#5b6773]">{[group.clinicName, place].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-[13px] font-bold">
          {group.doctorSlug ? (
            <a className="inline-flex min-h-11 items-center text-[#B4501A]" href={`https://www.neurochiro.co/chiropractor/${encodeURIComponent(group.doctorSlug)}`} target="_blank" rel="noreferrer">Public profile</a>
          ) : null}
          <Link className="inline-flex min-h-11 items-center text-[#0A6159]" href={`/admin/members?member=${encodeURIComponent(group.doctorId)}`}>Open in members</Link>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Patients started" value={formatNumber(group.patientsStarted)} />
        <Stat
          label="Est. revenue"
          value={group.estRevenueUsd == null ? '—' : formatMoney(group.estRevenueUsd)}
          tag={group.estRevenueUsd != null && group.valueIsEstimate ? 'Estimate' : null}
        />
        <Stat
          label="Introductions sent"
          value={group.officialIntroCount == null ? '—' : formatNumber(group.officialIntroCount)}
          detail="Official sent-to-patient count"
        />
      </div>
      <RoiLine group={group} roi={roi} />
      <div className="mt-4">
        <DoctorReports group={group} />
      </div>
    </Card>
  )
}

function Stat({ label, value, tag, detail }: { label: string; value: string; tag?: string | null; detail?: string }) {
  return (
    <div className="rounded-2xl bg-[#F8F6F3] px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="fd-ui text-[11px] font-extrabold uppercase tracking-wide text-[#D66829]">{label}</p>
        {tag ? <Tag kind="estimate">{tag}</Tag> : null}
      </div>
      <p className="fd-ui mt-1 text-[22px] font-extrabold tabular-nums">{value}</p>
      {detail ? <p className="mt-1 text-[12px] text-[#5b6773]">{detail}</p> : null}
    </div>
  )
}

function RoiLine({ group, roi }: { group: DoctorStartGroup; roi: number | null }) {
  if (group.estRevenueUsd == null) {
    return <p className="mt-4 text-[14px] text-[#5b6773]">Care plan value is unknown, so estimated revenue and ROI are not shown. Enter a value on a report to calculate them.</p>
  }
  if (roi != null && group.membership.annualUsd != null) {
    return (
      <p className="mt-4 text-[14px] text-[#15202B]">
        {formatMoney(group.estRevenueUsd)} in estimated revenue vs {formatMoney(group.membership.annualUsd)} annual membership
        {group.membership.amountLabel ? ` (${group.membership.amountLabel})` : ''}. That is about {formatRoiMultiple(roi)} the annual membership cost.
        {group.valueIsEstimate ? ' Revenue is marked as an estimate.' : ''}
      </p>
    )
  }
  const reason = group.membership.reason === 'stripe_unavailable'
    ? 'Stripe is unavailable, so membership cost and ROI are not shown.'
    : 'Membership cost is not in Stripe yet, so ROI is not shown.'
  return <p className="mt-4 text-[14px] text-[#5b6773]">Est. revenue is {formatMoney(group.estRevenueUsd)}. {reason}</p>
}
