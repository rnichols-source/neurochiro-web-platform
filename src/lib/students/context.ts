import 'server-only';
import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import { countUnread } from '@/lib/messaging/db';
import { getStudentMembership } from '@/lib/students/membership';
import type { StudentPortalValue } from '@/lib/students/portal-value';
import { missingSchema } from '@/lib/students/schema';

export type { StudentPortalValue };

const ADMINS = new Set(['admin', 'super_admin', 'founder', 'regional_admin']);

export function isStaffRole(role: string): boolean {
  return ADMINS.has(role);
}

export const getStudentPortal = cache(async (): Promise<StudentPortalValue | null> => {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const profile = await admin.from('profiles').select('role, full_name, email').eq('id', user.id).maybeSingle();
  const row = profile.data as { role?: string | null; full_name?: string | null; email?: string | null } | null;
  const role = row?.role || 'student';
  let school: string | null = null;
  let graduationYear: number | null = null;
  const student = await admin.from('students').select('school, graduation_year').eq('id', user.id).maybeSingle();
  if (student.error && missingSchema(student.error)) {
    school = null;
  } else if (student.data) {
    const data = student.data as { school?: string | null; graduation_year?: number | null };
    school = data.school || null;
    graduationYear = data.graduation_year ?? null;
  } else {
    const byUser = await admin.from('students').select('school, graduation_year').eq('user_id', user.id).maybeSingle();
    if (byUser.data) {
      const data = byUser.data as { school?: string | null; graduation_year?: number | null };
      school = data.school || null;
      graduationYear = data.graduation_year ?? null;
    }
  }
  let unreadMessages = 0;
  try {
    const unread = await countUnread(user.id);
    unreadMessages = unread.messages || 0;
  } catch {
    unreadMessages = 0;
  }
  return {
    userId: user.id,
    fullName: row?.full_name || '',
    email: row?.email || user.email || '',
    role,
    school,
    graduationYear,
    membership: await getStudentMembership(user.id),
    unreadMessages,
  };
});
