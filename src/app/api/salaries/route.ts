import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const revalidate = 1800; // 30 min cache

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = request.nextUrl;
    const state = searchParams.get('state');
    const roleType = searchParams.get('role_type');
    const employmentType = searchParams.get('employment_type');

    // Query job postings with salary data
    let query = supabase
      .from('job_postings')
      .select('salary_min, salary_max, type, category, employment_type, city, state, doctor_id')
      .not('salary_min', 'is', null)
      .in('status', ['Active', 'open']);

    if (state) query = query.eq('state', state);
    if (roleType) query = query.eq('type', roleType);
    if (employmentType) query = query.eq('employment_type', employmentType);

    const { data: jobs } = await query;
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ data: [], summary: null });
    }

    // Calculate statistics
    const salaries = jobs
      .map(j => {
        const min = j.salary_min || 0;
        const max = j.salary_max || min;
        return Math.round((min + max) / 2); // midpoint
      })
      .filter(s => s > 0)
      .sort((a, b) => a - b);

    if (salaries.length === 0) {
      return NextResponse.json({ data: [], summary: null });
    }

    const sum = salaries.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / salaries.length);
    const median = salaries[Math.floor(salaries.length / 2)];
    const p25 = salaries[Math.floor(salaries.length * 0.25)];
    const p75 = salaries[Math.floor(salaries.length * 0.75)];

    // Group by state
    const byState: Record<string, number[]> = {};
    for (const j of jobs) {
      const s = j.state || 'Unknown';
      const mid = Math.round(((j.salary_min || 0) + (j.salary_max || j.salary_min || 0)) / 2);
      if (mid > 0) {
        if (!byState[s]) byState[s] = [];
        byState[s].push(mid);
      }
    }

    const stateData = Object.entries(byState).map(([s, vals]) => ({
      state: s,
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      count: vals.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
    })).sort((a, b) => b.avg - a.avg);

    // Group by role type
    const byRole: Record<string, number[]> = {};
    for (const j of jobs) {
      const role = j.type || j.category || 'Other';
      const mid = Math.round(((j.salary_min || 0) + (j.salary_max || j.salary_min || 0)) / 2);
      if (mid > 0) {
        if (!byRole[role]) byRole[role] = [];
        byRole[role].push(mid);
      }
    }

    const roleData = Object.entries(byRole).map(([role, vals]) => ({
      role,
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      count: vals.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
    })).sort((a, b) => b.avg - a.avg);

    return NextResponse.json({
      summary: {
        avg,
        median,
        min: salaries[0],
        max: salaries[salaries.length - 1],
        percentile25: p25,
        percentile75: p75,
        count: salaries.length,
      },
      byState: stateData,
      byRole: roleData,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' }
    });
  } catch {
    return NextResponse.json({ data: [], summary: null }, { status: 500 });
  }
}
