import 'server-only';
import { after } from 'next/server';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';

const BOT = /bot|crawl|spider|preview/i;

/**
 * Record one profile_view after the page responds.
 * Skips obvious bots. Skips the doctor opening their own profile when the
 * session cookie can be read locally. A failed session read still records the view.
 */
export async function trackProfileView(doctor: { id: string; user_id?: string | null }) {
  const userAgent = (await headers()).get('user-agent') || '';
  if (BOT.test(userAgent)) return;

  let viewerId: string | null = null;
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getSession();
    viewerId = data.session?.user?.id ?? null;
  } catch {
    viewerId = null;
  }
  if (viewerId && doctor.user_id && viewerId === doctor.user_id) return;

  const doctorId = doctor.id;
  after(async () => {
    try {
      const admin = createAdminClient() as any;
      const { error } = await admin.from('analytics_events').insert({
        doctor_id: doctorId,
        event_type: 'profile_view',
      });
      if (error) console.error('[track-view] failed');
      else console.info('[track-view] ok');
    } catch {
      console.error('[track-view] failed');
    }
  });
}
