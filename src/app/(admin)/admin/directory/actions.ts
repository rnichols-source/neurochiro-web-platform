'use server'

import { createServerSupabase } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getAllDoctors(search?: string) {
  const supabase = createServerSupabase();
  let query = supabase.from('doctors').select('*').order('last_name', { ascending: true });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,clinic_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateDoctorManually(doctorId: string, updates: any) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('doctors')
    .update(updates)
    .eq('id', doctorId);

  if (error) {
    console.error("Manual Update Error:", error);
    return { success: false, error: error.message };
  }

  // Log the action
  await supabase.from('audit_logs').insert({
    category: 'DIRECTORY',
    event: `Manual Update: Doctor ${doctorId}`,
    user_name: user?.email || "Founder",
    target: "Clinical Directory",
    status: 'Success',
    severity: 'Medium',
    metadata: updates
  });

  revalidatePath('/admin/directory');
  revalidatePath('/directory');
  return { success: true };
}

export async function deleteDoctorManually(doctorId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('doctors')
    .delete()
    .eq('id', doctorId);

  if (error) return { success: false, error: error.message };

  await supabase.from('audit_logs').insert({
    category: 'DIRECTORY',
    event: `Manual Delete: Doctor ${doctorId}`,
    user_name: user?.email || "Founder",
    target: "Clinical Directory",
    status: 'Success',
    severity: 'High'
  });

  revalidatePath('/admin/directory');
  revalidatePath('/directory');
  return { success: true };
}
