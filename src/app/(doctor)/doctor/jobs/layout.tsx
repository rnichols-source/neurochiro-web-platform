import { parkedLayout } from '@/components/doctor/parked-layout'
import FeatureGate from '../FeatureGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  parkedLayout('hiring')
  return <FeatureGate feature="hiring">{children}</FeatureGate>;
}
