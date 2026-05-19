import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

/**
 * GET /api/booth/signups
 * Returns recent signups for the live booth feed.
 * Privacy: Only first name + last initial shown.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get today's start (UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // Get recent signups with doctor city/state
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ signups: [], todayCount: 0 });
    }

    // Get doctor locations for doctor signups
    const doctorIds = profiles.filter(p => p.role === 'doctor').map(p => p.id);
    let doctorLocations: Record<string, { city: string | null; state: string | null }> = {};

    if (doctorIds.length > 0) {
      const { data: doctors } = await supabase
        .from('doctors')
        .select('user_id, city, state')
        .in('user_id', doctorIds);

      if (doctors) {
        for (const d of doctors) {
          if (d.user_id) doctorLocations[d.user_id] = { city: d.city, state: d.state };
        }
      }
    }

    // Format with privacy (first name + last initial)
    const signups = profiles.map(p => {
      const parts = (p.full_name || '').split(' ');
      const firstName = parts[0] || 'Someone';
      const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] + '.' : '';
      const displayName = p.role === 'doctor'
        ? `Dr. ${firstName} ${lastInitial}`
        : `${firstName} ${lastInitial}`;

      const loc = doctorLocations[p.id];
      const location = loc?.city && loc?.state
        ? `${loc.city}, ${loc.state}`
        : loc?.state || null;

      return {
        name: displayName.trim(),
        role: p.role || 'member',
        location,
        createdAt: p.created_at,
      };
    });

    return NextResponse.json({
      signups,
      todayCount: profiles.length,
    });
  } catch (err: any) {
    console.error('[BOOTH SIGNUPS]', err);
    return NextResponse.json({ signups: [], todayCount: 0 });
  }
}
