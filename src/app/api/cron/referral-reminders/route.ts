import { NextResponse } from 'next/server';
import { runReferralReminders } from '@/lib/referrals/data';

export const maxDuration = 120;

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (process.env.REFERRAL_CRON_DRY_RUN === 'true') {
    return NextResponse.json({ success: true, dryRun: true });
  }
  const result = await runReferralReminders();
  return NextResponse.json({ success: true, ...result });
}
