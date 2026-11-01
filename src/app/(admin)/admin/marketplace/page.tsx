import { getVettingQueue } from "./vetting-actions";
import AdminQueue from "./queue-client";

export default async function AdminMarketplacePage() {
  const queue = await getVettingQueue();
  return <AdminQueue initial={queue} />;
}
