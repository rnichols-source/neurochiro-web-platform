import { redirect } from 'next/navigation'
import { getPortalContext } from '@/lib/portal/context'
import FeatureGate from '../FeatureGate'
import { lookupStaffOffice } from './actions'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')
  if (!ctx.doctor && await lookupStaffOffice(ctx.userId)) return children
  return <FeatureGate feature="practice_tools">{children}</FeatureGate>
}
