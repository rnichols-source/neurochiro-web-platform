'use server'

import { createServerSupabase } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';

export async function getAllDoctors(search?: string) {
  noStore();
  // Using Admin Client to ensure admin sees all records regardless of RLS
  const supabase = createAdminClient();
  let query = supabase.from('doctors').select('*').order('last_name', { ascending: true });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,clinic_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateDoctorManually(doctorId: string, updates: any) {
  // Use Admin Client for manual directory updates
  const supabase = createAdminClient();
  const { data: { user } } = await (supabase.auth as any).getUser(); // Auth might not work with admin client if token is not passed, but we don't strictly need user for update

  const { error } = await supabase
    .from('doctors')
    .update(updates)
    .eq('id', doctorId);

  if (error) {
    console.error("Manual Update Error:", error);
    return { success: false, error: error.message };
  }

  // Refresh search index for high-performance GIN/RPC search
  try {
    await supabase.rpc('refresh_search_index');
  } catch (refreshErr) {
    console.warn("Search Index Refresh (non-critical):", refreshErr);
  }

  // Log the action (using server client for audit log to get user if possible)
  try {
    const serverSupabase = createServerSupabase();
    const { data: { user: serverUser } } = await serverSupabase.auth.getUser();
    
    await supabase.from('audit_logs').insert({
      category: 'DIRECTORY',
      event: `Manual Update: Doctor ${doctorId}`,
      user_name: serverUser?.email || "Founder",
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
    // Use Admin Client to bypass RLS and ensure deletion works
    const supabase = createAdminClient();
    const serverSupabase = createServerSupabase();
    const { data: { user: serverUser } } = await serverSupabase.auth.getUser();

    console.log(`[DELETE] Starting deletion process for Doctor ID: ${doctorId}`);

    // 1. Delete associated jobs
    const { error: jobsError } = await supabase
      .from('job_postings')
      .delete()
      .eq('doctor_id', doctorId);
    
    if (jobsError) {
      console.warn("[DELETE] Jobs cleanup issue:", jobsError.message);
    }

    // 2. Try to clean up leads
    try {
      await supabase.from('leads').delete().eq('doctor_id', doctorId);
    } catch (e) {
      console.warn("[DELETE] Leads cleanup skipped");
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
      // Fallback: Check if it was matching by user_id instead of id
      console.warn(`[DELETE] No record found with id=${doctorId}, trying user_id...`);
      const { error: deleteError2, data: deleteData2 } = await supabase
        .from('doctors')
        .delete()
        .eq('user_id', doctorId)
        .select();
      
      if (deleteError2) {
        return { success: false, error: `Database Error (user_id): ${deleteError2.message}` };
      }
      
      if (!deleteData2 || deleteData2.length === 0) {
        console.error("[DELETE] No record found to delete with ID or UserID:", doctorId);
        return { success: false, error: "No record found with that ID. It may have already been deleted." };
      }
      
      console.log(`[DELETE] Successfully deleted doctor using user_id: ${doctorId}`);
    } else {
      console.log(`[DELETE] Successfully deleted doctor using id: ${doctorId}`);
    }

    // 4. Log the action (Non-blocking)
    try {
      await supabase.from('audit_logs').insert({
        category: 'DIRECTORY',
        event: `Manual Delete: Doctor ${doctorId}`,
        user_name: serverUser?.email || "Founder",
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
