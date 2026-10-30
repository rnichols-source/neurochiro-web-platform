'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { logPortalEvent } from '@/lib/leads/send'
import { outcomePatch, stageToAckAction } from '@/lib/leads/outcomes'
import { isMissingColumn, updateContactRequest } from '@/lib/leads/schema'
import { parseLegacyNote } from '@/lib/leads/validate'

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

  const admin = createAdminClient() as any;

  // Fetch from both leads table AND contact_requests table
  const [leadsRes, contactReqRes] = await Promise.all([
    admin
      .from('leads')
      .select('id, first_name, last_name, email, phone, source, stage, notes, last_contacted_at, confirmed_at, created_at')
      .eq('doctor_id', docId)
      .order('created_at', { ascending: false }),
    loadContactRequests(admin, docId),
  ]);

  const rawLeads = leadsRes.data || [];

  // Map contact_requests into the same shape as leads
  const contactLeads = (contactReqRes.data || []).map((cr: any) => {
    const nameParts = (cr.name || '').trim().split(' ');
    const legacy = parseLegacyNote(cr.note);
    let stage = 'new';
    if (cr.contact_outcome === 'patient_contacted_confirmed' || cr.outcome_detail === 'booked') stage = cr.outcome_detail === 'booked' ? 'scheduled' : 'contacted';
    else if (cr.contact_outcome === 'will_call_today') stage = 'new';

    return {
      id: cr.id,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: cr.email || legacy.email || null,
      phone: cr.phone,
      preferred_time: cr.preferred_time || legacy.preferredTime || null,
      message: cr.message || null,
      source: cr.source === 'dm_outreach' ? 'NeuroChiro introduction' : (cr.source || 'directory'),
      stage,
      notes: cr.message || cr.note || null,
      last_contacted_at: cr.acknowledged_at || null,
      confirmed_at: null,
      created_at: cr.created_at,
      _type: 'contact_request',
    };
  });

  // Merge and sort by created_at descending
  const leads = [...rawLeads.map((l: any) => ({ ...l, _type: 'lead' })), ...contactLeads]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const stageCounts = { new: 0, contacted: 0, scheduled: 0, converted: 0 };
  for (const l of leads) {
    const s = (l as any).stage || 'new';
    if (s in stageCounts) stageCounts[s as keyof typeof stageCounts]++;
  }

  const total = leads.length;
  const conversionRate = total > 0 ? Math.round((stageCounts.converted / total) * 100) : 0;

  return { leads, stageCounts, conversionRate };
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

async function loadContactRequests(admin: any, docId: string) {
  const extended = await admin
    .from('contact_requests')
    .select('id, name, phone, email, preferred_time, message, note, source, created_at, acknowledged_at, contact_outcome, outcome_detail, status')
    .eq('doctor_id', docId)
    .order('created_at', { ascending: false });
  if (!extended.error) return extended;
  if (isMissingColumn(extended.error)) {
    console.error('[LEADS] doctor leads is missing follow-up columns. Apply migration 20261030000000_lead_followup.sql.', extended.error.message);
    return admin
      .from('contact_requests')
      .select('id, name, phone, note, source, created_at, acknowledged_at, contact_outcome, status')
      .eq('doctor_id', docId)
      .order('created_at', { ascending: false });
  }
  return extended;
}
