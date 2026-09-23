'use server'

import { checkAdminAuth } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

interface SubscriberStats {
  total: number;
  confirmed: number;
  pending: number;
  unsubscribed: number;
  byState: { state: string; count: number }[];
  byZipPrefix: { prefix: string; state: string | null; count: number; hasDoctors: boolean }[];
  recentSignups: {
    id: string;
    email: string;
    zip: string;
    state: string | null;
    status: string;
    created_at: string;
    confirmed_at: string | null;
  }[];
  growthByWeek: { week: string; count: number }[];
}

export async function getSubscriberStats(): Promise<SubscriberStats> {
  await checkAdminAuth();
  const supabase = createAdminClient();

  // Get all subscribers
  const { data: subscribers } = await (supabase as any)
    .from('subscribers')
    .select('id, email, zip, state, status, created_at, confirmed_at, unsubscribed_at')
    .order('created_at', { ascending: false });

  const all = subscribers || [];

  const confirmed = all.filter((s: any) => s.status === 'confirmed');
  const pending = all.filter((s: any) => s.status === 'pending');
  const unsubscribed = all.filter((s: any) => s.status === 'unsubscribed');

  // Group by state
  const stateMap = new Map<string, number>();
  for (const s of confirmed) {
    const st = s.state || 'Unknown';
    stateMap.set(st, (stateMap.get(st) || 0) + 1);
  }
  const byState = Array.from(stateMap.entries())
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);

  // Group by 3-digit ZIP prefix
  const prefixMap = new Map<string, { count: number; state: string | null }>();
  for (const s of confirmed) {
    const prefix = s.zip?.slice(0, 3) || '???';
    const existing = prefixMap.get(prefix);
    if (existing) {
      existing.count++;
    } else {
      prefixMap.set(prefix, { count: 1, state: s.state });
    }
  }

  // Check which ZIP prefixes have doctors
  const { data: doctors } = await (supabase as any)
    .from('doctors')
    .select('city, state, address')
    .eq('verification_status', 'verified');

  // Build a set of states that have doctors
  const doctorStates = new Set(
    (doctors || []).map((d: any) => d.state).filter(Boolean)
  );

  const byZipPrefix = Array.from(prefixMap.entries())
    .map(([prefix, data]) => ({
      prefix,
      state: data.state,
      count: data.count,
      hasDoctors: data.state ? doctorStates.has(data.state) : false,
    }))
    .sort((a, b) => b.count - a.count);

  // Recent signups (last 20)
  const recentSignups = all.slice(0, 20).map((s: any) => ({
    id: s.id,
    email: s.email,
    zip: s.zip,
    state: s.state,
    status: s.status,
    created_at: s.created_at,
    confirmed_at: s.confirmed_at,
  }));

  // Growth by week (last 12 weeks)
  const weekMap = new Map<string, number>();
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const key = weekStart.toISOString().slice(0, 10);
    const count = all.filter((s: any) => {
      const created = new Date(s.created_at);
      return created >= weekStart && created < weekEnd;
    }).length;
    weekMap.set(key, count);
  }
  const growthByWeek = Array.from(weekMap.entries())
    .map(([week, count]) => ({ week, count }))
    .reverse();

  return {
    total: all.length,
    confirmed: confirmed.length,
    pending: pending.length,
    unsubscribed: unsubscribed.length,
    byState,
    byZipPrefix,
    recentSignups,
    growthByWeek,
  };
}

/**
 * Extract a 5-digit ZIP from an address string. Returns null if not found.
 */
function extractZipFromAddress(address: string | null): string | null {
  if (!address) return null;
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}

/**
 * Get adjacent 3-digit ZIP prefixes. Simple heuristic: prefix ± 1.
 */
function getAdjacentPrefixes(prefix: string): string[] {
  const num = parseInt(prefix, 10);
  if (isNaN(num)) return [prefix];
  const prefixes = [prefix];
  if (num > 0) prefixes.push(String(num - 1).padStart(3, '0'));
  if (num < 999) prefixes.push(String(num + 1).padStart(3, '0'));
  return prefixes;
}

export type NotifyRadius = 'zip_prefix' | 'state';

export interface NotifyPreview {
  ok: boolean;
  doctorName: string;
  doctorCity: string;
  doctorState: string;
  doctorZipPrefix: string | null;
  radius: NotifyRadius;
  newRecipients: number;
  alreadyNotified: number;
  total: number;
  error?: string;
}

/**
 * Preview who would be notified for a doctor, without sending.
 */
export async function previewDoctorNotification(
  doctorId: string,
  radius: NotifyRadius = 'zip_prefix',
): Promise<NotifyPreview> {
  await checkAdminAuth();
  const supabase = createAdminClient();

  const { data: doctor } = await (supabase as any)
    .from('doctors')
    .select('first_name, last_name, clinic_name, city, state, slug, address')
    .eq('id', doctorId)
    .single();

  if (!doctor) {
    return { ok: false, doctorName: '', doctorCity: '', doctorState: '', doctorZipPrefix: null, radius, newRecipients: 0, alreadyNotified: 0, total: 0, error: 'Doctor not found' };
  }

  const doctorZip = extractZipFromAddress(doctor.address);
  const doctorZipPrefix = doctorZip ? doctorZip.slice(0, 3) : null;

  // Get confirmed subscribers
  let query = (supabase as any)
    .from('subscribers')
    .select('id, email, zip, state')
    .eq('status', 'confirmed')
    .is('unsubscribed_at', null);

  if (radius === 'zip_prefix' && doctorZipPrefix) {
    const prefixes = getAdjacentPrefixes(doctorZipPrefix);
    // Filter subscribers whose ZIP starts with any of the prefixes
    query = query.eq('state', doctor.state); // still scope to state for safety
  } else {
    query = query.eq('state', doctor.state);
  }

  const { data: subscribers } = await query;
  if (!subscribers || subscribers.length === 0) {
    return { ok: true, doctorName: `Dr. ${doctor.first_name} ${doctor.last_name}`, doctorCity: doctor.city, doctorState: doctor.state, doctorZipPrefix, radius, newRecipients: 0, alreadyNotified: 0, total: 0 };
  }

  // Filter by ZIP prefix if using that radius
  let filtered = subscribers;
  if (radius === 'zip_prefix' && doctorZipPrefix) {
    const prefixes = new Set(getAdjacentPrefixes(doctorZipPrefix));
    filtered = subscribers.filter((s: any) => s.zip && prefixes.has(s.zip.slice(0, 3)));
  }

  // Check which have already been notified
  const subIds = filtered.map((s: any) => s.id);
  const { data: alreadySent } = await (supabase as any)
    .from('doctor_notifications')
    .select('subscriber_id')
    .eq('doctor_id', doctorId)
    .in('subscriber_id', subIds.length > 0 ? subIds : ['__none__']);

  const alreadySentSet = new Set((alreadySent || []).map((r: any) => r.subscriber_id));
  const newRecipients = filtered.filter((s: any) => !alreadySentSet.has(s.id)).length;

  return {
    ok: true,
    doctorName: `Dr. ${doctor.first_name} ${doctor.last_name}`,
    doctorCity: doctor.city,
    doctorState: doctor.state,
    doctorZipPrefix,
    radius,
    newRecipients,
    alreadyNotified: alreadySentSet.size,
    total: filtered.length,
  };
}

/**
 * Send doctor-joined notifications with dedup protection.
 */
export async function notifySubscribersNewDoctor(
  doctorId: string,
  radius: NotifyRadius = 'zip_prefix',
): Promise<{ ok: boolean; notified: number; skipped: number; error?: string }> {
  await checkAdminAuth();
  const supabase = createAdminClient();

  const { data: doctor } = await (supabase as any)
    .from('doctors')
    .select('first_name, last_name, clinic_name, city, state, slug, address')
    .eq('id', doctorId)
    .single();

  if (!doctor) {
    return { ok: false, notified: 0, skipped: 0, error: 'Doctor not found' };
  }

  const doctorZip = extractZipFromAddress(doctor.address);
  const doctorZipPrefix = doctorZip ? doctorZip.slice(0, 3) : null;

  // Get confirmed subscribers in scope
  let query = (supabase as any)
    .from('subscribers')
    .select('id, email, zip, state')
    .eq('status', 'confirmed')
    .is('unsubscribed_at', null)
    .eq('state', doctor.state);

  const { data: subscribers } = await query;
  if (!subscribers || subscribers.length === 0) {
    return { ok: true, notified: 0, skipped: 0 };
  }

  // Filter by ZIP prefix if needed
  let filtered = subscribers;
  if (radius === 'zip_prefix' && doctorZipPrefix) {
    const prefixes = new Set(getAdjacentPrefixes(doctorZipPrefix));
    filtered = subscribers.filter((s: any) => s.zip && prefixes.has(s.zip.slice(0, 3)));
  }

  // Exclude already notified
  const subIds = filtered.map((s: any) => s.id);
  const { data: alreadySent } = await (supabase as any)
    .from('doctor_notifications')
    .select('subscriber_id')
    .eq('doctor_id', doctorId)
    .in('subscriber_id', subIds.length > 0 ? subIds : ['__none__']);

  const alreadySentSet = new Set((alreadySent || []).map((r: any) => r.subscriber_id));
  const toNotify = filtered.filter((s: any) => !alreadySentSet.has(s.id));

  if (toNotify.length === 0) {
    return { ok: true, notified: 0, skipped: alreadySentSet.size };
  }

  const { getMarketingResend, getMarketingFrom, getMailingAddress } = await import('@/lib/marketing-email');
  const resend = getMarketingResend();
  const from = getMarketingFrom();
  const address = getMailingAddress();

  const doctorName = `Dr. ${doctor.first_name} ${doctor.last_name}`;
  const profileUrl = `https://neurochiro.co/directory/${doctor.slug}`;

  let notified = 0;

  for (const sub of toNotify) {
    // Write dedup row first
    const { error: dedupErr } = await (supabase as any)
      .from('doctor_notifications')
      .insert({ doctor_id: doctorId, subscriber_id: sub.id });

    if (dedupErr) {
      // Unique constraint hit — already notified (race condition protection)
      continue;
    }

    try {
      await resend.emails.send({
        from,
        to: [sub.email],
        subject: `A NeuroChiro doctor just joined near you`,
        html: `
          <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1E2D3B;padding:28px;text-align:center;">
              <h1 style="color:white;font-size:22px;margin:0;">NEURO<span style="color:#D66829;">CHIRO</span></h1>
            </div>
            <div style="padding:28px;background:white;">
              <p style="font-size:15px;color:#333;line-height:1.7;">Hi there,</p>
              <p style="font-size:15px;color:#333;line-height:1.7;">You signed up to be notified when a nervous system chiropractor joined near you. Good news:</p>
              <div style="background:#f8f6f2;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
                <p style="font-size:18px;font-weight:900;color:#1E2D3B;margin:0 0 4px;">${doctorName}</p>
                <p style="font-size:14px;color:#718096;margin:0;">${doctor.clinic_name} &middot; ${doctor.city}, ${doctor.state}</p>
              </div>
              <p style="font-size:15px;color:#333;line-height:1.7;">Check out their profile and see if they're the right fit for you:</p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${profileUrl}" style="display:inline-block;background:#D66829;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">View Their Profile</a>
              </div>
              <p style="font-size:15px;color:#333;line-height:1.7;">Dr. Ray<br><a href="https://neurochiro.co" style="color:#D66829;">neurochiro.co</a></p>
            </div>
            <div style="background:#f5f3ef;padding:20px;text-align:center;font-size:11px;color:#999;line-height:1.6;">
              <p style="margin:0 0 8px;">This email contains educational content only. It is not medical advice and does not create a doctor-patient relationship.</p>
              <p style="margin:0 0 8px;">${address}</p>
              <p style="margin:0;"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#D66829;">Unsubscribe</a></p>
            </div>
          </div>
        `,
        headers: {
          'List-Unsubscribe': '<{{{RESEND_UNSUBSCRIBE_URL}}}>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });
      notified++;
    } catch (err) {
      console.error(`[DOCTOR-JOINED] Failed to notify ${sub.email}:`, err);
      // Roll back dedup row on send failure
      await (supabase as any).from('doctor_notifications').delete()
        .eq('doctor_id', doctorId).eq('subscriber_id', sub.id);
    }
    await new Promise(r => setTimeout(r, 100));
  }

  return { ok: true, notified, skipped: alreadySentSet.size };
}

export async function getDoctorsForNotification(): Promise<{
  id: string;
  name: string;
  city: string;
  state: string;
  zipPrefix: string | null;
  lastNotifiedAt: string | null;
}[]> {
  await checkAdminAuth();
  const supabase = createAdminClient();

  const { data } = await (supabase as any)
    .from('doctors')
    .select('id, first_name, last_name, city, state, address')
    .eq('verification_status', 'verified')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!data || data.length === 0) return [];

  // Get last notification date for each doctor
  const doctorIds = data.map((d: any) => d.id);
  const { data: notifications } = await (supabase as any)
    .from('doctor_notifications')
    .select('doctor_id, sent_at')
    .in('doctor_id', doctorIds)
    .order('sent_at', { ascending: false });

  const lastNotifiedMap = new Map<string, string>();
  for (const n of (notifications || [])) {
    if (!lastNotifiedMap.has(n.doctor_id)) {
      lastNotifiedMap.set(n.doctor_id, n.sent_at);
    }
  }

  return data.map((d: any) => ({
    id: d.id,
    name: `Dr. ${d.first_name} ${d.last_name}`,
    city: d.city,
    state: d.state,
    zipPrefix: extractZipFromAddress(d.address)?.slice(0, 3) || null,
    lastNotifiedAt: lastNotifiedMap.get(d.id) || null,
  }));
}

export async function exportSubscribersCSV(): Promise<string> {
  await checkAdminAuth();
  const supabase = createAdminClient();

  const { data } = await (supabase as any)
    .from('subscribers')
    .select('email, zip, state, status, created_at, confirmed_at, unsubscribed_at, source')
    .order('created_at', { ascending: false });

  const rows = data || [];
  const header = 'email,zip,state,status,created_at,confirmed_at,unsubscribed_at,source';
  const csvRows = rows.map((r: any) =>
    `${r.email},${r.zip},${r.state || ''},${r.status},${r.created_at},${r.confirmed_at || ''},${r.unsubscribed_at || ''},${r.source || ''}`
  );

  return [header, ...csvRows].join('\n');
}
