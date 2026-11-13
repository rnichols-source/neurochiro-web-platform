import type { Metadata } from 'next'
import { ComingView } from '@/components/community/coming'

export const metadata: Metadata = { title: 'Work · Your NeuroChiro' }

export default function WorkPage() {
  return (
    <ComingView
      kicker="Coming later"
      title="Work"
      body="Openings in member offices, including CA roles, will show up here when that part of Your NeuroChiro is ready. Nothing on this page is a live job."
    />
  )
}
