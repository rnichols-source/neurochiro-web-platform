import { CommunityBanner } from '@/components/founder/live-banner'
import PortalFrame from './portal-frame'

export const dynamic = 'force-dynamic'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CommunityBanner />
      <PortalFrame>{children}</PortalFrame>
    </>
  )
}
