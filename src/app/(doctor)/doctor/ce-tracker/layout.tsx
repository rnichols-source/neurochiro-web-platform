import { parkedLayout } from '@/components/doctor/parked-layout'
import FeatureGate from '../FeatureGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  parkedLayout('ce')
  return <FeatureGate feature="practice_tools">{children}</FeatureGate>;
}
