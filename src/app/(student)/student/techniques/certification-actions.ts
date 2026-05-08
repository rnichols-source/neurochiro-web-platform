'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getCertifications() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await (supabase as any)
    .from('student_certifications')
    .select('id, technique_name, certification_date, verified')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  return data || [];
}

export async function addCertification(techniqueName: string, certificationDate: string | null) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await (supabase as any)
    .from('student_certifications')
    .upsert({
      student_id: user.id,
      technique_name: techniqueName,
      certification_date: certificationDate || null,
    }, { onConflict: 'student_id,technique_name' });

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteCertification(id: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await (supabase as any)
    .from('student_certifications')
    .delete()
    .eq('id', id)
    .eq('student_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}
