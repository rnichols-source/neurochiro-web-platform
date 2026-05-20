import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { rateLimit, getIP } from '@/lib/rate-limit';

export const revalidate = 300;

const limiter = rateLimit('doctor-badges', { maxRequests: 30, windowMs: 60_000 });

export async function GET(request: NextRequest) {
  const { allowed } = limiter.check(getIP(request));
  if (!allowed) return NextResponse.json({ badges: [] });

  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ badges: [] });

  try {
    const sb = createAdminClient() as any;
    const { data } = await sb
      .from('doctor_badges')
      .select('badge_id')
      .eq('user_id', userId);

    return NextResponse.json({ badges: (data || []).map((b: any) => b.badge_id) });
  } catch {
    return NextResponse.json({ badges: [] });
  }
}
