import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const revalidate = 1800; // 30 min cache

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const sb = supabase as any;
    const { searchParams } = request.nextUrl;
    const state = searchParams.get('state');
    const roleType = searchParams.get('role_type');

    // Try live job postings first
    let query = supabase
      .from('job_postings')
      .select('salary_min, salary_max, type, category, employment_type, city, state')
      .not('salary_min', 'is', null)
      .in('status', ['Active', 'open']);

    if (state) query = query.eq('state', state);
    if (roleType) query = query.eq('type', roleType);

    const { data: jobs } = await query;

    // Also fetch market_benchmarks (seeded data)
    let benchQuery = sb.from('market_benchmarks')
      .select('role_type, region_code, state_code, avg_salary_min, avg_salary_max, median_salary, sample_size')
      .order('sample_size', { ascending: false });

    if (state) benchQuery = benchQuery.eq('state_code', state);
    if (roleType) benchQuery = benchQuery.eq('role_type', roleType);

    const { data: benchmarks } = await benchQuery;

    // Build state data from benchmarks
    const stateData = (benchmarks || [])
      .filter((b: any) => b.state_code)
      .map((b: any) => ({
        state: b.state_code,
        avg: Math.round(((b.avg_salary_min || 0) + (b.avg_salary_max || 0)) / 2),
        count: b.sample_size || 0,
        min: b.avg_salary_min || 0,
        max: b.avg_salary_max || 0,
      }))
      .sort((a: any, b: any) => b.avg - a.avg);

    // Build role data from benchmarks
    const roleData = (benchmarks || [])
      .filter((b: any) => b.region_code === 'DEFAULT')
      .map((b: any) => ({
        role: b.role_type,
        avg: Math.round(((b.avg_salary_min || 0) + (b.avg_salary_max || 0)) / 2),
        count: b.sample_size || 0,
        min: b.avg_salary_min || 0,
        max: b.avg_salary_max || 0,
      }))
      .sort((a: any, b: any) => b.avg - a.avg);

    // If we have live job data, enhance with it
    if (jobs && jobs.length > 0) {
      const salaries = jobs
        .map(j => Math.round(((j.salary_min || 0) + (j.salary_max || j.salary_min || 0)) / 2))
        .filter(s => s > 0)
        .sort((a, b) => a - b);

      if (salaries.length > 0) {
        const sum = salaries.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / salaries.length);
        const median = salaries[Math.floor(salaries.length / 2)];
        const p25 = salaries[Math.floor(salaries.length * 0.25)];
        const p75 = salaries[Math.floor(salaries.length * 0.75)];

        return NextResponse.json({
          summary: { avg, median, min: salaries[0], max: salaries[salaries.length - 1], percentile25: p25, percentile75: p75, count: salaries.length },
          byState: stateData,
          byRole: roleData,
        }, { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } });
      }
    }

    // Fallback: build summary from benchmarks
    const national = (benchmarks || []).filter((b: any) => b.region_code === 'DEFAULT');
    if (national.length > 0) {
      const allAvgs = national.map((b: any) => Math.round(((b.avg_salary_min || 0) + (b.avg_salary_max || 0)) / 2));
      const totalSamples = national.reduce((s: number, b: any) => s + (b.sample_size || 0), 0);
      const weightedAvg = Math.round(
        national.reduce((s: number, b: any) => s + ((b.avg_salary_min + b.avg_salary_max) / 2) * (b.sample_size || 1), 0) /
        Math.max(totalSamples, 1)
      );
      const medians = national.map((b: any) => b.median_salary || 0).filter((m: number) => m > 0);
      const medianOfMedians = medians.length > 0 ? medians.sort((a: number, b: number) => a - b)[Math.floor(medians.length / 2)] : weightedAvg;

      return NextResponse.json({
        summary: {
          avg: weightedAvg,
          median: medianOfMedians,
          min: Math.min(...national.map((b: any) => b.avg_salary_min || 999999)),
          max: Math.max(...national.map((b: any) => b.avg_salary_max || 0)),
          percentile25: Math.round(weightedAvg * 0.8),
          percentile75: Math.round(weightedAvg * 1.2),
          count: totalSamples,
        },
        byState: stateData,
        byRole: roleData,
      }, { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } });
    }

    return NextResponse.json({ summary: null, byState: [], byRole: [] });
  } catch {
    return NextResponse.json({ summary: null, byState: [], byRole: [] }, { status: 500 });
  }
}
