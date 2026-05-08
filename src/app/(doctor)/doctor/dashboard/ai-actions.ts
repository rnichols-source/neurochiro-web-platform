'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// ─── AI WEEKLY INSIGHT ───────────────────────────────────────────────────────

export async function getAIWeeklyInsight(): Promise<string | null> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const admin = createAdminClient() as any;

    // Check for cached insight (regenerate once per day)
    const { data: cached } = await admin
      .from('doctor_tool_data')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .eq('tool_key', 'weekly_insight')
      .maybeSingle();

    if (cached?.data?.insight && cached.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < 24 * 60 * 60 * 1000) return cached.data.insight; // Less than 24 hours old
    }

    // Gather practice data
    const { data: doc } = await createAdminClient()
      .from('doctors')
      .select('first_name, profile_views, patient_leads, city, state, specialties, bio, photo_url, video_url, membership_tier')
      .eq('user_id', user.id)
      .single();

    if (!doc) return null;

    const [leadsRes, seminarsRes, jobsRes, ceRes] = await Promise.all([
      admin.from('leads').select('id, stage, created_at', { count: 'exact' }).eq('doctor_id', user.id),
      createAdminClient().from('seminars').select('id', { count: 'exact', head: true }).eq('host_id', user.id).eq('is_approved', true),
      createAdminClient().from('job_postings').select('id', { count: 'exact', head: true }).eq('doctor_id', user.id),
      admin.from('ce_certificates').select('ce_hours').eq('user_id', user.id),
    ]);

    const ceHours = (ceRes.data || []).reduce((s: number, c: any) => s + (c.ce_hours || 0), 0);
    const totalLeads = leadsRes.count || 0;
    const newLeads = (leadsRes.data || []).filter((l: any) => l.stage === 'new').length;
    const convertedLeads = (leadsRes.data || []).filter((l: any) => l.stage === 'converted').length;

    // Build context
    const context = {
      name: doc.first_name,
      profileViews: doc.profile_views || 0,
      totalLeads,
      newLeads,
      convertedLeads,
      conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
      seminarsHosted: seminarsRes.count || 0,
      jobsPosted: jobsRes.count || 0,
      ceHours,
      hasPhoto: !!doc.photo_url,
      hasVideo: !!doc.video_url,
      hasBio: !!(doc.bio && doc.bio.length >= 50),
      city: doc.city,
      state: doc.state,
      specialties: doc.specialties || [],
      tier: doc.membership_tier,
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return generateFallbackInsight(context);

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `You are a practice growth consultant for a chiropractor on the NeuroChiro platform. Generate a 1-2 sentence personalized weekly insight based on their data. Be specific, actionable, and encouraging. No fluff.

Practice data:
- Name: Dr. ${context.name}
- Profile views: ${context.profileViews}
- Total patient leads: ${context.totalLeads} (${context.newLeads} new, ${context.convertedLeads} converted)
- Conversion rate: ${context.conversionRate}%
- Seminars hosted: ${context.seminarsHosted}
- Jobs posted: ${context.jobsPosted}
- CE hours earned: ${context.ceHours}
- Has profile photo: ${context.hasPhoto}
- Has profile video: ${context.hasVideo}
- Has bio: ${context.hasBio}
- Location: ${context.city}, ${context.state}
- Specialties: ${context.specialties.join(', ') || 'none listed'}

Rules:
- Maximum 2 sentences
- Reference specific numbers from their data
- Give ONE actionable suggestion
- Tone: confident, direct, like a smart business partner
- Do NOT use phrases like "Great job!" or generic encouragement
- Return ONLY the insight text, no quotes`
      }],
    });

    const text = message.content[0];
    const insightText = text.type === 'text' ? text.text : generateFallbackInsight(context);

    // Cache the insight for 24 hours
    await admin.from('doctor_tool_data').upsert({
      user_id: user.id,
      tool_key: 'weekly_insight',
      data: { insight: insightText },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,tool_key' }).catch(() => {});

    return insightText;
  } catch (e) {
    console.error('AI Insight error:', e);
    return null;
  }
}

function generateFallbackInsight(ctx: any): string {
  if (!ctx.hasPhoto) return `Profiles with photos get 5x more views. Adding one could push your ${ctx.profileViews} views significantly higher.`;
  if (!ctx.hasVideo) return `You have ${ctx.profileViews} profile views but no video. Doctors who add video see 3x more patient leads.`;
  if (ctx.newLeads > 0) return `You have ${ctx.newLeads} new lead${ctx.newLeads > 1 ? 's' : ''} waiting to be contacted. Speed to contact is the #1 factor in conversion.`;
  if (ctx.totalLeads > 0 && ctx.conversionRate < 30) return `Your lead conversion rate is ${ctx.conversionRate}%. Following up within 24 hours could push this above 40%.`;
  if (ctx.profileViews === 0) return `Your profile hasn't been viewed yet. Sharing your NeuroChiro profile link on social media is the fastest way to get your first leads.`;
  return `You're at ${ctx.profileViews} profile views with ${ctx.totalLeads} leads. Consider hosting a seminar to boost both your visibility and CE hours.`;
}

// ─── AI PROFILE OPTIMIZATION ─────────────────────────────────────────────────

export async function getAIProfileOptimization(): Promise<string[] | null> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data: doc } = await createAdminClient()
      .from('doctors')
      .select('first_name, clinic_name, bio, photo_url, video_url, specialties, website_url, instagram_url, facebook_url, city, state, profile_views')
      .eq('user_id', user.id)
      .single();

    if (!doc) return null;

    // Get top performers in same city/state for comparison
    const { data: topDoctors } = await createAdminClient()
      .from('doctors')
      .select('bio, photo_url, video_url, specialties, website_url, profile_views')
      .eq('state', doc.state)
      .eq('verification_status', 'verified')
      .order('profile_views', { ascending: false })
      .limit(10);

    const topHaveVideo = (topDoctors || []).filter(d => d.video_url).length;
    const topAvgSpecialties = (topDoctors || []).reduce((s, d) => s + (d.specialties?.length || 0), 0) / Math.max((topDoctors || []).length, 1);
    const topAvgBioLength = (topDoctors || []).reduce((s, d) => s + (d.bio?.length || 0), 0) / Math.max((topDoctors || []).length, 1);

    const suggestions: string[] = [];

    if (!doc.photo_url) suggestions.push('Add a professional headshot — profiles with photos get 5x more views');
    if (!doc.video_url && topHaveVideo >= 3) suggestions.push(`${topHaveVideo} of the top 10 doctors in ${doc.state} have a profile video. Adding one sets you apart`);
    if ((doc.specialties?.length || 0) < Math.floor(topAvgSpecialties)) suggestions.push(`Top profiles in ${doc.state} list ${Math.round(topAvgSpecialties)} specialties on average. You have ${doc.specialties?.length || 0}`);
    if ((doc.bio?.length || 0) < topAvgBioLength * 0.5 && topAvgBioLength > 100) suggestions.push(`Your bio is shorter than average. Top profiles write ${Math.round(topAvgBioLength)}+ characters`);
    if (!doc.website_url) suggestions.push('Add your website URL — it builds credibility and drives traffic both ways');
    if (!doc.instagram_url && !doc.facebook_url) suggestions.push('Link your social media — patients check social profiles before booking');

    return suggestions.length > 0 ? suggestions.slice(0, 3) : null;
  } catch {
    return null;
  }
}
