import Link from 'next/link';
import PageHeader from '@/components/portal/PageHeader';
import { createAdminClient } from '@/lib/supabase-admin';
import { getStudentPortal } from '@/lib/students/context';
import { hasMemberAccess } from '@/lib/students/membership-pure';
import { missingSchema } from '@/lib/students/schema';
import { rsvpForCall } from './actions';
import CallClock from './CallClock';

type CallRow = {
  id: string;
  starts_at: string;
  duration_min: number | null;
  topic: string | null;
  description: string | null;
  guest_name: string | null;
  guest_doctor_id: string | null;
  recording_url: string | null;
  status: string;
};

function embed(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com') || parsed.hostname === 'youtu.be') {
      const id = parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export default async function MentorshipPage() {
  const portal = await getStudentPortal();
  const member = portal ? hasMemberAccess(portal.membership) : false;
  const admin = createAdminClient();
  const calls = await (admin as any).from('student_calls').select('id, starts_at, duration_min, topic, description, guest_name, guest_doctor_id, recording_url, status').order('starts_at', { ascending: true });
  if (calls.error && missingSchema(calls.error)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PageHeader title="Monthly call" description="The first call is being scheduled. You'll get an email." />
      </div>
    );
  }
  const rows = ((calls.data || []) as CallRow[]).filter((row) => row.status !== 'cancelled');
  const now = Date.now();
  const upcoming = rows.find((row) => row.status !== 'done' && new Date(row.starts_at).getTime() + (row.duration_min || 60) * 60000 > now) || null;
  const past = rows.filter((row) => row.status === 'done' && row.recording_url);
  let guest: { name: string; clinic: string | null; photo: string | null } | null = null;
  if (upcoming?.guest_doctor_id) {
    const doctor = await (admin as any).from('doctors').select('first_name, last_name, clinic_name, photo_url').eq('id', upcoming.guest_doctor_id).maybeSingle();
    const data = doctor.data as { first_name?: string; last_name?: string; clinic_name?: string | null; photo_url?: string | null } | null;
    if (data) guest = { name: `${data.first_name || ''} ${data.last_name || ''}`.trim(), clinic: data.clinic_name || null, photo: data.photo_url || null };
  }
  const joinAllowed = upcoming ? member && new Date(upcoming.starts_at).getTime() - now <= 15 * 60 * 1000 && new Date(upcoming.starts_at).getTime() + (upcoming.duration_min || 60) * 60000 > now : false;
  let joinUrl: string | null = null;
  if (joinAllowed && upcoming) {
    const secret = await (admin as any).from('student_call_secrets').select('join_url').eq('call_id', upcoming.id).maybeSingle();
    if (!secret.error) joinUrl = (secret.data as { join_url?: string } | null)?.join_url || null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <PageHeader title="Monthly call" description="Dr. Ray and a guest doctor. One hour. Members only." />
      {!upcoming ? (
        <article className="bg-white border border-portal-border rounded-xl p-6">
          <p className="text-base text-portal-ink">The first call is being scheduled. You'll get an email.</p>
        </article>
      ) : (
        <article className="bg-white border border-portal-border rounded-xl p-6 space-y-3">
          <h2 className="text-xl font-bold text-portal-ink">{upcoming.topic || 'Monthly call'}</h2>
          <CallClock startsAt={upcoming.starts_at} />
          {guest ? (
            <p className="text-base text-portal-ink">{guest.name}{guest.clinic ? ` · ${guest.clinic}` : ''}</p>
          ) : upcoming.guest_name ? <p className="text-base text-portal-ink">{upcoming.guest_name}</p> : null}
          {upcoming.description ? <p className="text-base text-portal-ink-2">{upcoming.description}</p> : null}
          <div className="flex flex-col sm:flex-row gap-2">
            <a className="min-h-11 inline-flex items-center justify-center rounded-lg border border-portal-border px-4 text-base font-bold text-portal-ink" href={`/api/students/call-ics?id=${upcoming.id}`}>Add to calendar</a>
            {member ? (
              <form action={async () => { 'use server'; await rsvpForCall(upcoming.id); }}>
                <button type="submit" className="min-h-11 rounded-lg bg-portal-accent px-4 text-base font-bold text-white">I'll be there</button>
              </form>
            ) : (
              <Link href="/student/subscribe?plan=monthly" className="min-h-11 inline-flex items-center justify-center rounded-lg bg-portal-accent px-4 text-base font-bold text-white">Join to attend</Link>
            )}
          </div>
          {member && !joinUrl ? <p className="text-sm text-portal-ink-2">The join link shows here 15 minutes before the call.</p> : null}
          {joinUrl ? <a className="min-h-11 inline-flex items-center text-base font-bold text-portal-accent" href={joinUrl}>Join the call</a> : null}
        </article>
      )}
      <section>
        <h2 className="text-lg font-bold text-portal-ink">Past calls</h2>
        {past.length === 0 ? <p className="mt-2 text-base text-portal-ink-2">Recordings will show up here after a call.</p> : null}
        <div className="mt-3 space-y-4">
          {past.map((call) => {
            const frame = call.recording_url ? embed(call.recording_url) : null;
            return (
              <article key={call.id} className="bg-white border border-portal-border rounded-xl p-4">
                <h3 className="text-lg font-bold text-portal-ink">{call.topic || 'Past call'}</h3>
                {frame ? <iframe title={call.topic || 'Recording'} src={frame} className="mt-3 w-full aspect-video rounded-lg border border-portal-border" allow="fullscreen" /> : null}
                {!frame && call.recording_url ? <a className="mt-2 inline-flex min-h-11 items-center text-base font-bold text-portal-accent" href={call.recording_url}>Watch the recording</a> : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
