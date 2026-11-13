import type { Metadata } from 'next'
import { InviteForm } from '@/components/community/invite-form'
import { BackHeading, Card, Kicker } from '@/components/community/ui'
import { requireCommunityMember } from '@/lib/community/data'
import { loadInvitations } from '@/lib/community/phase-data'
import { invitationUrl } from '@/lib/community/phases'

export const metadata: Metadata = { title: 'Send someone you love · Your NeuroChiro' }
export const dynamic = 'force-dynamic'

const STATUS: Record<string, string> = {
  sent: 'Sent',
  opened: 'Opened',
  found: 'They found someone',
}

export default async function InvitePage() {
  const session = await requireCommunityMember()
  const invitations = await loadInvitations(session.userId)

  return (
    <div>
      <BackHeading title="Send someone you love" href="/portal/refer" label="Find & Refer" crumb="Find & Refer › Send someone you love" area="refer" />
      <p className="mb-4 text-[13.5px] leading-snug text-[#3d4a57]">A private note for someone you care about, in this city or another country. It is not a post, and it is not a referral contest.</p>
      {!invitations.ready ? (
        <Card>
          <Kicker>Almost ready</Kicker>
          <p className="text-[13.5px] text-[#3d4a57]">Invitations save with the latest database update.</p>
        </Card>
      ) : <InviteForm />}
      {invitations.invitations.length > 0 ? (
        <Card>
          <Kicker>Sent</Kicker>
          <ul className="space-y-3">
            {invitations.invitations.map((invite) => (
              <li key={invite.id} className="text-[13.5px] text-[#3d4a57]">
                <p className="font-semibold text-neuro-navy">{invite.recipientWords} · {invite.place}</p>
                <p>{STATUS[invite.status] || 'Sent'}</p>
                <p className="break-all text-[12px] text-[#6b7785]">{invitationUrl(invite.token)}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  )
}
