import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import crypto from 'crypto';

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
        if (byToken.data.ce_completed) return NextResponse.json({ error: "Already checked in", alreadyCheckedIn: true });
        await admin.from("seminar_registrations").update({ ce_completed: true, checked_in_at: new Date().toISOString() }).eq("id", byToken.data.id);
        const { data: seminar } = await admin.from("seminars").select("title, ce_hours").eq("id", byToken.data.seminar_id).single();
        return NextResponse.json({ success: true, ceHours: seminar?.ce_hours || 0, seminarTitle: seminar?.title });
      }
    }

    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!resolvedId) return NextResponse.json({ error: 'Missing seminar ID' }, { status: 400 });

    // Verify registration exists
    const { data: registration } = await admin
      .from('seminar_registrations')
      .select('id, ce_completed')
      .eq('seminar_id', resolvedId)
      .or(`profile_id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle();

    if (!registration) {
      return NextResponse.json({ error: 'You must be registered for this seminar to check in' }, { status: 403 });
    }

    if (registration.ce_completed) {
      return NextResponse.json({ error: 'Already checked in', alreadyCheckedIn: true }, { status: 200 });
    }

    // Mark as checked in
    await admin
      .from('seminar_registrations')
      .update({ ce_completed: true, checked_in_at: new Date().toISOString() })
      .eq('id', registration.id);

    // Get seminar CE hours
    const { data: seminar } = await admin
      .from('seminars')
      .select('title, ce_hours')
      .eq('id', resolvedId)
      .single();

    const ceHours = seminar?.ce_hours || 0;

    // Generate CE certificate if seminar has CE hours
    if (ceHours > 0) {
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
