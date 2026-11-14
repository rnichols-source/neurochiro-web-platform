import { getFoundingSeatStatus } from '@/lib/students/founding-count';

export default async function FoundingSpots({ className }: { className?: string }) {
  const status = await getFoundingSeatStatus();
  return <p className={className}>{status.copy}</p>;
}
