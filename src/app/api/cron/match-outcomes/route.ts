import { NextRequest, NextResponse } from 'next/server';
import { sendOutcomePrompts } from '@/lib/match/prompts';

/** Daily. Asks both people how a 14-day-old match went. Skips if the tables are missing. */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await sendOutcomePrompts();
  return NextResponse.json(result);
}
