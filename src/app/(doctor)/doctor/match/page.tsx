import MatchDesk from '@/components/student/MatchDesk';
import HiringTabs from '../jobs/HiringTabs';
import { loadDesk } from '@/lib/match/store';

export default async function DoctorMatchPage() {
  const data = await loadDesk();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <HiringTabs />
      {data.side === 'doctor' ? <MatchDesk initial={data} /> : <p className="text-base text-portal-ink">{data.notice || 'This page is for doctors.'}</p>}
    </div>
  );
}
