import "server-only";
import { createAdminClient } from "@/lib/supabase-admin";
import { parseSeminarDates, timezoneForCity, isUpcoming } from "./dates";
import { countryCode, currencyForCountry } from "./format";
import { dedupeSlugs, isUuid, seminarSlug } from "./slug";
import type { SeminarFilters, SeminarRecord } from "./types";

export type { SeminarFilters, SeminarRecord };

const BASE_COLUMNS = "id, host_id, title, description, dates, location, city, country, venue_name, venue_address, start_time, end_time, event_type, instructor_name, instructor_bio, registration_link, price, ce_hours, categories, tags, target_audience, image_url, hero_image_url, gallery_images, schedule, speakers, faq, listing_tier, is_past, is_approved, page_views, clicks, created_at, updated_at";

const EXTRA_COLUMNS = "slug, starts_at, ends_at, timezone, format, topics, currency, price_from, price_note, registration_mode, status, is_featured, featured_until, capacity, seats_sold, country_code, state, latitude, longitude, tagline, outcomes, hosts, sponsors, whats_included, refund_policy, transfer_policy, travel_info, ce_approving_body, ce_states, ce_notes, audiences";

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function normalize(row: Record<string, unknown>, now = Date.now()): Omit<SeminarRecord, "slug" | "hostDoctor"> & { slug: string } {
  const parsed = parseSeminarDates(String(row.dates || ""));
  const startDate = (row.starts_at ? String(row.starts_at).slice(0, 10) : null) || parsed?.start || null;
  const endDate = (row.ends_at ? String(row.ends_at).slice(0, 10) : null) || parsed?.end || startDate;
  const year = parsed?.year || (startDate ? startDate.slice(0, 4) : "");
  const city = (row.city as string) || null;
  const slug = (typeof row.slug === "string" && row.slug) || seminarSlug(String(row.title || "seminar"), city, year);
  const country = (row.country as string) || null;
  const code = (row.country_code as string) || countryCode(country);
  const upcoming = isUpcoming(endDate, row.is_past === true, now);
  const featuredUntil = (row.featured_until as string) || null;
  const featuredFlag = row.is_featured === true && (!featuredUntil || new Date(featuredUntil).getTime() > now);
  const legacyFeatured = row.is_featured == null && (row.listing_tier === "featured" || row.listing_tier === "premium");
  const format = row.format === "virtual" || row.format === "hybrid" || row.format === "in_person"
    ? row.format
    : "in_person";
  return {
    id: String(row.id),
    slug,
    title: String(row.title || "Seminar"),
    description: (row.description as string) || null,
    tagline: (row.tagline as string) || null,
    dates: (row.dates as string) || null,
    startDate,
    endDate,
    timeZone: (row.timezone as string) || timezoneForCity(city, country),
    city,
    country,
    countryCode: code,
    state: (row.state as string) || null,
    location: (row.location as string) || null,
    venueName: (row.venue_name as string) || null,
    venueAddress: (row.venue_address as string) || null,
    format,
    registrationLink: (row.registration_link as string) || null,
    registrationMode: row.registration_mode === "neurochiro" ? "neurochiro" : "external",
    price: row.price == null ? null : Number(row.price),
    priceFrom: row.price_from == null ? (row.price == null ? null : Number(row.price)) : Number(row.price_from),
    currency: ((row.currency as string) || currencyForCountry(country)).toUpperCase(),
    priceNote: (row.price_note as string) || null,
    ceHours: row.ce_hours == null ? null : Number(row.ce_hours),
    topics: asStringArray(row.topics).length ? asStringArray(row.topics) : asStringArray(row.tags).concat(asStringArray(row.categories)),
    imageUrl: (row.image_url as string) || null,
    heroImageUrl: (row.hero_image_url as string) || (row.image_url as string) || null,
    schedule: row.schedule ?? null,
    speakers: row.speakers ?? null,
    faq: row.faq ?? null,
    outcomes: Array.isArray(row.outcomes) ? row.outcomes.map(String) : null,
    whatsIncluded: Array.isArray(row.whats_included) ? row.whats_included.map(String) : null,
    hosts: row.hosts ?? null,
    sponsors: row.sponsors ?? null,
    refundPolicy: (row.refund_policy as string) || null,
    transferPolicy: (row.transfer_policy as string) || null,
    travelInfo: row.travel_info ?? null,
    ceApprovingBody: (row.ce_approving_body as string) || null,
    ceStates: Array.isArray(row.ce_states) ? row.ce_states.map(String) : null,
    ceNotes: (row.ce_notes as string) || null,
    audiences: row.audiences ?? null,
    capacity: row.capacity == null ? null : Number(row.capacity),
    seatsSold: Number(row.seats_sold || 0),
    featured: featuredFlag || legacyFeatured,
    featuredUntil,
    status: (row.status as string) || (row.is_approved ? "published" : "submitted"),
    approved: row.is_approved === true || row.status === "published" || row.status === "completed",
    past: !upcoming,
    upcoming,
    hostId: (row.host_id as string) || null,
    instructorName: (row.instructor_name as string) || null,
    instructorBio: (row.instructor_bio as string) || null,
    pageViews: Number(row.page_views || 0),
    clicks: Number(row.clicks || 0),
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    raw: row,
  };
}

async function loadRows(): Promise<Record<string, unknown>[]> {
  const admin = createAdminClient() as unknown as { from: (table: string) => { select: (columns: string) => { limit: (n: number) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> } } };
  // intentional bound: the public seminar catalog is small
  const extended = await admin.from("seminars").select(`${BASE_COLUMNS}, ${EXTRA_COLUMNS}`).limit(200);
  let rows = !extended.error && extended.data ? extended.data : null;
  if (!rows) {
    const basic = await admin.from("seminars").select(BASE_COLUMNS).limit(200);
    if (basic.error || !basic.data) {
      console.error("[seminars] list failed", basic.error?.message || extended.error?.message || "empty");
      return [];
    }
    rows = basic.data;
  }
  return [...rows].sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
}

async function attachHosts(rows: SeminarRecord[]): Promise<SeminarRecord[]> {
  const ids = [...new Set(rows.map((row) => row.hostId).filter(Boolean))] as string[];
  if (!ids.length) return rows.map((row) => ({ ...row, hostDoctor: null }));
  const admin = createAdminClient();
  const { data } = await admin
    .from("doctors")
    .select("user_id, slug, first_name, last_name, photo_url, clinic_name")
    .in("user_id", ids);
  const byUser = new Map((data || []).map((doctor) => [doctor.user_id, doctor]));
  return rows.map((row) => ({
    ...row,
    hostDoctor: row.hostId ? (byUser.get(row.hostId) as SeminarRecord["hostDoctor"]) || null : null,
  }));
}

function visible(row: SeminarRecord): boolean {
  return row.approved && (row.status === "published" || row.status === "completed" || row.status === "approved");
}

export async function listSeminars(filters: SeminarFilters = {}, now = Date.now()): Promise<SeminarRecord[]> {
  const loaded = dedupeSlugs((await loadRows()).map((row) => normalize(row, now))).map((row) => ({ ...row, hostDoctor: null }));
  const withHosts = await attachHosts(loaded.filter(visible));
  const past = filters.past || filters.when === "past";
  let rows = withHosts.filter((row) => (past ? row.past : row.upcoming));
  if (filters.topic) rows = rows.filter((row) => row.topics.some((topic) => topic.toLowerCase() === filters.topic!.toLowerCase()));
  if (filters.country) rows = rows.filter((row) => row.countryCode === filters.country!.toUpperCase() || (row.country || "").toLowerCase() === filters.country!.toLowerCase());
  if (filters.format) rows = rows.filter((row) => row.format === filters.format);
  if (filters.ce) rows = rows.filter((row) => (row.ceHours || 0) > 0);
  if (filters.price === "under-500") rows = rows.filter((row) => (row.priceFrom || 0) > 0 && (row.priceFrom || 0) < 500);
  if (filters.price === "500-plus") rows = rows.filter((row) => (row.priceFrom || 0) >= 500);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter((row) => `${row.title} ${row.city || ""} ${row.description || ""}`.toLowerCase().includes(q));
  }
  if (filters.when === "next-3-months") {
    const horizon = now + 1000 * 60 * 60 * 24 * 92;
    rows = rows.filter((row) => {
      if (!row.startDate) return true;
      return new Date(`${row.startDate}T12:00:00Z`).getTime() <= horizon;
    });
  }
  rows.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const aTime = a.startDate ? new Date(`${a.startDate}T12:00:00Z`).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.startDate ? new Date(`${b.startDate}T12:00:00Z`).getTime() : Number.MAX_SAFE_INTEGER;
    return past ? bTime - aTime : aTime - bTime;
  });
  return rows;
}

export async function getSeminarBySlug(param: string, now = Date.now()): Promise<SeminarRecord | null> {
  const rows = dedupeSlugs((await loadRows()).map((row) => normalize(row, now))).map((row) => ({ ...row, hostDoctor: null }));
  const match = isUuid(param)
    ? rows.find((row) => row.id === param)
    : rows.find((row) => row.slug === param);
  if (!match || !visible(match)) return null;
  const [withHost] = await attachHosts([match]);
  return withHost;
}

export async function getRelated(seminar: SeminarRecord, now = Date.now()): Promise<SeminarRecord[]> {
  const rows = await listSeminars({}, now);
  return rows.filter((row) => row.id !== seminar.id && (row.countryCode === seminar.countryCode || row.topics.some((topic) => seminar.topics.includes(topic)))).slice(0, 3);
}

export async function getHostSummary(hostId: string | null) {
  if (!hostId) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("doctors")
    .select("slug, first_name, last_name, photo_url, clinic_name, bio, city, state")
    .eq("user_id", hostId)
    .maybeSingle();
  return data;
}
