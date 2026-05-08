'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function getVendorReviews(vendorId: string) {
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from('vendor_reviews')
    .select('id, rating, review_text, created_at, doctor_user_id')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];

  // Get doctor names for reviews
  const userIds = data.map((r: any) => r.doctor_user_id);
  const { data: doctors } = await supabase
    .from('doctors')
    .select('user_id, first_name, last_name, clinic_name, city, state, photo_url')
    .in('user_id', userIds);

  const doctorMap: Map<string, any> = new Map((doctors || []).map((d: any) => [d.user_id, d]));

  return data.map((r: any) => {
    const doc = doctorMap.get(r.doctor_user_id);
    return {
      id: r.id,
      rating: r.rating,
      reviewText: r.review_text,
      createdAt: r.created_at,
      doctor: doc ? {
        name: `Dr. ${doc.first_name} ${doc.last_name}`,
        clinic: doc.clinic_name,
        location: [doc.city, doc.state].filter(Boolean).join(', '),
        photoUrl: doc.photo_url,
      } : null,
    };
  });
}

export async function submitReview(vendorId: string, rating: number, reviewText: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify user is a doctor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'doctor') {
    return { error: 'Only verified doctors can leave reviews' };
  }

  const admin = createAdminClient() as any;
  const { error } = await admin
    .from('vendor_reviews')
    .upsert({
      vendor_id: vendorId,
      doctor_user_id: user.id,
      rating,
      review_text: reviewText.slice(0, 1000),
    }, { onConflict: 'vendor_id,doctor_user_id' });

  if (error) return { error: error.message };
  return { success: true };
}

export async function getVendorUsage(vendorId: string) {
  const supabase = createAdminClient() as any;

  const { count } = await supabase
    .from('vendor_usage')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId);

  const { data: doctors } = await supabase
    .from('vendor_usage')
    .select('doctor_user_id')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(5);

  let doctorPreviews: any[] = [];
  if (doctors && doctors.length > 0) {
    const ids = doctors.map((d: any) => d.doctor_user_id);
    const { data } = await supabase
      .from('doctors')
      .select('user_id, first_name, last_name, photo_url')
      .in('user_id', ids);
    doctorPreviews = (data || []).map((d: any) => ({
      name: `Dr. ${d.first_name} ${d.last_name}`,
      photoUrl: d.photo_url,
    }));
  }

  return { count: count || 0, doctors: doctorPreviews };
}

export async function toggleVendorUsage(vendorId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const admin = createAdminClient() as any;

  // Check if already marked
  const { data: existing } = await admin
    .from('vendor_usage')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('doctor_user_id', user.id)
    .single();

  if (existing) {
    await admin.from('vendor_usage').delete().eq('id', existing.id);
    return { success: true, added: false };
  } else {
    await admin.from('vendor_usage').insert({ vendor_id: vendorId, doctor_user_id: user.id });
    return { success: true, added: true };
  }
}
