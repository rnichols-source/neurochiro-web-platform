'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function getReferralNetwork() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get all referrals sent and received
  const [sentRes, receivedRes] = await Promise.all([
    supabase.from('referrals').select('recipient_id, patient_name, status, created_at').eq('referrer_id', user.id),
    supabase.from('referrals').select('referrer_id, patient_name, status, created_at').eq('recipient_id', user.id),
  ]);

  const sent = sentRes.data || [];
  const received = receivedRes.data || [];

  // Aggregate by doctor
  const networkMap = new Map<string, { doctorId: string; sent: number; received: number }>();

  for (const r of sent) {
    const existing = networkMap.get(r.recipient_id) || { doctorId: r.recipient_id, sent: 0, received: 0 };
    existing.sent++;
    networkMap.set(r.recipient_id, existing);
  }

  for (const r of received) {
    const existing = networkMap.get(r.referrer_id) || { doctorId: r.referrer_id, sent: 0, received: 0 };
    existing.received++;
    networkMap.set(r.referrer_id, existing);
  }

  // Get doctor details for all connected doctors
  const doctorIds = [...networkMap.keys()];
  if (doctorIds.length === 0) return { network: [], stats: { totalSent: sent.length, totalReceived: received.length, uniquePartners: 0, topPartner: null, thisMonth: 0 } };

  const { data: doctors } = await createAdminClient()
    .from('doctors')
    .select('user_id, first_name, last_name, clinic_name, city, state, photo_url, slug')
    .in('user_id', doctorIds);

  const doctorMap: Map<string, any> = new Map((doctors || []).filter(d => d.user_id).map(d => [d.user_id as string, d]));

  const network = Array.from(networkMap.values()).map(n => {
    const doc = doctorMap.get(n.doctorId);
    return {
      ...n,
      name: doc ? `Dr. ${doc.first_name} ${doc.last_name}` : 'Unknown Doctor',
      clinicName: doc?.clinic_name || '',
      city: doc?.city || '',
      state: doc?.state || '',
      photoUrl: doc?.photo_url || null,
      slug: doc?.slug || null,
      total: n.sent + n.received,
    };
  }).sort((a, b) => b.total - a.total);

  // Stats
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const thisMonth = [...sent, ...received].filter(r => new Date(r.created_at) > thirtyDaysAgo).length;
  const topPartner = network.length > 0 ? network[0] : null;

  return {
    network,
    stats: {
      totalSent: sent.length,
      totalReceived: received.length,
      uniquePartners: network.length,
      topPartner: topPartner ? { name: topPartner.name, count: topPartner.total } : null,
      thisMonth,
    },
  };
}
