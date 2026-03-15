'use server'

import { createServerSupabase } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';

export async function getAllDoctors(search?: string) {
  noStore();
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
  try {
    await supabase.from('audit_logs').insert({
      category: 'DIRECTORY',
      event: `Manual Update: Doctor ${doctorId}`,
      user_name: user?.email || "Founder",
      target: "Clinical Directory",
      status: 'Success',
      severity: 'Medium',
      metadata: updates
    });
  } catch (logError) {
    console.error("Audit Log Error (Non-blocking):", logError);
  }

  revalidatePath('/admin/directory');
  revalidatePath('/directory');
  return { success: true };
}

export async function deleteDoctorManually(doctorId: string) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Delete associated jobs first (if any) to avoid foreign key constraints
    const { error: jobsError } = await supabase
      .from('jobs')
      .delete()
      .eq('doctor_id', doctorId);
    
    if (jobsError) {
      console.warn("Error deleting associated jobs (might not exist):", jobsError);
      // We continue anyway, as it might just be that the doctor has no jobs
    }

    // 2. Delete the doctor
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', doctorId);

    if (error) {
      console.error("Manual Delete Error:", error);
      return { success: false, error: error.message };
    }

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        category: 'DIRECTORY',
        event: `Manual Delete: Doctor ${doctorId}`,
        user_name: user?.email || "Founder",
        target: "Clinical Directory",
        status: 'Success',
        severity: 'High'
      });
    } catch (logErr) {
      console.error("Non-blocking audit log error:", logErr);
    }

    revalidatePath('/admin/directory');
    revalidatePath('/directory');
    revalidatePath('/');
    
    return { success: true };
  } catch (err: any) {
    console.error("Critical error in deleteDoctorManually:", err);
    return { success: false, error: err.message || "An unexpected error occurred during deletion." };
  }
}
