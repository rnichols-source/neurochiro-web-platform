import { MemberInviteSection } from '@/components/portal/MemberInviteSection';
import { getPortalContext } from '@/lib/portal/context';
import FeatureGate from '../FeatureGate';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const ctx = await getPortalContext();
  return (
    <FeatureGate feature="settings">
      <div className="mb-6">
        <MemberInviteSection doctorId={ctx?.doctor?.id} />
      </div>
      {children}
    </FeatureGate>
  );
}
