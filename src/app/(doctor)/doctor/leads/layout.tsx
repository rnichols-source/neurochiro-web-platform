import FeatureGate from '../FeatureGate';
import LeadsHeader from './LeadsHeader';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate feature="leads">
      <LeadsHeader />
      {children}
    </FeatureGate>
  );
}
