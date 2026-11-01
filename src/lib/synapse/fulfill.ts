import 'server-only'
import { SEAT_HOLD_DAYS } from './config.ts'
import { asLooseDb, asRow, asRows } from './loose-db.ts'

function addDays(from: Date, days: number): string {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
}

function addYears(from: Date, years: number): string {
  const next = new Date(from)
  next.setUTCFullYear(next.getUTCFullYear() + years)
  return next.toISOString()
}

type SeatRow = {
  id: string
  vendor_id: string
  status: string
  stripe_checkout_session_id: string | null
}

type AddonRow = { id: string; status: string }

/** Idempotent on the Checkout Session id. A repeat event does not double-activate. */
export async function fulfillSynapseCheckout(admin: unknown, session: {
  id?: string
  payment_status?: string
  subscription?: string | null
  metadata?: Record<string, string> | null
}): Promise<void> {
  const db = asLooseDb(admin)
  const meta = session.metadata || {}
  const sessionId = session.id || ''
  if (!sessionId) return
  if (session.payment_status && session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') return

  if (meta.type === 'synapse_seat') {
    const seatId = meta.seat_id
    if (!seatId) return
    const { data } = await db.from('synapse_seats').select('id, vendor_id, status, stripe_checkout_session_id').eq('id', seatId).maybeSingle()
    const seat = asRow<SeatRow>(data)
    if (!seat) return
    if (seat.stripe_checkout_session_id === sessionId && seat.status === 'active') return
    const start = new Date()
    await db.from('synapse_seats').update({
      status: 'active',
      term_start: start.toISOString(),
      term_end: addYears(start, 1),
      stripe_checkout_session_id: sessionId,
      stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
      reserved_until: null,
    }).eq('id', seatId)
    await db.from('vendors').update({ is_active: true }).eq('id', seat.vendor_id)
    return
  }

  if (meta.type === 'synapse_addon') {
    const vendorId = meta.vendor_id
    const addonKey = meta.addon_key
    if (!vendorId || !addonKey) return
    const { data } = await db
      .from('synapse_addon_orders')
      .select('id, status')
      .eq('stripe_checkout_session_id', sessionId)
      .maybeSingle()
    const existing = asRow<AddonRow>(data)
    if (existing?.status === 'paid') return
    const row = {
      vendor_id: vendorId,
      addon_key: addonKey,
      stripe_checkout_session_id: sessionId,
      amount_cents: Number(meta.amount_cents || 0) || null,
      status: 'paid',
    }
    if (existing) {
      await db.from('synapse_addon_orders').update(row).eq('id', existing.id)
    } else {
      await db.from('synapse_addon_orders').insert(row)
    }
  }
}

export async function lapseSynapseSubscription(admin: unknown, subscriptionId: string | null | undefined): Promise<boolean> {
  if (!subscriptionId) return false
  const db = asLooseDb(admin)
  const { data } = await db
    .from('synapse_seats')
    .select('id, vendor_id')
    .eq('stripe_subscription_id', subscriptionId)
  const seats = asRows<{ id: string; vendor_id: string }>(data)
  if (!seats.length) return false
  const ids = seats.map((seat) => seat.id)
  await db.from('synapse_seats').update({ status: 'lapsed' }).in('id', ids)
  for (const seat of seats) {
    const { count } = await db
      .from('synapse_seats')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', seat.vendor_id)
      .eq('status', 'active')
    if (!count) await db.from('vendors').update({ is_active: false }).eq('id', seat.vendor_id)
  }
  return true
}

export function reservationDeadline(now = new Date()): string {
  return addDays(now, SEAT_HOLD_DAYS)
}
