import Link from 'next/link'
import { Card, FunnelList, ReachCounts, Tag } from '@/components/founder/bits'
import { NudgeButton } from '@/components/founder/nudge-button'
import type { FunnelStep, ReachCount } from '@/lib/founder/model'
import type { MorningNeed, PulseKpi, WeekBar } from '@/lib/founder/pulse'

const TONE: Record<MorningNeed['tone'], string> = {
  alert: '#C2413B',
  people: '#0E857A',
  growth: '#2C6BB4',
  money: '#B7791F',
}

export function MorningBanner({ line }: { line: string }) {
  return (
    <p className="rounded-[18px] bg-white px-4 py-3 text-[15px] font-bold leading-snug text-[#15202B]">{line}</p>
  )
}

export function NeedsCard({ needs, instagramClear }: { needs: MorningNeed[]; instagramClear: boolean }) {
  return (
    <Card>
      <h2 className="fd-ui mb-2 text-[17px] font-extrabold text-[#D66829]">Needs you today · {needs.length}</h2>
      {needs.length === 0 ? <p className="text-[14px] text-[#5b6773]">Nothing in this list is waiting.</p> : needs.map((need) => (
        <div key={need.id} className="flex flex-col gap-3 border-t border-[#EFECE7] py-3 first:border-0 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="fd-ui text-[15px] font-extrabold">{need.title}</p>
            <p className="text-[13px] leading-snug text-[#5b6773]">{need.detail}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[180px] sm:items-stretch">
            {need.nudge ? (
              <>
                <Link href={need.href} className="fd-ui inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#E7C4B4] px-3 text-[13px] font-extrabold text-[#B4501A]">See who</Link>
                <NudgeButton count={need.nudge} skipped={need.nudgeSkipped || 0} />
              </>
            ) : (
              <Link href={need.href} className="fd-ui inline-flex min-h-11 w-full items-center justify-center rounded-xl px-3 text-center text-[13px] font-extrabold text-white" style={{ background: TONE[need.tone] }}>{need.action}</Link>
            )}
            {need.seeHref && need.seeLabel ? (
              <Link href={need.seeHref} className="fd-ui inline-flex min-h-11 w-full items-center justify-center rounded-xl px-3 text-center text-[13px] font-extrabold text-[#15202B]">{need.seeLabel}</Link>
            ) : null}
          </div>
        </div>
      ))}
      {instagramClear ? <p className="border-t border-[#EFECE7] pt-3 text-[13px] text-[#5b6773]">Instagram DMs: nothing waiting for you to send.</p> : null}
    </Card>
  )
}

export function KpiCard({ kpi }: { kpi: PulseKpi }) {
  return (
    <div className={`flex h-full flex-col rounded-[18px] border-t-[5px] border-[#D66829] bg-white px-4 py-3 text-[#15202B] ${kpi.wide ? 'col-span-2 xl:col-span-1' : ''}`}>
      <Link href={kpi.href} className="block min-h-11 flex-1">
        <p className="fd-ui text-[11px] font-extrabold uppercase tracking-wide text-[#D66829]">{kpi.label}</p>
        <p className="fd-ui text-[28px] font-extrabold leading-none sm:text-[32px]">{kpi.value}</p>
        <p className="mt-1 text-[13px] leading-snug text-[#5b6773]">{kpi.detail}</p>
        <p className="mt-1 text-[13px] font-bold leading-snug text-[#15202B]">{kpi.delta}</p>
        <span className="mt-2 inline-flex min-h-11 items-center text-[13px] font-bold text-[#B4501A]">{kpi.hrefLabel}</span>
      </Link>
      <Tag kind={kpi.live ? 'live' : 'tracking'}>{kpi.tag}</Tag>
      {kpi.secondaryHref && kpi.secondaryLabel ? (
        <Link href={kpi.secondaryHref} className="mt-1 inline-flex min-h-11 items-center text-[13px] font-bold text-[#B4501A]">{kpi.secondaryLabel}</Link>
      ) : null}
    </div>
  )
}

export function MoneyAlerts({ alerts }: { alerts: { title: string; detail: string; href: string }[] }) {
  if (!alerts.length) return null
  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Link key={alert.title} href={alert.href} className="block min-h-11 rounded-2xl bg-[#FDECEC] px-3 py-2 text-[#15202B]">
          <span className="fd-ui block text-[14px] font-extrabold">{alert.title}</span>
          <span className="text-[13px] text-[#5b6773]">{alert.detail}</span>
        </Link>
      ))}
    </div>
  )
}

export function RequestPath({
  steps,
  median,
}: {
  steps: FunnelStep[]
  median: string
}) {
  return (
    <Card>
      <div className="mb-3">
        <h2 className="fd-ui text-[17px] font-extrabold">Request path</h2>
        <p className="text-[12px] text-[#8a95a1]">Same directory requests, all time. Each step is a share of the first number.</p>
      </div>
      <FunnelList steps={steps} />
      <p className="mt-3 text-[13px] text-[#5b6773]">{median}</p>
      <Link href="/admin/growth/funnel" className="mt-2 inline-flex min-h-11 items-center text-[13px] font-bold text-[#B4501A]">Open the full funnel</Link>
    </Card>
  )
}

export function WeekChart({ weeks, note }: { weeks: WeekBar[]; note: string }) {
  const max = Math.max(1, ...weeks.map((week) => week.n))
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="fd-ui text-[17px] font-extrabold">Visit requests per week</h2>
        <Tag kind="live">Live data</Tag>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {weeks.map((week) => (
          <div key={week.start} className="flex min-w-0 flex-col items-center">
            <span className="fd-ui text-[11px] font-extrabold tabular-nums">{week.n}</span>
            <div className="flex h-16 w-full items-end">
              <div className="w-full rounded-md bg-[#D66829]" style={{ height: `${Math.max(week.n ? 6 : 2, (week.n / max) * 56)}px`, opacity: week.current ? 0.55 : 1 }} />
            </div>
            <span className="mt-1 text-center text-[10px] leading-tight text-[#8a95a1]">{week.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-snug text-[#6b7785]">{note}</p>
      <Link href="/admin/card" className="mt-2 inline-flex min-h-11 items-center text-[13px] font-bold text-[#D66829]">Open the phone stats card</Link>
    </Card>
  )
}

export function WhoHere({ rows }: { rows: { value: string; label: string }[] }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="fd-ui text-[17px] font-extrabold">Who&apos;s on NeuroChiro</h2>
        <Tag kind="live">Live data</Tag>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0 rounded-2xl bg-[#F7F9FC] p-3">
            <b className="fd-ui block text-[26px]">{row.value}</b>
            <span className="text-[12px] leading-snug text-[#3d4a57]">{row.label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function OtherCounts({ counts, listingNote }: { counts: ReachCount[]; listingNote: string }) {
  return (
    <details className="rounded-[22px] bg-white p-4 shadow-[0_10px_26px_-20px_rgba(21,32,43,0.45)]">
      <summary className="fd-ui min-h-11 cursor-pointer text-[15px] font-extrabold">Other counts, not the request path</summary>
      <p className="mt-2 text-[13px] leading-snug text-[#5b6773]">These do not add up to visit requests. A person can be in more than one.</p>
      <div className="mt-3">
        <ReachCounts counts={counts} />
      </div>
      <p className="mt-3 text-[12px] leading-snug text-[#6b7785]">{listingNote}</p>
    </details>
  )
}
