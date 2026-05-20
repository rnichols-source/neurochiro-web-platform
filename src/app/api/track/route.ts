import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { rateLimit, getIP } from '@/lib/rate-limit';

const limiter = rateLimit('track', { maxRequests: 30, windowMs: 60_000 });

export async function POST(request: NextRequest) {
  const { allowed } = limiter.check(getIP(request));
  if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  try {
    const { doctorId, eventType } = await request.json();

    if (!doctorId || !eventType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    await supabase.from('analytics_events').insert({
      doctor_id: doctorId,
      event_type: eventType,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
