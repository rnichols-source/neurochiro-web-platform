import { Inter } from 'next/font/google'
import PortalFrame from './portal-frame'

const communityInter = Inter({ subsets: ['latin'], variable: '--font-community', display: 'swap' })

export const dynamic = 'force-dynamic'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={communityInter.variable}>
      <PortalFrame>{children}</PortalFrame>
    </div>
  )
}
