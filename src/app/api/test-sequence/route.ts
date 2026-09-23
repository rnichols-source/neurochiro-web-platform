import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

/**
 * TEST TOOL — Fast-forward subscriber timestamps for testing the welcome sequence.
 *
 * Guards:
 *   1. ALLOW_TEST_ENDPOINTS env var must be explicitly "true" (off by default in prod)
 *   2. Email must be in the hardcoded allowlist
 *   3. CRON_SECRET auth header required
 */

const EMAIL_ALLOWLIST = new Set([
  'rnichols@alignlife.com',
  'nichr114@gmail.com',
]);

export async function POST(req: NextRequest) {
  // Guard 1: env flag must be explicitly enabled
  if (process.env.ALLOW_TEST_ENDPOINTS !== 'true') {
    return NextResponse.json({ error: 'Test endpoints are disabled' }, { status: 403 });
  }

  // Guard 2: auth
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { email, action, days } = body;

  if (!email || !action) {
    return NextResponse.json({ error: 'email and action are required' }, { status: 400 });
  }

  // Guard 3: email allowlist
  if (!EMAIL_ALLOWLIST.has(email.toLowerCase())) {
    return NextResponse.json({ error: 'Email not in test allowlist' }, { status: 403 });
  }

  const supabase = createAdminClient();

  if (action === 'enroll') {
    // Create a confirmed test subscriber
    const { data: existing } = await (supabase as any)
      .from('subscribers')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      // Update to confirmed
      await (supabase as any)
        .from('subscribers')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          unsubscribed_at: null,
          token_hash: null,
          token_expires_at: null,
        })
        .eq('id', existing.id);

      return NextResponse.json({ ok: true, message: 'Existing subscriber re-enrolled and confirmed', id: existing.id });
    }

    const { data: newSub, error } = await (supabase as any)
      .from('subscribers')
      .insert({
        email: email.toLowerCase(),
        zip: '00000',
        state: null,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        source: 'test',
        ip: '127.0.0.1',
        user_agent: 'test-sequence',
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Test subscriber enrolled and confirmed', id: newSub.id });
  }

  if (action === 'fast_forward') {
    const daysBack = days || 3;

    const { data: sub } = await (supabase as any)
      .from('subscribers')
      .select('id, confirmed_at')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!sub) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    const newConfirmedAt = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    await (supabase as any)
      .from('subscribers')
      .update({ confirmed_at: newConfirmedAt })
      .eq('id', sub.id);

    return NextResponse.json({
      ok: true,
      message: `Moved confirmed_at back ${daysBack} days`,
      confirmed_at: newConfirmedAt,
    });
  }

  if (action === 'reset') {
    const { data: sub } = await (supabase as any)
      .from('subscribers')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!sub) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    const { error: deleteError } = await (supabase as any)
      .from('sequence_state')
      .delete()
      .eq('subscriber_id', sub.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'All sequence_state rows deleted for this subscriber' });
  }

  return NextResponse.json({ error: 'Unknown action. Use: enroll, fast_forward, reset' }, { status: 400 });
}
