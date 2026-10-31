import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-admin';
import { hashToken } from '@/lib/jobs/hash';
import { tokenFresh, MEMBER_UPSELL, MEMBER_UPSELL_PATH } from '@/lib/jobs/posting-pure';

export const dynamic = 'force-dynamic';

export default async function ManagePostPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data } = await (admin as any)
    .from('job_postings')
    .select('title, created_at, approval_status, status, expires_at, rejected_reason')
    .eq('manage_token_hash', hashToken(token))
    .maybeSingle();

  if (!data || !tokenFresh(data.created_at, Date.now())) {
    return (
      <div className="min-h-dvh bg-[#F7F8FA] px-4 pt-28">
        <p className="mx-auto max-w-xl text-base text-[#14212E]">This link is expired or not recognized.</p>
      </div>
    );
  }

  const status = data.approval_status === 'rejected'
    ? 'Rejected'
    : data.approval_status === 'approved'
      ? 'Live'
      : 'In review';

  return (
    <div className="min-h-dvh bg-[#F7F8FA] px-4 pt-28">
      <div className="mx-auto max-w-xl rounded-xl border border-[#e3e8ed] bg-white p-6">
        <h1 className="font-heading text-2xl font-bold text-[#14212E]">{data.title}</h1>
        <p className="mt-2 text-base text-[#3d4d5c]">
          Status: {status}. {data.expires_at ? `Expires ${new Date(data.expires_at).toLocaleDateString('en-US')}.` : ''}
        </p>
        {data.rejected_reason ? <p className="mt-3 text-base text-[#3d4d5c]">Reason: {data.rejected_reason}</p> : null}
        <p className="mt-4 text-base text-[#3d4d5c]">
          {MEMBER_UPSELL}{' '}
          <Link href={MEMBER_UPSELL_PATH} className="font-bold text-[#B4501A]">Join NeuroChiro</Link>
        </p>
      </div>
    </div>
  );
}
