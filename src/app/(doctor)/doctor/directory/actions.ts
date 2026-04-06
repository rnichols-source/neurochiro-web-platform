"use server";

import { createServerSupabase } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { Automations } from '@/lib/automations';

interface DoctorLocation { latitude: number; longitude: number; }

/**
 * 1. Referral Stats
 */
export async function getReferralStats() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { activePartners: 0, referralsSent: 0, referralsReceived: 0 };

  const [partnersRes, sentRes, receivedRes] = await Promise.all([
    supabase.from('doctor_connections').select('id', { count: 'exact' }).eq('status', 'active').or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`),
    supabase.from('referrals').select('id', { count: 'exact' }).eq('sender_id', user.id),
    supabase.from('referrals').select('id', { count: 'exact' }).eq('receiver_id', user.id)
  ]);

  return {
    activePartners: partnersRes.count || 0,
    referralsSent: sentRes.count || 0,
    referralsReceived: receivedRes.count || 0
  };
}

/**
 * 2. Reciprocity Loop Logic
 */
export async function getReciprocityLoop() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get current user's location from profiles
  const { data: doctor } = await supabase
    .from('profiles')
    .select('latitude, longitude')
    .eq('id', user.id)
    .single();

  // Type guard to satisfy the compiler
  if (!doctor || (doctor as any).latitude === undefined || (doctor as any).longitude === undefined) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_reciprocity_candidates', {
    p_user_id: user.id,
    p_lat: (doctor as any).latitude,
    p_lng: (doctor as any).longitude,
    p_radius_miles: 50.0
  });

  if (error) {
    console.error("Error fetching reciprocity candidates:", error);
    return [];
  }

  return data || [];
}

/**
 * 3. Referral Directory Fetch
 */
export async function getReferralDirectory(filters: { search?: string, specialty?: string } = {}) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('doctors')
    .select(`
      *,
      profile:profiles(avatar_url)
    `)
    .eq('verification_status', 'verified')
    .neq('user_id', user.id);

  if (filters.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,clinic_name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
  }

  if (filters.specialty && filters.specialty !== 'All Specialties') {
    query = query.contains('specialties', [filters.specialty]);
  }

  const { data: doctors, error } = await query.order('rating', { ascending: false });

  if (error) return [];

  // Fetch connections to mark partners
  const { data: connections } = await supabase
    .from('doctor_connections')
    .select('requester_id, receiver_id, status')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const partnerIds = new Set(
    (connections || [])
      .filter((c: any) => c.status === 'active')
      .map((c: any) => c.requester_id === user.id ? c.receiver_id : c.requester_id)
  );

  const pendingIds = new Set(
    (connections || [])
      .filter((c: any) => c.status === 'pending')
      .map((c: any) => c.requester_id === user.id ? c.receiver_id : c.requester_id)
  );

  return (doctors || []).map((d: any) => ({
    ...d,
    isPartner: partnerIds.has(d.user_id),
    isPending: pendingIds.has(d.user_id)
  }));
}

/**
 * 4. Actions
 */
export async function requestConnection(targetUserId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('doctor_connections')
    .insert({
      requester_id: user.id,
      receiver_id: targetUserId,
      status: 'pending'
    });

  if (error) throw error;

  revalidatePath('/doctor/directory');
  return { success: true };
}

export async function sendExternalInvite(email: string, message: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // In a real system, we'd use Resend here via our Automations
  try {
    console.log(`Inviting ${email} on behalf of ${user.id}: ${message}`);
    // await Automations.onExternalDoctorInvite(email, user.id, message);
    return { success: true };
  } catch (e) {
    return { error: "Failed to send invite" };
  }
}
