import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { executeAutomation } from '@/lib/automations';

export const maxDuration = 60;

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

  const supabase = getSupabase();
  
  try {
    // 2. Fetch pending items from the queue that are scheduled for now or earlier
    //    Also process 'scheduled' items whose scheduled_for time has passed
    const now = new Date().toISOString();
    const { data: queueItems, error } = await supabase
      .from('automation_queue')
      .select('*')
      .in('status', ['pending', 'scheduled'])
      .lte('created_at', now)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;

    if (!queueItems || queueItems.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No pending items' });
    }

    // Filter out scheduled items that haven't reached their scheduled time yet
    const readyItems = queueItems.filter((item: any) => {
      if (item.status === 'scheduled' && item.payload?.scheduled_for) {
        return new Date(item.payload.scheduled_for) <= new Date();
      }
      return true; // pending items always process
    });

    if (readyItems.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No ready items' });
    }

    // 3. Mark them as processing immediately to prevent race conditions
    const itemIds = readyItems.map((item: any) => item.id);
    await supabase
      .from('automation_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .in('id', itemIds);

    // 4. Process all items (in parallel with Promise.allSettled)
    const processingPromises = readyItems.map((item: any) =>
      executeAutomation(item.id, item.event_type, item.payload)
    );

    const results = await Promise.allSettled(processingPromises);

    // Any that rejected at the promise level
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        const item = readyItems[i];
        await supabase
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
      processed: readyItems.length
    });

  } catch (error: any) {
    console.error('Queue Processing Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
