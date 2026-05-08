'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function getLeadPipeline() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: doc } = await createAdminClient().from('doctors').select('id').eq('user_id', user.id).single();
  if (!doc) return null;

  const admin = createAdminClient() as any;
  const { data: leads } = await admin
    .from('leads')
    .select('id, first_name, last_name, email, phone, source, stage, notes, last_contacted_at, confirmed_at, created_at')
    .eq('doctor_id', doc.id)
    .order('created_at', { ascending: false });

  if (!leads) return { leads: [], stageCounts: { new: 0, contacted: 0, scheduled: 0, converted: 0 }, conversionRate: 0 };

  const stageCounts = { new: 0, contacted: 0, scheduled: 0, converted: 0 };
  for (const l of leads) {
    const s = l.stage || 'new';
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

  const admin = createAdminClient() as any;
  const updateData: any = { stage };
  if (stage === 'contacted') updateData.last_contacted_at = new Date().toISOString();
  if (stage === 'converted') updateData.confirmed_at = new Date().toISOString();

  const { error } = await admin.from('leads').update(updateData).eq('id', leadId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateLeadNotes(leadId: string, notes: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const admin = createAdminClient() as any;
  const { error } = await admin.from('leads').update({ notes }).eq('id', leadId);
  if (error) return { error: error.message };
  return { success: true };
}
