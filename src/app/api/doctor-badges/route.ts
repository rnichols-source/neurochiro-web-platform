import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { rateLimit, getIP } from '@/lib/rate-limit';
import { loadEarnedBadgeIds } from '@/lib/badges/compute';

export const revalidate = 3600;

const limiter = rateLimit('doctor-badges', { maxRequests: 30, windowMs: 60_000 });

export async function GET(request: NextRequest) {
  const { allowed } = limiter.check(getIP(request));
  if (!allowed) return NextResponse.json({ badges: [] });

  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ badges: [] });

  try {
    const sb = createAdminClient() as any;
    const { data: doctor } = await sb
      .from('doctors')
      .select('id, user_id, photo_url, bio, clinic_name, specialties, website_url, profile_views, city, state')
      .eq('user_id', userId)
      .maybeSingle();
    if (!doctor) return NextResponse.json({ badges: [] });
    const badges = await loadEarnedBadgeIds(doctor);
    return NextResponse.json(
      { badges },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    );
  } catch {
    return NextResponse.json({ badges: [] });
  }
}
