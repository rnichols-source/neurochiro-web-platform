import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PlaceHeader } from '@/components/founder/header'
import { recordDoctorPreview } from '@/app/(admin)/admin/founder-actions'
import { doctorRows } from '@/lib/founder/model'
import { loadFounderRoster } from '@/lib/founder/roster'
import { siteUrl } from '@/lib/leads/config'

export const dynamic = 'force-dynamic'

export default async function DoctorPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const roster = await loadFounderRoster()
  const doctor = doctorRows(roster).find((row) => row.id === id)
  if (!doctor) notFound()
  await recordDoctorPreview(doctor.id, doctor.name)
  const publicUrl = doctor.slug ? `${siteUrl()}/directory/${doctor.slug}` : null

  return (
    <div>
      <PlaceHeader place="people" title={doctor.name} subtitle="Read-only preview. You are still signed in as admin. This view is written to the audit log." />
      <div className="mx-auto max-w-xl space-y-3 px-4 py-4">
        <div className="rounded-[22px] bg-white p-5">
          <p className="text-[14px] text-[#5b6773]">{doctor.where} · {doctor.plan}</p>
          <p className="mt-3 text-[15px]">Health {doctor.health}. {doctor.reasons.join(' · ')}</p>
          <p className="mt-2 text-[15px]">{doctor.requests} requests · {doctor.confirmed} confirmed contact · {doctor.views} profile views on the listing counter.</p>
          {doctor.timeline.map((line) => <p key={line} className="mt-1 text-[13px] text-[#5b6773]">{line}</p>)}
        </div>
        <div className="flex flex-wrap gap-2">
          {publicUrl ? <a href={publicUrl} className="fd-ui inline-flex min-h-12 items-center rounded-xl bg-[#0E857A] px-4 font-extrabold text-white">Open the public page</a> : null}
          <Link href="/doctor/dashboard" className="fd-ui inline-flex min-h-12 items-center rounded-xl border border-[#D7DEE6] px-4 font-extrabold">Your doctor home</Link>
          <Link href={`/admin/people?id=${doctor.id}`} className="fd-ui inline-flex min-h-12 items-center rounded-xl border border-[#D7DEE6] px-4 font-extrabold">Back to People</Link>
        </div>
        <p className="text-[13px] text-[#6b7785]">This does not sign you in as the doctor. It shows the same counts the command center uses, and opens their public listing.</p>
      </div>
    </div>
  )
}
