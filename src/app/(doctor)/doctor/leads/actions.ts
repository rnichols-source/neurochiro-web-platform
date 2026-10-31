'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { logPortalEvent } from '@/lib/leads/send'
import { outcomePatch, stageToAckAction } from '@/lib/leads/outcomes'
import { updateContactRequest } from '@/lib/leads/schema'
import { loadLeadPipeline } from './pipeline'

async function getDoctorId(userId: string): Promise<string | null> {
  const { data } = await createAdminClient().from('doctors').select('id').eq('user_id', userId).single();
  return data?.id || null;
}

export async function getLeadPipeline() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const docId = await getDoctorId(user.id);
  if (!docId) return null;
  return loadLeadPipeline(docId);
}

export async function updateLeadStage(leadId: string, stage: string, leadType?: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const docId = await getDoctorId(user.id);
  if (!docId) return { error: 'Doctor not found' };

  const admin = createAdminClient() as any;

  if (leadType === 'contact_request') {
    const action = stageToAckAction(stage);
    if (!action) return { error: 'That stage does not apply to a contact request.' };
    const existing = await admin.from('contact_requests').select('id, acknowledged_at').eq('id', leadId).eq('doctor_id', docId).maybeSingle();
    if (existing.error) return { error: existing.error.message };
    if (!existing.data) return { error: 'Contact request not found.' };
    const patch = outcomePatch(action, 'dashboard', existing.data.acknowledged_at || null);
    const owned = await admin.from('contact_requests').select('id').eq('id', leadId).eq('doctor_id', docId).maybeSingle();
    if (!owned.data) return { error: 'Contact request was not updated.' };
    const updated = await updateContactRequest(admin, leadId, patch);
    if (!updated.ok) return { error: updated.error || 'Contact request was not updated.' };
    await logPortalEvent({ requestId: leadId, kind: 'doctor_ack', recipient: 'dashboard' });
    return { success: true };
  }

  const updateData: any = { stage };
  if (stage === 'contacted') updateData.last_contacted_at = new Date().toISOString();
  if (stage === 'converted') updateData.confirmed_at = new Date().toISOString();

  const { data, error } = await admin.from('leads').update(updateData).eq('id', leadId).eq('doctor_id', docId).select('id');
  if (error) return { error: error.message };
  if (!data?.length) return { error: 'Lead was not updated.' };
  return { success: true };
}

export async function updateLeadNotes(leadId: string, notes: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const docId = await getDoctorId(user.id);
  if (!docId) return { error: 'Doctor not found' };

  const admin = createAdminClient() as any;
  const lead = await admin.from('leads').update({ notes }).eq('id', leadId).eq('doctor_id', docId).select('id');
  if (lead.error) return { error: lead.error.message };
  if (lead.data?.length) return { success: true };

  const request = await admin.from('contact_requests').update({ note: notes }).eq('id', leadId).eq('doctor_id', docId).select('id');
  if (request.error) return { error: request.error.message };
  if (!request.data?.length) return { error: 'Nothing was updated.' };
  return { success: true };
}


