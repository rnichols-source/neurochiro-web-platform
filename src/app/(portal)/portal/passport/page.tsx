import type { Metadata } from 'next'
import { ComingView } from '@/components/community/coming'

export const metadata: Metadata = { title: 'Your passport · Your NeuroChiro' }

export default function PassportPage() {
  return (
    <ComingView
      kicker="Coming later"
      title="Your passport"
      body="When you travel, this is where a home doctor can stay with you and you can look for a nervous system chiropractor near where you are staying. It is not taking trips or sharing a record yet. Your privacy choices already include a switch for a future passport, and it stays off."
    />
  )
}
