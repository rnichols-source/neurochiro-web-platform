import Link from 'next/link'
import { PlaceHeader } from '@/components/founder/header'
import { Card, Tag } from '@/components/founder/bits'
import { requireAdminPage } from '@/lib/founder/guard'
import { loadProfileBuildBoard, type ProfileBuildRow } from '@/lib/profile-build/board'
import { RetryBuildButton } from './retry-button'

export const dynamic = 'force-dynamic'

export default async function ProfileBuildsPage() {
  await requireAdminPage()
  const board = await loadProfileBuildBoard()
  return (
    <div>
      <PlaceHeader
        place="people"
        title="Profile research"
        subtitle="Approved doctors get a researched profile from their public site. Blank fields are filled. Phone and anything already saved stay as they are."
      />
      <div className="space-y-4 px-4 py-4 lg:px-8">
        {!board.ready ? (
          <Card>
            <h2 className="fd-ui text-[17px] font-extrabold">Research is not on yet</h2>
            <p className="mt-2 text-[14px] text-[#5b6773]">The profile_build_jobs table is not in the database. The migration is in the repo and has not been applied.</p>
          </Card>
        ) : null}
        {board.ready && board.failed.length === 0 && board.retrying.length === 0 ? (
          <Card>
            <h2 className="fd-ui text-[17px] font-extrabold">No failures</h2>
            <p className="mt-2 text-[14px] text-[#5b6773]">Nothing is waiting after a failed research pass.</p>
          </Card>
        ) : null}
        {board.failed.length > 0 ? (
          <section className="space-y-3">
            <h2 className="fd-ui text-[17px] font-extrabold text-[#D66829]">Stopped after 3 tries · {board.failed.length}</h2>
            {board.failed.map((row) => <FailureCard key={row.id} row={row} />)}
          </section>
        ) : null}
        {board.retrying.length > 0 ? (
          <section className="space-y-3">
            <h2 className="fd-ui text-[17px] font-extrabold">Will try again · {board.retrying.length}</h2>
            {board.retrying.map((row) => <FailureCard key={row.id} row={row} />)}
          </section>
        ) : null}
      </div>
    </div>
  )
}

function FailureCard({ row }: { row: ProfileBuildRow }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="fd-ui text-[16px] font-extrabold">{row.doctorName}</h3>
            <Tag kind={row.status === 'failed' ? 'tracking' : 'estimate'}>{row.attempts} of 3</Tag>
          </div>
          {row.clinicName ? <p className="mt-1 text-[13px] text-[#5b6773]">{row.clinicName}</p> : null}
          <p className="mt-2 text-[14px] text-[#15202B]">{row.lastError}</p>
          <p className="mt-1 text-[13px] text-[#5b6773]">{stamp(row.updatedAt)}</p>
          <Link href={`/admin/people?id=${row.doctorId}`} className="mt-2 inline-flex min-h-11 items-center text-[13px] font-bold text-[#0A6159]">Open the doctor</Link>
        </div>
        <RetryBuildButton jobId={row.id} />
      </div>
    </Card>
  )
}

function stamp(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return `${date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })} ET`
}
