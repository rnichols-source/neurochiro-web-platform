import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import PageHeader from '@/components/portal/PageHeader';
import StatusPill from '@/components/portal/StatusPill';
import { getPortalContext } from '@/lib/portal/context';
import { getReferral, listAttachments, markViewed } from '@/lib/referrals/data';
import { ensureReferralThread, referralThreadId } from '@/lib/messaging/referral-thread';
import { canSeePatientContact, patientLabel, statusLabel } from '@/lib/referrals/pure';
import ReferralActions from './ReferralActions';

export default async function ReferralDetail({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getPortalContext();
  if (!ctx?.doctor) redirect('/login');
  const { id } = await params;
  await markViewed(id);
  const loaded = await getReferral(id);
  if (!loaded) notFound();
  const { row, v2, viewerDoctorId } = loaded;
  const mine = row.referring_doctor_id === viewerDoctorId;
  const showContact = canSeePatientContact({
    viewerDoctorId,
    referringDoctorId: row.referring_doctor_id,
    receivingDoctorId: row.receiving_doctor_id,
    status: row.status,
  });
  const files = await listAttachments(id);
  const threadEvent = row.status === 'declined' ? 'declined' : row.status === 'scheduled' ? 'booked' : row.status === 'accepted' || row.status === 'patient_contacted' ? 'accepted' : 'sent';
  const threadId = await referralThreadId(id) || await ensureReferralThread(id, threadEvent);
  const steps = [
    { label: 'Sent', at: row.created_at },
    { label: 'Seen', at: row.viewed_at || null },
    { label: 'Accepted', at: row.status === 'declined' ? null : row.responded_at },
    { label: 'Called', at: row.contacted_at || null },
    { label: 'Booked', at: row.scheduled_at || null },
  ];

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title={patientLabel(row.patient_first_name, row.patient_last_initial)}
        description={row.other_name || 'Referral'}
      />
      <StatusPill label={statusLabel(row.status)} />
      <p className="text-[15px] leading-6 text-portal-ink">{row.reason}</p>
      <p className="text-sm text-portal-muted">Urgency: {row.urgency === 'urgent' ? 'Urgent' : 'Routine'}</p>
      {showContact ? (
        <div className="bg-white border border-portal-border rounded-xl p-4 text-sm">
          <p>Phone: {row.patient_phone || 'Not added'}</p>
          <p>Email: {row.patient_email || 'Not added'}</p>
        </div>
      ) : (
        <p className="text-sm text-portal-muted">The phone is shared after this referral is accepted.</p>
      )}
      <ol className="bg-white border border-portal-border rounded-xl p-4 space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex justify-between gap-3 text-sm">
            <span className="font-bold text-portal-ink">{step.label}</span>
            <span className="text-portal-muted">{step.at ? new Date(step.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not yet'}</span>
          </li>
        ))}
      </ol>
      {files.length > 0 ? (
        <ul className="text-sm">
          {files.map((file) => (
            <li key={file.id}><a className="text-portal-accent font-bold" href={`/doctor/referrals/${id}?file=${file.id}`}>{file.fileName}</a></li>
          ))}
        </ul>
      ) : null}
      {threadId ? (
        <Link href={`/doctor/messages?c=${threadId}`} className="inline-flex min-h-11 items-center text-sm font-bold text-portal-accent">
          Message {row.other_name || 'the doctor'}
        </Link>
      ) : null}
      <ReferralActions
        id={row.id}
        status={row.status}
        mine={mine}
        v2={v2}
        otherName={row.other_name || 'the doctor'}
      />
      {row.decline_reason ? <p className="text-sm">Reason: {row.decline_reason}</p> : null}
      {row.thank_you_note ? <p className="text-sm">Note: {row.thank_you_note}</p> : null}
      <Link href="/doctor/referrals" className="inline-flex min-h-11 items-center text-sm font-bold text-portal-accent">Back to referrals</Link>
    </div>
  );
}
