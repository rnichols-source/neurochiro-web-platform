import FeatureGate from '../FeatureGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <FeatureGate feature="referral_network">{children}</FeatureGate>;
}
