import { headers } from 'next/headers';
import JobDetailClient from '@/app/(public)/careers/[id]/JobDetailClient';
import { loadPublicJob, recordJobView } from '@/lib/jobs/board';
import { viewerHash } from '@/lib/jobs/hash';
import { hasMemberAccess } from '@/lib/students/membership-pure';
import { getStudentMembership } from '@/lib/students/membership';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await loadPublicJob(id);
  if (!job) {
    return (
      <div className="min-h-dvh bg-[#F7F8FA] px-4 pt-32 text-center">
        <h1 className="font-heading text-2xl font-bold text-[#14212E]">Job not found</h1>
        <p className="mt-2 text-base text-[#3d4d5c]">This listing may have been removed or it is still in review.</p>
      </div>
    );
  }

  const headerList = await headers();
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const ua = headerList.get('user-agent') || '';
  await recordJobView(id, viewerHash({ userId: user?.id, ip, ua }));

  let applyMode: 'guest' | 'join' | 'member' = 'guest';
  let prefill = { name: '', email: '' };
  if (user) {
    const membership = await getStudentMembership(user.id);
    prefill = { name: '', email: user.email || '' };
    const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
    prefill.name = profile?.full_name || '';
    if (profile?.role === 'student' && hasMemberAccess(membership)) applyMode = 'member';
    else if (profile?.role === 'student') applyMode = 'join';
  }

  return <JobDetailClient job={job} applyMode={applyMode} prefill={prefill} />;
}
