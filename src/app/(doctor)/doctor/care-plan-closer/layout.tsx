import { parkedLayout } from '@/components/doctor/parked-layout'
import FeatureGate from '../FeatureGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  parkedLayout('care-plan-closer')
  return <FeatureGate feature="care_plan_closer">{children}</FeatureGate>;
}
