'use server'

import {
  acceptReferral,
  declineReferral,
  listMyReferrals,
  searchForCurrentDoctor,
  submitReferral as sendReferral,
} from '@/lib/referrals/data'

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

export async function searchDoctorsForReferral(query: string, country: string = 'US') {
  const result = await searchForCurrentDoctor({ query, country, acceptingOnly: false })
  if (!result) return { doctors: [] as ReferralDoctorResult[], noResults: true, geocodeFailed: false, searchLabel: 'Sign in to search.' }
  const doctors: ReferralDoctorResult[] = result.doctors.map((doctor) => ({
    id: doctor.id,
    first_name: doctor.firstName,
    last_name: doctor.lastName,
    clinic_name: doctor.clinicName,
    city: doctor.city,
    state: doctor.state,
    country: doctor.country,
    distance_miles: doctor.distanceMiles || 0,
    photo_url: doctor.photoUrl,
    instagram_handle_normalized: null,
    slug: doctor.slug,
  }))
  return {
    doctors,
    noResults: doctors.length === 0,
    geocodeFailed: false,
    searchLabel: result.label,
  }
}

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

export async function submitReferral(data: ReferralSubmission) {
  return sendReferral({
    receivingDoctorId: data.receivingDoctorId,
    patientFirstName: data.patientFirstName,
    patientLastInitial: data.patientLastInitial,
    patientPhone: data.patientPhone,
    patientEmail: data.patientEmail,
    patientZip: data.patientZip,
    reason: data.reason,
    urgency: data.urgency,
    consentConfirmed: data.consentConfirmed,
  })
}

export async function respondToReferral(referralId: string, action: 'accept' | 'decline', declineReason?: string) {
  if (action === 'accept') return acceptReferral(referralId)
  return declineReferral(referralId, declineReason || '')
}

export async function getMyReferrals() {
  const data = await listMyReferrals()
  if (!data) return null
  const map = (row: {
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
    other_name?: string
    other_id?: string
  }) => ({
    id: row.id,
    patient_first_name: row.patient_first_name,
    patient_last_initial: row.patient_last_initial,
    patient_phone: row.patient_phone,
    patient_email: row.patient_email,
    patient_city: row.patient_city,
    patient_zip: row.patient_zip,
    reason: row.reason,
    urgency: row.urgency,
    status: row.status,
    decline_reason: row.decline_reason,
    created_at: row.created_at,
    responded_at: row.responded_at,
    expires_at: row.expires_at,
    other_doctor_name: row.other_name || 'Doctor',
    other_doctor_clinic: null,
    other_doctor_photo: null,
    other_doctor_id: row.other_id || '',
  })
  return { sent: data.sent.map(map), received: data.received.map(map) }
}
