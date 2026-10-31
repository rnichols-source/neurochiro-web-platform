import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import { missingSchema } from '@/lib/students/schema';
import { redirect } from 'next/navigation';
import { saveStudentCall } from './actions';

export default async function AdminCallsPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const admin = createAdminClient();
  const profile = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = (profile.data as { role?: string } | null)?.role || '';
  if (!['admin', 'founder', 'super_admin'].includes(role)) redirect('/admin');
  const calls = await (admin as any).from('student_calls').select('id, topic, starts_at, status, guest_name').order('starts_at', { ascending: false }).limit(20);
  const missing = calls.error && missingSchema(calls.error);
  const rows = (calls.data || []) as { id: string; topic: string | null; starts_at: string; status: string; guest_name: string | null }[];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-[#16202a]">Student calls</h1>
      <p className="text-base text-[#3d4a57]">Schedule the monthly call. The join link is stored where students cannot read it until 15 minutes before.</p>
      {missing ? <p className="text-base">The call tables are not in the database yet.</p> : null}
      <form action={saveStudentCall} className="bg-white border border-[#e3e8ed] rounded-xl p-4 space-y-3">
        <input name="topic" required placeholder="Topic" className="min-h-11 w-full rounded-lg border border-[#e3e8ed] px-3 text-base" />
        <input name="guest_name" placeholder="Guest doctor" className="min-h-11 w-full rounded-lg border border-[#e3e8ed] px-3 text-base" />
        <input name="starts_at" type="datetime-local" required className="min-h-11 w-full rounded-lg border border-[#e3e8ed] px-3 text-base" />
        <input name="join_url" type="url" placeholder="Join link" className="min-h-11 w-full rounded-lg border border-[#e3e8ed] px-3 text-base" />
        <input name="recording_url" type="url" placeholder="Recording link, if you already have one" className="min-h-11 w-full rounded-lg border border-[#e3e8ed] px-3 text-base" />
        <textarea name="description" placeholder="What you will cover" className="min-h-24 w-full rounded-lg border border-[#e3e8ed] px-3 py-2 text-base" />
        <button type="submit" className="min-h-11 rounded-lg bg-[#14212e] px-4 text-base font-bold text-white">Save call</button>
      </form>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="bg-white border border-[#e3e8ed] rounded-xl p-4">
            <p className="text-base font-bold text-[#16202a]">{row.topic}</p>
            <p className="text-sm text-[#3d4a57]">{new Date(row.starts_at).toLocaleString()} · {row.status}{row.guest_name ? ` · ${row.guest_name}` : ''}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
