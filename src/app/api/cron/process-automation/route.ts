import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { executeAutomation } from '@/lib/automations';

export const maxDuration = 60; // Allow function to run up to 60 seconds (for Pro plan)

export async function GET(req: Request) {
  // 1. Verify Authorization (Optional, usually via Vercel Cron Secret)
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  
  try {
    // 2. Fetch pending items from the queue that are scheduled for now or earlier
    const { data: queueItems, error } = await (supabase as any)
      .from('automation_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;

    if (!queueItems || queueItems.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No pending items' });
    }

    // 3. Mark them as processing immediately to prevent race conditions
    const itemIds = queueItems.map((item: any) => item.id);
    await (supabase as any)
      .from('automation_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .in('id', itemIds);

    // 4. Process all items (in parallel with Promise.allSettled)
    const processingPromises = queueItems.map((item: any) => 
      executeAutomation(item.id, item.event_type, item.payload)
    );

    const results = await Promise.allSettled(processingPromises);

    // Any that rejected at the promise level (should be rare since executeAutomation catches errors internally)
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        const item = queueItems[i];
        await (supabase as any)
          .from('automation_queue')
          .update({ 
            status: 'failed', 
            last_error: result.reason?.message || 'Unknown Promise Rejection',
            updated_at: new Date().toISOString() 
          })
          .eq('id', item.id);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: queueItems.length 
    });

  } catch (error: any) {
    console.error('Queue Processing Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
