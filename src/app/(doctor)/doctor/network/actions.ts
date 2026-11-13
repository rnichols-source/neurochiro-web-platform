'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { communityMemberCopy } from '@/lib/doctor/places'
import { searchForCurrentDoctor, submitReferral } from '@/lib/referrals/data'
import { placeLabel } from '@/lib/referrals/pure'

export type DoctorHit = {
  id: string
  name: string
  clinic: string | null
  place: string
  miles: number | null
  unavailable: string | null
}

export async function searchNetworkDoctors(query: string): Promise<{
  label: string
  note: string
  choices: string[]
  doctors: DoctorHit[]
}> {
  const result = await searchForCurrentDoctor({ query, acceptingOnly: false })
  if (!result) return { label: '', note: 'Sign in to search.', choices: [], doctors: [] }
  return {
    label: result.label,
    note: result.note,
    choices: (result.choices || []).map((place) => placeLabel(place)),
    doctors: result.doctors.slice(0, 8).map((doctor) => ({
      id: doctor.id,
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`.replace(/\s+/g, ' ').trim(),
      clinic: doctor.clinicName,
      place: [doctor.city, doctor.state].filter(Boolean).join(', '),
      miles: doctor.distanceMiles,
      unavailable: doctor.unavailableReason || null,
    })),
  }
}

export async function sendWarmIntro(input: {
  receivingDoctorId: string
  firstName: string
  lastInitial: string
  phone: string
  email: string
  reason: string
  consent: boolean
}): Promise<{ ok: boolean; message: string }> {
  const result = await submitReferral({
    receivingDoctorId: input.receivingDoctorId,
    patientFirstName: input.firstName,
    patientLastInitial: input.lastInitial,
    patientPhone: input.phone,
    patientEmail: input.email,
    reason: input.reason,
    urgency: 'routine',
    consentConfirmed: input.consent,
  })
  if (!result.success) return { ok: false, message: communityMemberCopy(result.error || 'Could not send that intro.') }
  revalidatePath('/doctor/network')
  revalidatePath('/doctor')
  return { ok: true, message: communityMemberCopy(result.message || `Sent to ${result.receiverName || 'that doctor'}.`) }
}

export async function setOpenToStudents(open: boolean): Promise<{ ok: boolean }> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  const admin = createAdminClient() as any
  const updated = await admin.from('doctors').update({ accepts_student_messages: open }).eq('user_id', user.id)
  if (updated.error) return { ok: false }
  revalidatePath('/doctor/network/students')
  return { ok: true }
}
