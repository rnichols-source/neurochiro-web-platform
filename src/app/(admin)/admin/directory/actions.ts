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

export async function bulkDeleteDoctors(doctorIds: string[]) {
  try {
    const supabase = createAdminClient();
    let deleted = 0;
    let failed = 0;

    for (const id of doctorIds) {
      // Clean up associated records
      try { await supabase.from('job_postings').delete().eq('doctor_id', id); } catch {}
      try { await supabase.from('leads').delete().eq('doctor_id', id); } catch {}
      try { await supabase.from('patient_stories').delete().eq('doctor_id', id); } catch {}

      const { error } = await supabase.from('doctors').delete().eq('id', id);
      if (error) { failed++; } else { deleted++; }
    }

    // Log the action
    try {
      const serverSupabase = createServerSupabase();
      const { data: { user } } = await serverSupabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        category: 'DIRECTORY',
        event: `Bulk Delete: ${deleted} doctors removed`,
        user_name: user?.email || "Founder",
        target: "Clinical Directory",
        status: 'Success',
        severity: 'High',
        metadata: { deleted_ids: doctorIds, deleted_count: deleted, failed_count: failed }
      });
    } catch {}

    revalidatePath('/admin/directory');
    revalidatePath('/directory');
    revalidatePath('/');

    return { success: true, deleted, failed };
  } catch (err: any) {
    return { success: false, error: err.message, deleted: 0, failed: doctorIds.length };
  }
}

export async function migrateDoctorsFromCSV(rows: { name: string; email: string; stripeCustomerId: string; subscriptionId: string; amount: string }[]) {
  const supabase = createAdminClient();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      // Check if doctor with this email already exists
      const { data: existing } = await supabase
        .from('doctors')
        .select('id')
        .eq('email', row.email)
        .maybeSingle();

      if (existing) {
        // Doctor already exists, update their profile's stripe info if they have a user_id
        const { data: doc } = await supabase.from('doctors').select('user_id').eq('id', existing.id).single();
        if (doc?.user_id) {
          await supabase.from('profiles').update({
            stripe_customer_id: row.stripeCustomerId,
            subscription_status: 'active',
          }).eq('id', doc.user_id);
        }
        skipped++;
        continue;
      }

      // Parse name
      const nameParts = row.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create slug
      const slug = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

      // Create doctor record
      const { error: insertError } = await supabase.from('doctors').insert({
        first_name: firstName,
        last_name: lastName,
        email: row.email,
        slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
        clinic_name: `${firstName} ${lastName} Chiropractic`,
        city: '',
        state: '',
        country: 'US',
        address: '',
        latitude: 0,
        longitude: 0,
        bio: '',
        specialties: [],
        verification_status: 'verified',
        membership_tier: 'starter',
        region_code: 'US',
        profile_views: 0,
        patient_leads: 0,
      });

      if (insertError) {
        errors.push(`${row.email}: ${insertError.message}`);
      } else {
        created++;
      }

      // Also create a Supabase auth account + profile
      // Note: uses admin client to create users
      const tempPassword = `NC-${Math.random().toString(36).substring(2, 10)}!`;
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: row.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role: 'doctor', full_name: row.name }
      });

      if (authData?.user) {
        // Create profile
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: row.email,
          full_name: row.name,
          role: 'doctor',
          subscription_status: 'active',
          tier: 'starter',
          stripe_customer_id: row.stripeCustomerId,
        });

        // Link doctor record to auth user
        await supabase.from('doctors').update({
          user_id: authData.user.id,
        }).eq('email', row.email);

        // Send password reset so they can set their own password
        await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: row.email,
        });
      } else if (authError) {
        console.warn(`Auth creation for ${row.email}:`, authError.message);
      }
    } catch (err: any) {
      errors.push(`${row.email}: ${err.message}`);
    }
  }

  revalidatePath('/admin/directory');
  revalidatePath('/directory');

  return { created, skipped, errors };
}

export async function sendMigrationEmails(doctorIds: string[]) {
  const supabase = createAdminClient();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const id of doctorIds) {
    try {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('first_name, last_name, email, user_id')
        .eq('id', id)
        .single();

      if (!doctor?.email) { failed++; errors.push(`${id}: no email`); continue; }

      const firstName = doctor.first_name || 'Doctor';
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co';

      // Trigger Supabase's built-in password reset email flow
      // This sends a separate email from Supabase with a working token
      if (doctor.user_id) {
        try {
          await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: doctor.email,
            options: { redirectTo: `${siteUrl}/reset-password` }
          });
        } catch {}
      }

      // Also send our branded welcome email via Resend
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY || '');
      const loginLink = `${siteUrl}/login`;

      await resend.emails.send({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: [doctor.email],
        subject: `Dr. ${firstName}, your new NeuroChiro profile is ready`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 24px; font-weight: 800; color: #1E2D3B; margin: 0;">NEURO<span style="color: #D66829;">CHIRO</span></h1>
            </div>
            <h2 style="font-size: 22px; font-weight: 700; color: #1E2D3B; margin-bottom: 16px;">
              Hey Dr. ${firstName}, your new profile is ready.
            </h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
              We've upgraded the NeuroChiro platform with a completely new design, faster search, and better tools for your practice.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
              <strong>Your membership stays exactly the same</strong> — same billing, same price, nothing changes. You just need to set a password on the new site and complete your profile.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              It takes about 5 minutes. Once your profile is complete, you'll be live in the global directory and patients can find you.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 8px;"><strong>Here's how to get started:</strong></p>
            <ol style="color: #555; font-size: 15px; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
              <li>Go to the login page</li>
              <li>Click <strong>"Forgot password?"</strong></li>
              <li>Enter your email: <strong>${doctor.email}</strong></li>
              <li>You'll get a 6-digit code — enter it on the next screen</li>
              <li>Set your password and complete your profile</li>
            </ol>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginLink}" style="display: inline-block; padding: 16px 32px; background-color: #D66829; color: white; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 12px; letter-spacing: 0.5px;">
                Go to Login Page
              </a>
            </div>
            <p style="color: #999; font-size: 13px; line-height: 1.5; margin-top: 32px; border-top: 1px solid #eee; padding-top: 24px;">
              Questions? Just reply to this email or contact us at support@neurochirodirectory.com.
            </p>
          </div>
        `,
      });

      sent++;
    } catch (err: any) {
      failed++;
      errors.push(`${id}: ${err.message}`);
    }
  }

  // Log the action
  try {
    const serverSupabase = createServerSupabase();
    const { data: { user } } = await serverSupabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      category: 'MIGRATION',
      event: `Migration emails sent: ${sent} delivered, ${failed} failed`,
      user_name: user?.email || 'Founder',
      target: 'Doctor Migration',
      status: 'Success',
      severity: 'Medium',
      metadata: { sent, failed, errors }
    });
  } catch {}

  return { sent, failed, errors };
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
