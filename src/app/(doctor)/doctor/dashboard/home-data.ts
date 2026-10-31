import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import type { AttentionItem, SetupFields } from './home-types';

export type { AttentionItem, SetupFields };

function scheduleLabel(status?: string | null, date?: string | null): string {
  const value = (status || "not_scheduled").toLowerCase();
  if (value === "completed" || value === "done") return "Done";
  if (value === "scheduled" || value === "booked") {
    if (date) {
      const parsed = new Date(date);
      if (!Number.isNaN(parsed.getTime())) {
        const label = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "America/New_York",
        }).format(parsed);
        return `Scheduled ${label}`;
      }
    }
    return "Scheduled";
  }
  return "Not scheduled yet. We'll reach out.";
}

export async function getSpotlight(doctorId: string): Promise<{ spotlight: string; content: string }> {
  const fallback = "Not scheduled yet. We'll reach out.";
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from("doctors")
    .select("spotlight_status, spotlight_date, live_feature_status, live_feature_date")
    .eq("id", doctorId)
    .maybeSingle();
  if (error || !data) return { spotlight: fallback, content: fallback };
  return {
    spotlight: scheduleLabel(data.spotlight_status, data.spotlight_date),
    content: scheduleLabel(data.live_feature_status, data.live_feature_date),
  };
}

export async function getSetupFields(doctorId: string): Promise<SetupFields> {
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from('doctors')
    .select('photo_url, bio, short_intro, phone, city, address, specialties, first_visit_price, payment_model, slug')
    .eq('id', doctorId)
    .maybeSingle();
  if (error || !data) return { photo: false, bio: false, address: false, services: false, slug: null };
  return {
    photo: Boolean(data.photo_url),
    bio: Boolean((data.bio && data.bio.length >= 20) || (data.short_intro && data.short_intro.length >= 20)),
    address: Boolean(data.phone && (data.city || data.address)),
    services: Boolean((data.specialties && data.specialties.length) || data.first_visit_price || data.payment_model),
    slug: data.slug || null,
  };
}

export async function getAttention(doctorId: string, unreadMessages: number): Promise<AttentionItem[]> {
  const admin = createAdminClient() as any;
  const staleBefore = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const [contacts, leads] = await Promise.all([
    admin
      .from('contact_requests')
      .select('id, name, phone, note, contact_outcome, created_at')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })
      .limit(6),
    admin
      .from('leads')
      .select('id, name, created_at')
      .eq('doctor_id', doctorId)
      .eq('stage', 'new')
      .lt('created_at', staleBefore)
      .limit(4),
  ]);
  const items: AttentionItem[] = [];
  if (!contacts.error && Array.isArray(contacts.data)) {
    for (const row of contacts.data) {
      if (row.contact_outcome === 'patient_contacted_confirmed') continue;
      items.push({
        id: row.id,
        title: row.name || 'Patient',
        detail: row.note || 'Asked your office to call',
        phone: row.phone,
        kind: 'request',
      });
    }
  }
  if (!leads.error && Array.isArray(leads.data)) {
    for (const row of leads.data) {
      items.push({
        id: row.id,
        title: row.name || 'Lead',
        detail: 'Waiting more than 2 days',
        kind: 'lead',
        href: '/doctor/leads',
      });
    }
  }
  if (unreadMessages > 0) {
    items.unshift({
      id: 'messages',
      title: `${unreadMessages} unread message${unreadMessages === 1 ? '' : 's'}`,
      detail: 'Open messages',
      kind: 'message',
      href: '/doctor/messages',
    });
  }
  return items.slice(0, 8);
}

export async function getViewSeries(doctorId: string): Promise<number[]> {
  const admin = createAdminClient() as any;
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const events = await admin
    .from('analytics_events')
    .select('created_at')
    .eq('doctor_id', doctorId)
    .eq('event_type', 'profile_view')
    .gte('created_at', start);
  if (events.error || !Array.isArray(events.data)) return [];
  const days = new Set<string>();
  for (const row of events.data as { created_at?: string }[]) {
    const key = (row.created_at || '').slice(0, 10);
    if (key) days.add(key);
  }
  if (days.size < 14) return [];
  const buckets = new Map<string, number>();
  for (const day of days) buckets.set(day, 0);
  for (const row of events.data as { created_at?: string }[]) {
    const key = (row.created_at || '').slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, count]) => count);
}
