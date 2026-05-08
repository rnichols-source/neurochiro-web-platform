import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const sb = supabase as any;

    // Fetch all jobs with salary data from last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: jobs } = await supabase
      .from('job_postings')
      .select('salary_min, salary_max, type, category, employment_type, state')
      .not('salary_min', 'is', null)
      .gte('created_at', ninetyDaysAgo);

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ message: 'No salary data to aggregate' });
    }

    const now = new Date();
    const periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const periodEnd = now.toISOString().split('T')[0];

    // Group by role_type + state
    const groups: Record<string, { salaries: number[]; roleType: string; state: string }> = {};

    for (const job of jobs) {
      const roleType = job.type || job.category || 'Other';
      const state = job.state || 'NATIONAL';
      const key = `${roleType}__${state}`;
      const mid = Math.round(((job.salary_min || 0) + (job.salary_max || job.salary_min || 0)) / 2);

      if (mid > 0) {
        if (!groups[key]) groups[key] = { salaries: [], roleType, state };
        groups[key].salaries.push(mid);
      }

      // Also add to national aggregate
      const natKey = `${roleType}__NATIONAL`;
      if (!groups[natKey]) groups[natKey] = { salaries: [], roleType, state: 'NATIONAL' };
      groups[natKey].salaries.push(mid);
    }

    // Upsert into market_benchmarks
    let upserted = 0;
    for (const [, group] of Object.entries(groups)) {
      const sorted = group.salaries.sort((a, b) => a - b);
      const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
      const median = sorted[Math.floor(sorted.length / 2)];

      await sb.from('market_benchmarks').upsert({
        role_type: group.roleType,
        region_code: group.state === 'NATIONAL' ? 'DEFAULT' : group.state,
        state_code: group.state === 'NATIONAL' ? null : group.state,
        avg_salary_min: sorted[0],
        avg_salary_max: sorted[sorted.length - 1],
        median_salary: median,
        sample_size: sorted.length,
        period_start: periodStart,
        period_end: periodEnd,
        updated_at: now.toISOString(),
      }, {
        onConflict: 'role_type,region_code',
      });
      upserted++;
    }

    return NextResponse.json({ message: `Aggregated ${upserted} benchmark groups from ${jobs.length} jobs` });
  } catch (err) {
    console.error('Salary benchmark cron error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
