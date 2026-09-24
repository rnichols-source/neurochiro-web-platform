import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

/**
 * Conversion event tracking endpoint.
 * Called via navigator.sendBeacon from DoctorCard.
 * No IP, no user agent, no patient identifiers.
 * Deduped by (doctor_id, event_type, session_id, date) unique index.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { doctor_id, event_type, source_page, had_location, search_distance_miles, session_id } = body;

    if (!doctor_id || !event_type) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const validTypes = ['book', 'call', 'inquiry', 'profile_view', 'directions'];
    if (!validTypes.includes(event_type)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createAdminClient();

    await (supabase as any)
      .from('conversion_events')
      .insert({
        doctor_id,
        event_type,
        source_page: source_page || '/directory',
        had_location: had_location || false,
        search_distance_miles: search_distance_miles || null,
        session_id: session_id || null,
      });

    // Ignore unique constraint violations (dedup)
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Never fail visibly to the patient
  }
}
