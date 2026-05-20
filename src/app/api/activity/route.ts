import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { rateLimit, getIP } from '@/lib/rate-limit';

const limiter = rateLimit('activity', { maxRequests: 30, windowMs: 60_000 });

export async function POST(request: NextRequest) {
  const { allowed } = limiter.check(getIP(request));
  if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  try {
    const { eventType, pagePath, searchQuery, doctorId, city, state } = await request.json();

    if (!eventType || !['page_view', 'search', 'profile_view'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // site_activity table — cast needed until types are regenerated
    await (supabase as any).from('site_activity').insert({
      event_type: eventType,
      page_path: pagePath || null,
      search_query: searchQuery || null,
      doctor_id: doctorId || null,
      city: city || null,
      state: state || null,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
