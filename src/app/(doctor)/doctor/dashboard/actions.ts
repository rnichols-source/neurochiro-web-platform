'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
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
      (admin as any).from('doctors').select('clinic_name, slug, city, state, profile_views, bio, photo_url, specialties, website_url, instagram_url, facebook_url, review_count, membership_tier, verification_status, created_at').eq('user_id', user.id).single(),
      admin.from('seminars').select('*', { count: 'exact', head: true }).eq('host_id', user.id),
      admin.from('job_postings').select('*', { count: 'exact', head: true }).eq('doctor_id', docId),
      admin.from('leads').select('*', { count: 'exact', head: true }).eq('doctor_id', docId)
    ]);

    const profile = profileRes.data;
    const doctor = doctorRes.data;

    const seminarCount = seminarsRes.count || 0;
    const jobCount = jobsRes.count || 0;
    const patientLeads = leadsRes.count || 0;
    const profileViews = (doctor as any)?.profile_views || 0;

    // 3. Profile Completeness Calculation (specific weights per item)
    // If no doctor row found, skip the checklist entirely
    const completenessItems = doctor ? [
      { key: 'photo', label: 'Upload a profile photo', weight: 20, done: !!doctor.photo_url },
      { key: 'bio', label: 'Write a bio (50+ characters)', weight: 20, done: !!(doctor.bio && doctor.bio.length >= 50) },
      { key: 'clinic_name', label: 'Add your clinic name', weight: 15, done: !!doctor.clinic_name },
      { key: 'specialties', label: 'Add at least one specialty', weight: 15, done: !!(doctor.specialties && doctor.specialties.length > 0) },
      { key: 'location', label: 'Fill in city and state', weight: 10, done: !!(doctor.city && doctor.state) },
      { key: 'website', label: 'Add your website URL', weight: 10, done: !!doctor.website_url },
      { key: 'socials', label: 'Add a social media link', weight: 10, done: !!(doctor.instagram_url || doctor.facebook_url) },
    ] : [];
    const completeness = doctor ? completenessItems.filter(i => i.done).reduce((sum, i) => sum + i.weight, 0) : 100;
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

    // Discord notification — doctor portal login (once per day per doctor)
    try {
      const discordUrl = process.env.DISCORD_WEBHOOK_URL;
      if (discordUrl) {
        const today = new Date().toISOString().slice(0, 10);
        const cacheKey = `portal_login_${user.id}_${today}`;
        // Use a simple in-memory check via admin table or just send it
        // To avoid spam, check if we already notified today for this user
        const { data: existing } = await (admin as any)
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'portal_login')
          .gte('created_at', `${today}T00:00:00`)
          .limit(1);

        if (!existing || existing.length === 0) {
          // Record that we notified
          await (admin as any).from('notifications').insert({
            user_id: user.id,
            title: 'Portal login',
            body: `${profile?.full_name || user.email} logged into the doctor portal`,
            type: 'portal_login',
            priority: 'info',
          });

          // Send Discord notification
          const docName = profile?.full_name || user.email || 'Unknown';
          const docCity = doctor?.city ? `${doctor.city}, ${doctor.state || ''}` : '';
          await fetch(discordUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `🩺 **DOCTOR PORTAL LOGIN**\n\n**${docName}**${docCity ? ` — ${docCity}` : ''}\n${doctor?.clinic_name || ''}\nProfile: ${completeness}% complete`,
            }),
          }).catch(() => {});
        }
      }
    } catch {
      // Don't let notification errors break the dashboard
    }

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
        city: doctor?.city || "your city",
        membership_tier: (doctor as any)?.membership_tier || 'free',
        is_founding_member: isFounder,
        created_at: (doctor as any)?.created_at || null,
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

    const tier = doctorRes.data?.membership_tier || 'basic';
    const isStarter = tier === 'basic';
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
    const { data: acquisitionData } = await admin
      .from('leads')
      .select('source')
      .eq('doctor_id', doctorTableId);

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
  const { createAdminClient } = await import('@/lib/supabase-admin')
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }
  const { data: doctorRow } = await admin.from('doctors').select('id').eq('user_id', user.id).maybeSingle()
  const doctorTableId = (doctorRow as any)?.id || user.id

  try {
    const { error } = await supabase
      .from('leads')
      .update({ 
        status: 'converted', 
        confirmed_at: new Date().toISOString() 
      })
      .eq('id', leadId)
      .eq('doctor_id', doctorTableId)

    if (error) throw error;

    // Log the conversion event
    await admin.from('analytics_events').insert({
      doctor_id: doctorTableId,
      event_type: 'patient_confirmed',
      metadata: { leadId }
    });

    return { success: true }
  } catch (e: any) {
    console.error("Confirm Patient Error:", e);
    return { error: e.message }
  }
}

export async function getDoctorActivityFeed() {
  try {
    const supabase = createServerSupabase()
    const { createAdminClient } = await import('@/lib/supabase-admin')
    const admin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: doctorRow } = await admin.from('doctors').select('id').eq('user_id', user.id).maybeSingle()
    const doctorId = (doctorRow as any)?.id || user.id

    const activities: { type: string; title: string; detail: string; time: string; link: string }[] = []

    // Recent notifications
    const { data: notifs } = await supabase
      .from('notifications')
      .select('title, body, type, link, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (notifs) {
      notifs.forEach((n: any) => {
        activities.push({
          type: n.type || 'system',
          title: n.title,
          detail: n.body?.slice(0, 80) || '',
          time: n.created_at,
          link: n.link || '/doctor/notifications',
        })
      })
    }

    // Recent job applications
    const { data: apps } = await admin
      .from('job_applications')
      .select('id, job_id, name, created_at')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })
      .limit(3)

    if (apps) {
      apps.forEach((a: any) => {
        activities.push({
          type: 'job',
          title: 'New Job Applicant',
          detail: `${a.name} applied to your position`,
          time: a.created_at,
          link: '/doctor/jobs',
        })
      })
    }

    // Recent seminar registrations
    const { data: regs } = await admin
      .from('seminar_registrations')
      .select('id, seminar_id, created_at, profile_id')
      .eq('seminar_id', doctorId)
      .order('created_at', { ascending: false })
      .limit(3)

    // Sort by time, newest first
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return activities.slice(0, 8)
  } catch (e) {
    console.error("Activity Feed Error:", e)
    return []
  }
}

// ─── PRACTICE HEALTH SCORE ───────────────────────────────────────────────────

import { computePracticeHealth, type PracticeHealthResult } from '@/lib/practice-health'

export async function getPracticeHealthScore(): Promise<PracticeHealthResult | null> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const admin = createAdminClient() as any

    // Get doctor record first (need doc.id for leads queries)
    const { data: doc } = await createAdminClient().from('doctors').select('id, photo_url, bio, clinic_name, specialties, city, state, website_url, instagram_url, facebook_url, video_url, profile_views, patient_leads').eq('user_id', user.id).single();
    if (!doc) return null;

    const docId = doc.id;
    const [leadsRes, confirmedRes, seminarsRes, ceRes, referralsRes, matchRes, jobsRes, reviewsRes, notifsRes] = await Promise.all([
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('doctor_id', docId),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('doctor_id', docId).not('confirmed_at', 'is', null),
      createAdminClient().from('seminars').select('id', { count: 'exact', head: true }).eq('host_id', user.id).eq('is_approved', true),
      admin.from('ce_certificates').select('ce_hours').eq('user_id', user.id),
      admin.from('leads').select('id', { count: 'exact', head: true }).eq('source', 'referral').eq('doctor_id', docId),
      admin.from('match_positions').select('id', { count: 'exact', head: true }).eq('doctor_id', user.id),
      createAdminClient().from('job_postings').select('id', { count: 'exact', head: true }).eq('doctor_id', docId),
      admin.from('seminar_reviews').select('id', { count: 'exact', head: true }),
      createAdminClient().from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
    ])

    const ceHours = (ceRes.data || []).reduce((s: number, c: any) => s + (c.ce_hours || 0), 0)

    return computePracticeHealth({
      profile: {
        hasPhoto: !!doc.photo_url,
        hasBio: !!(doc.bio && doc.bio.length >= 50),
        hasClinicName: !!doc.clinic_name,
        hasSpecialties: !!(doc.specialties && doc.specialties.length > 0),
        hasLocation: !!(doc.city && doc.state),
        hasWebsite: !!doc.website_url,
        hasSocial: !!(doc.instagram_url || doc.facebook_url),
        hasVideo: !!doc.video_url,
      },
      engagement: {
        profileViews: doc.profile_views || 0,
        patientLeads: leadsRes.count || 0,
        confirmedPatients: confirmedRes.count || 0,
      },
      community: {
        seminarsHosted: seminarsRes.count || 0,
        ceHoursDelivered: ceHours,
        referralsSent: referralsRes.count || 0,
        chiroMatchPositions: matchRes.count || 0,
      },
      growth: {
        viewsTrend: doc.profile_views > 10 ? 15 : 0,
        leadsThisMonth: leadsRes.count || 0,
        jobsPosted: jobsRes.count || 0,
        reviewCount: reviewsRes.count || 0,
      },
    })
  } catch (e) {
    console.error("Practice Health Error:", e)
    return null
  }
}

// ─── COMPETITIVE INTELLIGENCE ────────────────────────────────────────────────

export async function getCompetitiveIntelligence() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: doc } = await createAdminClient().from('doctors').select('city, state, profile_views').eq('user_id', user.id).single()
    if (!doc || !doc.city) return null

    const { data: cityDoctors } = await createAdminClient()
      .from('doctors')
      .select('profile_views')
      .eq('city', doc.city)
      .eq('state', doc.state)
      .eq('verification_status', 'verified')
      .order('profile_views', { ascending: false })

    if (!cityDoctors || cityDoctors.length === 0) return null

    const myViews = doc.profile_views || 0
    const rank = cityDoctors.filter(d => (d.profile_views || 0) > myViews).length + 1
    const totalInCity = cityDoctors.length
    const avgViews = Math.round(cityDoctors.reduce((s, d) => s + (d.profile_views || 0), 0) / totalInCity)
    const topPercentile = Math.round((1 - (rank - 1) / totalInCity) * 100)

    return {
      cityRank: rank,
      totalInCity,
      topPercentile,
      areaAverageViews: avgViews,
      doctorViews: myViews,
      city: doc.city,
      state: doc.state,
      trend: myViews > avgViews ? 'up' as const : myViews < avgViews ? 'down' as const : 'flat' as const,
    }
  } catch {
    return null
  }
}

// ─── SMART ACTION ITEMS ──────────────────────────────────────────────────────

export async function getSmartActionItems() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    const admin = createAdminClient() as any
    const items: { id: string; priority: 'high' | 'medium' | 'low'; title: string; description: string; href: string; icon: string }[] = []

    // Unread messages
    const { count: unreadCount } = await createAdminClient().from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false)
    if (unreadCount && unreadCount > 0) {
      items.push({ id: 'unread', priority: 'high', title: `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`, description: 'Review your recent notifications', href: '/doctor/notifications', icon: 'Bell' })
    }

    // Stale leads (new leads older than 48 hours) — use doctor table ID
    const { data: docForLeads } = await createAdminClient().from('doctors').select('id').eq('user_id', user.id).single()
    const docIdForLeads = docForLeads?.id || user.id
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const { count: staleLeads } = await admin.from('leads').select('id', { count: 'exact', head: true }).eq('doctor_id', docIdForLeads).eq('stage', 'new').lt('created_at', twoDaysAgo)
    if (staleLeads && staleLeads > 0) {
      items.push({ id: 'stale_leads', priority: 'high', title: `${staleLeads} lead${staleLeads > 1 ? 's' : ''} waiting 48+ hours`, description: 'Contact them before they go elsewhere', href: '/doctor/leads', icon: 'Users' })
    }

    // Missing video
    const { data: doc } = await createAdminClient().from('doctors').select('video_url, photo_url, bio, specialties').eq('user_id', user.id).single()
    if (doc && !doc.video_url) {
      items.push({ id: 'video', priority: 'medium', title: 'Add a profile video', description: 'Doctors with video get 3x more patient leads', href: '/doctor/profile', icon: 'Video' })
    }

    // Profile gaps
    if (doc && (!doc.photo_url || !doc.bio || !doc.specialties || doc.specialties.length === 0)) {
      items.push({ id: 'profile', priority: 'medium', title: 'Complete your profile', description: 'A complete profile ranks higher in search results', href: '/doctor/profile', icon: 'User' })
    }

    return items.slice(0, 4)
  } catch {
    return []
  }
}

// ─── REVENUE INTELLIGENCE ────────────────────────────────────────────────────

export async function getRevenueIntelligence() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: doc } = await createAdminClient().from('doctors').select('id, average_case_value, membership_tier').eq('user_id', user.id).single()
    if (!doc) return null

    const admin = createAdminClient() as any
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { count: confirmedThisMonth } = await admin.from('leads').select('id', { count: 'exact', head: true }).eq('doctor_id', doc.id).not('confirmed_at', 'is', null).gte('confirmed_at', thirtyDaysAgo)

    const avgCaseValue = doc.average_case_value || 1200
    const estimatedRevenue = (confirmedThisMonth || 0) * avgCaseValue
    const tierCosts: Record<string, number> = { basic: 49, growth: 69, pro: 129 }
    const membershipCost = tierCosts[doc.membership_tier] || 49
    const roi = membershipCost > 0 ? Math.round(estimatedRevenue / membershipCost) : 0

    return {
      estimatedMonthlyRevenue: estimatedRevenue,
      membershipCost,
      roi,
      confirmedLeadsThisMonth: confirmedThisMonth || 0,
      averageCaseValue: avgCaseValue,
    }
  } catch {
    return null
  }
}

// ─── LEAD PIPELINE STAGES (for dashboard widget) ────────────────────────────

export async function getLeadPipelineStages() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const admin = createAdminClient() as any
    const { data: doc } = await createAdminClient().from('doctors').select('id').eq('user_id', user.id).single()
    if (!doc) return null

    const { data: leads } = await admin.from('leads').select('stage').eq('doctor_id', doc.id)
    if (!leads) return { new: 0, contacted: 0, scheduled: 0, converted: 0 }

    const stages = { new: 0, contacted: 0, scheduled: 0, converted: 0 }
    for (const l of leads) {
      const s = l.stage || 'new'
      if (s in stages) stages[s as keyof typeof stages]++
    }
    return stages
  } catch {
    return null
  }
}
