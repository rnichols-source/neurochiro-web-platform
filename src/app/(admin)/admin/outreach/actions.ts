'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const { createServerSupabase } = await import('@/lib/supabase-server');
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as any)?.role;
  if (!['admin', 'super_admin', 'founder', 'regional_admin'].includes(role)) throw new Error('Unauthorized');
  return user;
}

// ── Types ──
export type ProspectStatus = 'new' | 'contacted' | 'followed_up' | 'responded' | 'interested' | 'signed_up' | 'not_interested';

export interface Prospect {
  id: string;
  name: string;
  instagram_handle: string | null;
  email: string | null;
  website: string | null;
  phone: string | null;
  clinic_name: string | null;
  city: string;
  state: string;
  status: ProspectStatus;
  notes: string | null;
  script_used: string | null;
  source: string | null;
  facebook: string | null;
  contact_method: string | null;
  contacted_at: string | null;
  follow_up_at: string | null;
  follow_up_count: number;
  responded_at: string | null;
  signed_up_at: string | null;
  created_at: string;
  updated_at: string;
}

// Table must be created manually via sql_archive/OUTREACH_PROSPECTS_TABLE.sql

// ── Get Prospects ──
export async function getProspects(options: {
  state?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();


  const { state, status, search, page = 1, limit = 50 } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createAdminClient();

  let query = supabase
    .from('outreach_prospects' as any)
    .select('*', { count: 'exact' });

  if (state && state !== 'all') {
    query = query.eq('state', state);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,instagram_handle.ilike.%${search}%,city.ilike.%${search}%,clinic_name.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching prospects:', error);
    return { prospects: [], total: 0, hasMore: false };
  }

  return {
    prospects: (data || []) as unknown as Prospect[],
    total: count || 0,
    hasMore: (count || 0) > to + 1,
  };
}

// ── Get Pipeline Stats ──
export async function getPipelineStats(state?: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  let query = supabase.from('outreach_prospects' as any).select('status');
  if (state && state !== 'all') {
    query = query.eq('state', state);
  }

  const { data } = await query;
  const statuses = (data || []).map((d: any) => d.status);

  const stats = {
    total: statuses.length,
    new: statuses.filter((s: string) => s === 'new').length,
    contacted: statuses.filter((s: string) => s === 'contacted').length,
    followed_up: statuses.filter((s: string) => s === 'followed_up').length,
    responded: statuses.filter((s: string) => s === 'responded').length,
    interested: statuses.filter((s: string) => s === 'interested').length,
    signed_up: statuses.filter((s: string) => s === 'signed_up').length,
    not_interested: statuses.filter((s: string) => s === 'not_interested').length,
  };

  // Conversion rate
  const contactedTotal = stats.contacted + stats.followed_up + stats.responded + stats.interested + stats.signed_up + stats.not_interested;
  stats.total = statuses.length;

  return stats;
}

// ── Get Today's Queue ──
export async function getDailyQueue(dailyGoal: number = 10) {
  await requireAdmin();
  const supabase = createAdminClient();

  // Get new prospects (never contacted)
  const { data: newProspects } = await supabase
    .from('outreach_prospects' as any)
    .select('*')
    .eq('status', 'new')
    .order('created_at', { ascending: true })
    .limit(dailyGoal);

  // Get follow-ups due today or overdue
  const now = new Date().toISOString();
  const { data: followUps } = await supabase
    .from('outreach_prospects' as any)
    .select('*')
    .in('status', ['contacted', 'followed_up'])
    .lte('follow_up_at', now)
    .order('follow_up_at', { ascending: true })
    .limit(dailyGoal);

  return {
    newProspects: (newProspects || []) as unknown as Prospect[],
    followUps: (followUps || []) as unknown as Prospect[],
  };
}

// ── Add Prospect ──
export async function addProspect(data: {
  name: string;
  instagram_handle?: string;
  facebook?: string;
  email?: string;
  website?: string;
  phone?: string;
  clinic_name?: string;
  city: string;
  state: string;
  notes?: string;
  source?: string;
}) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from('outreach_prospects' as any).insert({
    name: data.name,
    instagram_handle: data.instagram_handle || null,
    facebook: data.facebook || null,
    email: data.email || null,
    website: data.website || null,
    phone: data.phone || null,
    clinic_name: data.clinic_name || null,
    city: data.city,
    state: data.state,
    notes: data.notes || null,
    source: data.source || 'manual',
    status: 'new',
  });

  if (error) {
    console.error('Error adding prospect:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/outreach');
  return { success: true };
}

// ── Bulk Add Prospects (CSV import) ──
export async function bulkAddProspects(prospects: Array<{
  name: string;
  instagram_handle?: string;
  email?: string;
  website?: string;
  phone?: string;
  clinic_name?: string;
  city: string;
  state: string;
}>) {
  await requireAdmin();
  const supabase = createAdminClient();

  const rows = prospects.map(p => ({
    name: p.name,
    instagram_handle: p.instagram_handle || null,
    email: p.email || null,
    website: p.website || null,
    phone: p.phone || null,
    clinic_name: p.clinic_name || null,
    city: p.city,
    state: p.state,
    status: 'new' as const,
    source: 'csv_import',
  }));

  const { error, data } = await supabase.from('outreach_prospects' as any).insert(rows).select();

  if (error) {
    console.error('Bulk import error:', error);
    return { success: false, error: error.message, count: 0 };
  }

  revalidatePath('/admin/outreach');
  return { success: true, count: data?.length || 0 };
}

// ── Update Prospect Status ──
export async function updateProspectStatus(id: string, status: ProspectStatus, notes?: string, scriptUsed?: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (notes !== undefined) updates.notes = notes;
  if (scriptUsed) updates.script_used = scriptUsed;

  // Set timestamps based on status
  if (status === 'contacted') {
    updates.contacted_at = new Date().toISOString();
    // Set follow-up for 5 days from now
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 5);
    updates.follow_up_at = followUp.toISOString();
    updates.follow_up_count = 1;
  } else if (status === 'followed_up') {
    const { data: current } = await supabase.from('outreach_prospects' as any).select('follow_up_count').eq('id', id).single();
    const count = ((current as any)?.follow_up_count || 1) + 1;
    updates.follow_up_count = count;
    if (count >= 3) {
      // After 3 follow-ups, auto-move to not_interested
      updates.status = 'not_interested';
      updates.follow_up_at = null;
    } else {
      const followUp = new Date();
      followUp.setDate(followUp.getDate() + 5);
      updates.follow_up_at = followUp.toISOString();
    }
  } else if (status === 'responded') {
    updates.responded_at = new Date().toISOString();
    updates.follow_up_at = null;
  } else if (status === 'signed_up') {
    updates.signed_up_at = new Date().toISOString();
    updates.follow_up_at = null;
  } else if (status === 'not_interested') {
    updates.follow_up_at = null;
  }

  const { error } = await supabase
    .from('outreach_prospects' as any)
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating prospect:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/outreach');
  return { success: true };
}

// ── Update Prospect Details ──
export async function updateProspect(id: string, data: Partial<Prospect>) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('outreach_prospects' as any)
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/outreach');
  return { success: true };
}

// ── Delete Prospect ──
export async function deleteProspect(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from('outreach_prospects' as any).delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/outreach');
  return { success: true };
}

// ── Find Email for Existing Prospect ──
export async function findProspectEmail(prospectId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: prospect } = await supabase
    .from('outreach_prospects' as any)
    .select('*')
    .eq('id', prospectId)
    .single();

  if (!prospect) return { success: false, error: 'Prospect not found' };
  const p = prospect as any;

  if (p.email) return { success: true, email: p.email, alreadyHad: true, emailSent: false };

  const foundEmail = await findEmailFromWebsite(p.website);

  if (foundEmail) {
    await supabase.from('outreach_prospects' as any).update({
      email: foundEmail,
      updated_at: new Date().toISOString(),
    }).eq('id', prospectId);

    // If they already have a pre-built profile, send the outreach email now
    let emailSent = false;
    const profileLink = p.notes?.match(/neurochiro\.co\/directory\/[\w-]+/)?.[0];
    if (profileLink) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY || '');
        const name = (p.name || 'Doctor').replace(/^Dr\.?\s*/i, '').split(' ')[0];
        const clinicName = p.clinic_name || p.name;

        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: foundEmail,
          subject: 'Your NeuroChiro profile is live',
          html: `<!DOCTYPE html><html><head>
            <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
            <style>body{font-family:'Lato',Helvetica,Arial,sans-serif;margin:0;padding:0;background:#FCF9F5;}
            .wrapper{max-width:600px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);border:1px solid #E5E7EB;}
            .header{background:#1E2D3B;padding:30px;text-align:center;}
            .content{padding:40px;color:#1E2D3B;font-size:16px;line-height:1.7;}
            .footer{text-align:center;padding:30px;font-size:11px;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;font-weight:700;}</style>
            </head><body><div class="wrapper">
            <div class="header"><img src="https://neurochiro.co/logo-white.png" alt="NeuroChiro" width="120" style="display:block;margin:0 auto;"></div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>My name is Dr. Raymond Nichols, and I'm the founder of NeuroChiro — the global directory built specifically for nervous system chiropractors.</p>
              <p>I created a profile for ${clinicName} on our platform, and it's already live:</p>
              <p style="margin: 20px 0;"><a href="https://${profileLink}" style="display: inline-block; background: #D66829; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 15px;">View Your Profile</a></p>
              <p>Patients in ${p.city || 'your area'} are actively using NeuroChiro to find chiropractors like you. All you need to do is claim your profile, add your photo and bio, and you're set. Takes about 2 minutes. No cost.</p>
              <p>Let me know if you have any questions.</p>
              <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro<br>neurochiro.co</p>
            </div>
            <div class="footer">&copy; 2026 NeuroChiro Network</div>
            </div></body></html>`,
        });
        emailSent = true;

        // Mark as contacted with follow-up
        const followUp = new Date();
        followUp.setDate(followUp.getDate() + 5);
        await supabase.from('outreach_prospects' as any).update({
          status: 'contacted',
          contacted_at: new Date().toISOString(),
          follow_up_at: followUp.toISOString(),
          follow_up_count: 1,
          script_used: 'auto_initial_email',
          notes: (p.notes || '') + ' | Auto-email sent after email found',
          updated_at: new Date().toISOString(),
        }).eq('id', prospectId);
      } catch (err) {
        console.error('Auto-email after find failed:', err);
      }
    }

    return { success: true, email: foundEmail, alreadyHad: false, emailSent };
  }

  return { success: false, error: 'No email found on their website' };
}

// ── Auto Email Finder ──
async function findEmailFromWebsite(websiteUrl: string | null): Promise<string | null> {
  if (!websiteUrl) return null;

  // Normalize URL
  let url = websiteUrl.trim();
  if (!url.startsWith('http')) url = `https://${url}`;

  // Try multiple pages where emails are commonly found
  const pagesToTry = [
    url,
    `${url}/contact`,
    `${url}/contact-us`,
    `${url}/about`,
    `${url}/about-us`,
  ];

  for (const pageUrl of pagesToTry) {
    try {
      const res = await fetch(pageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NeuroChiro/1.0)' },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) continue;

      const html = await res.text();

      // Find email addresses in the HTML
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = html.match(emailRegex) || [];

      // Filter out common junk emails
      const junkPatterns = ['example.com', 'sentry.io', 'wix.com', 'squarespace.com', 'wordpress.com', 'google.com', 'facebook.com', 'cloudflare', '.png', '.jpg', '.svg', '.css', '.js'];
      const validEmails = emails.filter(email => {
        const lower = email.toLowerCase();
        return !junkPatterns.some(junk => lower.includes(junk));
      });

      if (validEmails.length > 0) {
        // Prefer emails that look like contact/info/office emails
        const preferred = validEmails.find(e => /^(info|contact|office|hello|admin|support|dr|doc)/i.test(e));
        return preferred || validEmails[0];
      }
    } catch {
      // Timeout or fetch error — try next page
      continue;
    }
  }

  return null;
}

// ── Pre-Build Profile ──
export async function preBuildProfile(prospectId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  // Get the prospect data
  const { data: prospect } = await supabase
    .from('outreach_prospects' as any)
    .select('*')
    .eq('id', prospectId)
    .single();

  if (!prospect) return { success: false, error: 'Prospect not found' };
  const p = prospect as any;

  // Auto-find email if missing
  if (!p.email && p.website) {
    const foundEmail = await findEmailFromWebsite(p.website);
    if (foundEmail) {
      p.email = foundEmail;
      // Save the found email back to the prospect
      await supabase.from('outreach_prospects' as any).update({
        email: foundEmail,
        updated_at: new Date().toISOString(),
      }).eq('id', prospectId);
    }
  }

  // Parse name into first/last
  const fullName = (p.name || '').replace(/^Dr\.?\s*/i, '').trim();
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Generate slug
  const baseSlug = `${firstName}-${lastName}-${(p.city || '').replace(/\s+/g, '-')}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  // Check if a doctor with this name + city already exists
  const { data: existing } = await supabase
    .from('doctors' as any)
    .select('id, slug')
    .ilike('first_name', firstName)
    .ilike('last_name', lastName || '%')
    .ilike('city', p.city || '%')
    .limit(1);

  if (existing && (existing as any[]).length > 0) {
    const existingDoc = (existing as any[])[0];
    // Already exists — update the prospect with the link
    await supabase.from('outreach_prospects' as any).update({
      notes: `Profile already exists: neurochiro.co/directory/${existingDoc.slug}`,
      updated_at: new Date().toISOString(),
    }).eq('id', prospectId);

    return {
      success: true,
      slug: existingDoc.slug,
      profileUrl: `https://neurochiro.co/directory/${existingDoc.slug}`,
      alreadyExisted: true,
    };
  }

  // Create the unclaimed doctor listing
  const insertData: any = {
    first_name: firstName,
    last_name: lastName,
    slug: slug,
    clinic_name: p.clinic_name || `${firstName} ${lastName} Chiropractic`,
    city: p.city || '',
    state: p.state || '',
    country: 'United States',
    address: '',
    latitude: 0,
    longitude: 0,
    bio: '',
    specialties: [],
    verification_status: 'verified',
    membership_tier: 'starter',
    region_code: 'US',
    is_founding_member: false,
    phone: p.phone || null,
    email: p.email || null,
    website_url: p.website || null,
    instagram_url: p.instagram_handle ? `https://instagram.com/${p.instagram_handle.replace('@', '')}` : null,
    // No user_id — this is an unclaimed profile
  };

  const { error: insertError } = await supabase.from('doctors' as any).insert(insertData);

  if (insertError) {
    console.error('Pre-build profile error:', insertError);
    return { success: false, error: insertError.message };
  }

  const profileUrl = `https://neurochiro.co/directory/${slug}`;

  // Auto-send initial outreach email if we have an email
  let emailSent = false;
  if (p.email) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY || '');
      const name = firstName || p.name?.split(' ')[0] || 'Doctor';
      const clinicName = p.clinic_name || `${firstName} ${lastName} Chiropractic`;

      await resend.emails.send({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: p.email,
        subject: 'Your NeuroChiro profile is live',
        html: `<!DOCTYPE html><html><head>
          <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
          <style>body{font-family:'Lato',Helvetica,Arial,sans-serif;margin:0;padding:0;background:#FCF9F5;}
          .wrapper{max-width:600px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);border:1px solid #E5E7EB;}
          .header{background:#1E2D3B;padding:30px;text-align:center;}
          .content{padding:40px;color:#1E2D3B;font-size:16px;line-height:1.7;}
          .footer{text-align:center;padding:30px;font-size:11px;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;font-weight:700;}</style>
          </head><body><div class="wrapper">
          <div class="header"><img src="https://neurochiro.co/logo-white.png" alt="NeuroChiro" width="120" style="display:block;margin:0 auto;"></div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>I hope this email finds you well. My name is Dr. Raymond Nichols, and I'm the founder of NeuroChiro — the global directory built specifically for nervous system chiropractors.</p>
            <p>I took the time to create a profile for ${clinicName} on our platform, and it's already live:</p>
            <p style="margin: 20px 0;"><a href="${profileUrl}" style="display: inline-block; background: #D66829; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 15px;">View Your Profile</a></p>
            <p>Patients in ${p.city || 'your area'} are actively using NeuroChiro to find chiropractors like you. All you need to do is claim your profile, add your photo and bio, and you're set. It takes about 2 minutes and there's no cost.</p>
            <p>Let me know if you have any questions — happy to walk you through it.</p>
            <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro<br>neurochiro.co</p>
          </div>
          <div class="footer">&copy; 2026 NeuroChiro Network</div>
          </div></body></html>`,
      });
      emailSent = true;
    } catch (err) {
      console.error('Auto-email failed:', err);
    }
  }

  // Update the prospect with the profile link + mark contacted if email sent
  const updates: any = {
    notes: `Pre-built profile: ${profileUrl}${emailSent ? ' | Auto-email sent' : ''}`,
    updated_at: new Date().toISOString(),
  };

  if (emailSent) {
    updates.status = 'contacted';
    updates.contacted_at = new Date().toISOString();
    updates.script_used = 'auto_initial_email';
    // Set follow-up for 5 days from now
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 5);
    updates.follow_up_at = followUp.toISOString();
    updates.follow_up_count = 1;
  }

  await supabase.from('outreach_prospects' as any).update(updates).eq('id', prospectId);

  revalidatePath('/admin/outreach');
  return {
    success: true,
    slug: slug,
    profileUrl: profileUrl,
    alreadyExisted: false,
    emailSent,
  };
}

// ── DM Scripts ──
export async function getDMScripts() {
  return [
    {
      id: 'pre_built_gift',
      name: 'Pre-Built Profile (Primary)',
      category: 'first_contact',
      description: 'YOUR #1 SCRIPT — Send after clicking "Pre-Build Profile"',
      template: `Hey {name} — I built a profile for you on NeuroChiro. It's the global directory for nervous system chiropractors and patients in {city} are already using it to find docs like you. Your listing is live here: {profile_link}. You can claim it and add your photo + bio in about 2 minutes. No cost. Just thought you should know it exists.`,
    },
    {
      id: 'pre_built_short',
      name: 'Pre-Built Short Version',
      category: 'first_contact',
      description: 'Shorter version — gets to the point faster',
      template: `Hey {name} — I made you a profile on NeuroChiro, the directory for nervous system chiropractors. It's already live: {profile_link}. Claim it, add your photo, done. No cost. Patients in {city} can find you through it.`,
    },
    {
      id: 'pre_built_value',
      name: 'Pre-Built Value Lead',
      category: 'first_contact',
      description: 'Lead with the patient-finding angle',
      template: `Hey {name} — quick question. When patients in {city} search for a nervous system chiropractor, are they finding you? I built you a profile on NeuroChiro so they can: {profile_link}. It's free to claim. Add your photo and bio and you're live in the directory. Takes 2 minutes.`,
    },
    {
      id: 'follow_up_1',
      name: 'Follow-Up #1 (Profile Live)',
      category: 'follow_up',
      description: 'Nudge after 5 days — remind them their profile exists',
      template: `Hey {name} — just making sure you saw this. Your NeuroChiro profile is live and patients in {city} can find it: {profile_link}. If you want to update it with your photo and bio, takes 2 min. Either way, the listing is there for you.`,
    },
    {
      id: 'follow_up_2',
      name: 'Follow-Up #2 (Getting Views)',
      category: 'follow_up',
      description: 'Final follow-up — create urgency with views',
      template: `Last one from me — your profile at {profile_link} is getting views. Figured you'd want to know. Claim it whenever you're ready.`,
    },
    {
      id: 'responded_interested',
      name: 'They\'re Interested',
      category: 'response',
      description: 'They responded — guide them to claim',
      template: `Glad it resonated! Here's all you need to do: go to {profile_link}, click "Claim This Profile," and create a quick account. Then add your photo, bio, and specialties. That's it — you're live in the directory. Patients in {city} will be able to find and message you directly. Let me know if you need any help getting set up.`,
    },
    {
      id: 'signed_up',
      name: 'Welcome — They Claimed It',
      category: 'response',
      description: 'Send after they claim their profile',
      template: `Welcome to NeuroChiro! Glad to have you in the network. Quick tips: make sure your photo and bio are filled out — it makes a huge difference for patient clicks. Patients in {city} are already searching. You're now showing up. If you need anything at all, just message me.`,
    },
    {
      id: 'objection_cost',
      name: 'Objection: Is It Free?',
      category: 'objection',
      description: 'When they ask about cost',
      template: `100% free to claim your profile and be listed in the directory. Patients can find you, see your bio, specialties, and location. If you ever want access to advanced tools like the KPI tracker, care plan builder, and patient messaging, those are on a paid plan. But the directory listing? That's yours. Free. Forever.`,
    },
    {
      id: 'objection_time',
      name: 'Objection: No Time',
      category: 'objection',
      description: 'When they say they\'re too busy',
      template: `I already built it for you — it's live right now at {profile_link}. All you'd need to do is click "Claim," add your photo, and you're done. Literally 2 minutes between patients. And after that, it works for you 24/7 without you touching it.`,
    },
    {
      id: 'objection_why',
      name: 'Objection: Why Should I?',
      category: 'objection',
      description: 'When they want to know what makes this different',
      template: `Fair question. NeuroChiro is the only directory built specifically for nervous system chiropractors. When a patient searches for a chiropractor, they get YOU — not a list of random practices mixed with physical therapists and massage chains. It's built by someone in the profession, for the profession. Your profile is already live: {profile_link}. Take a look and decide for yourself.`,
    },
    {
      id: 'email_first_contact',
      name: 'Email: First Contact',
      category: 'email',
      description: 'Professional email when no Instagram/Facebook available',
      template: `Subject: Your NeuroChiro profile is live\n\nHi {name},\n\nI hope this email finds you well. My name is Dr. Raymond Nichols, and I'm the founder of NeuroChiro — the global directory built specifically for nervous system chiropractors.\n\nI took the time to create a profile for your practice on our platform, and it's already live:\n\n{profile_link}\n\nPatients in {city} are actively using NeuroChiro to find chiropractors like you. All you need to do is claim your profile, add your photo and bio, and you're set. It takes about 2 minutes and there's no cost.\n\nWe're building the largest network of nervous system chiropractors in the world, and I'd love to have {clinic_name} be part of it.\n\nLet me know if you have any questions — happy to walk you through it.\n\nBest,\nDr. Raymond Nichols\nFounder, NeuroChiro\nneurochiro.co`,
    },
    {
      id: 'email_follow_up',
      name: 'Email: Follow-Up',
      category: 'email',
      description: 'Follow-up email after 5-7 days with no response',
      template: `Subject: Quick follow-up — your NeuroChiro profile\n\nHi {name},\n\nJust wanted to make sure my last email didn't get buried. I created a profile for your practice on NeuroChiro and it's live here:\n\n{profile_link}\n\nPatients in {city} can already find you through the directory. If you'd like to add your photo and bio to make it yours, it takes about 2 minutes.\n\nNo pressure at all — just didn't want you to miss it.\n\nBest,\nDr. Raymond Nichols\nFounder, NeuroChiro`,
    },
    {
      id: 'email_final',
      name: 'Email: Final Follow-Up',
      category: 'email',
      description: 'Last email — respectful close',
      template: `Subject: Last note from me\n\nHi {name},\n\nI know you're busy running your practice, so I'll keep this short. Your profile on NeuroChiro is still live:\n\n{profile_link}\n\nIt's there whenever you're ready to claim it. If the timing isn't right, no worries at all. Wishing you and your practice the best.\n\nDr. Raymond Nichols\nFounder, NeuroChiro`,
    },
    {
      id: 'email_warm_intro',
      name: 'Email: Warm / Referral Intro',
      category: 'email',
      description: 'When someone referred you or you have a connection',
      template: `Subject: {name} — thought you should see this\n\nHi {name},\n\nI came across your practice while building out the NeuroChiro network in {state} and was really impressed with what you're doing at {clinic_name}.\n\nNeuroChiro is the global directory for nervous system chiropractors. I already built a profile for you — it's live here:\n\n{profile_link}\n\nWe have doctors across the country listed, and patients are using it daily to find chiropractors who focus on the nervous system. I think your practice would be a great addition.\n\nClaiming your profile takes 2 minutes — no cost, no catch. Just thought you should know it exists.\n\nWould love to have you in the network.\n\nDr. Raymond Nichols\nFounder, NeuroChiro\nneurochiro.co`,
    },
    {
      id: 'email_phone_follow_up',
      name: 'Email: After Phone Call',
      category: 'email',
      description: 'Send after speaking with them on the phone',
      template: `Subject: Here's the link we talked about\n\nHi {name},\n\nGreat speaking with you! As promised, here's your NeuroChiro profile:\n\n{profile_link}\n\nJust click "Claim This Profile," add your photo and bio, and you're all set. Takes about 2 minutes.\n\nIf you need anything at all, just reply to this email. I'm here to help.\n\nLooking forward to having {clinic_name} in the network.\n\nDr. Raymond Nichols\nFounder, NeuroChiro`,
    },
  ];
}

// ── Get States List ──
export async function getProspectStates() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('outreach_prospects' as any)
    .select('state')
    .order('state');

  const states = [...new Set((data || []).map((d: any) => d.state).filter(Boolean))];
  return states as string[];
}
