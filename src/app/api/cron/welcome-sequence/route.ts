import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendWelcomeStep, WELCOME_STEPS } from '@/lib/welcome-sequence';

export const maxDuration = 300;

/**
 * WELCOME SEQUENCE CRON
 * Runs daily. Sends day-3 and day-7 emails to confirmed subscribers.
 * Day 0 is sent immediately on confirmation (in /api/confirm).
 *
 * Idempotent: sequence_state unique constraint prevents double sends.
 * Dry run: add ?dry_run=true to see who would receive what.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get('dry_run') === 'true';
  const supabase = createAdminClient();

  // Get all confirmed subscribers who are NOT unsubscribed
  const { data: subscribers, error } = await (supabase as any)
    .from('subscribers')
    .select('id, email, confirmed_at, status, unsubscribed_at')
    .eq('status', 'confirmed')
    .is('unsubscribed_at', null)
    .not('confirmed_at', 'is', null);

  if (error || !subscribers) {
    console.error('[WELCOME SEQUENCE] Failed to fetch subscribers:', error);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }

  // Get all existing sequence_state rows to filter efficiently
  const subscriberIds = subscribers.map((s: any) => s.id);
  const { data: existingSteps } = await (supabase as any)
    .from('sequence_state')
    .select('subscriber_id, step')
    .in('subscriber_id', subscriberIds.length > 0 ? subscriberIds : ['__none__']);

  const sentSet = new Set(
    (existingSteps || []).map((s: any) => `${s.subscriber_id}:${s.step}`)
  );

  const now = new Date();
  const results: Array<{
    email: string;
    step: number;
    action: string;
    error?: string;
  }> = [];

  // Steps to process in this cron (day 3 and day 7 only; day 0 fires on confirm)
  const cronSteps = WELCOME_STEPS.filter(s => s.dayOffset > 0);

  for (const subscriber of subscribers) {
    const confirmedAt = new Date(subscriber.confirmed_at);
    const daysSinceConfirm = (now.getTime() - confirmedAt.getTime()) / (1000 * 60 * 60 * 24);

    for (const step of cronSteps) {
      // Skip if not yet time for this step
      if (daysSinceConfirm < step.dayOffset) continue;

      // Skip if already sent
      const key = `${subscriber.id}:${step.step}`;
      if (sentSet.has(key)) continue;

      // Send (or dry run)
      const result = await sendWelcomeStep(
        supabase,
        subscriber.id,
        subscriber.email,
        step,
        dryRun
      );

      results.push({
        email: subscriber.email,
        step: step.step,
        action: dryRun ? 'would_send' : (result.sent ? 'sent' : 'skipped'),
        error: result.error,
      });
    }
  }

  const sent = results.filter(r => r.action === 'sent').length;
  const wouldSend = results.filter(r => r.action === 'would_send').length;
  const skipped = results.filter(r => r.action === 'skipped').length;

  return NextResponse.json({
    status: dryRun ? 'dry_run' : 'complete',
    processed: subscribers.length,
    sent,
    wouldSend,
    skipped,
    details: results,
  });
}
