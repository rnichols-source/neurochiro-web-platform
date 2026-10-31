import FeatureGate from '../FeatureGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <FeatureGate feature="practice_tools">{children}</FeatureGate>;
}
