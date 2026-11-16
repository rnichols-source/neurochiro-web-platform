import { NextResponse } from 'next/server';
import { executeAutomation } from '@/lib/automations';
import { adminIsConfigured, createAdminClient } from '@/lib/supabase-admin';

export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!adminIsConfigured()) {
    return NextResponse.json({ error: 'Supabase environment is missing' }, { status: 500 });
  }

  const supabase = createAdminClient() as any;
  
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

    // Retired community drips: close them even if scheduled_for is still in the
    // future, so they cannot send and cannot fill this batch.
    const retiredDrips = new Set(['patient_education_1', 'patient_directory_reminder']);
    const retiredItems = queueItems.filter((item: any) => retiredDrips.has(item.event_type));
    const keptItems = queueItems.filter((item: any) => !retiredDrips.has(item.event_type));
    if (retiredItems.length > 0) {
      await supabase
        .from('automation_queue')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .in('id', retiredItems.map((item: any) => item.id));
    }

    // Filter out scheduled items that haven't reached their scheduled time yet
    const readyItems = keptItems.filter((item: any) => {
      if (item.status === 'scheduled' && item.payload?.scheduled_for) {
        return new Date(item.payload.scheduled_for) <= new Date();
      }
      return true; // pending items always process
    });

    if (readyItems.length === 0) {
      return NextResponse.json({ success: true, processed: 0, skipped: retiredItems.length, message: 'No ready items' });
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
      processed: readyItems.length,
      skipped: retiredItems.length,
    });

  } catch (error: any) {
    console.error('Queue Processing Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
