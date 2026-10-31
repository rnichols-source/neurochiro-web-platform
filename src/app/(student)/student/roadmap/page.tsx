import PageHeader from '@/components/portal/PageHeader';
import { STUDENT_ROADMAP } from '@/config/student-roadmap';
import { createAdminClient } from '@/lib/supabase-admin';
import { autoCompletedSteps } from '@/lib/students/roadmap';
import { getStudentPortal } from '@/lib/students/context';
import { missingSchema } from '@/lib/students/schema';
import RoadmapList from './RoadmapList';

export default async function RoadmapPage() {
  const portal = await getStudentPortal();
  const admin = createAdminClient();
  const userId = portal?.userId || '';
  const [quiz, contracts, rsvps, saved] = await Promise.all([
    (admin as any).from('technique_quiz_state').select('user_id').eq('user_id', userId).limit(1),
    admin.from('contracts').select('id').eq('user_id', userId).limit(1),
    (admin as any).from('student_call_rsvps').select('user_id').eq('user_id', userId).limit(1),
    (admin as any).from('student_roadmap_progress').select('step_key').eq('user_id', userId),
  ]);
  const savedKeys = saved.error && missingSchema(saved.error) ? [] : ((saved.data || []) as { step_key: string }[]).map((row) => row.step_key);
  const auto = autoCompletedSteps({
    quizDone: !quiz.error && (quiz.data || []).length > 0,
    contractSaved: !contracts.error && (contracts.data || []).length > 0,
    rsvped: !rsvps.error && (rsvps.data || []).length > 0,
  });
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <PageHeader title="Roadmap" description="From year 1 to your first 90 days. Check a step when it is done." />
      <RoadmapList stages={STUDENT_ROADMAP} done={[...new Set([...savedKeys, ...auto])]} />
    </div>
  );
}
