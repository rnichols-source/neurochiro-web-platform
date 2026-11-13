import { parkedLayout } from '@/components/doctor/parked-layout'
import FeatureGate from '../FeatureGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  parkedLayout('lives')
  return <FeatureGate feature="lives">{children}</FeatureGate>;
}
