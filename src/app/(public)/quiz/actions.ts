'use server'

import { headers } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { createLead } from '@/lib/leads/create-lead'
import { sendTracked } from '@/lib/leads/send'
import { getMailingAddress } from '@/lib/marketing-email'
import { runMatch } from '@/lib/quiz/match'
import { resultsEmailContent } from '@/lib/quiz/email-body'
import {
  ALERTS_SUCCESS_MESSAGE,
  ALREADY_SENT_MESSAGE,
  DOCTOR_UNAVAILABLE_MESSAGE,
  EMAIL_FAIL_MESSAGE,
  EMAIL_SUCCESS_MESSAGE,
  GENERIC_ERROR_MESSAGE,
  INVALID_MESSAGE,
  RATE_LIMIT_MESSAGE,
} from '@/lib/quiz/options'
import { directoryHref, displayDistance, requestSuccessMessage } from '@/lib/quiz/copy'
import {
  emailResultsInputSchema,
  isBotSubmission,
  quizEventSchema,
  requestInputSchema,
} from '@/lib/quiz/schema'
import { getOffersFor, recordQuizEvent, runQuizSearch } from '@/lib/quiz/server'
import { subscribeEmail } from '@/lib/subscribers/subscribe'
import type { RankDoctor } from '@/lib/quiz/rank'

const matchLimiter = rateLimit('quiz-match', { maxRequests: 10, windowMs: 60_000 })
const requestLimiter = rateLimit('quiz-request', { maxRequests: 3, windowMs: 60_000 })
const emailLimiter = rateLimit('quiz-email', { maxRequests: 3, windowMs: 60 * 60_000 })
const emailDayLimiter = rateLimit('quiz-email-day', { maxRequests: 1, windowMs: 24 * 60 * 60_000 })
const eventLimiter = rateLimit('quiz-event', { maxRequests: 60, windowMs: 60_000 })

async function clientIp(): Promise<string> {
  const headerList = await headers()
  return headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function failure(code: 'rate_limited' | 'invalid' | 'error', message: string) {
  return { ok: false as const, code, message }
}

export async function matchDoctors(raw: unknown) {
  try {
    const ip = await clientIp()
    return await runMatch(raw, {
      limitAllowed: matchLimiter.check(ip).allowed,
      search: (params) => runQuizSearch(params),
      onValid: (input) => {
        recordQuizEvent({
          sessionId: input.sessionId,
          event: 'complete',
          source: input.source,
          country: input.country,
          concern: input.concern,
        })
      },
    }).then(async (result) => {
      if (!result.ok) return result
      const offers = await getOffersFor(result.matches.map((match) => match.id))
      return {
        ...result,
        matches: result.matches.map((match) => ({
          ...match,
          offer: offers[match.id] || null,
        })),
      }
    })
  } catch (err) {
    console.error('[QUIZ] matchDoctors:', err instanceof Error ? err.message : 'failed')
    return failure('error', GENERIC_ERROR_MESSAGE)
  }
}

export async function requestAppointment(raw: unknown) {
  try {
    const ip = await clientIp()
    if (!requestLimiter.check(ip).allowed) return failure('rate_limited', RATE_LIMIT_MESSAGE)
    const parsed = requestInputSchema.safeParse(raw)
    if (!parsed.success) return failure('invalid', INVALID_MESSAGE)
    const input = parsed.data
    if (isBotSubmission(input)) {
      return { ok: true as const, silent: true as const, message: requestSuccessMessage('the office'), withdrawUrl: '' }
    }
    const result = await createLead({
      doctorId: input.doctorId,
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      preferredTime: input.bestTime || null,
      message: input.message || null,
      consentText: input.consentText,
      source: 'quiz',
      ip,
      smsConsent: input.smsConsent === true,
      smsPhone: input.smsConsent === true ? (input.phone || null) : null,
    })
    if (!result.ok) {
      const message = result.error === 'Doctor not found.'
        ? DOCTOR_UNAVAILABLE_MESSAGE
        : (result.error || GENERIC_ERROR_MESSAGE)
      return failure('error', message)
    }
    recordQuizEvent({
      sessionId: input.sessionId,
      event: 'request_sent',
      source: input.source,
      doctorId: input.doctorId,
    })
    if (result.savedForAdmin) {
      return {
        ok: true as const,
        silent: false as const,
        message: result.message || "We've received your request and our team will make sure the office gets it",
        withdrawUrl: result.withdrawUrl || '',
        savedForAdmin: true,
      }
    }
    return {
      ok: true as const,
      silent: false as const,
      message: requestSuccessMessage(result.practiceName),
      withdrawUrl: result.withdrawUrl || '',
      savedForAdmin: false,
    }
  } catch (err) {
    console.error('[QUIZ] requestAppointment:', err instanceof Error ? err.message : 'failed')
    return failure('error', GENERIC_ERROR_MESSAGE)
  }
}

function emailDoctors(doctors: RankDoctor[], ids: string[], country: 'US' | 'CA' | 'UK' | 'AU' | 'NZ' | 'IE' | 'IN' | 'AE') {
  const byId = new Map(doctors.filter((doctor) => doctor.id).map((doctor) => [doctor.id, doctor]))
  return ids.flatMap((id) => {
    const doctor = byId.get(id)
    if (!doctor?.slug || !/^[a-z0-9-]+$/.test(doctor.slug)) return []
    const miles = typeof doctor.distance_miles === 'number' ? doctor.distance_miles : null
    const shown = miles == null ? null : displayDistance(miles, country)
    const name = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.replace(/\s+/g, ' ').trim()
    return [{
      name,
      clinic: doctor.clinic_name || null,
      city: doctor.city || null,
      region: doctor.state || null,
      distance: shown?.value ?? null,
      unit: shown?.unit || (country === 'US' ? 'mi' as const : 'km' as const),
      slug: doctor.slug,
    }]
  })
}

export async function emailResults(raw: unknown) {
  try {
    const ip = await clientIp()
    const parsed = emailResultsInputSchema.safeParse(raw)
    if (!parsed.success) return failure('invalid', INVALID_MESSAGE)
    const input = parsed.data
    if (isBotSubmission(input)) {
      return { ok: true as const, silent: true as const, message: EMAIL_SUCCESS_MESSAGE, alerts: false }
    }
    const hourKey = `${ip}:${input.email}`
    if (!emailLimiter.check(hourKey).allowed) return failure('rate_limited', RATE_LIMIT_MESSAGE)
    const dayKey = `${input.email}:${input.postal.trim().toLowerCase()}`
    if (!emailDayLimiter.check(dayKey).allowed) return failure('rate_limited', ALREADY_SENT_MESSAGE)

    const country = input.country === 'UK' ? 'UK' : input.country
    const found = await runQuizSearch({
      location: input.postal,
      country,
      limit: '200',
      sort: 'distance',
    })
    let rows = [...(found.doctors || []), ...(found.nearest || [])]
    if (emailDoctors(rows, input.doctorIds, input.country).length === 0) {
      const wider = await runQuizSearch({
        location: input.postal,
        country,
        limit: '200',
        sort: 'distance',
        radius: '4000',
      })
      rows = [...(wider.doctors || []), ...(wider.nearest || []), ...rows]
    }
    const doctors = emailDoctors(rows, input.doctorIds, input.country)
    let mailed = false
    if (doctors.length > 0) {
    let mailingAddress = ''
    try {
      mailingAddress = getMailingAddress()
    } catch (err) {
      console.error('[QUIZ] emailResults:', err instanceof Error ? err.message : 'mailing address missing')
      return failure('error', EMAIL_FAIL_MESSAGE)
    }
    const unsubscribeUrl = `https://www.neurochiro.co/unsubscribe?email=${encodeURIComponent(input.email)}`
    const seeAll = directoryHref({
      place: input.postal,
      country: input.country,
      concern: 'pain',
      noLocal: true,
      empty: false,
    })
    const mail = resultsEmailContent({
      postal: input.postal,
      doctors,
      directoryHref: seeAll,
      mailingAddress,
      unsubscribeUrl,
    })
    if (mail.html.includes('neurochirodirectory.com')) {
      console.error('[QUIZ] emailResults: blocked unexpected domain')
      return failure('error', EMAIL_FAIL_MESSAGE)
    }
    const sent = await sendTracked({
      requestId: null,
      kind: 'quiz_results',
      channel: 'email',
      to: input.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })
    if (!sent.ok) {
      console.error('[QUIZ] emailResults:', sent.error || 'send failed')
      return failure('error', EMAIL_FAIL_MESSAGE)
    }
    mailed = true
    recordQuizEvent({
      sessionId: input.sessionId,
      event: 'email_sent',
      source: input.source,
      country: input.country,
    })
    } else if (input.doctorIds.length > 0) {
      return failure('error', EMAIL_FAIL_MESSAGE)
    }

    let alerts = false
    if (input.alerts) {
      const subscribed = await subscribeEmail({
        email: input.email,
        zip: input.postal,
        country: input.country === 'UK' ? 'GB' : input.country,
        source: 'quiz',
        ip,
        userAgent: '',
        skipCoverageCheck: true,
      })
      alerts = subscribed.status < 400 && subscribed.body.ok === true
      if (alerts) {
        recordQuizEvent({
          sessionId: input.sessionId,
          event: 'alerts_opt_in',
          source: input.source,
          country: input.country,
        })
      }
    }

    const message = mailed && alerts
      ? `${EMAIL_SUCCESS_MESSAGE} ${ALERTS_SUCCESS_MESSAGE}`
      : mailed
        ? EMAIL_SUCCESS_MESSAGE
        : alerts
          ? ALERTS_SUCCESS_MESSAGE
          : EMAIL_FAIL_MESSAGE
    if (!mailed && !alerts) return failure('error', message)
    return {
      ok: true as const,
      silent: false as const,
      message,
      alerts,
    }
  } catch (err) {
    console.error('[QUIZ] emailResults:', err instanceof Error ? err.message : 'failed')
    return failure('error', GENERIC_ERROR_MESSAGE)
  }
}

export async function trackQuizEvent(raw: unknown) {
  try {
    const ip = await clientIp()
    if (!eventLimiter.check(ip).allowed) return failure('rate_limited', RATE_LIMIT_MESSAGE)
    const parsed = quizEventSchema.safeParse(raw)
    if (!parsed.success) return failure('invalid', INVALID_MESSAGE)
    recordQuizEvent(parsed.data)
    return { ok: true as const }
  } catch (err) {
    console.error('[QUIZ] trackQuizEvent:', err instanceof Error ? err.message : 'failed')
    return failure('error', GENERIC_ERROR_MESSAGE)
  }
}
