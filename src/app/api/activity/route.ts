import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
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
