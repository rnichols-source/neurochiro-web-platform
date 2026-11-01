'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { stripe } from '@/lib/stripe'
import { categoryByKey } from '@/lib/synapse/categories'
import { addonByKey, loadVerifiedPrice } from '@/lib/synapse/checkout'
import { ADDONS, ALLY_ANNUAL_CENTS, isSynapseCountry, marketplaceCountry, type SynapseCountry } from '@/lib/synapse/config'
import { vendorDemand, type VendorDemand } from '@/lib/synapse/demand'
import { anchorFeeCents } from '@/lib/synapse/fees'
import { asLooseDb, asRow, asRows, type PostgrestError } from '@/lib/synapse/loose-db'
import { countActivePayingDoctors } from '@/lib/synapse/members'
import { proofScore, canReplyToRequest } from '@/lib/synapse/seats'

export type VendorPerkRow = {
  id: string
  title: string
  description: string | null
  code: string | null
  redeemUrl: string | null
  estValueCents: number | null
  audience: string
  active: boolean
  endsAt: string | null
}

export type VendorSeatView = {
  id: string
  tier: string
  status: string
  categoryKey: string
  country: string
  founding: boolean
  termStart: string | null
  termEnd: string | null
  feeCents: number | null
  renewalCents: number | null
  proofScore: number | null
  proofFlag: string
  pledgedAt: string | null
}

export type VendorRequestRow = {
  id: string
  category: string
  description: string
  budget: string | null
  timeline: string | null
  state: string | null
  country: string | null
  firstLookUntil: string | null
  canReply: boolean
}

export type VendorSynapse = {
  slug: string | null
  country: SynapseCountry
  perks: VendorPerkRow[]
  seat: VendorSeatView | null
  requests: VendorRequestRow[]
  demand: VendorDemand
  addons: { key: string; label: string; cents: number }[]
  schemaReady: boolean
}

function missing(error: PostgrestError | null): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === '42703' || error.code === 'PGRST204' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message || '')
}

async function vendorId(): Promise<{ id: string } | { error: string }> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to open the vendor dashboard.' }
  const { data } = await supabase.from('vendors').select('id').eq('id', user.id).maybeSingle()
  if (!data) return { error: 'No vendor profile is attached to this account.' }
  return { id: user.id }
}

export async function loadVendorSynapse(): Promise<VendorSynapse | { error: string }> {
  const who = await vendorId()
  if ('error' in who) return who
  const db = asLooseDb(createAdminClient())
  const { data: vendorData } = await db.from('vendors').select('slug, country, categories, best_price_pledged_at').eq('id', who.id).maybeSingle()
  const vendor = asRow<{ slug: string | null; country: string | null; categories: string[] | null; best_price_pledged_at: string | null }>(vendorData)
  const country = isSynapseCountry(vendor?.country || '') ? vendor?.country as SynapseCountry : marketplaceCountry(vendor?.country)
  const demand = await vendorDemand(who.id, country).catch(() => ({
    leadsByPlace: [],
    rfpsByCategory: [],
    reveals: { key: 'reveals', label: 'unavailable' },
    redemptionsByMonth: [],
    membersInCountry: { key: country, label: 'unavailable' },
  }))

  const seats = await db.from('synapse_seats').select('id, tier, status, category_key, country, is_founding, term_start, term_end, fee_cents').eq('vendor_id', who.id).order('created_at', { ascending: false })
  if (missing(seats.error)) {
    return {
      slug: vendor?.slug || null,
      country,
      perks: [],
      seat: null,
      requests: [],
      demand,
      addons: ADDONS.map((addon) => ({ key: addon.key, label: addon.label, cents: addon.cents })),
      schemaReady: false,
    }
  }
  const seatRows = asRows<{
    id: string
    tier: string
    status: string
    category_key: string
    country: string
    is_founding: boolean | null
    term_start: string | null
    term_end: string | null
    fee_cents: number | null
  }>(seats.data)
  const live = seatRows.find((seat) => ['active', 'at_risk', 'review', 'pending_payment'].includes(seat.status)) || seatRows[0] || null
  const reviews = await db.from('vendor_reviews').select('rating, created_at').eq('vendor_id', who.id)
  const proof = proofScore(asRows<{ rating: number; created_at: string }>(reviews.data).map((row) => ({ rating: row.rating, createdAt: row.created_at })), new Date())
  let renewalCents: number | null = null
  if (live) {
    const category = categoryByKey(live.category_key)
    if (category && live.tier === 'anchor') {
      try {
        const members = await countActivePayingDoctors()
        renewalCents = anchorFeeCents({
          categoryClass: category.class,
          members,
          founding: Boolean(live.is_founding),
          inFirstYear: false,
          previousFeeCents: live.fee_cents,
        })
      } catch {
        renewalCents = null
      }
    } else if (live.tier === 'ally') {
      renewalCents = ALLY_ANNUAL_CENTS
    }
  }

  const perkResult = await db.from('vendor_perks').select('id, title, description, code, redeem_url, est_value_cents, audience, active, ends_at').eq('vendor_id', who.id).order('created_at', { ascending: false })
  const perks = asRows<{
    id: string
    title: string
    description: string | null
    code: string | null
    redeem_url: string | null
    est_value_cents: number | null
    audience: string | null
    active: boolean
    ends_at: string | null
  }>(perkResult.data).map((perk) => ({
    id: perk.id,
    title: perk.title,
    description: perk.description,
    code: perk.code,
    redeemUrl: perk.redeem_url,
    estValueCents: perk.est_value_cents,
    audience: perk.audience || 'doctor',
    active: perk.active,
    endsAt: perk.ends_at,
  }))

  const categoryKeys = live ? [live.category_key] : (vendor?.categories || []).filter((key) => categoryByKey(key))
  const requests = categoryKeys.length
    ? await db.from('vendor_rfps').select('id, category, category_key, description, budget, timeline, country, first_look_until, doctor_user_id, status').eq('country', country).in('category_key', categoryKeys).eq('status', 'open')
    : { data: [] }
  const requestRows = asRows<{
    id: string
    category: string
    description: string
    budget: string | null
    timeline: string | null
    country: string | null
    first_look_until: string | null
    doctor_user_id: string
  }>(requests.data)
  const doctorUsers = [...new Set(requestRows.map((row) => row.doctor_user_id))]
  const doctorPlaces = doctorUsers.length
    ? await db.from('doctors').select('user_id, state, country').in('user_id', doctorUsers)
    : { data: [] }
  const placeByUser = new Map(asRows<{ user_id: string; state: string | null; country: string | null }>(doctorPlaces.data).map((doctor) => [doctor.user_id, doctor]))
  const tier = live && (live.status === 'active' || live.status === 'at_risk' || live.status === 'review')
    ? (live.tier === 'ally' ? 'ally' : 'anchor')
    : 'none'
  const now = new Date()

  return {
    slug: vendor?.slug || null,
    country,
    perks,
    seat: live ? {
      id: live.id,
      tier: live.tier,
      status: live.status,
      categoryKey: live.category_key,
      country: live.country,
      founding: Boolean(live.is_founding),
      termStart: live.term_start,
      termEnd: live.term_end,
      feeCents: live.fee_cents,
      renewalCents,
      proofScore: proof.score,
      proofFlag: live.status === 'at_risk' || live.status === 'review' ? live.status : proof.flag,
      pledgedAt: vendor?.best_price_pledged_at || null,
    } : null,
    requests: requestRows.map((row) => {
      const place = placeByUser.get(row.doctor_user_id)
      return {
        id: row.id,
        category: row.category,
        description: row.description,
        budget: row.budget,
        timeline: row.timeline,
        state: place?.state || null,
        country: row.country || place?.country || null,
        firstLookUntil: row.first_look_until,
        canReply: canReplyToRequest({ now, firstLookUntil: row.first_look_until, vendorTier: tier }),
      }
    }),
    demand,
    addons: ADDONS.map((addon) => ({ key: addon.key, label: addon.label, cents: addon.cents })),
    schemaReady: true,
  }
}

export async function saveVendorPerk(input: {
  id?: string
  title: string
  description: string
  code: string
  redeemUrl: string
  estValueDollars: number
  audience: 'doctor' | 'student' | 'both'
  active: boolean
  endsAt: string
  pledged: boolean
}) {
  const who = await vendorId()
  if ('error' in who) return who
  if (!input.pledged) return { error: 'Reconfirm the best-member-price pledge before saving.' }
  if (!input.title.trim() || !input.code.trim()) return { error: 'A title and a code are required.' }
  const cents = Math.round(Number(input.estValueDollars) * 100)
  if (!Number.isFinite(cents) || cents < 0) return { error: 'Enter a value of zero or more.' }
  const db = asLooseDb(createAdminClient())
  const { data: vendorData } = await db.from('vendors').select('country').eq('id', who.id).maybeSingle()
  const country = marketplaceCountry(asRow<{ country: string | null }>(vendorData)?.country)
  const now = new Date().toISOString()
  await db.from('vendors').update({ best_price_pledged_at: now }).eq('id', who.id)
  const row = {
    vendor_id: who.id,
    title: input.title.trim().slice(0, 160),
    description: input.description.trim().slice(0, 2000),
    code: input.code.trim().slice(0, 80),
    redeem_url: input.redeemUrl.trim() || null,
    est_value_cents: cents,
    audience: input.audience,
    active: input.active,
    ends_at: input.endsAt ? new Date(input.endsAt).toISOString() : null,
    country,
  }
  const write = input.id
    ? await db.from('vendor_perks').update(row).eq('id', input.id).eq('vendor_id', who.id)
    : await db.from('vendor_perks').insert(row)
  if (write.error) return { error: missing(write.error) ? 'Run the Synapse migration before saving perks.' : 'Could not save the perk.' }
  return { success: true }
}

export async function replyToRequest(rfpId: string, text: string, price: string) {
  const who = await vendorId()
  if ('error' in who) return who
  if (!text.trim()) return { error: 'Write a reply.' }
  const db = asLooseDb(createAdminClient())
  const { data } = await db.from('vendor_rfps').select('id, doctor_user_id, category_key, country, first_look_until, status').eq('id', rfpId).maybeSingle()
  const request = asRow<{ id: string; doctor_user_id: string; category_key: string | null; country: string | null; first_look_until: string | null; status: string | null }>(data)
  if (!request || request.status === 'closed') return { error: 'That request is closed.' }
  const seats = await db.from('synapse_seats').select('tier, status, category_key, country').eq('vendor_id', who.id)
  const seat = asRows<{ tier: string; status: string; category_key: string; country: string }>(seats.data).find((row) =>
    ['active', 'at_risk', 'review'].includes(row.status) && row.category_key === request.category_key && row.country === request.country)
  const tier = seat ? (seat.tier === 'ally' ? 'ally' : 'anchor') : 'none'
  if (!canReplyToRequest({ now: new Date(), firstLookUntil: request.first_look_until, vendorTier: tier })) {
    return { error: 'The Anchor has first look on this request. You can reply when that window ends.' }
  }
  const inserted = await db.from('vendor_rfp_responses').insert({
    rfp_id: rfpId,
    vendor_id: who.id,
    response_text: text.trim().slice(0, 4000),
    price: price.trim().slice(0, 120) || null,
  })
  if (inserted.error) {
    if (inserted.error.code === '23505') return { error: 'You already replied to this request.' }
    return { error: 'Could not send the reply.' }
  }
  await db.from('notifications').insert({
    user_id: request.doctor_user_id,
    title: 'A Synapse partner replied',
    body: 'A partner sent a quote on your request. Open Synapse to read it.',
    type: 'synapse_rfp',
    link: '/doctor/marketplace',
    priority: 'normal',
  })
  return { success: true }
}

export async function startAddonCheckout(addonKey: string) {
  const who = await vendorId()
  if ('error' in who) return who
  const addon = addonByKey(addonKey)
  if (!addon) return { error: 'That add-on is not available.' }
  const price = await loadVerifiedPrice(addon.env, { unitAmount: addon.cents, interval: null })
  if ('error' in price) return { error: price.error }
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: price.priceId, quantity: 1 }],
    success_url: `${site}/vendor/dashboard?addon=paid`,
    cancel_url: `${site}/vendor/dashboard`,
    metadata: {
      type: 'synapse_addon',
      addon_key: addon.key,
      vendor_id: who.id,
      amount_cents: String(addon.cents),
    },
  })
  if (!session.url || !session.id) return { error: 'Stripe did not return a checkout link.' }
  const pending = await asLooseDb(createAdminClient()).from('synapse_addon_orders').insert({
    vendor_id: who.id,
    addon_key: addon.key,
    stripe_checkout_session_id: session.id,
    amount_cents: addon.cents,
    status: 'pending',
  })
  if (pending.error && pending.error.code !== '23505' && !missing(pending.error)) {
    return { error: 'Checkout was created, but the order could not be recorded. Use the link only if you still want to pay.', url: session.url }
  }
  return { url: session.url }
}
