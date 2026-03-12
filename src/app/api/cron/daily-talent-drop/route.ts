import { NextResponse } from 'next/server';
import { Automations } from '@/lib/automations';

export const maxDuration = 300; // 5 minutes for large batches of SMS/Notifications

/**
 * TRIGGER: Every Tuesday Morning (via Vercel Cron)
 * Goal: Move time-delay from "whenever they remember" to "Instant" by pushing
 * the top 3 matches directly to Growth Tier Doctors' phones.
 */
export async function GET(req: Request) {
  // 1. Verify Authorization (Vercel Cron Secret)
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Trigger the "Grand Slam" Automation
    await Automations.triggerDailyTalentDrop();

    return NextResponse.json({ 
      success: true, 
      message: 'Daily Talent Drop enqueued for processing.' 
    });

  } catch (error: any) {
    console.error('Daily Talent Drop Trigger Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
