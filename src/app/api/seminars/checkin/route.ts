import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import { parseSeminarDates, timezoneForCity } from '@/lib/seminars/dates';
import { checkinWindow } from '@/lib/seminars/checkin-window';
import crypto from 'crypto';

function windowResponse(seminar: Record<string, unknown> | null) {
  const parsed = parseSeminarDates(String(seminar?.dates || ''));
  const decision = checkinWindow({
    now: new Date(),
    startsAt: (seminar?.starts_at as string) || null,
    endsAt: (seminar?.ends_at as string) || null,
    startDate: parsed?.start || null,
    endDate: parsed?.end || null,
    startTime: (seminar?.start_time as string) || null,
    timeZone: (seminar?.timezone as string) || timezoneForCity(seminar?.city as string, seminar?.country as string),
    city: (seminar?.city as string) || null,
    country: (seminar?.country as string) || null,
  });
  if (decision.ok) return null;
  const error = decision.reason === 'too_early'
    ? 'Check-in opens 2 hours before the seminar starts.'
    : 'Check-in is closed. This seminar has ended.';
  return NextResponse.json({ error }, { status: 403 });
}

async function loadSeminar(admin: any, id: string) {
  const full = await admin
    .from('seminars')
    .select('title, ce_hours, starts_at, ends_at, dates, start_time, timezone, city, country')
    .eq('id', id)
    .maybeSingle();
  if (!full.error) return full.data;
  const basic = await admin.from('seminars').select('title, ce_hours, dates, start_time, city, country').eq('id', id).maybeSingle();
  return basic.data;
}

async function markCheckedIn(admin: any, registrationId: string) {
  const updated = await admin
    .from('seminar_registrations')
    .update({ ce_completed: true, checked_in_at: new Date().toISOString() })
    .eq('id', registrationId)
    .eq('ce_completed', false)
    .select('id');
  if (updated.error) throw updated.error;
  return Array.isArray(updated.data) ? updated.data : [];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const seminarId = body.seminarId;
    const token = body.token;
    if (!seminarId && !token) return NextResponse.json({ error: 'Missing seminar ID' }, { status: 400 });

    const admin = createAdminClient() as any;
    let resolvedId = String(seminarId || "");
    if (resolvedId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(resolvedId)) {
      const { getSeminarBySlug } = await import("@/lib/seminars/queries");
      const seminar = await getSeminarBySlug(resolvedId);
      if (!seminar) return NextResponse.json({ error: "Seminar not found" }, { status: 404 });
      resolvedId = seminar.id;
    }

    if (token) {
      const byToken = await admin.from("seminar_registrations").select("id, ce_completed, seminar_id").eq("qr_token", token).maybeSingle();
      if (!byToken.error && byToken.data) {
        if (resolvedId && byToken.data.seminar_id !== resolvedId) {
          return NextResponse.json({ error: "That check-in code is for a different seminar" }, { status: 403 });
        }
        const seminar = await loadSeminar(admin, byToken.data.seminar_id);
        const closed = windowResponse(seminar);
        if (closed) return closed;
        const rows = await markCheckedIn(admin, byToken.data.id);
        if (!rows.length) return NextResponse.json({ error: "Already checked in", alreadyCheckedIn: true });
        return NextResponse.json({ success: true, ceHours: seminar?.ce_hours || 0, seminarTitle: seminar?.title });
      }
    }

    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!resolvedId) return NextResponse.json({ error: 'Missing seminar ID' }, { status: 400 });

    const { data: registration } = await admin
      .from('seminar_registrations')
      .select('id, ce_completed')
      .eq('seminar_id', resolvedId)
      .or(`profile_id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle();

    if (!registration) {
      return NextResponse.json({ error: 'You must be registered for this seminar to check in' }, { status: 403 });
    }

    const seminar = await loadSeminar(admin, resolvedId);
    const closed = windowResponse(seminar);
    if (closed) return closed;

    const rows = await markCheckedIn(admin, registration.id);
    if (!rows.length) {
      return NextResponse.json({ error: 'Already checked in', alreadyCheckedIn: true }, { status: 200 });
    }

    const ceHours = seminar?.ce_hours || 0;

    if (ceHours > 0) {
      const existing = await admin
        .from('ce_certificates')
        .select('id, certificate_number')
        .eq('registration_id', registration.id)
        .limit(1);
      if (!existing.error && Array.isArray(existing.data) && existing.data.length > 0) {
        return NextResponse.json({
          success: true,
          ceHours,
          certificateNumber: existing.data[0].certificate_number,
          seminarTitle: seminar?.title,
        });
      }

      const certNumber = `NC-CE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      await admin.from('ce_certificates').insert({
        user_id: user.id,
        seminar_id: resolvedId,
        registration_id: registration.id,
        ce_hours: ceHours,
        certificate_number: certNumber,
      });

      return NextResponse.json({
        success: true,
        ceHours,
        certificateNumber: certNumber,
        seminarTitle: seminar?.title,
      });
    }

    return NextResponse.json({ success: true, ceHours: 0 });
  } catch (err) {
    console.error('Check-in error:', err);
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 });
  }
}
