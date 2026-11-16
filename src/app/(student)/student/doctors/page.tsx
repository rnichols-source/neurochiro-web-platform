import Link from 'next/link';
import PageHeader from '@/components/portal/PageHeader';
import { createAdminClient } from '@/lib/supabase-admin';
import { getStudentPortal } from '@/lib/students/context';
import { hasMemberAccess } from '@/lib/students/membership-pure';
import { missingSchema } from '@/lib/students/schema';
import MentorshipForm from './MentorshipForm';
import ShadowForm from './ShadowForm';

type DoctorCard = {
  id: string;
  user_id: string | null;
  slug: string | null;
  first_name: string | null;
  last_name: string | null;
  clinic_name: string | null;
  city: string | null;
  state: string | null;
  photo_url: string | null;
  specialties: string[] | null;
  student_note: string | null;
  offers_shadowing: boolean | null;
  accepts_interns: boolean | null;
  accepts_student_messages: boolean | null;
  is_hiring: boolean | null;
  is_mentoring: boolean | null;
};

export default async function StudentDoctorsPage({ searchParams }: { searchParams: Promise<{ badge?: string; state?: string; q?: string; doctor?: string }> }) {
  const params = await searchParams;
  const portal = await getStudentPortal();
  const member = portal ? hasMemberAccess(portal.membership) : false;
  const admin = createAdminClient();
  const columns = 'id, user_id, slug, first_name, last_name, clinic_name, city, state, photo_url, specialties, student_note, offers_shadowing, accepts_interns, accepts_student_messages, is_hiring, is_mentoring, open_to_students';
  let query = await (admin as any).from('doctors').select(columns).eq('open_to_students', true).limit(60);
  let usedFallback = false;
  if (query.error && missingSchema(query.error)) {
    usedFallback = true;
    query = await (admin as any).from('doctors').select('id, slug, first_name, last_name, clinic_name, city, state, photo_url, specialties, is_hiring, is_mentoring').or('is_mentoring.eq.true,is_hiring.eq.true').limit(60);
  }
  let rows = ((query.data || []) as DoctorCard[]).filter((doctor) => usedFallback ? (doctor.is_mentoring || doctor.is_hiring) : true);
  if (params.state) rows = rows.filter((doctor) => (doctor.state || '').toLowerCase() === params.state!.toLowerCase());
  if (params.q) {
    const q = params.q.toLowerCase();
    rows = rows.filter((doctor) => `${doctor.city || ''} ${(doctor.specialties || []).join(' ')}`.toLowerCase().includes(q));
  }
  if (params.badge === 'shadow') rows = rows.filter((doctor) => doctor.offers_shadowing || doctor.is_mentoring);
  if (params.badge === 'intern') rows = rows.filter((doctor) => doctor.accepts_interns);
  if (params.badge === 'hiring') rows = rows.filter((doctor) => doctor.is_hiring);
  if (params.doctor) rows = rows.filter((doctor) => doctor.id === params.doctor);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader title="Doctors" description="Only doctors who turned this on are listed. Students only see this if the doctor opts in." />
      <form className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2" action="/student/doctors">
        <input name="state" defaultValue={params.state || ''} placeholder="State" className="min-h-11 rounded-lg border border-portal-border px-3 text-base text-portal-ink" />
        <input name="q" defaultValue={params.q || ''} placeholder="City or technique" className="min-h-11 rounded-lg border border-portal-border px-3 text-base text-portal-ink" />
        <button className="min-h-11 rounded-lg bg-portal-ink px-4 text-base font-bold text-white" type="submit">Filter</button>
      </form>
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          ['', 'All'],
          ['shadow', 'Shadow days'],
          ['intern', 'Interns'],
          ['hiring', 'Hiring'],
        ].map(([badge, label]) => (
          <Link key={label} href={badge ? `/student/doctors?badge=${badge}` : '/student/doctors'} className="min-h-11 inline-flex items-center rounded-lg border border-portal-border bg-white px-3 text-sm font-bold text-portal-ink">{label}</Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <article className="rounded-2xl bg-white p-6" style={{ boxShadow: 'inset 0 0 0 1px #ECE8E1' }}>
          <h2 className="text-xl font-extrabold text-[#15202B]">No doctors have opted in yet</h2>
          <p className="mt-2 text-[15px] leading-6 text-[#3d4a57]">This list only includes doctors who chose to meet students. Finish your profile so you are ready when someone turns it on, or open ChiroMatch if you are a member.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/student/profile" className="inline-flex min-h-11 items-center rounded-xl bg-[#2C6BB4] px-4 text-sm font-extrabold text-white">Finish your profile</Link>
            <Link href="/student/match" className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-extrabold text-[#1F4F8C]" style={{ boxShadow: 'inset 0 0 0 1px #ECE8E1' }}>Open ChiroMatch</Link>
          </div>
        </article>
      ) : null}
      <div className="space-y-3">
        {rows.map((doctor) => {
          const name = `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || 'Doctor';
          const badges = [
            doctor.offers_shadowing ? 'Shadow days' : null,
            doctor.accepts_interns ? 'Interns' : null,
            doctor.is_hiring ? 'Hiring' : null,
            doctor.is_mentoring ? 'Mentoring' : null,
          ].filter(Boolean);
          return (
            <article key={doctor.id} className="bg-white border border-portal-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                {doctor.photo_url ? <img src={doctor.photo_url} alt="" className="h-14 w-14 rounded-full object-cover" /> : null}
                <div>
                  <h2 className="text-lg font-bold text-portal-ink">{name}</h2>
                  <p className="text-base text-portal-ink-2">{[doctor.clinic_name, doctor.city, doctor.state].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              {badges.length ? <p className="mt-2 text-sm text-portal-ink">{badges.join(' · ')}</p> : null}
              {doctor.student_note ? <p className="mt-2 text-base text-portal-ink">{doctor.student_note}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {doctor.slug ? <Link href={`https://neurochiro.co/directory/${doctor.slug}`} className="inline-flex min-h-11 items-center text-base font-bold text-portal-accent">View profile</Link> : null}
                {doctor.accepts_student_messages && doctor.user_id ? (
                  <Link href={`/student/messages?to=${doctor.user_id}`} className="inline-flex min-h-11 items-center rounded-lg bg-[#2C6BB4] px-4 text-sm font-extrabold text-white">Message</Link>
                ) : null}
              </div>
              {member ? <MentorshipForm doctorId={doctor.id} /> : null}
              {member && doctor.offers_shadowing ? <ShadowForm doctorId={doctor.id} /> : null}
              {!member ? <p className="mt-2 text-sm text-portal-ink-2">Membership is required to ask about mentorship or request a shadow day.</p> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
