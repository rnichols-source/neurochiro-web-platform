import { NextRequest, NextResponse } from 'next/server';
import { createFeaturedCheckout } from '@/lib/jobs/posting';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const jobId = String(body.jobId || '');
  if (!jobId) return NextResponse.json({ error: 'Missing job.' }, { status: 400 });
  const result = await createFeaturedCheckout(user.id, jobId);
  if ('error' in result && result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
