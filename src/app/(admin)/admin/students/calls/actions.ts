'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { wrapEmail } from '@/lib/email-template';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import { STUDENT_CONFIG } from '@/config/students';
import { deriveStudentMembership } from '@/lib/students/membership-pure';
import { escapeHtml } from '@/lib/students/html';

async function staffId(): Promise<string | null> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const profile = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = (profile.data as { role?: string } | null)?.role || '';
  if (!['admin', 'founder', 'super_admin'].includes(role)) return null;
  return user.id;
}

export async function saveStudentCall(formData: FormData): Promise<void> {
  const userId = await staffId();
  if (!userId) return;
  const topic = String(formData.get('topic') || '').trim().slice(0, 140);
  const starts = String(formData.get('starts_at') || '');
  const joinUrl = String(formData.get('join_url') || '').trim();
  const recording = String(formData.get('recording_url') || '').trim();
  const description = String(formData.get('description') || '').trim().slice(0, 1000);
  const guestName = String(formData.get('guest_name') || '').trim().slice(0, 120);
  if (!topic || !starts) return;
  const admin = createAdminClient();
  const inserted = await (admin as any).from('student_calls').insert({
    starts_at: new Date(starts).toISOString(),
    topic,
    description,
    guest_name: guestName || null,
    recording_url: recording || null,
    status: 'scheduled',
    created_by: userId,
  }).select('id').single();
  if (inserted.error || !inserted.data) return;
  const id = (inserted.data as { id: string }).id;
  if (joinUrl) {
    await (admin as any).from('student_call_secrets').upsert({ call_id: id, join_url: joinUrl });
  }
  if (process.env.RESEND_API_KEY) {
    const people = await admin.from('profiles').select('id, email, role, tier, created_at, full_name').eq('role', 'student').limit(500);
    const resend = new Resend(process.env.RESEND_API_KEY);
    for (const person of (people.data || []) as { email?: string; role?: string; tier?: string; created_at?: string; full_name?: string }[]) {
      const membership = deriveStudentMembership({ role: person.role, tier: person.tier, createdAt: person.created_at, launchAt: STUDENT_CONFIG.launchAt });
      if (membership.status !== 'member' && membership.status !== 'grace' && membership.status !== 'past_due') continue;
      if (!person.email) continue;
      await resend.emails.send({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: person.email,
        subject: `New call: ${topic}${guestName ? ` with ${guestName}` : ''}`,
        html: wrapEmail(`<h1>${escapeHtml(topic)}</h1><p>${escapeHtml(description || 'The monthly student call is on the calendar.')}</p><p><a href="https://www.neurochiro.co/student/mentorship">See the time and RSVP</a></p>`),
      }).catch(() => undefined);
    }
  }
  revalidatePath('/admin/students/calls');
  revalidatePath('/student/mentorship');
}
