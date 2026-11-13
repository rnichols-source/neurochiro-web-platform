import { parkedLayout } from '@/components/doctor/parked-layout'
import FeatureGate from '../FeatureGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  parkedLayout('seminars')
  return <FeatureGate feature="seminars">{children}</FeatureGate>;
}
