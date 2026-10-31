'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { STUDENT_CONFIG } from '@/config/students';
import { wrapEmail } from '@/lib/email-template';
import { ensureContextConversation, postSystemMessage } from '@/lib/messaging/db';
import { createAdminClient } from '@/lib/supabase-admin';
import { escapeHtml } from '@/lib/students/html';
import { getStudentPortal } from '@/lib/students/context';
import { hasMemberAccess } from '@/lib/students/membership-pure';
import { missingSchema } from '@/lib/students/schema';
import { canRequestShadow } from '@/lib/students/shadow';

export async function requestShadow(input: {
  doctorId: string;
  dates: string[];
  message: string;
  isAdult: boolean;
  acceptedWaiver: boolean;
}): Promise<{ error?: string }> {
  const portal = await getStudentPortal();
  if (!portal) return { error: 'Sign in first.' };
  if (!hasMemberAccess(portal.membership)) return { error: 'Membership is required to request a shadow day.' };
  if (!input.isAdult) return { error: 'You need to confirm you are 18 or older.' };
  if (!input.acceptedWaiver) return { error: 'Read and accept the shadow-day note before you send this.' };
  const dates = (input.dates || []).map((day) => day.trim()).filter(Boolean).slice(0, 3);
  if (!dates.length) return { error: 'Offer at least one date.' };
  const message = input.message.trim().slice(0, 500);
  if (message.length < 10) return { error: 'Write a short note about why you want to visit.' };

  const admin = createAdminClient();
  const open = await (admin as any).from('shadow_requests').select('id, doctor_id').eq('student_id', portal.userId).eq('status', 'requested');
  if (open.error && missingSchema(open.error)) return { error: 'Shadow days are not ready yet.' };
  const rows = (open.data || []) as { doctor_id: string }[];
  const decision = canRequestShadow({
    openCount: rows.length,
    alreadyOpenWithDoctor: rows.some((row) => row.doctor_id === input.doctorId),
  });
  if (!decision.ok) return { error: decision.reason };

  const inserted = await (admin as any).from('shadow_requests').insert({
    student_id: portal.userId,
    doctor_id: input.doctorId,
    proposed_dates: dates,
    message,
    status: 'requested',
  }).select('id').single();
  if (inserted.error) return { error: 'Could not send that request.' };

  const doctor = await (admin as any).from('doctors').select('user_id, first_name, clinic_name').eq('id', input.doctorId).maybeSingle();
  const doctorRow = doctor.data as { user_id?: string; first_name?: string; clinic_name?: string | null } | null;
  if (doctorRow?.user_id && process.env.RESEND_API_KEY) {
    const profile = await admin.from('profiles').select('email').eq('id', doctorRow.user_id).maybeSingle();
    const email = (profile.data as { email?: string } | null)?.email;
    if (email) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: email,
        subject: 'A student asked to shadow',
        html: wrapEmail(`<h1>Shadow day request</h1><p>${escapeHtml(portal.fullName || 'A student')} asked to spend a day at ${escapeHtml(doctorRow.clinic_name || 'your clinic')}.</p><p>${escapeHtml(message)}</p><p>Dates: ${escapeHtml(dates.join(', '))}</p><p><a href="https://www.neurochiro.co/doctor/students/shadow">Review the request</a></p>`),
      }).catch(() => undefined);
    }
  }
  revalidatePath('/student/doctors');
  return {};
}

export async function decideShadow(input: { requestId: string; status: 'accepted' | 'declined'; date?: string; reply?: string }): Promise<{ error?: string }> {
  const portal = await getStudentPortal();
  if (!portal || portal.role !== 'doctor' && !['admin', 'founder', 'super_admin'].includes(portal.role)) {
    return { error: 'Only the doctor can answer this.' };
  }
  const admin = createAdminClient();
  const doctor = await (admin as any).from('doctors').select('id, user_id, clinic_name').eq('user_id', portal.userId).maybeSingle();
  const doctorRow = doctor.data as { id: string; clinic_name?: string | null } | null;
  if (!doctorRow) return { error: 'No clinic profile found.' };
  const existing = await (admin as any).from('shadow_requests').select('id, student_id, doctor_id, status').eq('id', input.requestId).eq('doctor_id', doctorRow.id).maybeSingle();
  if (existing.error && missingSchema(existing.error)) return { error: 'Shadow days are not ready yet.' };
  const row = existing.data as { id: string; student_id: string; status: string } | null;
  if (!row || row.status !== 'requested') return { error: 'That request is already closed.' };
  const updated = await (admin as any).from('shadow_requests').update({
    status: input.status,
    doctor_reply: (input.reply || '').slice(0, 500),
    decided_at: new Date().toISOString(),
  }).eq('id', row.id);
  if (updated.error) return { error: 'Could not save that answer.' };
  if (input.status === 'accepted') {
    const conversationId = await ensureContextConversation({
      participantOne: portal.userId,
      participantTwo: row.student_id,
      contextType: 'shadow',
      contextId: row.id,
    });
    if (conversationId) {
      await postSystemMessage(conversationId, `Shadow day confirmed for ${input.date || 'the date you agreed'}`);
    }
  }
  revalidatePath('/doctor/students/shadow');
  return {};
}
