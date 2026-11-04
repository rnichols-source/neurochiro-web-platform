import { z } from 'zod'
import { detectPostalCode } from '../detect-postal.ts'
import { isPlausibleEmail, isPlausiblePhone, normalizeEmail } from '../leads/validate.ts'
import {
  CONCERN_IDS,
  countriesMatch,
  ENTRY_SOURCES,
  EXPERIENCE_IDS,
  LEGACY_EXPERIENCE,
  LEGACY_PRIORITY,
  postalHint,
  PRIORITY_IDS,
  QUIZ_COUNTRIES,
  QUIZ_EVENTS,
  QUIZ_REQUEST_CONSENT_STORED,
  QUIZ_STEPS,
  type QuizCountry,
} from './options.ts'

function mapExperience(value: unknown): unknown {
  if (typeof value !== 'string') return value
  return LEGACY_EXPERIENCE[value] || value
}

function mapPriority(value: unknown): unknown {
  if (typeof value !== 'string') return value
  return LEGACY_PRIORITY[value] || value
}

function mapSource(value: unknown): unknown {
  if (typeof value === 'string' && (ENTRY_SOURCES as readonly string[]).includes(value)) return value
  return 'direct'
}

const experienceSchema = z.preprocess(mapExperience, z.enum(EXPERIENCE_IDS))
const prioritySchema = z.preprocess(mapPriority, z.enum(PRIORITY_IDS))
const sourceSchema = z.preprocess(mapSource, z.enum(ENTRY_SOURCES))

export const matchInputSchema = z.object({
  concern: z.enum(CONCERN_IDS),
  country: z.enum(QUIZ_COUNTRIES),
  postal: z.string().trim().max(10).optional().default(''),
  city: z.string().trim().max(80).optional().default(''),
  region: z.string().trim().max(40).optional().default(''),
  experience: experienceSchema,
  priority: prioritySchema,
  source: sourceSchema.optional().default('direct'),
  sessionId: z.string().uuid(),
}).superRefine((value, ctx) => {
  const detected = value.postal ? detectPostalCode(value.postal, postalHint(value.country)) : null
  const postalOk = !!detected && countriesMatch(detected.country, value.country)
  const cityOk = value.city.length > 0 && value.region.length > 0
  if (!postalOk && !cityOk) {
    ctx.addIssue({ code: 'custom', message: 'Enter a postal code, or a city and state.', path: ['postal'] })
  }
})

export const requestInputSchema = z.object({
  doctorId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40).optional().default(''),
  email: z.string().trim().max(120).optional().default(''),
  bestTime: z.string().trim().max(80).optional().default(''),
  message: z.string().trim().max(500).optional().default(''),
  consent: z.literal(true),
  consentText: z.literal(QUIZ_REQUEST_CONSENT_STORED),
  smsConsent: z.boolean().optional().default(false),
  _hp: z.string().max(200).optional().default(''),
  startedAt: z.number(),
  sessionId: z.string().uuid(),
  source: sourceSchema.optional().default('direct'),
}).superRefine((value, ctx) => {
  const phoneOk = value.phone ? isPlausiblePhone(value.phone) : false
  const emailOk = value.email ? isPlausibleEmail(value.email) : false
  if (value.phone && !phoneOk) {
    ctx.addIssue({ code: 'custom', message: 'Enter a phone number we can call.', path: ['phone'] })
  }
  if (value.email && !emailOk) {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid email address.', path: ['email'] })
  }
  if (!phoneOk && !emailOk) {
    ctx.addIssue({ code: 'custom', message: 'Enter a phone number or an email.', path: ['phone'] })
  }
}).transform((value) => ({
  ...value,
  email: value.email ? (normalizeEmail(value.email) || '') : '',
}))

export const emailResultsInputSchema = z.object({
  email: z.string().trim().max(120),
  country: z.enum(QUIZ_COUNTRIES),
  postal: z.string().trim().max(10),
  doctorIds: z.array(z.string().uuid()).max(6),
  consent: z.literal(true),
  alerts: z.boolean(),
  _hp: z.string().max(200).optional().default(''),
  startedAt: z.number(),
  sessionId: z.string().uuid(),
  source: sourceSchema.optional().default('direct'),
}).superRefine((value, ctx) => {
  if (!isPlausibleEmail(value.email)) {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid email address.', path: ['email'] })
  }
  const detected = detectPostalCode(value.postal, postalHint(value.country))
  if (!detected || !countriesMatch(detected.country, value.country)) {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid postal code.', path: ['postal'] })
  }
}).transform((value) => ({
  ...value,
  email: normalizeEmail(value.email) || value.email.trim().toLowerCase(),
}))

export const quizEventSchema = z.object({
  sessionId: z.string().uuid(),
  event: z.enum(QUIZ_EVENTS),
  step: z.enum(QUIZ_STEPS).optional(),
  source: z.enum(ENTRY_SOURCES).optional(),
  country: z.enum(QUIZ_COUNTRIES).optional(),
  concern: z.enum(CONCERN_IDS).optional(),
  matchCount: z.number().int().min(0).max(50).optional(),
  bandMiles: z.number().int().min(0).max(5000).optional(),
  doctorId: z.string().uuid().optional(),
}).strict()

export type MatchInput = z.infer<typeof matchInputSchema>
export type RequestInput = z.infer<typeof requestInputSchema>
export type EmailResultsInput = z.infer<typeof emailResultsInputSchema>
export type QuizEventInput = z.infer<typeof quizEventSchema>

export function normalizedPostal(input: { postal?: string; country: QuizCountry }): string {
  const detected = input.postal ? detectPostalCode(input.postal, postalHint(input.country)) : null
  if (!detected || !countriesMatch(detected.country, input.country)) return ''
  return detected.code
}

export function placeLabel(input: { postal?: string; city?: string; region?: string; country: QuizCountry }): string {
  const postal = normalizedPostal(input)
  if (postal) return postal
  const city = (input.city || '').trim()
  const region = (input.region || '').trim()
  return region ? `${city}, ${region}` : city
}

/** A filled honeypot or a form finished in under 2 seconds is treated as a bot. */
export function isBotSubmission(input: { _hp?: string; startedAt?: number }, now = Date.now()): boolean {
  if ((input._hp || '').trim()) return true
  if (typeof input.startedAt === 'number' && now - input.startedAt < 2000) return true
  return false
}
