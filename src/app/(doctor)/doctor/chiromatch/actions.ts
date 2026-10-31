'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { deriveCycleStatus } from '@/lib/chiromatch-status'
import type { MatchCycle, MatchPosition } from '@/types/chiromatch'

function withDerivedStatus(cycle: MatchCycle, now: Date): MatchCycle | null {
  const derived = deriveCycleStatus(cycle, now);
  if (derived.finished) return null;
  const status: MatchCycle['status'] =
    derived.phase === 'open' ? 'ranking_open'
    : derived.phase === 'closed' ? 'ranking_closed'
    : 'upcoming';
  return { ...cycle, status };
}

export async function getActiveCycle(): Promise<MatchCycle | null> {
  const sb = createServerSupabase() as any;
  const { data } = await sb
    .from('match_cycles')
    .select('*')
    .order('ranking_opens_at', { ascending: true });
  const now = new Date();
  const cycles = ((data || []) as MatchCycle[])
    .map((cycle) => withDerivedStatus(cycle, now))
    .filter((cycle): cycle is MatchCycle => cycle != null);
  const open = cycles.find((cycle) => cycle.status === 'ranking_open');
  if (open) return open;
  const closed = cycles
    .filter((cycle) => cycle.status === 'ranking_closed')
    .sort((a, b) => new Date(a.match_day).getTime() - new Date(b.match_day).getTime());
  if (closed[0]) return closed[0];
  return cycles.find((cycle) => cycle.status === 'upcoming') || null;
}

export async function getMyMatchPositions(cycleId?: string): Promise<MatchPosition[]> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = (supabase as any).from('match_positions').select('*').eq('doctor_id', user.id).order('created_at', { ascending: false });
  if (cycleId) query = query.eq('cycle_id', cycleId);
  const { data } = await query;
  return data || [];
}

export async function createMatchPosition(input: {
  title: string; description: string; compensation_type: string;
  salary_min: number | null; salary_max: number | null;
  benefits: string; requirements: string;
  city: string; state: string; practice_type: string;
  mentorship_offered: boolean;
}) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const cycle = await getActiveCycle();
  if (!cycle || (cycle.status !== 'upcoming' && cycle.status !== 'ranking_open')) {
    return { error: 'No active match cycle accepting positions' };
  }

  const admin = createAdminClient() as any;
  const { error } = await admin.from('match_positions').insert({
    cycle_id: cycle.id,
    doctor_id: user.id,
    title: input.title,
    description: input.description || null,
    compensation_type: input.compensation_type || null,
    salary_min: input.salary_min || null,
    salary_max: input.salary_max || null,
    benefits: input.benefits ? input.benefits.split(',').map((b: string) => b.trim()).filter(Boolean) : [],
    requirements: input.requirements ? input.requirements.split(',').map((r: string) => r.trim()).filter(Boolean) : [],
    city: input.city || null,
    state: input.state || null,
    practice_type: input.practice_type || null,
    mentorship_offered: input.mentorship_offered,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function withdrawPosition(positionId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const admin = createAdminClient() as any;
  const { error } = await admin
    .from('match_positions')
    .update({ status: 'withdrawn' })
    .eq('id', positionId)
    .eq('doctor_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function getMyMatchResults(cycleId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient() as any;
  // Get positions I own for this cycle
  const { data: positions } = await admin
    .from('match_positions')
    .select('id')
    .eq('doctor_id', user.id)
    .eq('cycle_id', cycleId);

  if (!positions || positions.length === 0) return [];

  const posIds = positions.map((p: any) => p.id);
  const { data: results } = await admin
    .from('match_results')
    .select('*')
    .eq('cycle_id', cycleId)
    .in('position_id', posIds);

  return results || [];
}

export async function getCandidatesForPosition(positionId: string) {
  const admin = createAdminClient() as any;

  // Get students who ranked this position
  const { data: rankings } = await admin
    .from('match_student_rankings')
    .select('student_id, rank')
    .eq('position_id', positionId)
    .order('rank', { ascending: true });

  if (!rankings || rankings.length === 0) return [];

  const studentIds = rankings.map((r: any) => r.student_id);
  const { data: students } = await admin
    .from('students')
    .select('id, full_name, school, graduation_year, skills, resume_url')
    .in('id', studentIds);

  const studentMap: Map<string, any> = new Map((students || []).map((s: any) => [s.id, s]));

  // Get existing doctor rankings
  const { data: doctorRankings } = await admin
    .from('match_doctor_rankings')
    .select('student_id, rank, notes')
    .eq('position_id', positionId);

  const drMap: Map<string, any> = new Map((doctorRankings || []).map((r: any) => [r.student_id, r]));

  return rankings.map((r: any) => {
    const student = studentMap.get(r.student_id) || {};
    const dr = drMap.get(r.student_id);
    return {
      student_id: r.student_id,
      full_name: student.full_name || 'Unknown',
      school: student.school,
      graduation_year: student.graduation_year,
      skills: student.skills || [],
      resume_url: student.resume_url,
      student_rank: r.rank,
      doctor_rank: dr?.rank || null,
      notes: dr?.notes || null,
    };
  });
}

export async function saveDoctorRankings(positionId: string, rankings: { student_id: string; rank: number; notes?: string }[]) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const admin = createAdminClient() as any;

  // Get cycle_id from position
  const { data: position } = await admin
    .from('match_positions')
    .select('cycle_id')
    .eq('id', positionId)
    .single();

  if (!position) return { error: 'Position not found' };

  // Delete existing rankings for this position
  await admin.from('match_doctor_rankings').delete().eq('position_id', positionId);

  // Insert new rankings
  if (rankings.length > 0) {
    const { error } = await admin.from('match_doctor_rankings').insert(
      rankings.map(r => ({
        cycle_id: position.cycle_id,
        position_id: positionId,
        student_id: r.student_id,
        rank: r.rank,
        notes: r.notes || null,
      }))
    );
    if (error) return { error: error.message };
  }

  return { success: true };
}
