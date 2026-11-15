import { NextRequest, NextResponse } from 'next/server';
import { sendOutcomePrompts } from '@/lib/match/prompts';

/** Daily. Asks both people how a 14-day-old match went. Skips if the tables are missing. */
export async function GET(req: NextRequest) {
  // DISABLED 2026-11-15 — unnecessary survey emails for old matches
  return NextResponse.json({ skipped: true, reason: 'Match outcomes disabled — too many emails' });

  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await sendOutcomePrompts();
  return NextResponse.json(result);
}
