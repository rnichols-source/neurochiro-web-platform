import PageHeader from '@/components/portal/PageHeader';
import HiringTabs from '../../jobs/HiringTabs';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import { missingSchema } from '@/lib/students/schema';
import { decideShadow } from '@/app/(student)/student/doctors/actions';
import { redirect } from 'next/navigation';

export default async function ShadowInboxPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const admin = createAdminClient();
  const doctor = await (admin as any).from('doctors').select('id').eq('user_id', user.id).maybeSingle();
  const doctorId = (doctor.data as { id?: string } | null)?.id;
  const requests = doctorId
    ? await (admin as any).from('shadow_requests').select('id, student_id, proposed_dates, message, status, created_at').eq('doctor_id', doctorId).order('created_at', { ascending: false })
    : { data: [], error: null };
  const missing = requests.error && missingSchema(requests.error);
  const rows = (requests.data || []) as { id: string; student_id: string; proposed_dates: string[] | null; message: string | null; status: string }[];

  return (
    <div className="space-y-4">
      <HiringTabs />
      <PageHeader title="Shadow days" description="Students only see this if you turn shadow days on in your profile." />
      {missing ? <p className="text-base text-portal-ink-2">Shadow requests are not turned on yet.</p> : null}
      {!missing && rows.length === 0 ? <p className="text-base text-portal-ink-2">No shadow requests yet.</p> : null}
      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="bg-white border border-portal-border rounded-xl p-4">
            <p className="text-sm font-bold text-portal-ink-2">{row.status}</p>
            <p className="mt-1 text-base text-portal-ink">{row.message}</p>
            <p className="mt-1 text-sm text-portal-ink-2">Dates: {(row.proposed_dates || []).join(', ') || 'none listed'}</p>
            {row.status === 'requested' ? (
              <form className="mt-3 flex flex-wrap gap-2" action={async (formData) => {
                'use server';
                await decideShadow({
                  requestId: row.id,
                  status: String(formData.get('status')) === 'declined' ? 'declined' : 'accepted',
                  date: String(formData.get('date') || ''),
                  reply: String(formData.get('reply') || ''),
                });
              }}>
                <select name="date" className="min-h-11 rounded-lg border border-portal-border px-3 text-base">
                  {(row.proposed_dates || []).map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
                <input name="reply" placeholder="Short reply" className="min-h-11 flex-1 rounded-lg border border-portal-border px-3 text-base" />
                <button name="status" value="accepted" className="min-h-11 rounded-lg bg-portal-ink px-4 text-sm font-bold text-white">Accept</button>
                <button name="status" value="declined" className="min-h-11 rounded-lg border border-portal-border px-4 text-sm font-bold text-portal-ink">Decline</button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
