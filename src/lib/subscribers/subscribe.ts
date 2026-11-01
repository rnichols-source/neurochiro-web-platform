import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase-admin'
import { zipToState } from '@/lib/zip-to-state'
import { getMarketingResend, getMarketingFrom, wrapMarketingEmail } from '@/lib/marketing-email'
import { getThresholds } from '@/lib/thresholds'
import { detectPostalCode } from '@/lib/detect-postal'

const SOURCE_ALLOWLIST = [
  'website', 'homepage', 'directory_empty', 'profile_footer', 'site_footer',
  'og_share', 'city_page', 'contact_request', 'quiz',
]

const SUCCESS = { ok: true, message: 'Check your inbox for a confirmation link.' }

type LooseError = { code?: string; message?: string } | null
type LooseResult<T> = { data: T; error: LooseError }
type LooseFilter = {
  eq: (column: string, value: string) => LooseFilter
  maybeSingle: () => Promise<LooseResult<Record<string, unknown> | null>>
}
type LooseUpdate = {
  eq: (column: string, value: string) => Promise<LooseResult<null>>
}
type LooseTable = {
  select: (columns: string) => LooseFilter
  insert: (row: Record<string, unknown>) => Promise<LooseResult<null>>
  update: (row: Record<string, unknown>) => LooseUpdate
}
type LooseClient = {
  from: (table: string) => LooseTable
}
type CoverageDoctor = {
  id: string
  first_name: string | null
  last_name: string | null
  clinic_name: string | null
  slug: string | null
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  photo_url: string | null
  booking_url: string | null
  phone: string | null
}

function textField(row: Record<string, unknown> | null, key: string): string {
  const value = row?.[key]
  return typeof value === 'string' ? value : ''
}

export type SubscribeEmailInput = {
  email: string
  zip: string
  country?: string
  source?: string
  ip?: string
  userAgent?: string
  skipCoverageCheck?: boolean
}

export type SubscribeEmailResult = {
  status: number
  body: Record<string, unknown>
}

export function normalizeSubscribeSource(source: string | null | undefined): string {
  if (source && SOURCE_ALLOWLIST.includes(source)) return source
  return 'website'
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function sendConfirmationEmail(email: string, token: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://neurochiro.co'
  const confirmUrl = `${siteUrl}/api/confirm?token=${token}`
  const resend = getMarketingResend()
  const from = getMarketingFrom()
  await resend.emails.send({
    from,
    to: [email],
    subject: 'Confirm your NeuroChiro subscription',
    html: wrapMarketingEmail(`
      <p style="font-size:15px;color:#333;line-height:1.6;">Thanks for signing up for the NeuroChiro patient list.</p>
      <p style="font-size:15px;color:#333;line-height:1.6;">Click the button below to confirm your email address. This link expires in 24 hours.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${confirmUrl}" style="display:inline-block;background:#D66829;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Confirm My Email</a>
      </div>
      <p style="font-size:13px;color:#999;">If you didn't sign up, you can ignore this email.</p>
    `),
  })
}

/**
 * Shared new-doctor alert signup. `/api/subscribe` calls this with
 * skipCoverageCheck false so a nearby doctor still returns the coverage
 * response instead of a subscription. The quiz passes true.
 */
export async function subscribeEmail(input: SubscribeEmailInput): Promise<SubscribeEmailResult> {
  const hint = input.country === 'UK' ? 'GB' : (input.country || 'US')
  const detection = detectPostalCode(input.zip, hint)
  if (!detection) {
    return { status: 400, body: { ok: false, error: 'Please enter a valid postal code for your country.' } }
  }

  const normalizedEmail = input.email.trim().toLowerCase()
  const normalizedZip = detection.code
  const detectedCountry = detection.country
  const state = detectedCountry === 'US' ? zipToState(normalizedZip) : ''
  const source = normalizeSubscribeSource(input.source)
  const ip = input.ip || ''
  const userAgent = input.userAgent || ''
  const supabase = createAdminClient()
  // subscribers, zip_codes, and conversion_events are not in the generated Database type.
  const db = supabase as unknown as LooseClient

  if (!input.skipCoverageCheck) {
    try {
      const { data: zipCoord } = await db
        .from('zip_codes')
        .select('lat, lng, city, state')
        .eq('country', detectedCountry)
        .eq('zip', normalizedZip)
        .maybeSingle()

      if (zipCoord) {
        const { haversineDistance } = await import('@/lib/geo')
        const t = await getThresholds()
        const lat = Number(zipCoord.lat)
        const lng = Number(zipCoord.lng)

        let docQuery = supabase
          .from('doctors')
          .select('id, first_name, last_name, clinic_name, slug, city, state, latitude, longitude, photo_url, booking_url, phone')
          .eq('verification_status', 'verified')
          .not('latitude', 'eq', 0)
          .not('latitude', 'is', null)
        if (detectedCountry === 'US') {
          docQuery = docQuery.or('country.is.null,country.eq.US')
        } else {
          docQuery = docQuery.eq('country', detectedCountry)
        }
        const { data: nearbyDocs } = await docQuery

        const nearby = ((nearbyDocs || []) as unknown as CoverageDoctor[])
          .map((doctor) => ({
            ...doctor,
            distance: haversineDistance(lat, lng, Number(doctor.latitude), Number(doctor.longitude)),
          }))
          .filter((doctor) => doctor.distance <= t.subscribe_nearby)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5)

        if (nearby.length > 0) {
          db.from('conversion_events').insert({
            event_type: 'waitlist_coverage_hit',
            source_page: '/list',
            had_location: true,
            session_id: normalizedZip,
          }).then(() => {}).catch(() => {})

          return {
            status: 200,
            body: {
              ok: false,
              coverage: true,
              doctors: nearby.map((doctor) => ({
                name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
                clinic: doctor.clinic_name,
                city: doctor.city,
                state: doctor.state,
                distance: Math.round(doctor.distance * 10) / 10,
                slug: doctor.slug || doctor.id,
                photo_url: doctor.photo_url,
                booking_url: doctor.booking_url || null,
                phone: doctor.phone || null,
              })),
              message: `Good news — there ${nearby.length === 1 ? 'is already a doctor' : `are already ${nearby.length} doctors`} near you.`,
            },
          }
        }
      }
    } catch (coverageErr) {
      console.warn('[SUBSCRIBE] Coverage check error (non-blocking):', coverageErr)
    }
  }

  const { data: existing } = await db
    .from('subscribers')
    .select('id, status, token_expires_at, updated_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  const existingStatus = textField(existing, 'status')
  const existingId = textField(existing, 'id')
  const existingUpdated = textField(existing, 'updated_at')

  if (existing) {
    if (existingStatus === 'confirmed') {
      return { status: 200, body: SUCCESS }
    }

    if (existingStatus === 'unsubscribed') {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = hashToken(token)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      await db
        .from('subscribers')
        .update({
          status: 'pending',
          zip: normalizedZip,
          state,
          country: detectedCountry,
          token_hash: tokenHash,
          token_expires_at: expiresAt,
          unsubscribed_at: null,
          ip,
          user_agent: userAgent,
        })
        .eq('id', existingId)
      await sendConfirmationEmail(normalizedEmail, token)
      return { status: 200, body: SUCCESS }
    }

    const lastUpdated = new Date(existingUpdated).getTime()
    if (Date.now() - lastUpdated < 15 * 60 * 1000) {
      return { status: 200, body: SUCCESS }
    }

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await db
      .from('subscribers')
      .update({
        zip: normalizedZip,
        state,
        token_hash: tokenHash,
        token_expires_at: expiresAt,
        ip,
        user_agent: userAgent,
      })
      .eq('id', existingId)
    await sendConfirmationEmail(normalizedEmail, token)
    return { status: 200, body: SUCCESS }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { error: insertError } = await db
    .from('subscribers')
    .insert({
      email: normalizedEmail,
      zip: normalizedZip,
      state,
      country: detectedCountry,
      status: 'pending',
      token_hash: tokenHash,
      token_expires_at: expiresAt,
      source,
      ip,
      user_agent: userAgent,
    })

  if (insertError) {
    if (insertError.code === '23505') return { status: 200, body: SUCCESS }
    console.error('[SUBSCRIBE] Insert error:', insertError)
    return { status: 500, body: { ok: false, error: 'Something went wrong. Please try again.' } }
  }

  await sendConfirmationEmail(normalizedEmail, token)
  return { status: 200, body: SUCCESS }
}
