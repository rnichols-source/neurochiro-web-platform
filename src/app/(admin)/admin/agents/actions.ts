'use server'

import { createAdminClient } from '@/lib/supabase-admin'

async function requireAdmin() {
  const { createServerSupabase } = await import('@/lib/supabase-server');
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role?: string } | null)?.role;
  if (!role || !['admin', 'super_admin', 'founder'].includes(role)) throw new Error('Unauthorized');
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
  'lead-nurture': 'Lead Nurture',
  'vendor-outreach': 'Vendor Outreach',
  'seminar-host-outreach': 'Seminar Host Outreach',
  'chiro-finder': 'Chiro Finder',
  'daily-talent-drop': 'Daily Talent Drop',
  'profile-reminders': 'Profile Reminder',
};

type AgentSnapshot = {
  lastRun: string;
  lastResult: {
    status?: string | null;
    event?: string | null;
    metadata?: { sent?: number; archived?: number; recipients?: number } | null;
  };
};

function snapshotFromLog(log: {
  created_at: string;
  status?: string | null;
  event?: string | null;
  metadata?: unknown;
}): AgentSnapshot {
  const metadata = log.metadata && typeof log.metadata === 'object' && !Array.isArray(log.metadata)
    ? log.metadata as { sent?: number; archived?: number; recipients?: number }
    : null;
  return {
    lastRun: log.created_at,
    lastResult: { status: log.status ?? null, event: log.event ?? null, metadata },
  };
}

export async function getAgentStatus() {
  await requireAdmin();
  const supabase = createAdminClient();

  const results: Record<string, AgentSnapshot> = {};

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
      results[agentId] = snapshotFromLog(lastLog);
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

      const current = results[agentId];
      if (lastQueue && (!current || new Date(lastQueue.created_at) > new Date(current.lastRun))) {
        results[agentId] = snapshotFromLog({
          created_at: lastQueue.created_at,
          status: lastQueue.status,
          event: `Last ${eventName}: ${lastQueue.status}`,
          metadata: lastQueue.payload,
        });
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

    if (data.disabled) {
      return { success: true, message: 'Vendor outreach is disabled. Nothing was sent.' };
    }

    if (data.success) {
      return { success: true, message: data.message || `${agentId} ran successfully` };
    } else {
      return { success: false, error: data.error || 'Unknown error' };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to trigger agent';
    return { success: false, error: message };
  }
}
