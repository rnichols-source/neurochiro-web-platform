'use server'

import { createAdminClient } from '@/lib/supabase-admin';
import { checkAdminAuth } from '@/lib/admin-auth';
import { doctorTokenFilters, escapeLikeWildcards, postgrestOrIlike, profileTokenFilters } from '@/lib/admin/member-search';
import { isMissingColumn } from '@/lib/leads/schema';

export async function searchAllResources(query: string) {
  try {
    await checkAdminAuth();
    const supabase = createAdminClient();
    const cleanQuery = query.trim();
    const like = `%${escapeLikeWildcards(cleanQuery)}%`;
    const doctorSelect = 'id, first_name, last_name, clinic_name, city, state, verification_status'
    let doctorQuery = supabase.from('doctors').select(doctorSelect).limit(50);
    for (const filter of doctorTokenFilters(cleanQuery)) doctorQuery = doctorQuery.or(filter);
    let profileQuery = supabase.from('profiles')
      .select('id, full_name, email, role')
      .limit(50);
    for (const filter of profileTokenFilters(cleanQuery)) profileQuery = profileQuery.or(filter);

    const doctorResult = await doctorQuery
    const doctorsPromise = doctorResult.error && isMissingColumn(doctorResult.error)
      ? doctorTokenFilters(cleanQuery, false).reduce(
          (next, filter) => next.or(filter),
          supabase.from('doctors').select(doctorSelect).limit(50),
        )
      : Promise.resolve(doctorResult)
    const [
      { data: doctors },
      { data: profiles },
      { data: seminars },
      { data: logs }
    ] = await Promise.all([
      doctorsPromise,
      profileQuery,
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
