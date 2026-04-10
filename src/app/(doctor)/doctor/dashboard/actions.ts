'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { isFounderRole } from '@/lib/founder'

export async function getDoctorDashboardStats() {
  try {
    const supabase = createServerSupabase()
    const { createAdminClient } = await import('@/lib/supabase-admin')
    const admin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // First get doctor table ID for leads/jobs queries
    const { data: doctorIdRow } = await admin.from('doctors').select('id').eq('user_id', user.id).single();
    const docId = doctorIdRow?.id || user.id;

    // Use admin client to bypass any RLS issues
    const [profileRes, doctorRes, seminarsRes, jobsRes, leadsRes] = await Promise.all([
      admin.from('profiles').select('role, tier, full_name').eq('id', user.id).single(),
      admin.from('doctors').select('clinic_name, slug, city, state, profile_views, bio, photo_url, specialties, website_url, instagram_url, facebook_url, review_count, membership_tier, verification_status').eq('user_id', user.id).single(),
      admin.from('seminars').select('*', { count: 'exact', head: true }).eq('host_id', user.id),
      admin.from('job_postings').select('*', { count: 'exact', head: true }).eq('doctor_id', docId),
      admin.from('leads').select('*', { count: 'exact', head: true }).eq('doctor_id', docId)
    ]);

    const profile = profileRes.data;
    const doctor = doctorRes.data;

    // Debug logging
    console.log('[DASHBOARD] doctorRes error:', doctorRes.error?.message);
    console.log('[DASHBOARD] doctor data:', doctor ? 'found' : 'null', 'profile_views:', (doctor as any)?.profile_views);

    const seminarCount = seminarsRes.count || 0;
    const jobCount = jobsRes.count || 0;
    const patientLeads = leadsRes.count || 0;
    const profileViews = (doctor as any)?.profile_views || 0;

    // 3. Profile Completeness Calculation (specific weights per item)
    const completenessItems = [
      { key: 'photo', label: 'Upload a profile photo', weight: 20, done: !!doctor?.photo_url },
      { key: 'bio', label: 'Write a bio (50+ characters)', weight: 20, done: !!(doctor?.bio && doctor.bio.length >= 50) },
      { key: 'clinic_name', label: 'Add your clinic name', weight: 15, done: !!doctor?.clinic_name },
      { key: 'specialties', label: 'Add at least one specialty', weight: 15, done: !!(doctor?.specialties && doctor.specialties.length > 0) },
      { key: 'location', label: 'Fill in city and state', weight: 10, done: !!(doctor?.city && doctor?.state) },
      { key: 'website', label: 'Add your website URL', weight: 10, done: !!doctor?.website_url },
      { key: 'socials', label: 'Add a social media link', weight: 10, done: !!(doctor?.instagram_url || doctor?.facebook_url) },
    ];
    const completeness = completenessItems.filter(i => i.done).reduce((sum, i) => sum + i.weight, 0);
    const missingItems = completenessItems.filter(i => !i.done);

    const userRole = profile?.role || 'doctor';
    const isFounder = isFounderRole(userRole);
    const isAdmin = ['admin', 'super_admin', 'founder', 'regional_admin'].includes(userRole);

    // Vendor Offers (shown to everyone)
    const vendorOffers = [
      {
        vendor: "NeuralPulse Technologies",
        title: "20% off Neuro scanning equipment",
        code: "NEUROPRO20",
        link: "/marketplace"
      },
      {
        vendor: "ChiroFlow EHR",
        title: "3 months free practice software",
        code: "FLOW3FREE",
        link: "/marketplace"
      },
      {
        vendor: "GrowthSpine Marketing",
        title: "$500 off onboarding",
        code: "GROW500",
        link: "/marketplace"
      }
    ];

    return {
      profile: {
        name: profile?.full_name || user.email?.split('@')[0] || "Doctor",
        slug: doctor?.slug || "",
        clinicName: doctor?.clinic_name || "My Practice",
        isMember: isFounder || isAdmin || userRole === 'doctor',
        role: userRole,
        status: 'active',
        subscription_status: (profile as any)?.subscription_status || null,
        verification_status: (doctor as any)?.verification_status || null
      },
      vendorOffers,
      doctor: {
        city: doctor?.city || "your city"
      },
      stats: [
        { label: "Profile Views", value: profileViews.toLocaleString(), trend: profileViews > 0 ? "+100%" : "0%" },
        { label: "Patient Leads", value: patientLeads.toString(), trend: patientLeads > 0 ? "+100%" : "0%" },
        { label: "Seminar Registrations", value: seminarCount.toLocaleString(), trend: "0%" },
        { label: "Job Applications", value: jobCount.toString(), trend: "0%" }
      ],
      marketPerformance: {
        completeness,
        completenessItems: completenessItems.map(i => ({ label: i.label, weight: i.weight, done: i.done })),
        missingItems: missingItems.map(i => i.label),
        reviews: (doctor as any)?.review_count || 0,
        engagement: profileViews > 50 ? 90 : profileViews > 10 ? 60 : profileViews > 0 ? 30 : 0
      },
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
  const { createAdminClient } = await import('@/lib/supabase-admin')
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    // First get the doctor's table ID
    const { data: doctorRow } = await admin.from('doctors').select('id').eq('user_id', user.id).single();
    const doctorTableId = doctorRow?.id || user.id;

    // 1. Parallelize fetches using admin client and correct doctor ID
    const [profileRes, doctorRes, leadsRes, confirmedRes, analyticsRes] = await Promise.all([
      admin.from('profiles').select('role').eq('id', user.id).single(),
      admin.from('doctors').select('profile_views, patient_leads, average_case_value, membership_tier').eq('user_id', user.id).single(),
      admin.from('leads').select('*').eq('doctor_id', doctorTableId).is('confirmed_at', null),
      admin.from('leads').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorTableId).not('confirmed_at', 'is', null),
      admin.from('analytics_events').select('*').eq('doctor_id', doctorTableId)
    ]);

    const tier = doctorRes.data?.membership_tier || 'starter';
    const isStarter = tier === 'starter';
    const membershipCost = tier === 'pro' ? 199 : tier === 'growth' ? 99 : 49;
    const averageCaseValue = Number((doctorRes.data as any)?.average_case_value) || 2500;
    
    // Aggregating analytics from the new analytics_events table
    const analytics = analyticsRes.data || [];
    const contactClicks = analytics.filter((a: any) => a.event_type === 'contact_click').length;
    const bookingClicks = analytics.filter((a: any) => a.event_type === 'booking_click').length;
    const phoneTaps = analytics.filter((a: any) => a.event_type === 'phone_tap').length;

    const stats = {
      profile_views: (doctorRes.data as any)?.profile_views || 0,
      contact_clicks: contactClicks,
      phone_taps: phoneTaps,
      website_clicks: analytics.filter((a: any) => a.event_type === 'website_click').length,
      booking_clicks: bookingClicks,
      message_requests: 0,
      referrals_sent: (leadsRes.data as any)?.length || 0,
      confirmed_patients: confirmedRes.count || 0,
      average_case_value: averageCaseValue,
      membership_cost: membershipCost
    };

    // 5. Fetch Historical Data (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: historicalLeads } = await admin
      .from('leads')
      .select('created_at, status')
      .eq('doctor_id', doctorTableId)
      .gte('created_at', sixMonthsAgo.toISOString());

    // 6. Fetch Acquisition Channels
    const { data: acquisitionData } = await supabase
      .from('leads')
      .select('source')
      .eq('doctor_id', user.id);

    // Grouping historical data by month
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const revenueByMonth = historicalLeads?.reduce((acc: any, lead: any) => {
      const month = months[new Date(lead.created_at).getMonth()];
      acc[month] = (acc[month] || 0) + (lead.status === 'converted' ? averageCaseValue : 0);
      return acc;
    }, {}) || {};

    const historicalRevenue = Object.keys(revenueByMonth).length > 0 
      ? Object.entries(revenueByMonth).map(([date, amount]) => ({ date, amount: amount as number }))
      : [];

    // Grouping acquisition sources
    const sourceCounts = acquisitionData?.reduce((acc: any, lead: any) => {
      const src = lead.source || 'directory';
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {}) || {};

    const patientAcquisition = Object.entries(sourceCounts).map(([source, count]) => ({
      source: source.charAt(0).toUpperCase() + source.slice(1).replace('_', ' '),
      count: count as number
    }));

    return {
      period,
      tier,
      stats,
      pending_patients: isStarter ? [] : (leadsRes.data || []).map((l: any) => ({
        id: l.id,
        name: `${l.first_name} ${l.last_name?.charAt(0)}.`,
        date: new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })),
      historical_revenue: isStarter ? [] : historicalRevenue,
      patient_acquisition: isStarter ? [] : (patientAcquisition.length > 0 ? patientAcquisition : [
        { source: "Global Directory", count: 0 },
        { source: "Direct Search", count: 0 }
      ])
    };
  } catch (e) {
    console.error("ROI Data Error:", e);
    return null;
  }
}

export async function confirmPatient(leadId: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  try {
    const { error } = await supabase
      .from('leads')
      .update({ 
        status: 'converted', 
        confirmed_at: new Date().toISOString() 
      })
      .eq('id', leadId)
      .eq('doctor_id', user.id)

    if (error) throw error;
    
    // Log the conversion event
    await supabase.from('analytics_events').insert({
      doctor_id: user.id,
      event_type: 'patient_confirmed',
      metadata: { leadId }
    });

    return { success: true }
  } catch (e: any) {
    console.error("Confirm Patient Error:", e);
    return { error: e.message }
  }
}
