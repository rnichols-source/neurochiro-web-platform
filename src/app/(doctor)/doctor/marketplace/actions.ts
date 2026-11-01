'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { categoryByKey, categoryLabel } from '@/lib/synapse/categories'
import { marketplaceCountry, type SynapseCountry } from '@/lib/synapse/config'
import { asLooseDb, asRows, type PostgrestError } from '@/lib/synapse/loose-db'
import { revealPerkForUser } from '@/lib/synapse/reveal'
import { paybackProgress, savedThisYearCents } from '@/lib/synapse/savings'
import { listDoctorRequests, type DoctorRequest } from '@/app/(public)/marketplace/request/actions'

export type WalletPerk = {
  id: string
  vendorId: string
  vendorName: string
  title: string
  description: string | null
  redeemUrl: string | null
  estValueCents: number | null
  categoryKey: string
  categoryLabel: string
  tier: 'anchor' | 'ally'
  used: boolean
  rating: number | null
}

export type WalletData = {
  country: SynapseCountry
  perks: WalletPerk[]
  savedCents: number
  goalCents: number
  reached: boolean
  ratio: number
  requests: DoctorRequest[]
  schemaReady: boolean
}

function missingTable(error: PostgrestError | null): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || error.code === 'PGRST204' || error.code === '42703' || /does not exist|schema cache/i.test(error.message || '')
}

async function doctorContext(): Promise<{ userId: string; country: SynapseCountry } | { error: string }> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to open Synapse.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'doctor') return { error: 'Synapse perks in this portal are for doctor members.' }
  const { data: doctor } = await createAdminClient().from('doctors').select('country').eq('user_id', user.id).maybeSingle()
  return { userId: user.id, country: marketplaceCountry(doctor?.country) }
}

export async function loadWallet(): Promise<WalletData | { error: string }> {
  const who = await doctorContext()
  if ('error' in who) return who
  const emptyProgress = paybackProgress(0)
  const base: WalletData = {
    country: who.country,
    perks: [],
    savedCents: emptyProgress.cents,
    goalCents: emptyProgress.goal,
    reached: emptyProgress.reached,
    ratio: emptyProgress.ratio,
    requests: [],
    schemaReady: true,
  }
  const db = asLooseDb(createAdminClient())
  const countries = who.country === 'US' ? ['US'] : [who.country, 'US']
  const perksResult = await db
    .from('vendor_perks')
    .select('id, vendor_id, title, description, redeem_url, est_value_cents, country, audience, active')
    .eq('active', true)
    .in('audience', ['doctor', 'both'])
    .or(`country.in.(${countries.join(',')}),country.is.null`)
  if (missingTable(perksResult.error)) {
    return { ...base, schemaReady: false, requests: await listDoctorRequests(who.userId) }
  }

  const perkRows = asRows<{
    id: string
    vendor_id: string
    title: string
    description: string | null
    redeem_url: string | null
    est_value_cents: number | null
    country: string | null
    audience: string | null
  }>(perksResult.data)
  const vendorIds = [...new Set(perkRows.map((row) => row.vendor_id))]
  const vendors = vendorIds.length
    ? await db.from('vendors').select('id, name, categories').in('id', vendorIds)
    : { data: [] }
  const seats = vendorIds.length
    ? await db.from('synapse_seats').select('vendor_id, tier, category_key, status').in('vendor_id', vendorIds).in('status', ['active', 'at_risk', 'review'])
    : { data: [] }
  const usage = await db.from('vendor_usage').select('vendor_id').eq('doctor_user_id', who.userId)
  const ratings = await db.from('vendor_reviews').select('vendor_id, rating').eq('doctor_user_id', who.userId)
  const redemptions = await db.from('perk_redemptions').select('amount_saved_cents, created_at').eq('doctor_user_id', who.userId)

  const vendorById = new Map(asRows<{ id: string; name: string; categories: string[] | null }>(vendors.data).map((vendor) => [vendor.id, vendor]))
  const seatByVendor = new Map(asRows<{ vendor_id: string; tier: string; category_key: string; status: string }>(seats.data).map((seat) => [seat.vendor_id, seat]))
  const used = new Set(asRows<{ vendor_id: string }>(usage.data).map((row) => row.vendor_id))
  const ratingByVendor = new Map(asRows<{ vendor_id: string; rating: number }>(ratings.data).map((row) => [row.vendor_id, row.rating]))

  const perks: WalletPerk[] = perkRows.flatMap((perk) => {
    const vendor = vendorById.get(perk.vendor_id)
    const seat = seatByVendor.get(perk.vendor_id)
    if (!vendor || !seat) return []
    const categoryKey = categoryByKey(seat.category_key)?.key || categoryByKey(vendor.categories?.[0] || '')?.key || 'software'
    return [{
      id: perk.id,
      vendorId: perk.vendor_id,
      vendorName: vendor.name,
      title: perk.title,
      description: perk.description,
      redeemUrl: perk.redeem_url,
      estValueCents: perk.est_value_cents,
      categoryKey,
      categoryLabel: categoryLabel(categoryKey),
      tier: seat.tier === 'ally' ? 'ally' : 'anchor',
      used: used.has(perk.vendor_id),
      rating: ratingByVendor.get(perk.vendor_id) ?? null,
    }]
  })
  perks.sort((a, b) => {
    const category = a.categoryLabel.localeCompare(b.categoryLabel)
    if (category !== 0) return category
    if (a.tier !== b.tier) return a.tier === 'anchor' ? -1 : 1
    return a.vendorName.localeCompare(b.vendorName)
  })

  const year = new Date().getUTCFullYear()
  const saved = savedThisYearCents(
    asRows<{ amount_saved_cents: number; created_at: string }>(redemptions.data).map((row) => ({
      amountSavedCents: row.amount_saved_cents,
      createdAt: row.created_at,
    })),
    year,
  )
  const progress = paybackProgress(saved)
  return {
    country: who.country,
    perks,
    savedCents: progress.cents,
    goalCents: progress.goal,
    reached: progress.reached,
    ratio: progress.ratio,
    requests: await listDoctorRequests(who.userId),
    schemaReady: true,
  }
}

export async function revealPerkCode(perkId: string) {
  const who = await doctorContext()
  if ('error' in who) return who
  return revealPerkForUser(who.userId, perkId, 'doctor')
}

export async function redeemPerk(perkId: string, amountSavedCents: number) {
  const who = await doctorContext()
  if ('error' in who) return who
  const amount = Math.floor(Number(amountSavedCents))
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Enter a saved amount of zero or more.' }
  const db = asLooseDb(createAdminClient())
  const { error } = await db.from('perk_redemptions').insert({
    perk_id: perkId,
    doctor_user_id: who.userId,
    amount_saved_cents: amount,
    source: 'doctor',
  })
  if (error) return { error: missingTable(error) ? 'Redemptions are not available until the Synapse migration runs.' : 'Could not record this use.' }
  return { success: true }
}

export async function rateVendor(vendorId: string, rating: number, note: string) {
  const who = await doctorContext()
  if ('error' in who) return who
  const score = Math.round(rating)
  if (score < 1 || score > 5) return { error: 'Pick a rating from 1 to 5.' }
  const db = asLooseDb(createAdminClient())
  const { error } = await db.from('vendor_reviews').upsert({
    vendor_id: vendorId,
    doctor_user_id: who.userId,
    rating: score,
    review_text: note.trim().slice(0, 1000),
  }, { onConflict: 'vendor_id,doctor_user_id' })
  if (error) return { error: 'Could not save the rating.' }
  return { success: true }
}

export async function loadRequests() {
  const who = await doctorContext()
  if ('error' in who) return []
  return listDoctorRequests(who.userId)
}
