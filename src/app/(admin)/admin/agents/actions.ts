'use server'

import { createAdminClient } from '@/lib/supabase-admin'

async function requireAdmin() {
  const { createServerSupabase } = await import('@/lib/supabase-server');
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as any)?.role;
  if (!['admin', 'super_admin', 'founder'].includes(role)) throw new Error('Unauthorized');
  return user;
}

const AGENT_EVENT_MAP: Record<string, string> = {
  'weekly-digest': 'Weekly Digest',
  'follow-up-bot': 'Follow-Up Bot',
  'profile-nudger': 'profile_nudge',
  'onboarding-sequence': 'onboarding_email',
  'upgrade-nudger': 'Upgrade Nudger',
  'outreach-sender': 'Outreach Sender',
  'analytics-compiler': 'Analytics Compiler',
  'database-cleaner': 'Database Cleaner',
  'churn-preventer': 'Churn Preventer',
  'spotlight-promoter': 'Spotlight Promoter',
  'student-opportunity': 'Student Opportunity',
  'chiro-finder': 'Chiro Finder',
  'daily-talent-drop': 'Daily Talent Drop',
  'profile-reminders': 'Profile Reminder',
};

export async function getAgentStatus() {
  await requireAdmin();
  const supabase = createAdminClient();

  const results: Record<string, any> = {};

  // Check audit_logs for last run of each agent
  for (const [agentId, eventName] of Object.entries(AGENT_EVENT_MAP)) {
    const { data: lastLog } = await supabase
      .from('audit_logs')
      .select('*')
      .ilike('event', `%${eventName}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastLog) {
      results[agentId] = {
        lastRun: lastLog.created_at,
        lastResult: lastLog,
      };
    }

    // Also check automation_queue for nudger and onboarding
    if (agentId === 'profile-nudger' || agentId === 'onboarding-sequence') {
      const { data: lastQueue } = await supabase
        .from('automation_queue')
        .select('*')
        .eq('event_type', eventName)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastQueue && (!results[agentId] || new Date(lastQueue.created_at) > new Date(results[agentId].lastRun))) {
        results[agentId] = {
          lastRun: lastQueue.created_at,
          lastResult: {
            status: lastQueue.status,
            event: `Last ${eventName}: ${lastQueue.status}`,
            metadata: lastQueue.payload,
          },
        };
      }
    }
  }

  return results;
}

export async function triggerAgent(agentId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  await requireAdmin();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co';
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return { success: false, error: 'CRON_SECRET not configured' };
  }

  const endpoint = `${baseUrl}/api/cron/${agentId}`;

  try {
    const res = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${cronSecret}` },
    });

    const data = await res.json();

    if (data.success) {
      return { success: true, message: data.message || `${agentId} ran successfully` };
    } else {
      return { success: false, error: data.error || 'Unknown error' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to trigger agent' };
  }
}
