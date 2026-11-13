import type { Metadata } from 'next'
import Link from 'next/link'
import { InviteChoice } from '@/components/community/invite-choice'
import { createServerSupabase } from '@/lib/supabase-server'
import { findDoctorsForPlace, loadInvitationByToken, markInvitationOpened } from '@/lib/community/phase-data'
import { isInvitationToken, type ParsedPlace } from '@/lib/community/phases'
import { isStoredCommunityRole } from '@/lib/community/logic'
import { createAdminClient } from '@/lib/supabase-admin'

export const metadata: Metadata = { title: 'A care invitation · NeuroChiro' }
export const dynamic = 'force-dynamic'

export default async function CareInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!isInvitationToken(token)) return <Shell><Missing /></Shell>

  const invite = await loadInvitationByToken(token)
  if (!invite) return <Shell><Missing /></Shell>
  if (invite.status === 'sent') await markInvitationOpened(token)

  const place: ParsedPlace = {
    label: invite.place,
    city: invite.city,
    stateCode: invite.stateCode,
    countryCode: invite.countryCode,
    scope: invite.city ? 'city' : invite.stateCode ? 'state' : 'country',
  }
  const nearby = await findDoctorsForPlace(place, invite.doctorId)
  const session = await viewer()

  return (
    <Shell>
      <p className="text-[12px] font-semibold text-[#6b7785]">Your NeuroChiro</p>
      <h1 className="mt-1 font-heading text-[26px] font-bold tracking-[-0.03em] text-neuro-navy">Someone who cares about you sent this</h1>
      <p className="mt-2 text-[14px] leading-snug text-[#3d4a57]">
        Nervous system chiropractors near {invite.place} are already here. You are not starting from a blank search. Community membership is free.
      </p>
      <p className="mt-2 text-[13px] text-[#6b7785]">Sent for {invite.recipientWords}.</p>
      {invite.note ? (
        <div className="mt-4 rounded-[18px] bg-[#fdf1ea] px-4 py-3">
          <p className="text-[12px] font-semibold text-[#B4501A]">A note</p>
          <p className="mt-1 text-[14px] leading-snug text-neuro-navy">{invite.note}</p>
        </div>
      ) : null}
      <section className="mt-4 rounded-[18px] border border-[rgba(30,45,59,0.08)] bg-white px-4 py-3">
        <p className="mb-2 text-[12px] font-semibold text-[#6b7785]">Near {invite.place}</p>
        {nearby.widened ? <p className="mb-2 text-[12.5px] text-[#6b7785]">None were listed in that exact place. These are listed nearby.</p> : null}
        {nearby.doctors.length === 0 ? (
          <p className="text-[14px] text-[#3d4a57]">No listed doctor is in that place yet. You can still join and look again as the directory grows.</p>
        ) : (
          <ul className="divide-y divide-[#eee]">
            {nearby.doctors.map((doctor) => (
              <li key={doctor.id} className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8eef3] font-heading text-[14px] font-bold text-neuro-navy">{doctor.initials}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-[15px] font-bold text-neuro-navy">{doctor.title}</p>
                    <p className="text-[12px] text-[#6b7785]">
                      {[doctor.city, doctor.state].filter(Boolean).join(' · ')}
                      {invite.doctorId === doctor.id ? ' · they had this office in mind' : ''}
                    </p>
                  </div>
                  {session.community ? (
                    <Link href={`/portal/visit?doctor=${doctor.id}`} className="text-[13px] font-semibold text-[#B4501A]">Request</Link>
                  ) : null}
                </div>
                <InviteChoice token={token} doctorId={doctor.id} community={session.community} hasHome={session.hasHome} />
              </li>
            ))}
          </ul>
        )}
      </section>
      {!session.userId ? (
        <div className="mt-4 flex gap-2">
          <Link href={`/register?role=patient&next=${encodeURIComponent(`/for/${token}`)}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[11px] bg-neuro-orange text-[13.5px] font-semibold text-white">
            Join free
          </Link>
          <Link href={`/login?next=${encodeURIComponent(`/for/${token}`)}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[11px] border border-[#d9dfe5] text-[13.5px] font-semibold text-neuro-navy">
            Log in
          </Link>
        </div>
      ) : !session.community ? (
        <p className="mt-4 text-[13px] leading-snug text-[#3d4a57]">This link is for a community member. Your current account stays as it is.</p>
      ) : (
        <Link href="/portal" className="mt-4 inline-block text-[13px] font-semibold text-[#B4501A]">Back to Your NeuroChiro →</Link>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#F5F3EF] text-[#16202a]">
      <div className="mx-auto w-full max-w-[480px] px-[18px] py-8">{children}</div>
    </main>
  )
}

function Missing() {
  return (
    <>
      <h1 className="font-heading text-[26px] font-bold text-neuro-navy">This link is not active</h1>
      <p className="mt-2 text-[14px] text-[#3d4a57]">Ask the person who sent it for a new one, or look through the directory yourself.</p>
      <Link href="/directory" className="mt-4 inline-block text-[13px] font-semibold text-[#B4501A]">Open the directory →</Link>
    </>
  )
}

async function viewer(): Promise<{ userId: string | null; community: boolean; hasHome: boolean }> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { userId: null, community: false, hasHome: false }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const community = isStoredCommunityRole(profile?.role)
  if (!community) return { userId: user.id, community: false, hasHome: false }
  const admin = createAdminClient() as any
  const home = await admin.from('community_home_doctors').select('profile_id').eq('profile_id', user.id).maybeSingle()
  return { userId: user.id, community: true, hasHome: Boolean(home.data?.profile_id) }
}
