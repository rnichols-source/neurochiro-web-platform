import { MemberInviteCard } from '@/components/portal/MemberReferralInvite'
import { loadMemberInvite } from '@/lib/member-referrals/invite'

export async function MemberInviteSection({ doctorId }: { doctorId: string | null | undefined }) {
  if (!doctorId) return null
  const invite = await loadMemberInvite(doctorId)
  if (!invite) return null
  return (
    <MemberInviteCard
      url={invite.url}
      message={invite.message}
      explanation={invite.explanation}
      countLabel={invite.countLabel}
    />
  )
}
