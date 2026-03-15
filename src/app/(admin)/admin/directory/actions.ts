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

    console.log(`[DELETE] Starting deletion process for Doctor ID: ${doctorId}`);

    // 1. Delete associated jobs
    const { error: jobsError } = await supabase
      .from('jobs')
      .delete()
      .eq('doctor_id', doctorId);
    
    if (jobsError) {
      console.warn("[DELETE] Jobs cleanup issue:", jobsError.message);
    }

    // 2. Try to clean up leads if they reference this doctor_id
    // Note: Some leads might reference auth.users(id), others might reference doctor(id)
    // We try both to be safe.
    try {
      await supabase.from('leads').delete().eq('doctor_id', doctorId);
    } catch (e) {
      console.warn("[DELETE] Leads cleanup skipped (column might not exist or reference auth.id)");
    }

    // 3. Delete the doctor record
    const { error: deleteError, data: deleteData } = await supabase
      .from('doctors')
      .delete()
      .eq('id', doctorId)
      .select();

    if (deleteError) {
      console.error("[DELETE] Doctor Table Error:", deleteError);
      return { success: false, error: `Database Error: ${deleteError.message} (${deleteError.code})` };
    }

    if (!deleteData || deleteData.length === 0) {
      console.error("[DELETE] No record found to delete with ID:", doctorId);
      return { success: false, error: "No record found with that ID. It may have already been deleted." };
    }

    console.log(`[DELETE] Successfully deleted doctor: ${doctorId}`);

    // 4. Log the action (Non-blocking)
    try {
      await supabase.from('audit_logs').insert({
        category: 'DIRECTORY',
        event: `Manual Delete: Doctor ${doctorId}`,
        user_name: user?.email || "Founder",
        target: "Clinical Directory",
        status: 'Success',
        severity: 'High',
        metadata: { deleted_id: doctorId, deleted_at: new Date().toISOString() }
      });
    } catch (logErr) {
      console.error("[DELETE] Audit Log Error (Non-blocking):", logErr);
    }

    revalidatePath('/admin/directory');
    revalidatePath('/directory');
    revalidatePath('/');
    
    return { success: true };
  } catch (err: any) {
    console.error("[DELETE] Critical Exception:", err);
    return { success: false, error: `Critical Exception: ${err.message || "Unknown error"}` };
  }
}
