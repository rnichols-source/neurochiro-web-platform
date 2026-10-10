'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

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
    admin
      .from('contact_requests')
      .select('id, name, phone, note, source, created_at, acknowledged_at, contact_outcome, status')
      .eq('doctor_id', docId)
      .order('created_at', { ascending: false }),
  ]);

  const rawLeads = leadsRes.data || [];

  // Map contact_requests into the same shape as leads
  const contactLeads = (contactReqRes.data || []).map((cr: any) => {
    const nameParts = (cr.name || '').trim().split(' ');
    let stage = 'new';
    if (cr.contact_outcome === 'patient_contacted_confirmed') stage = 'contacted';
    else if (cr.contact_outcome === 'will_call_today') stage = 'new';

    return {
      id: cr.id,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: null,
      phone: cr.phone,
      source: cr.source === 'dm_outreach' ? 'NeuroChiro introduction' : (cr.source || 'directory'),
      stage,
      notes: cr.note || null,
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

export async function updateLeadStage(leadId: string, stage: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const docId = await getDoctorId(user.id);
  if (!docId) return { error: 'Doctor not found' };

  const admin = createAdminClient() as any;
  const updateData: any = { stage };
  if (stage === 'contacted') updateData.last_contacted_at = new Date().toISOString();
  if (stage === 'converted') updateData.confirmed_at = new Date().toISOString();

  // Ownership check: only update leads belonging to this doctor
  const { error } = await admin.from('leads').update(updateData).eq('id', leadId).eq('doctor_id', docId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateLeadNotes(leadId: string, notes: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const docId = await getDoctorId(user.id);
  if (!docId) return { error: 'Doctor not found' };

  const admin = createAdminClient() as any;
  // Ownership check
  const { error } = await admin.from('leads').update({ notes }).eq('id', leadId).eq('doctor_id', docId);
  if (error) return { error: error.message };
  return { success: true };
}
