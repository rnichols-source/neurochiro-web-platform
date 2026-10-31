import MatchDesk from '@/components/student/MatchDesk';
import { loadDesk } from '@/lib/match/store';

export default async function StudentMatchPage() {
  const data = await loadDesk();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <MatchDesk initial={data} />
    </div>
  );
}
