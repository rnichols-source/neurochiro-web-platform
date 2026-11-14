import { getFoundingSeatStatus } from '@/lib/students/founding-count';

export default async function FoundingSpots({ className }: { className?: string }) {
  const status = await getFoundingSeatStatus();
  if (!status.copy) return null;
  return <p className={className}>{status.copy}</p>;
}
