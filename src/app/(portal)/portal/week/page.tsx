import type { Metadata } from 'next'
import { ComingView } from '@/components/community/coming'

export const metadata: Metadata = { title: 'This week · Your NeuroChiro' }

export default function WeekPage() {
  return (
    <ComingView
      kicker="Coming later"
      title="This week"
      body="A short check-in for your household, and The Weekly Adjustment, will live here. Phase 1 does not collect a score or play the show. Your home doctor, visit requests, household, and privacy choices are the part that works today."
    />
  )
}
