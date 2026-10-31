'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { getStudentPortal } from '@/lib/students/context';
import { missingSchema } from '@/lib/students/schema';

export async function toggleRoadmapStep(stepKey: string, done: boolean): Promise<{ stored: 'db' | 'local' }> {
  const portal = await getStudentPortal();
  if (!portal) return { stored: 'local' };
  const admin = createAdminClient();
  if (done) {
    const inserted = await (admin as any).from('student_roadmap_progress').upsert({ user_id: portal.userId, step_key: stepKey, done_at: new Date().toISOString() }, { onConflict: 'user_id,step_key' });
    if (inserted.error && missingSchema(inserted.error)) return { stored: 'local' };
    if (inserted.error) return { stored: 'local' };
    return { stored: 'db' };
  }
  const removed = await (admin as any).from('student_roadmap_progress').delete().eq('user_id', portal.userId).eq('step_key', stepKey);
  if (removed.error && missingSchema(removed.error)) return { stored: 'local' };
  return { stored: 'db' };
}
