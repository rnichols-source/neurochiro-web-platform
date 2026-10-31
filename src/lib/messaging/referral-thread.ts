import 'server-only';
import { patientLabel } from '@/lib/referrals/pure';
import { createAdminClient } from '@/lib/supabase-admin';
import { ensureContextConversation } from './conversations';
import { postSystemMessage } from './system';

export type ReferralThreadEvent = 'sent' | 'accepted' | 'declined' | 'booked';

function line(event: ReferralThreadEvent, doctorName: string, patient: string, urgency: string): string {
  if (event === 'sent') {
    const pace = urgency === 'urgent' ? 'Urgent' : 'Routine';
    return `${doctorName} referred ${patient} · ${pace}`;
  }
  if (event === 'accepted') return 'Accepted';
  if (event === 'declined') return 'Declined';
  return 'Booked';
}

/** Creates the referral thread and posts a status line. Never includes phone or email. */
export async function ensureReferralThread(referralId: string, event: ReferralThreadEvent): Promise<string | null> {
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('doctor_referrals')
    .select('id, patient_first_name, patient_last_initial, urgency, referring_doctor_id, receiving_doctor_id')
    .eq('id', referralId)
    .maybeSingle();
  if (error || !data) return null;
  const doctors = await admin
    .from('doctors')
    .select('id, user_id, first_name, last_name')
    .in('id', [data.referring_doctor_id, data.receiving_doctor_id]);
  const rows = (doctors.data || []) as { id: string; user_id: string | null; first_name: string | null; last_name: string | null }[];
  const referrer = rows.find((row) => row.id === data.referring_doctor_id);
  const receiver = rows.find((row) => row.id === data.receiving_doctor_id);
  if (!referrer?.user_id || !receiver?.user_id) return null;
  const conversationId = await ensureContextConversation({
    participantOne: referrer.user_id,
    participantTwo: receiver.user_id,
    contextType: 'referral',
    contextId: referralId,
  });
  if (!conversationId) return null;
  const doctorName = `Dr. ${referrer.first_name || ''} ${referrer.last_name || ''}`.trim();
  const patient = patientLabel(data.patient_first_name || '', data.patient_last_initial || '');
  await postSystemMessage(conversationId, line(event, doctorName, patient, data.urgency || 'routine'));
  return conversationId;
}

export async function referralThreadId(referralId: string): Promise<string | null> {
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('conversations')
    .select('id')
    .eq('context_type', 'referral')
    .eq('context_id', referralId)
    .limit(1)
    .maybeSingle();
  if (error || !data?.id) return null;
  return data.id as string;
}
