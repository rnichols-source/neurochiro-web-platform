import { Suspense } from 'react';
import FeatureGate from '../FeatureGate';
import { OpenReferralFromQuery } from '@/components/portal/ReferralProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate feature="referrals">
      <Suspense fallback={null}>
        <OpenReferralFromQuery />
      </Suspense>
      {children}
    </FeatureGate>
  );
}
