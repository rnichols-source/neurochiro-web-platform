'use server'

import { createAdminClient } from '@/lib/supabase-admin';
import { checkAdminAuth } from '@/lib/admin-auth';
import { doctorOrFilter, escapeLikeWildcards, postgrestOrIlike, profileOrFilter } from '@/lib/admin/member-search';

export async function searchAllResources(query: string) {
  try {
    await checkAdminAuth();
    const supabase = createAdminClient();
    const cleanQuery = query.trim();
    const like = `%${escapeLikeWildcards(cleanQuery)}%`;

    const [
      { data: doctors },
      { data: profiles },
      { data: seminars },
      { data: logs }
    ] = await Promise.all([
      supabase.from('doctors')
        .select('id, first_name, last_name, clinic_name, city, state, verification_status')
        .or(doctorOrFilter(cleanQuery))
        .limit(50),
      supabase.from('profiles')
        .select('id, full_name, email, role')
        .or(profileOrFilter(cleanQuery))
        .limit(50),
      supabase.from('seminars')
        .select('id, title, city, state')
        .ilike('title', like)
        .limit(20),
      supabase.from('audit_logs')
        .select('id, category, event, user_name, target, created_at')
        .or(`event.ilike.${postgrestOrIlike(cleanQuery)},user_name.ilike.${postgrestOrIlike(cleanQuery)},target.ilike.${postgrestOrIlike(cleanQuery)}`)
        .order('created_at', { ascending: false })
        .limit(50)
    ]);

    return {
      success: true,
      data: {
        doctors: doctors || [],
        profiles: profiles || [],
        seminars: seminars || [],
        logs: logs || []
      }
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return { success: false, error: message };
  }
}
