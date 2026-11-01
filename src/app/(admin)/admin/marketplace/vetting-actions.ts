'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { stripe } from '@/lib/stripe'
import { categoryByKey } from '@/lib/synapse/categories'
import { expectedSeatPrice, loadVerifiedPrice, seatPriceEnv } from '@/lib/synapse/checkout'
import { isSynapseCountry, type SeatStatus } from '@/lib/synapse/config'
import { checkoutPlanFor } from '@/lib/synapse/fees'
import { asLooseDb, asRow, asRows, type PostgrestError } from '@/lib/synapse/loose-db'
import { countActivePayingDoctors } from '@/lib/synapse/members'
import { reservationDeadline } from '@/lib/synapse/fulfill'
import { proofScore, seatHoldsCategory, type RatingRow } from '@/lib/synapse/seats'

function missingColumn(error: PostgrestError | null): boolean {
  if (!error) return false
  return error.code === '42703' || error.code === 'PGRST204' || error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message || '')
}

export type VettingVendor = {
  id: string
  name: string
  slug: string | null
  tier: string | null
  categories: string[] | null
  country: string | null
  vetting_status: string | null
  vetting_checklist: Record<string, boolean> | null
  vetting_notes: string | null
  best_price_pledged_at: string | null
  is_active: boolean | null
  contact_email: string | null
  website_url: string | null
}

export type VettingSeat = {
  id: string
  vendor_id: string
  category_key: string
  country: string
  tier: string
  status: string
  is_founding: boolean | null
  fee_cents: number | null
  member_count_snapshot: number | null
  reserved_until: string | null
  term_start: string | null
  term_end: string | null
  stripe_checkout_session_id: string | null
}

export type AddonOrderRow = {
  id: string
  vendor_id: string
  addon_key: string
  amount_cents: number | null
  status: string
  scheduled_for: string | null
  created_at: string
}

type HoldSeat = {
  id: string
  tier: string
  status: string
  reserved_until: string | null
  vendor_id: string
}

export async function getVettingQueue() {
  await checkAdminAuth()
  const admin = asLooseDb(createAdminClient())
  const vendors = await admin.from('vendors').select('id, name, slug, tier, categories, country, vetting_status, vetting_checklist, vetting_notes, best_price_pledged_at, is_active, contact_email, website_url').order('created_at', { ascending: false })
  const seats = await admin.from('synapse_seats').select('id, vendor_id, category_key, country, tier, status, is_founding, fee_cents, member_count_snapshot, reserved_until, term_start, term_end, stripe_checkout_session_id').order('created_at', { ascending: false })
  const orders = await admin.from('synapse_addon_orders').select('id, vendor_id, addon_key, amount_cents, status, scheduled_for, created_at').order('created_at', { ascending: false })
  return {
    vendors: missingColumn(vendors.error) ? [] : asRows<VettingVendor>(vendors.data),
    seats: missingColumn(seats.error) ? [] : asRows<VettingSeat>(seats.data),
    orders: missingColumn(orders.error) ? [] : asRows<AddonOrderRow>(orders.data),
    schemaReady: !missingColumn(seats.error),
  }
}

export async function saveVetting(vendorId: string, input: { status: string; checklist: Record<string, boolean>; notes: string }) {
  await checkAdminAuth()
  const admin = asLooseDb(createAdminClient())
  const { error } = await admin.from('vendors').update({
    vetting_status: input.status,
    vetting_checklist: input.checklist,
    vetting_notes: input.notes,
  }).eq('id', vendorId)
  if (error) return { error: missingColumn(error) ? 'Run the Synapse migration before saving vetting.' : 'Could not save vetting.' }
  revalidatePath('/admin/marketplace')
  return { success: true }
}

export async function approveSeat(input: {
  vendorId: string
  tier: 'anchor' | 'ally'
  categoryKey: string
  country: string
  founding: boolean
}) {
  await checkAdminAuth()
  const category = categoryByKey(input.categoryKey)
  if (!category) return { error: 'Pick a canonical category. Other has no key.' }
  if (!isSynapseCountry(input.country)) return { error: 'Pick a country.' }
  const admin = asLooseDb(createAdminClient())
  const now = new Date()
  if (input.tier === 'anchor') {
    const existing = await admin.from('synapse_seats').select('id, tier, status, reserved_until, vendor_id').eq('category_key', input.categoryKey).eq('country', input.country).eq('tier', 'anchor')
    if (missingColumn(existing.error)) return { error: 'Run the Synapse migration before approving a seat.' }
    for (const seat of asRows<HoldSeat>(existing.data)) {
      const holds = seatHoldsCategory({ tier: seat.tier, status: seat.status, reservedUntil: seat.reserved_until }, now)
      if (!holds && seat.status === 'pending_payment') {
        await admin.from('synapse_seats').update({ status: 'lapsed' }).eq('id', seat.id)
      }
    }
    const again = await admin.from('synapse_seats').select('id, tier, status, reserved_until, vendor_id').eq('category_key', input.categoryKey).eq('country', input.country).eq('tier', 'anchor')
    const blocker = asRows<HoldSeat>(again.data).find((seat) =>
      seatHoldsCategory({ tier: seat.tier, status: seat.status, reservedUntil: seat.reserved_until }, now))
    if (blocker) {
      const { data: holder } = await admin.from('vendors').select('name').eq('id', blocker.vendor_id).maybeSingle()
      const name = asRow<{ name: string | null }>(holder)?.name
      return { error: `Seat already held by ${name || 'another vendor'}` }
    }
  }

  let members = 0
  try {
    members = await countActivePayingDoctors()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not count active paying members.'
    return { error: message }
  }
  const plan = checkoutPlanFor(input.tier, {
    categoryClass: category.class,
    members,
    founding: input.founding,
    inFirstYear: input.founding,
  })
  const inserted = await admin.from('synapse_seats').insert({
    vendor_id: input.vendorId,
    category_key: input.categoryKey,
    country: input.country,
    tier: input.tier,
    status: 'pending_payment',
    is_founding: input.founding,
    member_count_snapshot: members,
    fee_cents: plan.feeCents,
    reserved_until: reservationDeadline(now),
  }).select('id').single()
  const created = asRow<{ id: string }>(inserted.data)
  if (inserted.error || !created) {
    if (inserted.error?.code === '23505') {
      const { data: holderSeat } = await admin.from('synapse_seats').select('vendor_id').eq('category_key', input.categoryKey).eq('country', input.country).eq('tier', 'anchor').in('status', ['pending_payment', 'active', 'at_risk', 'review']).limit(1).maybeSingle()
      const holderId = asRow<{ vendor_id: string }>(holderSeat)?.vendor_id
      const { data: holder } = holderId
        ? await admin.from('vendors').select('name').eq('id', holderId).maybeSingle()
        : { data: null }
      const name = asRow<{ name: string | null }>(holder)?.name
      return { error: `Seat already held by ${name || 'another vendor'}` }
    }
    return { error: missingColumn(inserted.error) ? 'Run the Synapse migration before approving a seat.' : 'Could not reserve the seat.' }
  }

  const link = await createSeatCheckout(created.id)
  revalidatePath('/admin/marketplace')
  return {
    success: true,
    seatId: created.id,
    feeCents: plan.feeCents,
    members,
    url: 'url' in link ? link.url : null,
    error: 'error' in link ? link.error : undefined,
  }
}

export async function createSeatCheckout(seatId: string) {
  await checkAdminAuth()
  const admin = asLooseDb(createAdminClient())
  const { data } = await admin.from('synapse_seats').select('id, vendor_id, category_key, tier, status, is_founding, member_count_snapshot, fee_cents').eq('id', seatId).maybeSingle()
  const seat = asRow<{
    id: string
    vendor_id: string
    category_key: string
    tier: 'anchor' | 'ally'
    is_founding: boolean | null
    member_count_snapshot: number | null
  }>(data)
  if (!seat) return { error: 'Seat not found.' }
  const category = categoryByKey(seat.category_key)
  if (!category) return { error: 'Seat category is not canonical.' }
  const plan = checkoutPlanFor(seat.tier, {
    categoryClass: category.class,
    members: seat.member_count_snapshot || 0,
    founding: Boolean(seat.is_founding),
    inFirstYear: Boolean(seat.is_founding),
  })
  const envName = seatPriceEnv(plan, category.class)
  const price = await loadVerifiedPrice(envName, expectedSeatPrice(plan, category.class))
  if ('error' in price) return { error: price.error }
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: price.priceId, quantity: plan.quantity }],
    success_url: `${site}/marketplace?seat=paid`,
    cancel_url: `${site}/marketplace/pricing`,
    metadata: { type: 'synapse_seat', seat_id: seat.id, vendor_id: seat.vendor_id },
    subscription_data: { metadata: { type: 'synapse_seat', seat_id: seat.id } },
  })
  await admin.from('synapse_seats').update({ stripe_checkout_session_id: session.id }).eq('id', seat.id)
  return { url: session.url }
}

export async function setSeatStatus(seatId: string, status: SeatStatus) {
  await checkAdminAuth()
  if (!['at_risk', 'review', 'revoked', 'active', 'lapsed'].includes(status)) return { error: 'That status is not an admin action.' }
  const admin = asLooseDb(createAdminClient())
  const { data } = await admin.from('synapse_seats').select('vendor_id').eq('id', seatId).maybeSingle()
  const seat = asRow<{ vendor_id: string }>(data)
  const { error } = await admin.from('synapse_seats').update({ status }).eq('id', seatId)
  if (error) return { error: 'Could not update the seat.' }
  if (seat?.vendor_id) {
    const { count } = await admin.from('synapse_seats').select('id', { count: 'exact', head: true }).eq('vendor_id', seat.vendor_id).eq('status', 'active')
    const live = (count || 0) > 0
    await admin.from('vendors').update({ is_active: live }).eq('id', seat.vendor_id)
  }
  revalidatePath('/admin/marketplace')
  revalidatePath('/marketplace')
  return { success: true }
}

export async function scheduleAddon(orderId: string, scheduledFor: string, notes: string) {
  await checkAdminAuth()
  const admin = asLooseDb(createAdminClient())
  const when = scheduledFor ? new Date(scheduledFor).toISOString() : null
  const { error } = await admin.from('synapse_addon_orders').update({
    scheduled_for: when,
    notes: notes.trim() || null,
  }).eq('id', orderId)
  if (error) return { error: 'Could not schedule the add-on.' }
  revalidatePath('/admin/marketplace')
  return { success: true }
}

export async function seatProof(vendorId: string) {
  await checkAdminAuth()
  const admin = asLooseDb(createAdminClient())
  const { data } = await admin.from('vendor_reviews').select('rating, created_at').eq('vendor_id', vendorId)
  const rows: RatingRow[] = asRows<{ rating: number; created_at: string }>(data).map((row) => ({ rating: row.rating, createdAt: row.created_at }))
  const { data: vendor } = await admin.from('vendors').select('best_price_pledged_at').eq('id', vendorId).maybeSingle()
  return { proof: proofScore(rows, new Date()), pledgedAt: asRow<{ best_price_pledged_at: string | null }>(vendor)?.best_price_pledged_at || null }
}
