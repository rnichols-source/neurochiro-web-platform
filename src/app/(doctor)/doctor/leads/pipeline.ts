import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { isMissingColumn } from '@/lib/leads/schema';
import { parseLegacyNote } from '@/lib/leads/validate';
import { dedupePatientRequests, pipelineTab } from '@/lib/portal/stats';

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

export async function loadLeadPipeline(doctorId: string) {
  const admin = createAdminClient() as any;
  const [leadsRes, contactReqRes] = await Promise.all([
    admin
      .from('leads')
      .select('id, first_name, last_name, email, phone, source, stage, notes, last_contacted_at, confirmed_at, created_at')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false }),
    loadContactRequests(admin, doctorId),
  ]);

  const rawLeads = leadsRes.data || [];
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

  const merged = [...rawLeads.map((lead: any) => ({ ...lead, _type: 'lead' })), ...contactLeads]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const leads = dedupePatientRequests(merged);

  const stageCounts = { new: 0, contacted: 0, scheduled: 0, converted: 0 };
  for (const lead of leads) {
    stageCounts[pipelineTab((lead as any).stage)]++;
  }

  const total = leads.length;
  const conversionRate = total > 0 ? Math.round((stageCounts.converted / total) * 100) : 0;
  return { leads, stageCounts, conversionRate };
}
