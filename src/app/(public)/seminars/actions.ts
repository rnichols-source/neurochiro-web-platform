'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { isUpcoming, parseSeminarDates } from '@/lib/seminars/dates'

// Public columns only. admin_notes, payment_status, host_type_at_submission
// are revoked from anon/authenticated via column-level grants.
const SEMINAR_PUBLIC_COLUMNS = 'id, host_id, title, description, dates, location, city, country, venue_name, venue_address, start_time, end_time, event_type, instructor_name, instructor_bio, registration_link, price, ce_hours, categories, tags, target_audience, image_url, hero_image_url, gallery_images, schedule, speakers, faq, listing_tier, is_past, is_approved, page_views, clicks, created_at, updated_at' as const;

export interface SeminarFilterOptions {
  country?: string;
  city?: string;
  instructor?: string;
  eventType?: string;
  showPast?: boolean;
}

export async function getSeminars(options: SeminarFilterOptions = {}) {

  const supabase = createServerSupabase()

  let query = supabase
    .from('seminars')
    .select(SEMINAR_PUBLIC_COLUMNS)
    .eq('is_approved', true)

  if (options.country && options.country !== 'All') {
    query = query.eq('country', options.country)
  }
  
  if (options.city && options.city !== 'All') {
    query = query.eq('city', options.city)
  }

  if (options.instructor && options.instructor !== 'All') {
    query = query.ilike('instructor_name', `%${options.instructor}%`)
  }

  if (options.eventType && options.eventType !== 'All') {
    query = query.eq('event_type', options.eventType)
  }

  if (options.showPast) {
    query = query.eq('is_past', true)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching seminars:", error)
    return []
  }

  const rows = ((data || []) as Array<{ dates?: string | null; is_past?: boolean | null }>).filter((row) => {
    const end = parseSeminarDates(row.dates)?.end || null
    return options.showPast ? !isUpcoming(end, row.is_past) : isUpcoming(end, row.is_past)
  })
  rows.sort((a, b) => {
    const aStart = parseSeminarDates(a.dates)?.start || ""
    const bStart = parseSeminarDates(b.dates)?.start || ""
    return options.showPast ? bStart.localeCompare(aStart) : aStart.localeCompare(bStart)
  })

  return rows
}

export async function getSeminarsForMap() {
  // Note: latitude/longitude/is_boosted columns don't exist.
  // Map uses address-based geocoding via Google Maps embed.
  const supabase = createServerSupabase()

  const { data, error } = await supabase
    .from('seminars')
    .select('id, title, city, country, dates, instructor_name, venue_address, listing_tier')
    .eq('is_approved', true)
    .eq('is_past', false)
    .order('created_at', { ascending: true })

  if (error) {
    console.error("Error fetching map seminars:", error)
    return []
  }

  return ((data || []) as Array<{ dates?: string | null }>).filter((row) => isUpcoming(parseSeminarDates(row.dates)?.end || null, false))
}

export async function getSeminarBySlugAction(param: string) {
  const { getSeminarBySlug } = await import('@/lib/seminars/queries')
  const seminar = await getSeminarBySlug(param)
  if (!seminar) return null
  return {
    id: seminar.id,
    slug: seminar.slug,
    title: seminar.title,
    speakers: seminar.speakers,
    city: seminar.city,
    dates: seminar.dates,
  }
}

export async function getSeminarById(id: string) {

    const supabase = createServerSupabase()
    const { data, error } = await supabase
        .from('seminars')
        .select(SEMINAR_PUBLIC_COLUMNS)
        .eq('id', id)
        .single() as { data: any; error: any }

    if (error) {
        console.error("Error fetching seminar:", error)
        return null
    }

    // Look up host doctor's directory slug for cross-linking
    if (data?.host_id) {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('slug, first_name, last_name, photo_url, clinic_name')
        .eq('user_id', data.host_id)
        .maybeSingle()
      if (doctor) {
        data.host_doctor = doctor;
      }
    }

    return data
}

export async function registerForSeminar(seminarId: string) {
  void seminarId
  return { error: "Open the seminar page to RSVP or register." }
}

export async function captureEventInterest(seminarId: string, email: string, name?: string) {
  const supabase = createServerSupabase()

  // Store in leads table
  const { error } = await supabase
    .from('leads')
    .insert({
      email,
      full_name: name || null,
      source: 'seminar_interest',
      metadata: { seminar_id: seminarId },
    })

  if (error) {
    if (error.code === '23505') return { error: 'You\'re already on the list!' }
    console.error("Lead capture error:", error)
    return { error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}
