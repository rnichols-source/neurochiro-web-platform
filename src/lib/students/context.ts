import 'server-only';
import { cache } from 'react';
import { createServerSupabase } from '@/lib/supabase-server';
import { countUnread } from '@/lib/messaging/db';
import { getStudentMembership } from '@/lib/students/membership';
import { loadStudentProfile } from '@/lib/students/save-student-profile';
import type { StudentPortalValue } from '@/lib/students/portal-value';

export type { StudentPortalValue };

const ADMINS = new Set(['admin', 'super_admin', 'founder', 'regional_admin']);

export function isStaffRole(role: string): boolean {
  return ADMINS.has(role);
}

export const getStudentPortal = cache(async (): Promise<StudentPortalValue | null> => {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const loaded = await loadStudentProfile(user.id);
  if (loaded.error) console.error('[students] profile read failed', loaded.error);
  const row = loaded.data;
  const role = row?.role || 'student';
  let unreadMessages = 0;
  try {
    const unread = await countUnread(user.id);
    unreadMessages = unread.messages || 0;
  } catch {
    unreadMessages = 0;
  }
  return {
    userId: user.id,
    fullName: row?.fullName || '',
    email: row?.email || user.email || '',
    role,
    school: row?.school || null,
    yearInSchool: row?.yearInSchool || null,
    graduationYear: row?.graduationYear ?? null,
    city: row?.city || null,
    state: row?.state || null,
    techniques: row?.techniques || [],
    membership: await getStudentMembership(user.id),
    unreadMessages,
  };
});
