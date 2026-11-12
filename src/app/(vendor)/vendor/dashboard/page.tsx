import { getVendorDashboardData } from "./actions";
import { loadVendorSynapse } from "./synapse-actions";
import DashboardClient from "./dashboard-client";

export const dynamic = 'force-dynamic'

export default async function VendorDashboardPage() {
  const [data, synapse] = await Promise.all([getVendorDashboardData(), loadVendorSynapse()]);
  return <DashboardClient data={data} synapse={synapse} />;
}
