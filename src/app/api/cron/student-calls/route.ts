import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { wrapEmail } from '@/lib/email-template';
import { createAdminClient } from '@/lib/supabase-admin';
import { escapeHtml } from '@/lib/students/html';
import { missingSchema } from '@/lib/students/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = createAdminClient();
  const now = Date.now();
  const soon = new Date(now + 26 * 60 * 60 * 1000).toISOString();
  const calls = await (admin as any).from('student_calls').select('id, topic, starts_at, status').eq('status', 'scheduled').lte('starts_at', soon);
  if (calls.error && missingSchema(calls.error)) return NextResponse.json({ ok: true, skipped: true });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, skipped: 'mail' });
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (const call of (calls.data || []) as { id: string; topic: string | null; starts_at: string }[]) {
    const start = new Date(call.starts_at).getTime();
    const hours = (start - now) / 3600000;
    const column = hours <= 1.2 && hours > 0 ? 'reminded_1h_at' : hours <= 25 && hours > 1.2 ? 'reminded_24h_at' : null;
    if (!column) continue;
    const rsvps = await (admin as any).from('student_call_rsvps').select('user_id, reminded_24h_at, reminded_1h_at').eq('call_id', call.id).is(column, null);
    if (rsvps.error && missingSchema(rsvps.error)) continue;
    for (const rsvp of (rsvps.data || []) as { user_id: string }[]) {
      const profile = await admin.from('profiles').select('email').eq('id', rsvp.user_id).maybeSingle();
      const email = (profile.data as { email?: string } | null)?.email;
      if (!email) continue;
      await resend.emails.send({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: email,
        subject: hours <= 1.2 ? `Call in about an hour: ${call.topic || 'Monthly call'}` : `Call tomorrow: ${call.topic || 'Monthly call'}`,
        html: wrapEmail(`<h1>${escapeHtml(call.topic || 'Monthly call')}</h1><p><a href="https://www.neurochiro.co/student/mentorship">Open the call page</a>. The join link appears 15 minutes before the start.</p>`),
      }).catch(() => undefined);
      await (admin as any).from('student_call_rsvps').update({ [column]: new Date().toISOString() }).eq('call_id', call.id).eq('user_id', rsvp.user_id);
      sent += 1;
    }
  }

  const tomorrow = new Date(now + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const shadows = await (admin as any).from('shadow_requests').select('id, student_id, doctor_id, proposed_dates, reminded_at').eq('status', 'accepted').is('reminded_at', null);
  if (!shadows.error) {
    for (const row of (shadows.data || []) as { id: string; student_id: string; proposed_dates: string[] | null }[]) {
      const dates = row.proposed_dates || [];
      if (!dates.includes(tomorrow)) continue;
      const profile = await admin.from('profiles').select('email').eq('id', row.student_id).maybeSingle();
      const email = (profile.data as { email?: string } | null)?.email;
      if (email) {
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: email,
          subject: 'Shadow day tomorrow',
          html: wrapEmail('<h1>Shadow day tomorrow</h1><p>Check your messages for the time you and the doctor agreed on.</p>'),
        }).catch(() => undefined);
      }
      await (admin as any).from('shadow_requests').update({ reminded_at: new Date().toISOString() }).eq('id', row.id);
    }
  }
  return NextResponse.json({ ok: true, sent });
}
