'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import type { MatchCycle, MatchPositionWithDoctor } from '@/types/chiromatch'

export async function getActiveCycleForStudent(): Promise<MatchCycle | null> {
  const sb = createServerSupabase() as any;
  const { data } = await sb
    .from('match_cycles')
    .select('*')
    .in('status', ['upcoming', 'ranking_open', 'ranking_closed', 'matched'])
    .order('match_day', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getAvailablePositions(cycleId: string): Promise<MatchPositionWithDoctor[]> {
  const admin = createAdminClient() as any;
  const { data: positions } = await admin
    .from('match_positions')
    .select('*')
    .eq('cycle_id', cycleId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (!positions || positions.length === 0) return [];

  // Get doctor info for each position
  const doctorIds = [...new Set(positions.map((p: any) => p.doctor_id))] as string[];
  const supabase = createAdminClient();
  const { data: doctors } = await supabase
    .from('doctors')
    .select('user_id, clinic_name, first_name, last_name, city, state, specialties, photo_url')
    .in('user_id', doctorIds);

  const doctorMap = new Map((doctors || []).map(d => [d.user_id, d]));

  return positions.map((p: any) => {
    const doc = doctorMap.get(p.doctor_id);
    return {
      ...p,
      doctor: doc ? {
        clinic_name: doc.clinic_name,
        first_name: doc.first_name,
        last_name: doc.last_name,
        city: doc.city,
        state: doc.state,
        specialties: doc.specialties || [],
        photo_url: doc.photo_url,
      } : { clinic_name: 'Unknown', first_name: '', last_name: '', city: '', state: '', specialties: [], photo_url: null },
    };
  });
}

export async function getPositionDetail(positionId: string): Promise<MatchPositionWithDoctor | null> {
  const admin = createAdminClient() as any;
  const { data: position } = await admin
    .from('match_positions')
    .select('*')
    .eq('id', positionId)
    .single();

  if (!position) return null;

  const supabase = createAdminClient();
  const { data: doc } = await supabase
    .from('doctors')
    .select('user_id, clinic_name, first_name, last_name, city, state, specialties, photo_url')
    .eq('user_id', position.doctor_id)
    .single();

  return {
    ...position,
    doctor: doc ? {
      clinic_name: doc.clinic_name,
      first_name: doc.first_name,
      last_name: doc.last_name,
      city: doc.city,
      state: doc.state,
      specialties: doc.specialties || [],
      photo_url: doc.photo_url,
    } : { clinic_name: 'Unknown', first_name: '', last_name: '', city: '', state: '', specialties: [], photo_url: null },
  };
}

export async function getMyRankings(cycleId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient() as any;
  const { data } = await admin
    .from('match_student_rankings')
    .select('*')
    .eq('cycle_id', cycleId)
    .eq('student_id', user.id)
    .order('rank', { ascending: true });

  if (!data || data.length === 0) return [];

  // Get position details
  const posIds = data.map((r: any) => r.position_id);
  const positions = await getAvailablePositions(cycleId);
  const posMap = new Map(positions.map(p => [p.id, p]));

  return data.map((r: any) => ({
    ...r,
    position: posMap.get(r.position_id) || null,
  }));
}

export async function saveRankings(cycleId: string, rankings: { position_id: string; rank: number }[]) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify cycle is open for ranking
  const sb = supabase as any;
  const { data: cycle } = await sb
    .from('match_cycles')
    .select('status')
    .eq('id', cycleId)
    .single();

  if (!cycle || cycle.status !== 'ranking_open') {
    return { error: 'Rankings are not currently open for this cycle' };
  }

  const admin = createAdminClient() as any;

  // Delete existing rankings
  await admin.from('match_student_rankings').delete().eq('cycle_id', cycleId).eq('student_id', user.id);

  // Insert new rankings
  if (rankings.length > 0) {
    const { error } = await admin.from('match_student_rankings').insert(
      rankings.map(r => ({
        cycle_id: cycleId,
        student_id: user.id,
        position_id: r.position_id,
        rank: r.rank,
      }))
    );
    if (error) return { error: error.message };
  }

  return { success: true };
}

export async function getMyMatchResult(cycleId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient() as any;
  const { data } = await admin
    .from('match_results')
    .select('*')
    .eq('cycle_id', cycleId)
    .eq('student_id', user.id)
    .maybeSingle();

  if (!data) return null;

  // If matched, get position details
  if (data.status === 'matched' && data.position_id) {
    const position = await getPositionDetail(data.position_id);
    return { ...data, position };
  }

  return data;
}
