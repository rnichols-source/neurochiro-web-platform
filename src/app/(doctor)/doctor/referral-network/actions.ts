'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { haversineDistance, boundingBox, isValidCoord } from '@/lib/geo'
import { getThresholds } from '@/lib/thresholds'
import { detectPostalCode } from '@/lib/detect-postal'
import { Resend } from 'resend'
import { wrapEmail } from '@/lib/email-template'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '')
}

const FROM = 'Dr. Ray <support@neurochirodirectory.com>'

async function getCurrentDoctor(): Promise<{ userId: string; doctorId: string; firstName: string; lastName: string; clinicName: string | null } | null> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: doc } = await (admin as any)
    .from('doctors')
    .select('id, first_name, last_name, clinic_name')
    .eq('user_id', user.id)
    .single()

  if (!doc) return null
  return {
    userId: user.id,
    doctorId: doc.id,
    firstName: doc.first_name,
    lastName: doc.last_name,
    clinicName: doc.clinic_name,
  }
}

async function geocodeQuery(query: string, country: string): Promise<{ lat: number; lng: number; city: string; state: string } | null> {
  const admin = createAdminClient()
  const trimmed = query.trim()

  // Try postal code detection first
  const postal = detectPostalCode(trimmed, country)
  if (postal) {
    const { data } = await (admin as any)
      .from('zip_codes')
      .select('city, state, lat, lng')
      .eq('zip', postal.code)
      .eq('country', postal.country)
      .maybeSingle()

    if (data) {
      return { lat: Number(data.lat), lng: Number(data.lng), city: data.city, state: data.state }
    }
  }

  // Try city name lookup in zip_codes
  // Parse "City, State" or just "City"
  const parts = trimmed.split(/[,\s]+/).filter(Boolean)
  if (parts.length >= 1) {
    // Try exact city match (case insensitive)
    let q = (admin as any)
      .from('zip_codes')
      .select('city, state, lat, lng')
      .ilike('city', trimmed.split(',')[0].trim())
      .eq('country', country)
      .limit(1) // intentional bound

    const { data } = await q
    if (data && data.length > 0) {
      return { lat: Number(data[0].lat), lng: Number(data[0].lng), city: data[0].city, state: data[0].state }
    }
  }

  return null
}

// ── Doctor search result type ────────────────────────────────────────────────

export interface ReferralDoctorResult {
  id: string
  first_name: string
  last_name: string
  clinic_name: string | null
  city: string | null
  state: string | null
  country: string | null
  distance_miles: number
  photo_url: string | null
  instagram_handle_normalized: string | null
  slug: string | null
}

// ── 1. Search doctors for referral ───────────────────────────────────────────

export async function searchDoctorsForReferral(
  query: string,
  country: string = 'US'
): Promise<{ doctors: ReferralDoctorResult[]; noResults: boolean; geocodeFailed: boolean; searchLabel: string }> {
  const me = await getCurrentDoctor()
  if (!me) return { doctors: [], noResults: true, geocodeFailed: false, searchLabel: 'Not authenticated' }

  const geo = await geocodeQuery(query, country)
  if (!geo) {
    return { doctors: [], noResults: true, geocodeFailed: true, searchLabel: `We couldn't find that postcode or city. Try searching by city name instead.` }
  }

  const admin = createAdminClient()
  const thresholds = await getThresholds()
  const radii = [thresholds.directory_default, thresholds.directory_expansion_1, thresholds.directory_expansion_2]

  for (const radius of radii) {
    const [minLng, minLat, maxLng, maxLat] = boundingBox(geo.lat, geo.lng, radius)

    const { data: doctors } = await (admin as any)
      .from('doctors')
      .select('id, first_name, last_name, clinic_name, city, state, country, latitude, longitude, photo_url, instagram_handle_normalized, slug')
      .eq('verification_status', 'verified')
      .eq('membership_tier', 'pro')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .neq('id', me.doctorId)
      .limit(200) // intentional bound

    if (!doctors || doctors.length === 0) continue

    // Calculate exact distances and filter
    const results: ReferralDoctorResult[] = doctors
      .filter((d: any) => isValidCoord(d.latitude, d.longitude))
      .map((d: any) => ({
        id: d.id,
        first_name: d.first_name,
        last_name: d.last_name,
        clinic_name: d.clinic_name,
        city: d.city,
        state: d.state,
        country: d.country,
        distance_miles: haversineDistance(geo.lat, geo.lng, Number(d.latitude), Number(d.longitude)),
        photo_url: d.photo_url,
        instagram_handle_normalized: d.instagram_handle_normalized,
        slug: d.slug,
      }))
      .filter((d: ReferralDoctorResult) => d.distance_miles <= radius)
      .sort((a: ReferralDoctorResult, b: ReferralDoctorResult) => a.distance_miles - b.distance_miles)

    if (results.length > 0) {
      return {
        doctors: results,
        noResults: false,
        geocodeFailed: false,
        searchLabel: `${results.length} doctor${results.length === 1 ? '' : 's'} near ${geo.city}, ${geo.state}`,
      }
    }
  }

  // No doctors found at any radius. Log gap.
  await logReferralGap(geo.city, geo.state, country, geo.lat, geo.lng)

  return {
    doctors: [],
    noResults: true,
    geocodeFailed: false,
    searchLabel: `No NeuroChiro member found near ${geo.city}, ${geo.state}`,
  }
}

// ── 2. Submit referral ───────────────────────────────────────────────────────

export interface ReferralSubmission {
  receivingDoctorId: string
  patientFirstName: string
  patientLastInitial: string
  patientPhone: string
  patientEmail?: string
  patientCity?: string
  patientZip?: string
  reason: string
  urgency: 'routine' | 'urgent'
  consentConfirmed: boolean
}

export async function submitReferral(data: ReferralSubmission): Promise<{ success: boolean; error?: string; referralId?: string }> {
  const me = await getCurrentDoctor()
  if (!me) return { success: false, error: 'Not authenticated' }

  if (!data.consentConfirmed) {
    return { success: false, error: 'Patient consent is required to share their information.' }
  }

  if (!data.patientFirstName.trim() || !data.patientLastInitial.trim() || !data.reason.trim() || !data.patientPhone.trim()) {
    return { success: false, error: 'Please fill in all required fields.' }
  }

  const admin = createAdminClient()

  // Get receiving doctor info for email
  const { data: receiver } = await (admin as any)
    .from('doctors')
    .select('id, user_id, first_name, last_name, clinic_name, email')
    .eq('id', data.receivingDoctorId)
    .single()

  if (!receiver) return { success: false, error: 'Receiving doctor not found.' }

  // Get receiver's email from profiles (authoritative for email)
  const { data: receiverProfile } = await (admin as any)
    .from('profiles')
    .select('email')
    .eq('id', receiver.user_id)
    .single()

  const receiverEmail = receiverProfile?.email || receiver.email

  // Insert the referral
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  const { data: referral, error: insertError } = await (admin as any)
    .from('doctor_referrals')
    .insert({
      referring_doctor_id: me.doctorId,
      receiving_doctor_id: data.receivingDoctorId,
      patient_first_name: data.patientFirstName.trim(),
      patient_last_initial: data.patientLastInitial.trim().charAt(0).toUpperCase(),
      patient_phone: data.patientPhone.trim(),
      patient_email: data.patientEmail?.trim() || null,
      patient_city: data.patientCity?.trim() || null,
      patient_zip: data.patientZip?.trim() || null,
      reason: data.reason.trim(),
      urgency: data.urgency,
      consent_confirmed: true,
      status: 'pending',
      created_at: now,
      expires_at: expiresAt,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[REFERRAL] Insert error:', insertError.message)
    return { success: false, error: 'Failed to create referral. Please try again.' }
  }

  // Send email to receiving doctor (non-identifying info only)
  const urgencyLabel = data.urgency === 'urgent' ? '<span style="color:#ef4444;font-weight:900;">URGENT</span>' : 'Routine'
  try {
    const resend = getResend()
    await resend.emails.send({
      from: FROM,
      to: receiverEmail,
      subject: `New Patient Referral from Dr. ${me.firstName} ${me.lastName}`,
      html: wrapEmail(`
        <h1>You Have a New Patient Referral</h1>
        <p><strong>Dr. ${me.firstName} ${me.lastName}</strong>${me.clinicName ? ` (${me.clinicName})` : ''} is referring a patient to you.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:8px 0;color:#9CA3AF;font-size:14px;">Patient</td><td style="padding:8px 0;font-weight:700;">${data.patientFirstName} ${data.patientLastInitial}.</td></tr>
          ${data.patientCity ? `<tr><td style="padding:8px 0;color:#9CA3AF;font-size:14px;">Patient City</td><td style="padding:8px 0;">${data.patientCity}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#9CA3AF;font-size:14px;">Reason</td><td style="padding:8px 0;">${data.reason}</td></tr>
          <tr><td style="padding:8px 0;color:#9CA3AF;font-size:14px;">Urgency</td><td style="padding:8px 0;">${urgencyLabel}</td></tr>
        </table>
        <p style="font-size:14px;color:#6B7280;">Log in to your dashboard to accept or decline this referral. Patient contact info will be shared once you accept.</p>
        <div style="text-align:center;margin-top:30px;">
          <a href="https://neurochiro.co/doctor/referral-network?tab=received" style="display:inline-block;background-color:#D66829;color:#FFFFFF;padding:16px 32px;text-decoration:none;border-radius:12px;font-weight:900;font-size:14px;letter-spacing:1px;text-transform:uppercase;">View Referral</a>
        </div>
      `),
    })
  } catch (e) {
    console.error('[REFERRAL] Email send error:', e)
    // Non-critical, referral still created
  }

  // In-app notification for receiving doctor
  try {
    await (admin as any).from('notifications').insert({
      user_id: receiver.user_id,
      title: 'New Patient Referral',
      body: `Dr. ${me.firstName} ${me.lastName} referred a patient to you. ${data.urgency === 'urgent' ? '(URGENT)' : ''}`,
      type: 'referral',
      link: '/doctor/referral-network?tab=received',
      priority: data.urgency === 'urgent' ? 'urgent' : 'info',
    })
  } catch {
    // Non-critical
  }

  // Mark notified
  await (admin as any)
    .from('doctor_referrals')
    .update({ notified_at: now })
    .eq('id', referral.id)

  return { success: true, referralId: referral.id }
}

// ── 3. Respond to referral ───────────────────────────────────────────────────

export async function respondToReferral(
  referralId: string,
  action: 'accept' | 'decline',
  declineReason?: string
): Promise<{ success: boolean; error?: string }> {
  const me = await getCurrentDoctor()
  if (!me) return { success: false, error: 'Not authenticated' }

  const admin = createAdminClient()

  // Fetch referral to verify ownership and get details
  const { data: referral } = await (admin as any)
    .from('doctor_referrals')
    .select('*, referring_doctor:referring_doctor_id(id, user_id, first_name, last_name, clinic_name)')
    .eq('id', referralId)
    .eq('receiving_doctor_id', me.doctorId)
    .eq('status', 'pending')
    .single()

  if (!referral) return { success: false, error: 'Referral not found or already responded to.' }

  const now = new Date().toISOString()
  const newStatus = action === 'accept' ? 'accepted' : 'declined'

  const updatePayload: Record<string, any> = {
    status: newStatus,
    responded_at: now,
  }
  if (action === 'decline' && declineReason) {
    updatePayload.decline_reason = declineReason
  }

  const { error: updateError } = await (admin as any)
    .from('doctor_referrals')
    .update(updatePayload)
    .eq('id', referralId)

  if (updateError) {
    console.error('[REFERRAL] Update error:', updateError.message)
    return { success: false, error: 'Failed to update referral.' }
  }

  // Get referring doctor's email
  const referringDoctor = referral.referring_doctor
  const { data: referrerProfile } = await (admin as any)
    .from('profiles')
    .select('email')
    .eq('id', referringDoctor.user_id)
    .single()

  const referrerEmail = referrerProfile?.email

  if (referrerEmail) {
    try {
      const resend = getResend()
      if (action === 'accept') {
        await resend.emails.send({
          from: FROM,
          to: referrerEmail,
          subject: `Referral Accepted by Dr. ${me.firstName} ${me.lastName}`,
          html: wrapEmail(`
            <h1>Your Referral Was Accepted</h1>
            <p><strong>Dr. ${me.firstName} ${me.lastName}</strong>${me.clinicName ? ` (${me.clinicName})` : ''} accepted your referral for <strong>${referral.patient_first_name} ${referral.patient_last_initial}.</strong></p>
            <p>They now have the patient's contact information and will be reaching out directly.</p>
            <div style="text-align:center;margin-top:30px;">
              <a href="https://neurochiro.co/doctor/referral-network?tab=sent" style="display:inline-block;background-color:#D66829;color:#FFFFFF;padding:16px 32px;text-decoration:none;border-radius:12px;font-weight:900;font-size:14px;letter-spacing:1px;text-transform:uppercase;">View in Dashboard</a>
            </div>
          `),
        })
      } else {
        await resend.emails.send({
          from: FROM,
          to: referrerEmail,
          subject: `Referral Declined by Dr. ${me.firstName} ${me.lastName}`,
          html: wrapEmail(`
            <h1>Your Referral Was Declined</h1>
            <p><strong>Dr. ${me.firstName} ${me.lastName}</strong> was unable to accept your referral for <strong>${referral.patient_first_name} ${referral.patient_last_initial}.</strong></p>
            ${declineReason ? `<p style="color:#6B7280;font-style:italic;">"${declineReason}"</p>` : ''}
            <p>You can search for another doctor in that area to re-refer this patient.</p>
            <div style="text-align:center;margin-top:30px;">
              <a href="https://neurochiro.co/doctor/referral-network" style="display:inline-block;background-color:#D66829;color:#FFFFFF;padding:16px 32px;text-decoration:none;border-radius:12px;font-weight:900;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Find Another Doctor</a>
            </div>
          `),
        })
      }
    } catch (e) {
      console.error('[REFERRAL] Response email error:', e)
    }
  }

  // In-app notification for referring doctor
  try {
    await (admin as any).from('notifications').insert({
      user_id: referringDoctor.user_id,
      title: action === 'accept' ? 'Referral Accepted' : 'Referral Declined',
      body: action === 'accept'
        ? `Dr. ${me.firstName} ${me.lastName} accepted your referral for ${referral.patient_first_name} ${referral.patient_last_initial}.`
        : `Dr. ${me.firstName} ${me.lastName} declined your referral for ${referral.patient_first_name} ${referral.patient_last_initial}.${declineReason ? ' Reason: ' + declineReason : ''}`,
      type: 'referral',
      link: '/doctor/referral-network?tab=sent',
      priority: 'info',
    })
  } catch {
    // Non-critical
  }

  return { success: true }
}

// ── 4. Get my referrals ──────────────────────────────────────────────────────

export interface ReferralRecord {
  id: string
  patient_first_name: string
  patient_last_initial: string
  patient_phone: string | null
  patient_email: string | null
  patient_city: string | null
  patient_zip: string | null
  reason: string
  urgency: string
  status: string
  decline_reason: string | null
  created_at: string
  responded_at: string | null
  expires_at: string | null
  // Joined doctor info
  other_doctor_name: string
  other_doctor_clinic: string | null
  other_doctor_photo: string | null
  other_doctor_id: string
}

export async function getMyReferrals(): Promise<{ sent: ReferralRecord[]; received: ReferralRecord[] } | null> {
  const me = await getCurrentDoctor()
  if (!me) return null

  const admin = createAdminClient()

  // Sent referrals: read from table directly (referrer sees all info)
  const { data: sentRaw } = await (admin as any)
    .from('doctor_referrals')
    .select('*, receiving_doctor:receiving_doctor_id(id, first_name, last_name, clinic_name, photo_url)')
    .eq('referring_doctor_id', me.doctorId)
    .order('created_at', { ascending: false })
    .limit(100) // intentional bound

  // Received referrals: read from the safe view (PHI gated)
  const { data: receivedRaw } = await (admin as any)
    .from('doctor_referrals_safe')
    .select('*, referring_doctor:referring_doctor_id(id, first_name, last_name, clinic_name, photo_url)')
    .eq('receiving_doctor_id', me.doctorId)
    .order('created_at', { ascending: false })
    .limit(100) // intentional bound

  const mapSent = (r: any): ReferralRecord => ({
    id: r.id,
    patient_first_name: r.patient_first_name,
    patient_last_initial: r.patient_last_initial,
    patient_phone: r.patient_phone,
    patient_email: r.patient_email,
    patient_city: r.patient_city,
    patient_zip: r.patient_zip,
    reason: r.reason,
    urgency: r.urgency,
    status: r.status,
    decline_reason: r.decline_reason,
    created_at: r.created_at,
    responded_at: r.responded_at,
    expires_at: r.expires_at,
    other_doctor_name: `Dr. ${r.receiving_doctor?.first_name || ''} ${r.receiving_doctor?.last_name || ''}`.trim(),
    other_doctor_clinic: r.receiving_doctor?.clinic_name || null,
    other_doctor_photo: r.receiving_doctor?.photo_url || null,
    other_doctor_id: r.receiving_doctor?.id || '',
  })

  const mapReceived = (r: any): ReferralRecord => ({
    id: r.id,
    patient_first_name: r.patient_first_name,
    patient_last_initial: r.patient_last_initial,
    patient_phone: r.patient_phone, // null until accepted (safe view)
    patient_email: r.patient_email, // null until accepted (safe view)
    patient_city: r.patient_city,
    patient_zip: r.patient_zip,
    reason: r.reason,
    urgency: r.urgency,
    status: r.status,
    decline_reason: r.decline_reason,
    created_at: r.created_at,
    responded_at: r.responded_at,
    expires_at: r.expires_at,
    other_doctor_name: `Dr. ${r.referring_doctor?.first_name || ''} ${r.referring_doctor?.last_name || ''}`.trim(),
    other_doctor_clinic: r.referring_doctor?.clinic_name || null,
    other_doctor_photo: r.referring_doctor?.photo_url || null,
    other_doctor_id: r.referring_doctor?.id || '',
  })

  return {
    sent: (sentRaw || []).map(mapSent),
    received: (receivedRaw || []).map(mapReceived),
  }
}

// ── 5. Log referral gap ──────────────────────────────────────────────────────

export async function logReferralGap(
  city: string,
  state: string,
  country: string,
  lat?: number,
  lng?: number
): Promise<void> {
  try {
    const admin = createAdminClient()
    await (admin as any).from('demand_mentions').insert({
      city,
      state,
      lat: lat || null,
      lng: lng || null,
      country: country || 'US',
      source: 'referral_search',
      status: 'unworked',
    })
  } catch (e) {
    console.error('[REFERRAL] Gap log error:', e)
  }
}
