import FeatureGate from '../FeatureGate'
import { getDoctorProfile } from './actions'
import { ProfileSeed } from './seed'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const profile = await getDoctorProfile().catch(() => null)
  const data = profile && typeof profile === 'object' ? profile as Record<string, unknown> : null
  return (
    <FeatureGate feature="profile">
      <ProfileSeed profile={data}>{children}</ProfileSeed>
    </FeatureGate>
  )
}
