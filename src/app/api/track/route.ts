import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import { rateLimit, getIP } from '@/lib/rate-limit';
import {
  VISITOR_COOKIE,
  isBotUserAgent,
  isTrackedEvent,
  isUuid,
  utcDayStart,
  visitorKey,
} from '@/lib/analytics/profile-events';

const limiter = rateLimit('track', { maxRequests: 30, windowMs: 60_000 });

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 400,
};

export async function POST(request: NextRequest) {
  const { allowed } = limiter.check(getIP(request));
  if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const body = payload && typeof payload === 'object' ? payload as { doctorId?: unknown; eventType?: unknown; visitorKey?: unknown } : {};
  const doctorId = body.doctorId;
  const eventType = body.eventType;
  if (!isUuid(doctorId) || !isTrackedEvent(eventType)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (isBotUserAgent(request.headers.get('user-agent'))) {
    return NextResponse.json({ success: true, counted: false });
  }

  try {
    const admin = createAdminClient();
    const { data: doctor, error: doctorError } = await admin
      .from('doctors')
      .select('id, user_id, slug')
      .eq('id', doctorId)
      .maybeSingle();

    if (doctorError || !doctor) {
      return NextResponse.json({ error: 'Unknown doctor' }, { status: 404 });
    }

    if (eventType === 'profile_view') {
      return recordProfileView(request, doctor, visitorKey(body.visitorKey));
    }

    const { error } = await admin.from('analytics_events').insert({
      doctor_id: doctor.id,
      event_type: eventType,
      source: 'directory',
      metadata: { slug: doctor.slug },
    });
    if (error) {
      console.error('[track] insert failed', error.code);
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
    return NextResponse.json({ success: true, counted: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

async function recordProfileView(
  request: NextRequest,
  doctor: { id: string; user_id: string | null; slug: string },
  hintedKey: string | null,
) {
  const cookieKey = visitorKey(request.cookies.get(VISITOR_COOKIE)?.value);
  const key = cookieKey || hintedKey || crypto.randomUUID();
  const response = NextResponse.json({ success: true, counted: false });
  if (!cookieKey) {
    response.cookies.set(VISITOR_COOKIE, key, cookieOptions);
  }

  if (await viewerIsDoctor(doctor.user_id)) {
    return response;
  }

  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from('analytics_events')
    .select('id')
    .eq('doctor_id', doctor.id)
    .eq('event_type', 'profile_view')
    .eq('visitor_key', key)
    .gte('created_at', utcDayStart(new Date()))
    .limit(1); // intentional bound: one row means this visitor already counted today

  if (existingError) {
    console.error('[track] profile view lookup failed', existingError.code);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
  if (existing && existing.length > 0) return response;

  const { error } = await admin.from('analytics_events').insert({
    doctor_id: doctor.id,
    event_type: 'profile_view',
    source: 'directory',
    visitor_key: key,
    metadata: { slug: doctor.slug },
  });
  if (error) {
    if (error.code === '23505') return response;
    console.error('[track] profile view insert failed', error.code);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }

  const counted = NextResponse.json({ success: true, counted: true });
  if (!cookieKey) counted.cookies.set(VISITOR_COOKIE, key, cookieOptions);
  return counted;
}

async function viewerIsDoctor(doctorUserId: string | null): Promise<boolean> {
  if (!doctorUserId) return false;
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id === doctorUserId;
  } catch {
    return false;
  }
}
