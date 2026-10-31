'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import { missingSchema } from '@/lib/students/schema';

export async function getStudentOptIn() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const row = await (admin as any).from('doctors').select('open_to_students, is_mentoring, offers_shadowing, accepts_interns, is_hiring, student_note').eq('user_id', user.id).maybeSingle();
  if (row.error && missingSchema(row.error)) return { missing: true as const };
  const data = row.data as {
    open_to_students?: boolean | null;
    is_mentoring?: boolean | null;
    offers_shadowing?: boolean | null;
    accepts_interns?: boolean | null;
    is_hiring?: boolean | null;
    student_note?: string | null;
  } | null;
  return { missing: false as const, ...data };
}

export async function saveStudentOptIn(formData: FormData): Promise<{ error?: string }> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in first.' };
  const note = String(formData.get('student_note') || '').slice(0, 280);
  const admin = createAdminClient();
  const updated = await (admin as any).from('doctors').update({
    open_to_students: formData.get('open_to_students') === 'yes',
    is_mentoring: formData.get('is_mentoring') === 'yes',
    offers_shadowing: formData.get('offers_shadowing') === 'yes',
    accepts_interns: formData.get('accepts_interns') === 'yes',
    is_hiring: formData.get('is_hiring') === 'yes',
    student_note: note,
  }).eq('user_id', user.id);
  if (updated.error && missingSchema(updated.error)) return { error: 'Student settings are not on yet.' };
  if (updated.error) return { error: 'Could not save that.' };
  revalidatePath('/doctor/profile');
  revalidatePath('/student/doctors');
  return {};
}
