import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { buildCallIcs } from '@/lib/students/ics';
import { missingSchema } from '@/lib/students/schema';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Missing call' }, { status: 400 });
  const admin = createAdminClient();
  const call = await (admin as any).from('student_calls').select('id, topic, starts_at, duration_min, description').eq('id', id).maybeSingle();
  if (call.error && missingSchema(call.error)) return NextResponse.json({ error: 'Not ready' }, { status: 404 });
  const row = call.data as { id: string; topic: string | null; starts_at: string; duration_min: number | null; description: string | null } | null;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = buildCallIcs({
    id: row.id,
    title: row.topic || 'NeuroChiro monthly call',
    startsAt: row.starts_at,
    durationMin: row.duration_min || 60,
    description: row.description || undefined,
  });
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="neurochiro-call.ics"',
    },
  });
}
