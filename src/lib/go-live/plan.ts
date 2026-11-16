import { toApplicationE164 } from '../applications/phone.ts'
import { toE164 } from '../sms/phone.ts'
import { isDoctorMembershipProduct, isStudentProduct, type ProductHint } from './products.ts'

export const DOCTOR_PAY_URL = 'https://buy.stripe.com/4gM14p3EHeEs8qyfas7wA0q'
export const PORTAL_LOGIN_URL = 'https://neurochiro.co/login?next=%2Fdoctor%2Fdashboard'
export const PORTAL_HOME_URL = 'https://neurochiro.co/doctor/dashboard'
export const REQUESTS_URL = 'https://neurochiro.co/doctor/leads'
export const REFERRAL_URL = 'https://neurochiro.co/doctor/referrals'
export const UNPAID_HIDE_MS = 72 * 60 * 60 * 1000

const NON_MEMBERSHIP = new Set([
  'doctor_application_setup',
  'synapse_seat',
  'synapse_addon',
  'seminar_package',
  'job_feature',
  'job_post_nonmember',
  'job_listing',
  'course_purchase',
  'store_purchase',
  'store_cart',
  'vendor',
  'seminar_listing',
  'neuros_signup',
  'conference_signup',
])

/** Recurring list prices, Dec 1 USD prices, founding currencies, and multi-office totals. */
const KNOWN_AMOUNTS: Record<string, number[]> = {
  usd: [9900, 99000, 19900, 199000, 16800, 168000, 30600, 306000],
  cad: [13900, 139000],
  aud: [12900, 129000],
  gbp: [7900, 79000],
  eur: [7900, 79000],
  nzd: [13900, 139000],
  aed: [36400, 363600],
}

/** One-time first charges: $39 back pay and $49 Brave Practice first month. */
const SPECIAL_ONE_TIME: Record<string, number[]> = {
  usd: [3900, 4000, 4100, 4200, 4300, 4400, 4500, 4600, 4700, 4800, 4900],
}

export type PaymentState = 'paid' | 'requires_action' | 'failed'

export function publishOnPayment(state: PaymentState): boolean {
  return state === 'paid'
}

export function shouldHideUnpaid(input: {
  status: string
  reviewedAt: string | null
  paid: boolean
  now: string
}): boolean {
  if (input.paid) return false
  if (input.status !== 'needs_action') return false
  const reviewed = Date.parse(input.reviewedAt || '')
  if (!Number.isFinite(reviewed)) return false
  return Date.parse(input.now) - reviewed >= UNPAID_HIDE_MS
}

export function smsAlertsEnabled(value: boolean | null | undefined): boolean {
  return value === true
}

export function canTextNumber(phone: string | null | undefined): boolean {
  return Boolean(phone && toE164(phone, 'US'))
}

export type ListingSource = {
  firstName: string
  lastName: string
  practiceApproach: string
  techniques: string
  officeAddress: string
  city: string
  state: string
  country: string
  website: string
  instagram: string
  /** Private SMS / alert mobile. Text alerts use this. The public listing does not. */
  phone: string
  /** Office or other public phone, collected separately from the alert mobile. */
  officePhone?: string
  /** Phone already on the public listing. Left unchanged when it is set. */
  currentPhone?: string
  clinicName?: string
  hours?: string
  bookingUrl?: string
  photoUrl?: string
}

export function techniquesToSpecialties(value: string): string[] {
  const seen = new Set<string>()
  const items: string[] = []
  for (const part of value.split(/,|&|\/|\band\b/i)) {
    const next = part.trim().replace(/\s+/g, ' ')
    if (next.length < 2) continue
    const key = next.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    items.push(next.slice(0, 80))
    if (items.length === 12) break
  }
  return items
}

export function listingContentPatch(input: ListingSource): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  const clinic = (input.clinicName || '').trim()
  const bio = input.practiceApproach.trim()
  const address = input.officeAddress.trim()
  const city = input.city.trim()
  const state = input.state.trim()
  const country = input.country.trim().toUpperCase()
  const website = input.website.trim()
  const instagram = input.instagram.trim().replace(/^@/, '')
  const hours = (input.hours || '').trim()
  const booking = (input.bookingUrl || '').trim()
  const photo = (input.photoUrl || '').trim()
  const specialties = techniquesToSpecialties(input.techniques)
  if (clinic) patch.clinic_name = clinic.slice(0, 160)
  if (bio) patch.bio = bio.slice(0, 4000)
  if (address) patch.address = address.slice(0, 300)
  if (city) patch.city = city.slice(0, 80)
  if (state) patch.state = state.slice(0, 40)
  if (country && country !== 'OTHER') patch.country = country.slice(0, 8)
  if (website) patch.website_url = website.slice(0, 300)
  if (instagram) patch.instagram_url = `https://www.instagram.com/${instagram.slice(0, 80)}/`
  const publicPhone = publishedListingPhone(input)
  if (publicPhone) patch.phone = publicPhone
  if (hours) patch.hours = hours.slice(0, 1000)
  if (booking) patch.booking_url = booking.slice(0, 300)
  if (photo) patch.photo_url = photo.slice(0, 500)
  if (specialties.length) patch.specialties = specialties
  return patch
}

export type CompletenessField = {
  key: string
  label: string
  href: string
  done: boolean
}

export function profileCompleteness(input: {
  clinicName: string
  bio: string
  photo: string
  specialties: string[]
  hours: string
  phone: string
  address: string
  city: string
  bookingUrl: string
  latitude: number | null
  longitude: number | null
  textNumber: boolean
}): { percent: number; missing: CompletenessField[]; fields: CompletenessField[] } {
  const fields: CompletenessField[] = [
    { key: 'clinic', label: 'Practice name', href: '/doctor/profile?tab=basics', done: input.clinicName.trim().length > 1 },
    { key: 'bio', label: 'Bio', href: '/doctor/profile?tab=about', done: input.bio.trim().length >= 20 },
    { key: 'photo', label: 'Photo', href: '/doctor/profile?tab=photos', done: input.photo.trim().length > 0 },
    { key: 'specialties', label: 'Techniques', href: '/doctor/profile?tab=services', done: input.specialties.length > 0 },
    { key: 'hours', label: 'Office hours', href: '/doctor/profile?tab=basics', done: input.hours.trim().length > 0 },
    { key: 'phone', label: 'Phone', href: '/doctor/profile?tab=basics', done: input.phone.trim().length > 0 },
    { key: 'address', label: 'Address', href: '/doctor/profile?tab=basics', done: input.address.trim().length > 3 && input.city.trim().length > 1 },
    { key: 'booking', label: 'Booking link', href: '/doctor/profile?tab=links', done: input.bookingUrl.trim().length > 0 },
    { key: 'map', label: 'Map pin', href: '/doctor/profile?tab=basics', done: input.latitude != null && input.longitude != null && input.latitude !== 0 },
    { key: 'text', label: 'Text number', href: '/doctor/settings', done: input.textNumber },
  ]
  const done = fields.filter((field) => field.done).length
  return {
    percent: Math.round((done / fields.length) * 100),
    missing: fields.filter((field) => !field.done),
    fields,
  }
}

export function needsProfileFinish(missing: CompletenessField[]): boolean {
  return missing.some((field) => field.key !== 'booking' && field.key !== 'text')
}

export function duplicateKey(firstName: string, lastName: string, city: string): string {
  return [firstName, lastName, city].map((part) => part.trim().toLowerCase().replace(/\s+/g, ' ')).join('|')
}

export type CheckoutContact = {
  phone: string | null
  smsConsent: boolean | null
  city: string | null
  state: string | null
  clinicName: string | null
  website: string | null
}

type CustomField = {
  key?: string
  label?: { custom?: string }
  text?: { value?: string | null }
  numeric?: { value?: string | null }
  dropdown?: { value?: string | null }
}

function fieldValue(field: CustomField): string {
  return (field.text?.value || field.numeric?.value || field.dropdown?.value || '').trim()
}

function fieldName(field: CustomField): string {
  return `${field.key || ''} ${field.label?.custom || ''}`.toLowerCase()
}

export function readCheckoutContact(fields: unknown): CheckoutContact {
  const list = Array.isArray(fields) ? fields as CustomField[] : []
  const contact: CheckoutContact = { phone: null, smsConsent: null, city: null, state: null, clinicName: null, website: null }
  for (const field of list) {
    const name = fieldName(field)
    const value = fieldValue(field)
    if (!value) continue
    if (/phone|mobile|cell/.test(name) && !contact.phone) contact.phone = value
    else if (/consent|text alert|sms/.test(name)) {
      contact.smsConsent = /^(yes|y|true|i agree|agreed)$/i.test(value)
    } else if (name.includes('city') && !contact.city) contact.city = value
    else if (/\bstate\b|province/.test(name) && !contact.state) contact.state = value
    else if (/clinic|practice/.test(name) && !contact.clinicName) contact.clinicName = value
    else if (/website|url/.test(name) && !contact.website) contact.website = value
  }
  return contact
}

export type CheckoutIdentity = {
  sessionId: string
  customerId: string | null
  subscriptionId: string | null
  email: string
  name: string
  phone: string | null
  smsConsent: boolean | null
  city: string | null
  state: string | null
  country: string | null
  clinicName: string | null
  amountTotal: number | null
  currency: string | null
  priceId: string | null
  metadataType: string | null
  metadataRole: string | null
  userId: string | null
  mode: string | null
  paymentLinkPresent: boolean
  /** Invoices have no Payment Link. The amount list still applies when the product could not be loaded. */
  allowAmountFallback?: boolean
}

export type { ProductHint }

function amountMatches(currency: string | null, amount: number | null, table: Record<string, number[]>): boolean {
  if (amount == null) return false
  return (table[(currency || '').toLowerCase()] || []).includes(amount)
}

/**
 * A checkout is a doctor membership when metadata, a known price, the Stripe
 * product, or the amount fallback says so. Students and other products never match.
 * The amount fallback stays for Payment Links whose product could not be loaded.
 */
export function isDoctorMembershipCheckout(
  input: CheckoutIdentity,
  known: { priceIds: string[]; studentPriceIds: string[] },
  product?: ProductHint | null,
): boolean {
  const type = (input.metadataType || '').trim()
  if (NON_MEMBERSHIP.has(type)) return false
  if ((input.metadataRole || '').toLowerCase() === 'student') return false
  if (input.priceId && known.studentPriceIds.includes(input.priceId)) return false
  if (isStudentProduct(product)) return false
  if (type === 'doctor_membership' || (input.metadataRole || '').toLowerCase() === 'doctor') return true
  if (input.priceId && known.priceIds.includes(input.priceId)) return true
  if (isDoctorMembershipProduct(product)) return true
  if (product?.id) return false
  if (type) return false
  const amountAllowed = input.paymentLinkPresent || input.allowAmountFallback === true
  if (!amountAllowed) return false
  if (input.mode === 'payment') {
    return amountMatches(input.currency, input.amountTotal, SPECIAL_ONE_TIME)
      || amountMatches(input.currency, input.amountTotal, { aed: [363600] })
  }
  if (input.mode !== 'subscription') return false
  if (amountMatches(input.currency, input.amountTotal, SPECIAL_ONE_TIME)) return true
  return amountMatches(input.currency, input.amountTotal, KNOWN_AMOUNTS)
}

export type ExistingListing = {
  id: string
  email: string | null
  firstName: string
  lastName: string
  city: string
  userId: string | null
  stripeCustomerId: string | null
}

export type PathBPlan =
  | { action: 'skip'; reason: string }
  | { action: 'attach'; doctorId: string; reason: 'email' | 'customer' }
  | { action: 'flag_duplicate'; doctorId: string }
  | { action: 'create' }

export function isPublicLiveListing(row: {
  verificationStatus?: string | null
  isApproved?: boolean | null
}): boolean {
  return row.verificationStatus === 'verified' || row.isApproved === true
}

export type CheckoutIntake =
  | { action: 'ignore'; reason: 'not_membership' }
  | { action: 'link_live'; doctorId: string }
  | { action: 'go_live'; doctorId: string }
  | { action: 'create_and_go_live' }

/**
 * Payment publishes the doctor. A listing that already has a successful go-live
 * run only stores Stripe ids. Every other payer runs go-live, and a live listing
 * is never hidden.
 */
export function planCheckoutIntake(input: {
  membership: boolean
  hasOkGoLive?: boolean
  listings: Array<ExistingListing & { verificationStatus?: string | null; isApproved?: boolean | null }>
}): CheckoutIntake {
  if (!input.membership) return { action: 'ignore', reason: 'not_membership' }
  const live = input.listings.find((row) => isPublicLiveListing(row))
  if (live && input.hasOkGoLive) return { action: 'link_live', doctorId: live.id }
  if (live) return { action: 'go_live', doctorId: live.id }
  const pending = input.listings[0]
  if (pending) return { action: 'go_live', doctorId: pending.id }
  return { action: 'create_and_go_live' }
}

export type InvoiceApplication = {
  id: string
  status: string
  reviewedAt: string | null
  createdAt: string
}

export type InvoiceIntake =
  | { action: 'ignore'; reason: 'not_paid' | 'renewal' | 'not_membership' | 'already_live' }
  | { action: 'complete_bank'; applicationId: string }
  | { action: 'go_live'; doctorId: string }
  | { action: 'create_and_go_live' }

/** A renewal never starts go-live. The first paid doctor-membership invoice does. */
export function invoiceIsRenewal(billingReason: string | null, hasSubscription: boolean): boolean {
  const reason = (billingReason || '').trim()
  if (reason === 'subscription_cycle' || reason === 'subscription_update' || reason === 'subscription_threshold' || reason === 'upcoming') {
    return true
  }
  if (reason === 'subscription_create' || reason === 'manual') return false
  if (!reason) return hasSubscription
  return hasSubscription
}

export function planInvoiceIntake(input: {
  billingReason: string | null
  amountPaid: number
  membership: boolean
  hasSubscription?: boolean
  hasOkGoLive?: boolean
  applications: InvoiceApplication[]
  listings: Array<{ id?: string; verificationStatus?: string | null; isApproved?: boolean | null }>
}): InvoiceIntake {
  if (input.amountPaid <= 0) return { action: 'ignore', reason: 'not_paid' }
  const reason = input.billingReason || ''
  const hasSubscription = input.hasSubscription ?? (
    reason === 'subscription_create'
    || reason === 'subscription_cycle'
    || reason === 'subscription_update'
    || reason === 'subscription_threshold'
  )
  if (invoiceIsRenewal(input.billingReason, hasSubscription)) {
    return { action: 'ignore', reason: 'renewal' }
  }
  if (!input.membership) return { action: 'ignore', reason: 'not_membership' }
  const bank = [...input.applications]
    .filter((row) => row.status === 'needs_action' && row.reviewedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (bank) return { action: 'complete_bank', applicationId: bank.id }
  if (input.hasOkGoLive) return { action: 'ignore', reason: 'already_live' }
  const listing = input.listings.find((row) => row.id)
  if (listing?.id) return { action: 'go_live', doctorId: listing.id }
  return { action: 'create_and_go_live' }
}

export function subscriptionIdFromInvoice(invoice: {
  subscription?: unknown
  parent?: { subscription_details?: { subscription?: unknown } | null } | null
}): string | null {
  const nested = invoice.parent?.subscription_details?.subscription
  if (typeof nested === 'string' && nested) return nested
  if (nested && typeof nested === 'object' && 'id' in nested) {
    const id = (nested as { id?: unknown }).id
    if (typeof id === 'string' && id) return id
  }
  return typeof invoice.subscription === 'string' && invoice.subscription ? invoice.subscription : null
}

export function phoneFromCheckout(customFields: unknown, customerPhone: string | null | undefined): string | null {
  const custom = readCheckoutContact(customFields).phone
  if (custom) return custom
  const builtIn = (customerPhone || '').trim()
  return builtIn || null
}

/** Office phone to publish when the listing phone is blank. Null leaves the column unchanged. */
export function publishedListingPhone(input: {
  currentPhone?: string | null
  officePhone?: string | null
}): string | null {
  if ((input.currentPhone || '').trim()) return null
  const office = (input.officePhone || '').trim()
  return office ? office.slice(0, 40) : null
}

/** Checkout cell, including Stripe's built-in phone, stays on the private text-alert fields. */
export function listingPhonesFromCheckout(input: {
  phone: string | null
  smsConsent: boolean | null
}): { phone: string; alertPhone: string | null } {
  const cell = (input.phone || '').trim()
  return {
    phone: '',
    alertPhone: input.smsConsent === true && cell ? cell : null,
  }
}

export type CheckoutApplicationContact = {
  /** Public listing phone. A checkout cell is never written here. */
  listingPhone: ''
  application: {
    mobile_e164: string
    sms_consent: boolean
    sms_consent_at: string | null
  } | null
  /** Set when they consented and the number can take a US or Canadian text. */
  alertPhone: string | null
}

/** Keep the checkout cell on the application, whether or not they agreed to texts. */
export function checkoutApplicationContact(input: {
  phone: string | null
  smsConsent: boolean | null
  country: string | null
  now: string
}): CheckoutApplicationContact {
  const consent = input.smsConsent === true
  const country = (input.country || 'US').trim() || 'US'
  const mobile = toApplicationE164(input.phone, country)
  return {
    listingPhone: '',
    application: mobile
      ? {
          mobile_e164: mobile,
          sms_consent: consent,
          sms_consent_at: consent ? input.now : null,
        }
      : null,
    alertPhone: consent && mobile && canTextNumber(mobile) ? mobile : null,
  }
}

export function paymentIntentIdFromInvoicePayment(payment: {
  status?: string | null
  payment?: { type?: string | null; payment_intent?: string | { id?: string | null } | null } | null
}): string | null {
  if (payment.status && payment.status !== 'paid') return null
  const intent = payment.payment?.payment_intent
  if (typeof intent === 'string' && intent) return intent
  if (intent && typeof intent === 'object' && typeof intent.id === 'string' && intent.id) return intent.id
  return null
}

export function planPathB(input: {
  identity: CheckoutIdentity
  existing: ExistingListing[]
  claimed: boolean
  membership: boolean
}): PathBPlan {
  if (input.claimed) return { action: 'skip', reason: 'already_claimed' }
  if (!input.membership) return { action: 'skip', reason: 'not_membership' }
  if (input.identity.userId) return { action: 'skip', reason: 'account_already_linked' }
  const email = input.identity.email.trim().toLowerCase()
  if (!email.includes('@')) return { action: 'skip', reason: 'missing_email' }
  const byCustomer = input.identity.customerId
    ? input.existing.find((row) => row.stripeCustomerId && row.stripeCustomerId === input.identity.customerId)
    : null
  if (byCustomer) return { action: 'attach', doctorId: byCustomer.id, reason: 'customer' }
  const byEmail = input.existing.find((row) => (row.email || '').trim().toLowerCase() === email)
  if (byEmail) return { action: 'attach', doctorId: byEmail.id, reason: 'email' }
  const [firstName, ...rest] = input.identity.name.trim().split(/\s+/)
  const lastName = rest.join(' ')
  const city = (input.identity.city || '').trim()
  if (firstName && lastName && city) {
    const key = duplicateKey(firstName, lastName, city)
    const twin = input.existing.find((row) => duplicateKey(row.firstName, row.lastName, row.city) === key)
    if (twin) return { action: 'flag_duplicate', doctorId: twin.id }
  }
  return { action: 'create' }
}

export function webhookDisposition(input: { alreadyProcessed: boolean; claimed: boolean }):
  | { process: false; reason: 'duplicate_event' | 'already_claimed' }
  | { process: true } {
  if (input.alreadyProcessed) return { process: false, reason: 'duplicate_event' }
  if (input.claimed) return { process: false, reason: 'already_claimed' }
  return { process: true }
}

export type SetupStep = 'activate_login' | 'finish_profile' | 'book_spotlight' | 'book_ig_live' | 'add_text_number'

export type NudgePlan = {
  kind: 'setup' | 'checkin'
  day: 1 | 2 | 3 | 4 | 7 | 14 | 30
  step: SetupStep | null
  key: string
}

const SETUP_ORDER: SetupStep[] = ['activate_login', 'finish_profile', 'book_spotlight', 'book_ig_live', 'add_text_number']

export function nextUnfinishedStep(done: Record<SetupStep, boolean>): SetupStep | null {
  return SETUP_ORDER.find((step) => !done[step]) || null
}

export function nextNudge(input: {
  daysSinceLive: number
  done: Record<SetupStep, boolean>
  sentKeys: string[]
}): NudgePlan | null {
  const day = input.daysSinceLive
  const sent = new Set(input.sentKeys)
  if (day === 7 || day === 14 || day === 30) {
    const key = `checkin:${day}`
    if (sent.has(key)) return null
    return { kind: 'checkin', day, step: null, key }
  }
  if (day !== 1 && day !== 2 && day !== 3 && day !== 4) return null
  const step = nextUnfinishedStep(input.done)
  if (!step) return null
  const key = `setup:${day}:${step}`
  if (sent.has(key)) return null
  return { kind: 'setup', day, step, key }
}

export function daysSince(liveAt: string, now: string): number {
  const live = Date.parse(liveAt)
  const current = Date.parse(now)
  if (!Number.isFinite(live) || !Number.isFinite(current)) return -1
  return Math.floor((current - live) / (24 * 60 * 60 * 1000))
}

export type WeekMember = {
  name: string
  city: string
  loginActivated: boolean
  profilePercent: number
  textNumber: boolean
  spotlightBooked: boolean
  igLiveBooked: boolean
  exceptions: string[]
}

export function formatNewMembers(members: WeekMember[]): string[] {
  if (!members.length) return ['New members this week:', '- None.']
  const lines = ['New members this week:']
  for (const member of members) {
    const place = member.city ? ` (${member.city})` : ''
    const checks = [
      member.loginActivated ? 'login on' : 'login not activated',
      `profile ${member.profilePercent}%`,
      member.textNumber ? 'text number on' : 'no text number',
      member.spotlightBooked ? 'Spotlight booked' : 'Spotlight not booked',
      member.igLiveBooked ? 'IG Live booked' : 'IG Live not booked',
    ]
    lines.push(`- ${member.name}${place}: ${checks.join(', ')}`)
    if (member.exceptions.length) lines.push(`  Exception: ${member.exceptions.join('; ')}`)
  }
  return lines
}

export function countryFromCurrency(currency: string | null, explicit: string | null): string {
  const given = (explicit || '').trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(given)) return given === 'UK' ? 'GB' : given
  const code = (currency || '').toLowerCase()
  if (code === 'gbp') return 'GB'
  if (code === 'cad') return 'CA'
  if (code === 'aud') return 'AU'
  if (code === 'nzd') return 'NZ'
  if (code === 'eur') return 'EU'
  if (code === 'aed') return 'AE'
  return 'US'
}

export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

export function safePayUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null
    const host = url.hostname
    if (host === 'buy.stripe.com' || host === 'invoice.stripe.com' || host === 'pay.stripe.com' || host.endsWith('.stripe.com')) {
      return url.toString()
    }
  } catch {
    return null
  }
  return null
}

export type WaitlistMatch = {
  id: string
  distanceMiles: number
  confirmed: boolean
}

export function orderWaitlistTiers<T extends WaitlistMatch>(matches: T[]): T[] {
  return [...matches].sort((a, b) => {
    const bandA = a.distanceMiles <= 25 ? 0 : 1
    const bandB = b.distanceMiles <= 25 ? 0 : 1
    if (bandA !== bandB) return bandA - bandB
    return a.distanceMiles - b.distanceMiles
  })
}

const STEP_NAMES = ['checkout', 'profile', 'portal', 'welcome', 'waitlist', 'instagram', 'summary'] as const
type StepName = (typeof STEP_NAMES)[number]

type RecordedStep = { step: string; status: string }

function recordedStepOk(steps: RecordedStep[], step: string): boolean {
  return steps.some((row) => row.step === step && row.status === 'ok')
}

/** Force re-runs unfinished work. A welcome that already succeeded stays put unless resend is ticked. */
export function shouldSendWelcome(input: { alreadyOk: boolean; resendWelcome: boolean }): boolean {
  if (!input.alreadyOk) return true
  return input.resendWelcome === true
}

export function stepsToRun(input: {
  completed: RecordedStep[]
  force: boolean
  resendWelcome: boolean
}): StepName[] {
  return STEP_NAMES.filter((step) => {
    const ok = recordedStepOk(input.completed, step)
    if (step === 'welcome') return shouldSendWelcome({ alreadyOk: ok, resendWelcome: input.resendWelcome })
    if (!ok) return true
    return input.force
  })
}

export function isStudentRole(role: string | null | undefined): boolean {
  const value = (role || '').trim().toLowerCase()
  return value === 'student' || value === 'student_paid' || value.startsWith('student_')
}

export type PromotionPlan =
  | { action: 'create_user' }
  | { action: 'exclude'; reason: 'student' | 'vendor' | 'admin' }
  | { action: 'link_existing'; promoteRole: boolean }

/** An existing community member becomes a doctor on the same auth user. Students stay students. */
export function promotionPlan(input: {
  hasAccount: boolean
  hasDoctor: boolean
  role: string | null
}): PromotionPlan {
  if (!input.hasAccount) return { action: 'create_user' }
  if (isStudentRole(input.role)) return { action: 'exclude', reason: 'student' }
  const role = (input.role || '').trim().toLowerCase()
  if (role === 'vendor') return { action: 'exclude', reason: 'vendor' }
  if (role === 'admin' || role === 'founder' || role === 'super_admin' || role === 'staff') {
    return { action: 'exclude', reason: 'admin' }
  }
  const alreadyDoctor = role.includes('doctor')
  return { action: 'link_existing', promoteRole: !alreadyDoctor }
}

export type LoggedInPlan =
  | { action: 'ignore'; reason: 'not_membership' | 'student' | 'excluded' }
  | { action: 'store_ids'; doctorId: string }
  | { action: 'go_live'; doctorId: string }
  | { action: 'promote_and_go_live' }
  | { action: 'create_and_go_live' }

export function planLoggedInCheckout(input: {
  membership: boolean
  role: string | null
  doctorId: string | null
  hasOkGoLive: boolean
}): LoggedInPlan {
  if (!input.membership) return { action: 'ignore', reason: 'not_membership' }
  const promotion = promotionPlan({
    hasAccount: true,
    hasDoctor: Boolean(input.doctorId),
    role: input.role,
  })
  if (promotion.action === 'exclude') {
    return { action: 'ignore', reason: promotion.reason === 'student' ? 'student' : 'excluded' }
  }
  if (input.doctorId && input.hasOkGoLive) return { action: 'store_ids', doctorId: input.doctorId }
  if (input.doctorId) return { action: 'go_live', doctorId: input.doctorId }
  if (promotion.action === 'link_existing') return { action: 'promote_and_go_live' }
  return { action: 'create_and_go_live' }
}

export type ProfileGap = 'website' | 'photo' | 'write-up'

export function minimumProfileGaps(input: { website: string; photo: string; bio: string }): ProfileGap[] {
  const missing: ProfileGap[] = []
  if (!input.website.trim()) missing.push('website')
  if (!input.photo.trim()) missing.push('photo')
  if (input.bio.trim().length < 20) missing.push('write-up')
  return missing
}

export function smsPromptRequired(input: { phone: string | null; consent: boolean }): boolean {
  if (input.consent === true && canTextNumber(input.phone)) return false
  return true
}

export function adminGoLiveSummary(input: {
  doctorName: string
  email: string
  profileUrl: string
  city: string
  source: string
  missing: string[]
  textSent: boolean
}): { subject: string; text: string } {
  const lines = [
    `${input.doctorName || 'A doctor'} is live.`,
    `Email: ${input.email || 'unknown'}`,
    input.city ? `City: ${input.city}` : '',
    input.profileUrl ? `Profile: ${input.profileUrl}` : '',
    `Source: ${input.source}`,
  ].filter(Boolean)
  if (input.missing.length) {
    lines.push('Profile went live in basic form: needs website/photo/write-up')
    lines.push(`Missing: ${input.missing.join(', ')}`)
  }
  if (!input.textSent) lines.push('No text sent: no mobile on file')
  return {
    subject: `Go-live: ${input.doctorName || input.email || 'new doctor'}`,
    text: lines.join('\n'),
  }
}

export function invoiceLineProduct(line: {
  price?: { id?: string | null; product?: string | { id?: string | null } | null } | null
  pricing?: { price_details?: { price?: string | null; product?: string | null } | null } | null
}): { priceId: string | null; productId: string | null } {
  const modern = line.pricing?.price_details
  const legacyProduct = line.price?.product
  const productId = modern?.product
    || (typeof legacyProduct === 'string' ? legacyProduct : legacyProduct?.id)
    || null
  const priceId = modern?.price || line.price?.id || null
  return {
    priceId: priceId || null,
    productId: productId || null,
  }
}
