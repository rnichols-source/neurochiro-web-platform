import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { seminarId } = await request.json();
    if (!seminarId) return NextResponse.json({ error: 'Missing seminar ID' }, { status: 400 });

    const admin = createAdminClient() as any;

    // Verify registration exists
    const { data: registration } = await admin
      .from('seminar_registrations')
      .select('id, ce_completed')
      .eq('seminar_id', seminarId)
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
      .eq('id', seminarId)
      .single();

    const ceHours = seminar?.ce_hours || 0;

    // Generate CE certificate if seminar has CE hours
    if (ceHours > 0) {
      const certNumber = `NC-CE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      await admin.from('ce_certificates').insert({
        user_id: user.id,
        seminar_id: seminarId,
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
