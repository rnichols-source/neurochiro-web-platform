import 'server-only'

import { bannerDismissedAt, countGrantedReferrals, loadMemberById } from './db.ts'
import {
  bannerCopy,
  cardExplanation,
  inviteMessage,
  isPublishedActiveMember,
  memberInviteUrl,
  rewardCountLabel,
} from './logic.ts'

export type MemberInvite = {
  url: string
  message: string
  title: string
  body: string
  explanation: string
  countLabel: string
  dismissed: boolean
}

function origin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co').replace(/\/$/, '')
}

export async function loadMemberInvite(doctorId: string): Promise<MemberInvite | null> {
  try {
    const member = await loadMemberById(doctorId)
    if (!member?.slug || !isPublishedActiveMember(member)) return null
    const now = new Date()
    const url = memberInviteUrl(member.slug, origin())
    const [granted, dismissedAt] = await Promise.all([
      countGrantedReferrals(member.id),
      bannerDismissedAt(member.id),
    ])
    const banner = bannerCopy(now)
    return {
      url,
      message: inviteMessage(url, now),
      title: banner.title,
      body: banner.body,
      explanation: cardExplanation(now),
      countLabel: rewardCountLabel(granted),
      dismissed: Boolean(dismissedAt),
    }
  } catch (error) {
    console.error('[member-referral] invite lookup skipped', error instanceof Error ? error.name : 'error')
    return null
  }
}
