'use server'

import { createServerSupabase } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { bustAdminCoverage } from '@/lib/admin/bust-coverage';
import { checkAdminAuth } from '@/lib/admin-auth';
import { looseFrom } from '@/lib/admin/loose-query';
import { pickDoctorPatch } from '@/lib/admin/member-search';
import type { Json } from '@/types/supabase';

function looseUpdate(
  client: unknown,
  table: string,
  values: Record<string, string | number | boolean | null>,
  idColumn: string,
  id: string,
) {
  const from = (client as {
    from: (name: string) => {
      update: (row: Record<string, string | number | boolean | null>) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
      }
    }
  }).from;
  return from.call(client, table).update(values).eq(idColumn, id);
}

export async function updateDoctorManually(doctorId: string, updates: Record<string, unknown>) {
  await checkAdminAuth();
  const patch = pickDoctorPatch(updates);

  if (typeof patch.clinic_name === 'string' && patch.clinic_name) {
    const cn = patch.clinic_name;
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cn)) {
      return { success: false, error: 'Clinic name cannot contain an email address.' };
    }
    if (/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(cn)) {
      return { success: false, error: 'Clinic name cannot contain a phone number.' };
    }
    if (/https?:\/\/|www\.|\.com\b|\.net\b|\.org\b/i.test(cn)) {
      return { success: false, error: 'Clinic name cannot contain a URL.' };
    }
  }

  if (Object.keys(patch).length === 0) return { success: true };

  const supabase = createAdminClient();
  const { error } = await looseUpdate(supabase, 'doctors', patch, 'id', doctorId);

  if (error) {
    console.error('Manual Update Error');
    return { success: false, error: error.message };
  }

  try {
    await supabase.rpc('refresh_search_index');
  } catch {
    console.warn('Search Index Refresh (non-critical)');
  }

  try {
    const serverSupabase = createServerSupabase();
    const { data: { user: serverUser } } = await serverSupabase.auth.getUser();
    const metadata: { [key: string]: Json | undefined } = {};
    for (const [key, value] of Object.entries(patch)) metadata[key] = value;

    await supabase.from('audit_logs').insert({
      category: 'DIRECTORY',
      event: `Manual Update: Doctor ${doctorId}`,
      user_name: serverUser?.email || 'Founder',
      target: 'Clinical Directory',
      status: 'Success',
      severity: 'Medium',
      metadata,
    });
  } catch (logError) {
    console.error('Audit Log Error (Non-blocking)', logError instanceof Error ? logError.name : 'error');
  }

  revalidatePath('/admin/members');
  revalidatePath('/admin/directory');
  revalidatePath('/directory');
  bustAdminCoverage();
  return { success: true };
}

export async function activateAfterOnboardingCall(doctorId: string) {
  await checkAdminAuth();
  const supabase = createAdminClient();

  // Get the doctor's user_id to also update student record if needed
  const { data: doctor } = await supabase.from('doctors').select('user_id, first_name, last_name').eq('id', doctorId).single();
  if (!doctor) return { success: false, error: 'Doctor not found' };

  const doctorUpdate = await looseUpdate(supabase, 'doctors', {
    onboarding_call_status: 'completed',
    is_approved: true,
    verification_status: 'verified',
  }, 'id', doctorId);
  if (doctorUpdate.error) return { success: false, error: doctorUpdate.error.message };

  if (doctor.user_id) {
    const profileUpdate = await looseUpdate(supabase, 'profiles', { is_approved: true }, 'id', doctor.user_id);
    if (profileUpdate.error) return { success: false, error: profileUpdate.error.message };
  }

  // Discord notification
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  if (discordUrl) {
    fetch(discordUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `✅ **ACTIVATED** Dr. ${doctor.first_name} ${doctor.last_name} — onboarding call completed`,
      }),
    }).catch(() => {});
  }

  revalidatePath('/admin/directory');
  revalidatePath('/admin/members');
  bustAdminCoverage();
  return { success: true };
}

export async function activateStudentAfterOnboardingCall(studentId: string) {
  await checkAdminAuth();
  const supabase = createAdminClient();

  await looseUpdate(supabase, 'students', {
    onboarding_call_status: 'completed',
  }, 'id', studentId);

  await looseUpdate(supabase, 'profiles', { is_approved: true }, 'id', studentId);

  revalidatePath('/admin/directory');
  revalidatePath('/admin/members');
  return { success: true };
}

export async function getDoctorIntroductions(doctorId: string): Promise<{ city: string; state: string; date: string; type: string }[]> {
  await checkAdminAuth();
  const supabase = createAdminClient();

  const { data } = await looseFrom(supabase, 'reply_logs')
    .select('searched_city, searched_state, created_at, template_id')
    .eq('doctor_id', doctorId)
    .in('template_id', ['doctor_comment', 'doctor_dm', 'sent_to_patient'])
    .order('created_at', { ascending: false });

  return (data || []).map((row) => {
    const template = typeof row.template_id === 'string' ? row.template_id : '';
    const created = typeof row.created_at === 'string' ? row.created_at : '';
    return {
      city: typeof row.searched_city === 'string' ? row.searched_city : '',
      state: typeof row.searched_state === 'string' ? row.searched_state : '',
      date: created.slice(0, 10),
      type: template === 'doctor_comment' ? 'Comment' : template === 'doctor_dm' ? 'DM' : 'Sent',
    };
  });
}

