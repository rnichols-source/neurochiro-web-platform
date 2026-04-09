import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source, role, location, first_name, doctor_id } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Upsert to avoid duplicates
    const { error } = await supabase
      .from('leads')
      .upsert({
        email,
        source: source || 'website',
        role: role || 'patient',
        location: location || null,
        first_name: first_name || null,
        doctor_id: doctor_id || null,
        status: 'new',
        metadata: {
          timestamp: new Date().toISOString(),
        }
      }, { onConflict: 'email' });

    if (error) {
      // If upsert fails due to no unique constraint, just insert
      await supabase.from('leads').insert({
        email,
        source: source || 'website',
        role: role || 'patient',
        location: location || null,
        first_name: first_name || null,
        doctor_id: doctor_id || null,
        status: 'new',
        metadata: { timestamp: new Date().toISOString() }
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
