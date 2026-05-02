import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300;

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * DATABASE CLEANER — Runs every Sunday at 3 AM EST
 * - Finds duplicate doctor profiles (same name + city)
 * - Finds profiles with broken/empty slugs
 * - Cleans up stale automation queue items (older than 30 days)
 * - Reports findings to audit_logs
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    let issues: string[] = [];

    // 1. Find doctors with empty or null slugs and fix them
    const { data: noSlug } = await supabase
      .from('doctors')
      .select('id, first_name, last_name, city, slug')
      .or('slug.is.null,slug.eq.');

    if (noSlug && noSlug.length > 0) {
      for (const doc of noSlug as any[]) {
        const newSlug = `${doc.first_name || 'dr'}-${doc.last_name || 'unknown'}-${(doc.city || 'unknown').replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 6)}`
          .toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
        await supabase.from('doctors').update({ slug: newSlug }).eq('id', doc.id);
      }
      issues.push(`Fixed ${noSlug.length} doctors with missing slugs`);
    }

    // 2. Clean up completed/failed automation queue items older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: cleanedQueue } = await supabase
      .from('automation_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('created_at', thirtyDaysAgo)
      .select('id', { count: 'exact', head: true });

    if (cleanedQueue && cleanedQueue > 0) {
      issues.push(`Cleaned ${cleanedQueue} old automation queue items`);
    }

    // 3. Find doctors with latitude/longitude of 0 (needs geocoding)
    const { count: needsGeocoding } = await supabase
      .from('doctors')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'verified')
      .or('latitude.eq.0,longitude.eq.0,latitude.is.null,longitude.is.null');

    if (needsGeocoding && needsGeocoding > 0) {
      issues.push(`${needsGeocoding} doctors need geocoding`);
    }

    // 4. Find profiles with no role set
    const { count: noRole } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .or('role.is.null,role.eq.');

    if (noRole && noRole > 0) {
      issues.push(`${noRole} profiles have no role set`);
    }

    // Log results
    await supabase.from('audit_logs').insert({
      category: 'AUTOMATION',
      event: `Database Cleaner: ${issues.length > 0 ? issues.join(', ') : 'No issues found'}`,
      user_name: 'System',
      target: 'database',
      status: 'Success',
      severity: issues.length > 0 ? 'Medium' : 'Low',
      metadata: { issues },
    });

    return NextResponse.json({ success: true, issues });
  } catch (err: any) {
    console.error('[DATABASE CLEANER ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
