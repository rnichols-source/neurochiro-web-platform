'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const { createServerSupabase } = await import('@/lib/supabase-server');
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as any)?.role;
  if (!['admin', 'super_admin', 'founder', 'regional_admin'].includes(role)) throw new Error('Unauthorized');
  return user;
}

// ── Types ──
export type ProspectStatus = 'new' | 'contacted' | 'followed_up' | 'responded' | 'interested' | 'signed_up' | 'not_interested';

export interface Prospect {
  id: string;
  name: string;
  instagram_handle: string | null;
  email: string | null;
  website: string | null;
  phone: string | null;
  clinic_name: string | null;
  city: string;
  state: string;
  status: ProspectStatus;
  notes: string | null;
  script_used: string | null;
  source: string | null;
  contacted_at: string | null;
  follow_up_at: string | null;
  follow_up_count: number;
  responded_at: string | null;
  signed_up_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Ensure table exists ──
async function ensureTable() {
  const supabase = createAdminClient();
  // Try a simple query — if it fails, create the table
  const { error } = await supabase.from('outreach_prospects').select('id').limit(1);
  if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
    // Table doesn't exist — create it
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS outreach_prospects (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          instagram_handle TEXT,
          email TEXT,
          website TEXT,
          phone TEXT,
          clinic_name TEXT,
          city TEXT NOT NULL DEFAULT '',
          state TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'new',
          notes TEXT,
          script_used TEXT,
          source TEXT DEFAULT 'manual',
          contacted_at TIMESTAMPTZ,
          follow_up_at TIMESTAMPTZ,
          follow_up_count INT DEFAULT 0,
          responded_at TIMESTAMPTZ,
          signed_up_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_outreach_state ON outreach_prospects(state);
        CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_prospects(status);
      `
    }).catch(() => {
      // RPC might not exist, try raw SQL via admin
      console.warn('Could not auto-create outreach_prospects table. Please create it manually.');
    });
  }
}

// ── Get Prospects ──
export async function getProspects(options: {
  state?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();
  await ensureTable();

  const { state, status, search, page = 1, limit = 50 } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createAdminClient();

  let query = supabase
    .from('outreach_prospects')
    .select('*', { count: 'exact' });

  if (state && state !== 'all') {
    query = query.eq('state', state);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,instagram_handle.ilike.%${search}%,city.ilike.%${search}%,clinic_name.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching prospects:', error);
    return { prospects: [], total: 0, hasMore: false };
  }

  return {
    prospects: (data || []) as Prospect[],
    total: count || 0,
    hasMore: (count || 0) > to + 1,
  };
}

// ── Get Pipeline Stats ──
export async function getPipelineStats(state?: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  let query = supabase.from('outreach_prospects').select('status');
  if (state && state !== 'all') {
    query = query.eq('state', state);
  }

  const { data } = await query;
  const statuses = (data || []).map((d: any) => d.status);

  const stats = {
    total: statuses.length,
    new: statuses.filter((s: string) => s === 'new').length,
    contacted: statuses.filter((s: string) => s === 'contacted').length,
    followed_up: statuses.filter((s: string) => s === 'followed_up').length,
    responded: statuses.filter((s: string) => s === 'responded').length,
    interested: statuses.filter((s: string) => s === 'interested').length,
    signed_up: statuses.filter((s: string) => s === 'signed_up').length,
    not_interested: statuses.filter((s: string) => s === 'not_interested').length,
  };

  // Conversion rate
  const contactedTotal = stats.contacted + stats.followed_up + stats.responded + stats.interested + stats.signed_up + stats.not_interested;
  stats.total = statuses.length;

  return stats;
}

// ── Get Today's Queue ──
export async function getDailyQueue(dailyGoal: number = 10) {
  await requireAdmin();
  const supabase = createAdminClient();

  // Get new prospects (never contacted)
  const { data: newProspects } = await supabase
    .from('outreach_prospects')
    .select('*')
    .eq('status', 'new')
    .order('created_at', { ascending: true })
    .limit(dailyGoal);

  // Get follow-ups due today or overdue
  const now = new Date().toISOString();
  const { data: followUps } = await supabase
    .from('outreach_prospects')
    .select('*')
    .in('status', ['contacted', 'followed_up'])
    .lte('follow_up_at', now)
    .order('follow_up_at', { ascending: true })
    .limit(dailyGoal);

  return {
    newProspects: (newProspects || []) as Prospect[],
    followUps: (followUps || []) as Prospect[],
  };
}

// ── Add Prospect ──
export async function addProspect(data: {
  name: string;
  instagram_handle?: string;
  email?: string;
  website?: string;
  phone?: string;
  clinic_name?: string;
  city: string;
  state: string;
  notes?: string;
  source?: string;
}) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from('outreach_prospects').insert({
    name: data.name,
    instagram_handle: data.instagram_handle || null,
    email: data.email || null,
    website: data.website || null,
    phone: data.phone || null,
    clinic_name: data.clinic_name || null,
    city: data.city,
    state: data.state,
    notes: data.notes || null,
    source: data.source || 'manual',
    status: 'new',
  });

  if (error) {
    console.error('Error adding prospect:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/outreach');
  return { success: true };
}

// ── Bulk Add Prospects (CSV import) ──
export async function bulkAddProspects(prospects: Array<{
  name: string;
  instagram_handle?: string;
  email?: string;
  website?: string;
  phone?: string;
  clinic_name?: string;
  city: string;
  state: string;
}>) {
  await requireAdmin();
  const supabase = createAdminClient();

  const rows = prospects.map(p => ({
    name: p.name,
    instagram_handle: p.instagram_handle || null,
    email: p.email || null,
    website: p.website || null,
    phone: p.phone || null,
    clinic_name: p.clinic_name || null,
    city: p.city,
    state: p.state,
    status: 'new' as const,
    source: 'csv_import',
  }));

  const { error, data } = await supabase.from('outreach_prospects').insert(rows).select();

  if (error) {
    console.error('Bulk import error:', error);
    return { success: false, error: error.message, count: 0 };
  }

  revalidatePath('/admin/outreach');
  return { success: true, count: data?.length || 0 };
}

// ── Update Prospect Status ──
export async function updateProspectStatus(id: string, status: ProspectStatus, notes?: string, scriptUsed?: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (notes !== undefined) updates.notes = notes;
  if (scriptUsed) updates.script_used = scriptUsed;

  // Set timestamps based on status
  if (status === 'contacted') {
    updates.contacted_at = new Date().toISOString();
    // Set follow-up for 5 days from now
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 5);
    updates.follow_up_at = followUp.toISOString();
    updates.follow_up_count = 1;
  } else if (status === 'followed_up') {
    const { data: current } = await supabase.from('outreach_prospects').select('follow_up_count').eq('id', id).single();
    const count = ((current as any)?.follow_up_count || 1) + 1;
    updates.follow_up_count = count;
    if (count >= 3) {
      // After 3 follow-ups, auto-move to not_interested
      updates.status = 'not_interested';
      updates.follow_up_at = null;
    } else {
      const followUp = new Date();
      followUp.setDate(followUp.getDate() + 5);
      updates.follow_up_at = followUp.toISOString();
    }
  } else if (status === 'responded') {
    updates.responded_at = new Date().toISOString();
    updates.follow_up_at = null;
  } else if (status === 'signed_up') {
    updates.signed_up_at = new Date().toISOString();
    updates.follow_up_at = null;
  } else if (status === 'not_interested') {
    updates.follow_up_at = null;
  }

  const { error } = await supabase
    .from('outreach_prospects')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating prospect:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/outreach');
  return { success: true };
}

// ── Update Prospect Details ──
export async function updateProspect(id: string, data: Partial<Prospect>) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('outreach_prospects')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/outreach');
  return { success: true };
}

// ── Delete Prospect ──
export async function deleteProspect(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from('outreach_prospects').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/outreach');
  return { success: true };
}

// ── DM Scripts ──
export async function getDMScripts() {
  return [
    {
      id: 'cold_open',
      name: 'Cold Open',
      category: 'first_contact',
      description: 'Warm introduction — works best for first DM',
      template: `Hey {name} — I came across your page and love what you're doing in {city}. I built a platform called NeuroChiro that's basically the global directory for nervous system chiropractors. We're growing the network in {state} right now and I think your practice would be a great fit. Would you be open to checking it out? No pressure at all. Here's the link: neurochiro.co`,
    },
    {
      id: 'value_lead',
      name: 'Value Lead',
      category: 'first_contact',
      description: 'Lead with what they get — higher conversion for skeptical docs',
      template: `Hey {name} — quick question. Are you showing up when patients in {city} search for a nervous system chiropractor online? I built neurochiro.co — it's a directory specifically for docs like you. You get a full profile page, patient leads, messaging, analytics, and a community of docs who practice the same way. We're building out {state} right now. Want me to send you more info?`,
    },
    {
      id: 'social_proof',
      name: 'Social Proof',
      category: 'first_contact',
      description: 'Use your numbers to build credibility',
      template: `Hey {name} — I don't usually cold DM but I'm building something I think you'd genuinely benefit from. NeuroChiro is a platform with doctors listed across multiple states. Patients use it to find nervous system chiropractors near them. We're expanding in {state} and your practice would be a solid addition. Takes 5 min to set up. Want the link?`,
    },
    {
      id: 'follow_up_1',
      name: 'Follow-Up #1',
      category: 'follow_up',
      description: 'Gentle nudge after 5 days of no response',
      template: `Hey {name} — just circling back on this. No pressure at all — just didn't want you to miss it if it got buried. Let me know if you have any questions about NeuroChiro. Happy to walk you through it.`,
    },
    {
      id: 'follow_up_2',
      name: 'Follow-Up #2',
      category: 'follow_up',
      description: 'Final follow-up — respectful close',
      template: `Hey {name} — last one from me! If the timing isn't right, totally understand. If you ever want to check it out, neurochiro.co is always there. Wishing you the best with your practice in {city}.`,
    },
    {
      id: 'responded_interested',
      name: 'They\'re Interested',
      category: 'response',
      description: 'They responded positively — give them the full pitch',
      template: `That's awesome — glad it resonated. Here's the quick version: you set up your profile (bio, photo, specialties, location), and patients in your area can find you through the directory. You also get messaging, analytics on your profile views, and access to tools like the care plan builder and KPI tracker. Here's the link to get started: neurochiro.co. Takes about 5 minutes. Let me know if you have any questions — happy to help you get set up.`,
    },
    {
      id: 'signed_up',
      name: 'Welcome Message',
      category: 'response',
      description: 'Send after they create their account',
      template: `Welcome to NeuroChiro! Glad to have you in the network. Quick tip — make sure you complete your profile (photo + bio makes a huge difference for patient clicks). If you need help with anything, just message me anytime. We're building something special here and you're now part of it.`,
    },
    {
      id: 'objection_cost',
      name: 'Objection: Cost',
      category: 'objection',
      description: 'When they ask about pricing',
      template: `Great question. The membership is {price}/month and includes your full directory listing, patient leads, messaging, analytics, and all the practice tools. Most docs spend way more than that on Google ads that don't even target the right patients. This is purpose-built for nervous system chiropractors. And you can cancel anytime. Want to try it out?`,
    },
    {
      id: 'objection_time',
      name: 'Objection: No Time',
      category: 'objection',
      description: 'When they say they\'re too busy',
      template: `Totally get it — you're running a practice. The setup literally takes 5 minutes. Add your name, photo, city, and a quick bio. That's it. Once it's live, patients find YOU — you don't have to do anything else. It works while you work. Want me to send the link and you can do it between patients?`,
    },
  ];
}

// ── Get States List ──
export async function getProspectStates() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('outreach_prospects')
    .select('state')
    .order('state');

  const states = [...new Set((data || []).map((d: any) => d.state).filter(Boolean))];
  return states as string[];
}
