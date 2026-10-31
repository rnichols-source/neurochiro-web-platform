import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';
import { hashToken } from '@/lib/jobs/hash';
import { tokenFresh, MEMBER_UPSELL, MEMBER_UPSELL_PATH } from '@/lib/jobs/posting-pure';

export const dynamic = 'force-dynamic';

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  let title = 'Your post';
  if (token) {
    const admin = createAdminClient();
    const { data } = await (admin as any)
      .from('job_postings')
      .select('title, created_at, approval_status')
      .eq('manage_token_hash', hashToken(token))
      .maybeSingle();
    if (data && tokenFresh(data.created_at, Date.now())) title = data.title || title;
  }

  return (
    <div className="min-h-dvh bg-[#F7F8FA] px-4 pt-28">
      <div className="mx-auto max-w-xl rounded-xl border border-[#e3e8ed] bg-white p-6">
        <h1 className="font-heading text-2xl font-bold text-[#14212E]">Paid. We review posts within 1 business day.</h1>
        <p className="mt-3 text-base text-[#3d4d5c]">{title} is waiting for review. We email you when it is live or if we need a change.</p>
        <p className="mt-4 text-base text-[#3d4d5c]">
          {MEMBER_UPSELL}{' '}
          <Link href={MEMBER_UPSELL_PATH} className="font-bold text-[#B4501A]">Join NeuroChiro</Link>
        </p>
      </div>
    </div>
  );
}
