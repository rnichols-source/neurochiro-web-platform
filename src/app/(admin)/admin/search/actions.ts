'use server'

import { createAdminClient } from '@/lib/supabase-admin';

import { checkAdminAuth } from '@/lib/admin-auth';

export async function searchAllResources(query: string) {
  try {
    await checkAdminAuth();
    const supabase = createAdminClient();
    const cleanQuery = query.trim().replace(/[%_(),.*\\]/g, '');

    const [
      { data: doctors },
      { data: profiles },
      { data: seminars },
      { data: logs }
    ] = await Promise.all([
      supabase.from('doctors')
        .select('id, first_name, last_name, clinic_name, city, state, verification_status')
        .or(`first_name.ilike.%${cleanQuery}%,last_name.ilike.%${cleanQuery}%,clinic_name.ilike.%${cleanQuery}%`)
        .limit(50),
      supabase.from('profiles')
        .select('id, full_name, email, role')
        .or(`full_name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%`)
        .limit(50),
      supabase.from('seminars')
        .select('id, title, city, state')
        .ilike('title', `%${cleanQuery}%`)
        .limit(20),
      supabase.from('audit_logs')
        .select('*')
        .or(`event.ilike.%${cleanQuery}%,user_name.ilike.%${cleanQuery}%,target.ilike.%${cleanQuery}%`)
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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
