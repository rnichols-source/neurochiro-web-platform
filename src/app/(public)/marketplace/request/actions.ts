'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { categoryKeyFromAlias, categoryLabel } from '@/lib/synapse/categories'
import { FIRST_LOOK_HOURS, isSynapseCountry, marketplaceCountry } from '@/lib/synapse/config'
import { asLooseDb, asRows, type PostgrestError } from '@/lib/synapse/loose-db'

function missingColumn(error: PostgrestError | null): boolean {
  if (!error) return false
  return error.code === '42703' || error.code === 'PGRST204' || error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message || '')
}

export async function submitRFP(data: {
  category: string
  description: string
  budget: string
  timeline: string
  country?: string
}) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to submit a request.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'doctor') {
    return { error: 'Only doctors can submit quote requests.' }
  }

  const categoryKey = categoryKeyFromAlias(data.category)
  if (!categoryKey) return { error: 'Pick a category from the list.' }
  if (!data.description.trim()) return { error: 'Describe what you need.' }

  const adminTyped = createAdminClient()
  let country = data.country && isSynapseCountry(data.country) ? data.country : null
  if (!country) {
    const { data: doctor } = await adminTyped.from('doctors').select('country').eq('user_id', user.id).maybeSingle()
    country = marketplaceCountry(doctor?.country)
  }

  const db = asLooseDb(adminTyped)
  const anchor = await db
    .from('synapse_seats')
    .select('id')
    .eq('category_key', categoryKey)
    .eq('country', country)
    .eq('tier', 'anchor')
    .eq('status', 'active')
    .limit(1)
  const hasAnchor = !anchor.error && asRows<{ id: string }>(anchor.data).length > 0
  const firstLook = hasAnchor ? new Date(Date.now() + FIRST_LOOK_HOURS * 60 * 60 * 1000).toISOString() : null

  const full = await db.from('vendor_rfps').insert({
    doctor_user_id: user.id,
    category: categoryLabel(categoryKey),
    category_key: categoryKey,
    country,
    description: data.description.slice(0, 2000),
    budget: data.budget,
    timeline: data.timeline,
    status: 'open',
    first_look_until: firstLook,
  })
  if (!full.error) return { success: true, firstLook }
  if (!missingColumn(full.error)) return { error: 'Could not save the request.' }

  const legacy = await db.from('vendor_rfps').insert({
    doctor_user_id: user.id,
    category: categoryLabel(categoryKey),
    description: data.description.slice(0, 2000),
    budget: data.budget,
    timeline: data.timeline,
    status: 'open',
  })
  if (legacy.error) return { error: 'Could not save the request.' }
  return { success: true, firstLook: null }
}

export type DoctorRequest = {
  id: string
  category: string
  description: string
  budget: string | null
  timeline: string | null
  country: string | null
  status: string | null
  firstLookUntil: string | null
  responses: { id: string; vendorName: string; text: string; price: string | null; createdAt: string }[]
}

export async function listDoctorRequests(userId: string): Promise<DoctorRequest[]> {
  const db = asLooseDb(createAdminClient())
  const rfps = await db
    .from('vendor_rfps')
    .select('id, category, description, budget, timeline, country, status, first_look_until')
    .eq('doctor_user_id', userId)
    .order('created_at', { ascending: false })
  if (rfps.error) return []
  const rows = asRows<{
    id: string
    category: string
    description: string
    budget: string | null
    timeline: string | null
    country: string | null
    status: string | null
    first_look_until: string | null
  }>(rfps.data)
  if (!rows.length) return []
  const responses = await db
    .from('vendor_rfp_responses')
    .select('id, rfp_id, vendor_id, response_text, price, created_at')
    .in('rfp_id', rows.map((row) => row.id))
  const replyRows = asRows<{
    id: string
    rfp_id: string
    vendor_id: string
    response_text: string
    price: string | null
    created_at: string
  }>(responses.data)
  const vendorIds = [...new Set(replyRows.map((row) => row.vendor_id))]
  const vendors = vendorIds.length
    ? await db.from('vendors').select('id, name').in('id', vendorIds)
    : { data: [] }
  const names = new Map(asRows<{ id: string; name: string }>(vendors.data).map((vendor) => [vendor.id, vendor.name]))
  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    description: row.description,
    budget: row.budget,
    timeline: row.timeline,
    country: row.country,
    status: row.status,
    firstLookUntil: row.first_look_until,
    responses: replyRows.filter((reply) => reply.rfp_id === row.id).map((reply) => ({
      id: reply.id,
      vendorName: names.get(reply.vendor_id) || 'Partner',
      text: reply.response_text,
      price: reply.price,
      createdAt: reply.created_at,
    })),
  }))
}
