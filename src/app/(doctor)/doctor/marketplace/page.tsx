import PageHeader from '@/components/portal/PageHeader';
import { loadWallet } from './actions';
import SynapseWallet from './wallet-client';

export default async function DoctorMarketplacePage() {
  const wallet = await loadWallet();
  if ('error' in wallet) {
    return (
      <div className="space-y-4">
        <PageHeader title="Synapse" description="Member deals from Synapse partners." />
        <p className="text-sm text-portal-ink-2">{wallet.error}</p>
      </div>
    );
  }
  return <SynapseWallet initial={wallet} />;
}
