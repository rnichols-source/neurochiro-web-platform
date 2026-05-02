import { NextResponse } from 'next/server';
import { Automations } from '@/lib/automations';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300;

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await Automations.triggerDailyTalentDrop();

    const supabase = getSupabase();
    await supabase.from('audit_logs').insert({
      category: 'AUTOMATION',
      event: 'Daily Talent Drop: triggered successfully',
      user_name: 'System',
      target: 'verified_doctors',
      status: 'Success',
      severity: 'Low',
      metadata: {},
    });

    return NextResponse.json({ success: true, message: 'Daily Talent Drop triggered.' });
  } catch (error: any) {
    console.error('Daily Talent Drop Error:', error);

    try {
      const supabase = getSupabase();
      await supabase.from('audit_logs').insert({
        category: 'AUTOMATION',
        event: `Daily Talent Drop: FAILED — ${error.message}`,
        user_name: 'System',
        target: 'verified_doctors',
        status: 'Failed',
        severity: 'High',
        metadata: { error: error.message },
      });
    } catch {}

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
