import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import { formatNewMembers, profileCompleteness, type WeekMember } from './plan.ts'

export async function loadNewMemberLines(): Promise<string[]> {
  const admin = createAdminClient() as any
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await admin
    .from('doctors')
    .select('id, user_id, first_name, last_name, city, clinic_name, bio, photo_url, specialties, hours, phone, address, booking_url, latitude, longitude, sms_alerts_enabled, lead_alert_phones, spotlight_status, live_feature_status, listing_exception, needs_profile_finish, sms_region_note, verified_at')
    .gte('verified_at', since)
    .eq('verification_status', 'verified')
    .limit(40)
  if (error || !Array.isArray(data)) return ['New members this week:', '- None yet, or the new columns are not applied.']
  const members: WeekMember[] = []
  for (const row of data) {
    const specialties = Array.isArray(row.specialties) ? row.specialties.filter((item: unknown) => typeof item === 'string') : []
    const phones = Array.isArray(row.lead_alert_phones) ? row.lead_alert_phones : []
    const score = profileCompleteness({
      clinicName: row.clinic_name || '',
      bio: row.bio || '',
      photo: row.photo_url || '',
      specialties,
      hours: row.hours || '',
      phone: row.phone || '',
      address: row.address || '',
      city: row.city || '',
      bookingUrl: row.booking_url || '',
      latitude: row.latitude == null ? null : Number(row.latitude),
      longitude: row.longitude == null ? null : Number(row.longitude),
      textNumber: row.sms_alerts_enabled === true && phones.length > 0,
    })
    let loginActivated = false
    if (row.user_id) {
      const user = await admin.auth.admin.getUserById(row.user_id).catch(() => null)
      loginActivated = Boolean(user?.data?.user?.last_sign_in_at)
    }
    const exceptions = [row.listing_exception, row.needs_profile_finish ? 'needs profile finish' : '', row.sms_region_note].filter((item: string) => item)
    members.push({
      name: `Dr. ${row.first_name || ''} ${row.last_name || ''}`.replace(/\s+/g, ' ').trim(),
      city: row.city || '',
      loginActivated,
      profilePercent: score.percent,
      textNumber: row.sms_alerts_enabled === true && phones.length > 0,
      spotlightBooked: Boolean(row.spotlight_status && row.spotlight_status !== 'not_scheduled' && row.spotlight_status !== 'not_booked'),
      igLiveBooked: Boolean(row.live_feature_status && row.live_feature_status !== 'not_scheduled' && row.live_feature_status !== 'not_booked'),
      exceptions,
    })
  }
  return formatNewMembers(members)
}
