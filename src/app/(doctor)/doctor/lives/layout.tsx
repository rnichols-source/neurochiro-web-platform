import FeatureGate from '../FeatureGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <FeatureGate feature="lives">{children}</FeatureGate>;
}
