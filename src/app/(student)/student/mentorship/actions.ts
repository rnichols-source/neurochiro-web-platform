'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-admin';
import { getStudentPortal } from '@/lib/students/context';
import { hasMemberAccess } from '@/lib/students/membership-pure';
import { missingSchema } from '@/lib/students/schema';

export async function rsvpForCall(callId: string): Promise<{ error?: string }> {
  const portal = await getStudentPortal();
  if (!portal) return { error: 'Sign in first.' };
  if (!hasMemberAccess(portal.membership)) return { error: 'Membership is required for the monthly call.' };
  const admin = createAdminClient();
  const inserted = await (admin as any).from('student_call_rsvps').upsert({ call_id: callId, user_id: portal.userId }, { onConflict: 'call_id,user_id' });
  if (inserted.error && missingSchema(inserted.error)) return { error: 'The call list is not ready yet.' };
  if (inserted.error) return { error: 'Could not save your RSVP.' };
  revalidatePath('/student/mentorship');
  return {};
}
