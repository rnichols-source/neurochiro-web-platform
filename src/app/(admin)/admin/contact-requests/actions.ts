"use server"

import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export async function getContactRequests() {
  await checkAdminAuth()
  const db = createAdminClient()

  const { data } = await (db as any)
    .from('contact_requests')
    .select(`
      id, name, phone, note, status, source, created_at,
      acknowledged_at, acknowledged_by, acknowledged_via,
      admin_note, contact_outcome, withdrawn_at,
      doctor_id
    `)
    .order('created_at', { ascending: false })

  if (!data) return []

  // Get doctor details for each request
  const doctorIds = [...new Set(data.map((r: any) => r.doctor_id))] as string[]
  const { data: doctors } = await db
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, email, phone, city, state')
    .in('id', doctorIds.length > 0 ? doctorIds : ['__none__'])

  const doctorMap = new Map((doctors || []).map((d: any) => [d.id, d]))

  return data.map((r: any) => {
    const doc = doctorMap.get(r.doctor_id)
    return {
      ...r,
      doctor_name: doc ? `Dr. ${doc.first_name} ${doc.last_name}` : 'Unknown',
      doctor_clinic: doc?.clinic_name || '',
      doctor_email: doc?.email || '',
      doctor_phone: doc?.phone || '',
      doctor_city: doc?.city || '',
      doctor_state: doc?.state || '',
      hours_elapsed: Math.round((Date.now() - new Date(r.created_at).getTime()) / 3600000),
    }
  })
}

/**
 * Admin marks a contact request with an outcome.
 * Used for the backfill of the existing 14 and for ongoing admin acknowledgment.
 */
export async function adminAcknowledgeRequest(data: {
  requestId: string
  outcome: 'patient_contacted_confirmed' | 'doctor_unreachable'
  note?: string
}) {
  const user = await checkAdminAuth()
  const db = createAdminClient()

  const updates: any = {
    contact_outcome: data.outcome,
    admin_note: data.note || null,
    acknowledged_via: 'admin',
    acknowledged_by: user.id,
  }

  // Only set acknowledged_at if not already set
  const { data: existing } = await (db as any)
    .from('contact_requests')
    .select('acknowledged_at')
    .eq('id', data.requestId)
    .single()

  if (!existing?.acknowledged_at) {
    updates.acknowledged_at = new Date().toISOString()
  }

  updates.status = data.outcome === 'patient_contacted_confirmed' ? 'acknowledged' : 'doctor_unreachable'

  await (db as any)
    .from('contact_requests')
    .update(updates)
    .eq('id', data.requestId)

  revalidatePath('/admin/contact-requests')
  return { success: true }
}
