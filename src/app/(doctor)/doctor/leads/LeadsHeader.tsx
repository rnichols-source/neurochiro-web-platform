import { getPortalContext } from '@/lib/portal/context';
import { getDoctorPortalStats } from '@/lib/portal/stats-load';

export default async function LeadsHeader() {
  const ctx = await getPortalContext();
  if (!ctx?.doctor) return null;
  const stats = await getDoctorPortalStats({
    doctorId: ctx.doctor.id,
    userId: ctx.userId,
    range: 'month',
    city: ctx.doctor.city,
    profileViews: ctx.doctor.profile_views,
  });
  return (
    <p className="text-sm text-portal-ink-2 mb-4" data-patient-requests={stats.patientRequests.total}>
      Patient requests this month: {stats.patientRequests.total}. New {stats.patientRequests.new}, contacted {stats.patientRequests.contacted}, booked {stats.patientRequests.booked}.
    </p>
  );
}
