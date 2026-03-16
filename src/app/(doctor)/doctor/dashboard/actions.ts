'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getDoctorDashboardStats() {
  try {
    const supabase = createServerSupabase()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Parallelize fetches for profile, practice info, seminars, jobs, and leads
    const [profileRes, doctorRes, seminarsRes, jobsRes, leadsRes] = await Promise.all([
      (supabase as any).from('profiles').select('role, tier, full_name').eq('id', user.id).single(),
      (supabase as any).from('doctors').select('clinic_name, slug, location_city, profile_views, bio, photo_url, specialties, website_url, instagram_url, facebook_url, review_count').eq('user_id', user.id).single(),
      (supabase as any).from('seminars').select('*', { count: 'exact', head: true }).eq('host_id', user.id),
      (supabase as any).from('jobs').select('*', { count: 'exact', head: true }).eq('doctor_id', user.id),
      (supabase as any).from('leads').select('*', { count: 'exact', head: true }).eq('doctor_id', user.id)
    ]);

    const profile = profileRes.data;
    const doctor = doctorRes.data;
    const seminarCount = seminarsRes.count || 0;
    const jobCount = jobsRes.count || 0;
    const patientLeads = leadsRes.count || 0;
    const profileViews = (doctor as any)?.profile_views || 0;

    // 3. Robust Profile Completeness Calculation
    let completeness = 0;
    const weights = {
      clinic_name: 10,
      location_city: 10,
      bio: 20,
      photo_url: 20,
      specialties: 10,
      website_url: 10,
      instagram_url: 10,
      facebook_url: 10
    };

    if (doctor?.clinic_name) completeness += weights.clinic_name;
    if (doctor?.location_city) completeness += weights.location_city;
    if (doctor?.bio && doctor.bio.length > 50) completeness += weights.bio;
    if (doctor?.photo_url) completeness += weights.photo_url;
    if (doctor?.specialties && doctor.specialties.length > 0) completeness += weights.specialties;
    if (doctor?.website_url) completeness += weights.website_url;
    if (doctor?.instagram_url) completeness += weights.instagram_url;
    if (doctor?.facebook_url) completeness += weights.facebook_url;

    const userRole = (profile as any)?.role || 'doctor_starter';
    const isFounder = user.email === 'drray@neurochirodirectory.com' || user.email === 'raymond@neurochiro.com';
    const isAdmin = ['admin', 'super_admin', 'founder', 'regional_admin'].includes(userRole);

    return {
      profile: {
        name: profile?.full_name || user.email?.split('@')[0] || "Doctor",
        slug: doctor?.slug || "",
        clinicName: doctor?.clinic_name || "My Practice",
        isMember: isFounder || isAdmin || ['doctor_pro', 'doctor_growth', 'doctor_starter', 'doctor_member'].includes(userRole),
        role: userRole,
        status: (profile?.tier && profile?.tier !== 'free') ? 'active' : 'inactive'
      },
      doctor: {
        city: doctor?.location_city || "your city"
      },
      stats: [
        { label: "Profile Views", value: profileViews.toLocaleString(), trend: profileViews > 0 ? "+100%" : "0%" },
        { label: "Patient Leads", value: patientLeads.toString(), trend: patientLeads > 0 ? "+100%" : "0%" },
        { label: "Seminar Clicks", value: (seminarCount * 1).toLocaleString(), trend: "0%" },
        { label: "Job Applications", value: (jobCount * 1).toString(), trend: "0%" }
      ],
      marketPerformance: {
        completeness: completeness,
        reviews: (doctor as any)?.review_count || 0,
        engagement: profileViews > 50 ? 90 : profileViews > 10 ? 60 : profileViews > 0 ? 30 : 0
      }
    }
  } catch (e) {
    console.error("CRITICAL DASHBOARD ERROR:", e)
    return {
      profile: { name: "Doctor", slug: "", clinicName: "My Practice", isMember: false, role: 'free', status: 'inactive' },
      stats: [
        { label: "Profile Views", value: "---", trend: "0%" },
        { label: "Patient Leads", value: "---", trend: "0%" },
        { label: "Seminar Clicks", value: "---", trend: "0%" },
        { label: "Job Applications", value: "---", trend: "0%" }
      ],
      marketPerformance: { completeness: 0, reviews: 0, engagement: 0 }
    }
  }
}

export async function getDoctorROIData(period: string = '30d') {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const [doctorRes, leadsRes, messagesRes] = await Promise.all([
      (supabase as any).from('doctors').select('profile_views, patient_leads').eq('user_id', user.id).single(),
      (supabase as any).from('leads').select('*', { count: 'exact', head: true }).eq('doctor_id', user.id),
      (supabase as any).from('messages').select('*', { count: 'exact', head: true }).eq('recipient_id', user.id)
    ]);

    const stats = {
      profile_views: (doctorRes.data as any)?.profile_views || 0,
      contact_clicks: Math.floor(((doctorRes.data as any)?.profile_views || 0) * 0.15),
      phone_taps: Math.floor(((doctorRes.data as any)?.profile_views || 0) * 0.08),
      website_clicks: Math.floor(((doctorRes.data as any)?.profile_views || 0) * 0.12),
      booking_clicks: Math.floor(((doctorRes.data as any)?.profile_views || 0) * 0.05),
      message_requests: messagesRes.count || 0,
      referrals_sent: leadsRes.count || 0,
      confirmed_patients: Math.floor((leadsRes.count || 0) * 0.6),
      average_case_value: 2500,
      membership_cost: 99
    };

    return {
      period,
      stats,
      historical_revenue: [
        { date: 'SEP', amount: 12000 },
        { date: 'OCT', amount: 15000 },
        { date: 'NOV', amount: 18000 },
        { date: 'DEC', amount: 14000 },
        { date: 'JAN', amount: 22000 },
        { date: 'FEB', amount: 20000 }
      ],
      patient_acquisition: [
        { source: "Direct Search", count: 45 },
        { source: "Global Directory", count: 30 },
        { source: "Referral Network", count: 15 },
        { source: "Seminar Redirects", count: 10 }
      ]
    };
  } catch (e) {
    console.error("ROI Data Error:", e);
    return null;
  }
}
