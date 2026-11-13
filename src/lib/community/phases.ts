import { countryHint } from '../directory-countries.ts'
import { containsHealthWords } from '../leads/validate.ts'
import { nextWeeklyShow } from '../portal/weekly-show.ts'
import { resolveStateCode, stateCodeToName } from '../resolve-state.ts'

/** Public links for community features. Always the production host. */
export const PUBLIC_ORIGIN = 'https://neurochiro.co'

export const FEELINGS = ['doing_well', 'a_little_off', 'want_to_talk'] as const
export type Feeling = (typeof FEELINGS)[number]

export const FEELING_LABELS: Record<Feeling, string> = {
  doing_well: 'Doing well',
  a_little_off: 'A little off',
  want_to_talk: 'Want to talk',
}

export const TRIP_KINDS = ['trip', 'move', 'second_look'] as const
export type TripKind = (typeof TRIP_KINDS)[number]

export const TRIP_KIND_LABELS: Record<TripKind, string> = {
  trip: 'A trip',
  move: 'A move',
  second_look: 'A second look',
}

export const WORK_PATHS = ['ca', 'front_desk', 'student'] as const
export type WorkPath = (typeof WORK_PATHS)[number]

export const WORK_PATH_LABELS: Record<WorkPath, string> = {
  ca: 'CA',
  front_desk: 'Front desk',
  student: 'Student path',
}

export const SAMPLE_SET_ID = 'a11ce000-0000-4000-8000-000000000001'

export const SAMPLE_SET = {
  id: SAMPLE_SET_ID,
  title: 'Sample · how a set looks',
  note: 'This is sample content so you can see a set. It is not care, and it is not from a doctor.',
  steps: [
    'Read the title your doctor wrote for you',
    'Follow the step they gave you, in their words',
    'Mark the step done here when you have done it',
  ],
} as const

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
const AU_NAMES: Record<string, string> = {
  'new south wales': 'NSW',
  victoria: 'VIC',
  queensland: 'QLD',
  'south australia': 'SA',
  'western australia': 'WA',
  tasmania: 'TAS',
  'northern territory': 'NT',
  'australian capital territory': 'ACT',
}
const AU_CODES = new Set(Object.values(AU_NAMES))
const GB_NAMES: Record<string, string> = {
  england: 'ENG',
  scotland: 'SCT',
  wales: 'WLS',
  'northern ireland': 'NIR',
}
const GB_CODES = new Set(Object.values(GB_NAMES))
const NZ_NAMES: Record<string, string> = {
  auckland: 'E7',
  wellington: 'G2',
  canterbury: 'F4',
  waikato: 'E8',
  'bay of plenty': 'E9',
  otago: 'F9',
}

const COUNTRY_NAMES: Record<string, string> = {
  'united states': 'US',
  'united states of america': 'US',
  usa: 'US',
  us: 'US',
  canada: 'CA',
  'united kingdom': 'GB',
  uk: 'GB',
  britain: 'GB',
  'great britain': 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  'northern ireland': 'GB',
  australia: 'AU',
  'new zealand': 'NZ',
  ireland: 'IE',
  germany: 'DE',
  france: 'FR',
  spain: 'ES',
  italy: 'IT',
  netherlands: 'NL',
  holland: 'NL',
  belgium: 'BE',
  portugal: 'PT',
  austria: 'AT',
  switzerland: 'CH',
  sweden: 'SE',
  norway: 'NO',
  denmark: 'DK',
  finland: 'FI',
  poland: 'PL',
  mexico: 'MX',
  india: 'IN',
  japan: 'JP',
  'south africa': 'ZA',
  brazil: 'BR',
  singapore: 'SG',
  'united arab emirates': 'AE',
  uae: 'AE',
  'south korea': 'KR',
  korea: 'KR',
  philippines: 'PH',
  israel: 'IL',
  'costa rica': 'CR',
}

export type ParsedPlace = {
  label: string
  city: string | null
  stateCode: string | null
  countryCode: string | null
  scope: 'city' | 'state' | 'country'
}

export function isFeeling(value: string | null | undefined): value is Feeling {
  return (FEELINGS as readonly string[]).includes(value || '')
}

export function isTripKind(value: string | null | undefined): value is TripKind {
  return (TRIP_KINDS as readonly string[]).includes(value || '')
}

export function isWorkPath(value: string | null | undefined): value is WorkPath {
  return (WORK_PATHS as readonly string[]).includes(value || '')
}

function zonedDay(now: Date): { key: string; weekday: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(now)
  const get = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return { key: `${get('year')}-${get('month')}-${get('day')}`, weekday: get('weekday') }
}

export function addDays(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/** Monday of the current week in America/New_York. */
export function weekStartKey(now: Date): string {
  const here = zonedDay(now)
  const index = WEEKDAY_INDEX[here.weekday] ?? 0
  const delta = index === 0 ? -6 : 1 - index
  return addDays(here.key, delta)
}

export function weeklyShowLine(now: Date): { dateKey: string; label: string; tonight: boolean } {
  const show = nextWeeklyShow(now)
  return { dateKey: show.dateKey, label: show.label, tonight: show.label.startsWith('Tonight') }
}

export function prepareLiveQuestion(raw: string): { body: string } | { error: string } {
  const body = raw.trim().replace(/\s+/g, ' ')
  if (body.length < 8) return { error: 'Write a short question, at least a few words.' }
  if (body.length > 280) return { error: 'Keep the question to 280 characters.' }
  return { body }
}

function countryCodeFor(input: string): string | null {
  return COUNTRY_NAMES[input.trim().toLowerCase()] || null
}

function namedState(input: string, country: 'US' | 'CA'): { code: string; country: string } | null {
  const trimmed = input.trim()
  const code = resolveStateCode(trimmed, country)
  if (!code) return null
  if (trimmed.toUpperCase() === code) return { code, country }
  if (trimmed.toLowerCase() === stateCodeToName(code, country).toLowerCase()) return { code, country }
  return null
}

/** Known names and codes only. Does not treat a short city as an Australian region. */
function exactState(input: string): { code: string; country: string } | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const us = namedState(trimmed, 'US')
  if (us) return us
  const ca = namedState(trimmed, 'CA')
  if (ca) return ca
  const lower = trimmed.toLowerCase()
  const upper = trimmed.toUpperCase()
  if (AU_NAMES[lower]) return { code: AU_NAMES[lower], country: 'AU' }
  if (AU_CODES.has(upper)) return { code: upper, country: 'AU' }
  if (GB_NAMES[lower]) return { code: GB_NAMES[lower], country: 'GB' }
  if (GB_CODES.has(upper)) return { code: upper, country: 'GB' }
  if (NZ_NAMES[lower]) return { code: NZ_NAMES[lower], country: 'NZ' }
  return null
}

export function parsePlace(raw: string): ParsedPlace | { error: string } {
  const label = raw.trim().replace(/\s+/g, ' ')
  if (label.length < 2 || label.length > 80) return { error: 'Use a city, state, or country, up to 80 characters.' }
  if (!/^[\p{L}\p{N}][\p{L}\p{N}\s,.'-]{1,79}$/u.test(label)) return { error: 'Use letters for the place.' }

  const wholeCountry = countryCodeFor(label)
  if (wholeCountry) {
    return { label, city: null, stateCode: null, countryCode: wholeCountry, scope: 'country' }
  }
  const wholeState = exactState(label)
  if (wholeState) {
    return { label, city: null, stateCode: wholeState.code, countryCode: wholeState.country, scope: 'state' }
  }

  const parts = label.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const tail = parts[parts.length - 1]
    const tailCountry = countryCodeFor(tail)
    const tailState = exactState(tail)
    if (tailState && !tailCountry) {
      return {
        label,
        city: parts.slice(0, -1).join(', '),
        stateCode: tailState.code,
        countryCode: tailState.country,
        scope: 'city',
      }
    }
    if (tailCountry) {
      const head = parts.slice(0, -1).join(', ')
      if (parts.length >= 3) {
        const mid = exactState(parts[parts.length - 2])
        if (mid) {
          return {
            label,
            city: parts.slice(0, -2).join(', '),
            stateCode: mid.code,
            countryCode: tailCountry,
            scope: 'city',
          }
        }
      }
      const headState = exactState(head)
      if (headState) {
        return { label, city: null, stateCode: headState.code, countryCode: tailCountry, scope: 'state' }
      }
      return { label, city: head, stateCode: null, countryCode: tailCountry, scope: 'city' }
    }
  }

  const hint = countryHint(label)
  return {
    label,
    city: label.split(',')[0].trim(),
    stateCode: null,
    countryCode: hint,
    scope: 'city',
  }
}

export function placeSearchLabel(place: ParsedPlace): string {
  if (place.scope === 'country') {
    const name = Object.entries(COUNTRY_NAMES).find(([, code]) => code === place.countryCode && place.label.toLowerCase() !== 'us' && place.label.toLowerCase() !== 'uk')
    return name ? place.label : place.label
  }
  return place.label
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function validateTripDates(start: string, end: string, now = new Date()): string | null {
  if (!ISO_DATE.test(start) || !ISO_DATE.test(end)) return 'Choose a start and an end date.'
  const startMs = Date.parse(`${start}T12:00:00Z`)
  const endMs = Date.parse(`${end}T12:00:00Z`)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 'Those dates do not look usable.'
  if (start > end) return 'The end date comes after the start.'
  const today = zonedDay(now).key
  if (end < addDays(today, -1)) return 'That stay has already ended.'
  if (start > addDays(today, 730)) return 'Pick a date within the next two years.'
  if ((endMs - startMs) / 86400000 > 180) return 'Keep one stay to 180 days. You can add another after that.'
  return null
}

export function formatTripRange(start: string, end: string): string {
  const a = new Date(`${start}T12:00:00Z`)
  const b = new Date(`${end}T12:00:00Z`)
  const month = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(date)
  const sameMonth = a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth()
  if (sameMonth) return `${month(a)} ${a.getUTCDate()}–${b.getUTCDate()}`
  if (a.getUTCFullYear() === b.getUTCFullYear()) return `${month(a)} ${a.getUTCDate()}–${month(b)} ${b.getUTCDate()}`
  return `${month(a)} ${a.getUTCDate()}, ${a.getUTCFullYear()}–${month(b)} ${b.getUTCDate()}, ${b.getUTCFullYear()}`
}

export function passportHomeLine(place: string, start: string, end: string): string {
  return `You're going to ${place} ${formatTripRange(start, end)}. Find a nervous system chiropractor while you're there.`
}

export type PassportShare = {
  sharedFirstName: string | null
  homeClinicLabel: string | null
  familyFirstNames: string | null
  exerciseTitles: string | null
  note: string | null
  error: string | null
}

export function preparePassportShare(input: {
  shareFirstName: boolean
  shareHomeClinic: boolean
  shareFamily: boolean
  shareExercises: boolean
  firstName: string | null
  homeClinicLabel: string | null
  familyFirstNames: string[]
  exerciseTitles: string[]
  note: string
}): PassportShare {
  const note = input.note.trim().slice(0, 280)
  if (containsHealthWords(note)) {
    return emptyPassport('Keep the note to a hello. A passport is not a chart.')
  }
  if (input.shareFirstName && !input.firstName) {
    return emptyPassport('Add your name on your account before sharing it.')
  }
  if (input.shareHomeClinic && !input.homeClinicLabel) {
    return emptyPassport('Choose a home doctor before sharing a home clinic.')
  }
  const names = input.shareFamily ? input.familyFirstNames.map((name) => name.trim()).filter(Boolean) : []
  if (input.shareFamily && names.length === 0) {
    return emptyPassport('Add a household first name before sharing it.')
  }
  const titles = input.shareExercises ? input.exerciseTitles.map((title) => title.trim()).filter(Boolean) : []
  if (input.shareExercises && titles.length === 0) {
    return emptyPassport('Turn on passport sharing for a set first, or leave that off.')
  }
  return {
    sharedFirstName: input.shareFirstName ? input.firstName : null,
    homeClinicLabel: input.shareHomeClinic ? input.homeClinicLabel : null,
    familyFirstNames: names.length ? names.join(', ') : null,
    exerciseTitles: titles.length ? titles.join(' · ') : null,
    note: note || null,
    error: null,
  }
}

function emptyPassport(error: string): PassportShare {
  return {
    sharedFirstName: null,
    homeClinicLabel: null,
    familyFirstNames: null,
    exerciseTitles: null,
    note: null,
    error,
  }
}

export function passportDoctorView(input: {
  place: string
  when: string
  sharedFirstName: string | null
  homeClinicLabel: string | null
  familyFirstNames: string | null
  exerciseTitles: string | null
  note: string | null
}): { title: string; lines: string[] } {
  const who = input.sharedFirstName || 'A community member'
  const lines = [`${who} is going to ${input.place} (${input.when}) and asked for a warm introduction.`]
  if (input.homeClinicLabel) lines.push(`Home clinic they chose to share: ${input.homeClinicLabel}.`)
  if (input.familyFirstNames) lines.push(`Household first names they chose to share: ${input.familyFirstNames}.`)
  if (input.exerciseTitles) lines.push(`Sets they chose to share: ${input.exerciseTitles}.`)
  if (input.note) lines.push(input.note)
  lines.push('This is not a chart. Nothing else was shared.')
  return { title: 'Care passport', lines }
}

export function parseExerciseDraft(input: { title: string; note: string; stepsText: string }):
  | { title: string; note: string | null; steps: string[] }
  | { error: string } {
  const title = input.title.trim().replace(/\s+/g, ' ')
  if (title.length < 3 || title.length > 80) return { error: 'Give the set a title, from 3 to 80 characters.' }
  if (/^sample\b/i.test(title)) return { error: 'Sample is reserved for the labeled preview set.' }
  const note = input.note.trim().replace(/\s+/g, ' ')
  if (note.length > 240) return { error: 'Keep the note to 240 characters.' }
  const steps = input.stepsText
    .split('\n')
    .map((step) => step.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
  if (steps.length < 1 || steps.length > 8) return { error: 'Write 1 to 8 steps, one per line.' }
  if (steps.some((step) => step.length < 3 || step.length > 160)) {
    return { error: 'Each step needs 3 to 160 characters.' }
  }
  return { title, note: note || null, steps }
}

export function reminderLine(title: string): string {
  return `${title} is here when you have a quiet minute.`
}

export function isInvitationToken(value: string | null | undefined): boolean {
  return /^[A-Za-z0-9_-]{20,64}$/.test(value || '')
}

export function invitationUrl(token: string): string {
  return `${PUBLIC_ORIGIN}/for/${token}`
}

export function prepareInvitation(input: {
  recipientWords: string
  place: string
  note: string
}): { recipientWords: string; place: ParsedPlace; note: string | null } | { error: string } {
  const recipientWords = input.recipientWords.trim().replace(/\s+/g, ' ')
  if (recipientWords.length < 2 || recipientWords.length > 80) {
    return { error: 'Say who this is for, in a few words.' }
  }
  if (containsHealthWords(recipientWords) || containsHealthWords(input.note)) {
    return { error: 'Keep this to a personal note. Leave health details out.' }
  }
  const place = parsePlace(input.place)
  if ('error' in place) return place
  const note = input.note.trim().replace(/\s+/g, ' ').slice(0, 280)
  return { recipientWords, place, note: note || null }
}

export function invitationMessage(input: {
  placeLabel: string
  note: string | null
  doctorTitle: string | null
  token: string
}): string {
  const intro = input.doctorTitle
    ? `I wanted you to have a nervous system chiropractor near ${input.placeLabel}. I had ${input.doctorTitle} in mind.`
    : `I wanted you to have a nervous system chiropractor near ${input.placeLabel}. Doctors there are already pulled up, so you are not starting from a blank search.`
  const lines = [intro]
  if (input.note) lines.push(input.note)
  lines.push(invitationUrl(input.token))
  return lines.join('\n\n')
}

export function invitationShareLinks(message: string): { sms: string; email: string; whatsapp: string } {
  const body = encodeURIComponent(message)
  const subject = encodeURIComponent('A nervous system chiropractor near you')
  return {
    sms: `sms:?&body=${body}`,
    email: `mailto:?subject=${subject}&body=${body}`,
    whatsapp: `https://wa.me/?text=${body}`,
  }
}

export function invitationFoundNotice(place: string): { title: string; body: string } {
  return {
    title: 'They found someone',
    body: `The person you invited near ${place} found a NeuroChiro doctor. No other details were shared.`,
  }
}

export function prepareWorkInterest(input: { path: string; place: string; note: string }):
  | { path: WorkPath; place: ParsedPlace; note: string | null }
  | { error: string } {
  if (!isWorkPath(input.path)) return { error: 'Choose CA, front desk, or a student path.' }
  const place = parsePlace(input.place)
  if ('error' in place) return place
  const note = input.note.trim().replace(/\s+/g, ' ')
  if (note.length > 280) return { error: 'Keep the note to 280 characters.' }
  if (containsHealthWords(note)) return { error: 'Keep the note to your interest in the work. Leave health details out.' }
  return { path: input.path, place, note: note || null }
}

export function openingMatches(path: WorkPath, title: string): boolean {
  const text = title.toLowerCase()
  if (path === 'ca') return /\bca\b|chiropractic assistant/.test(text)
  if (path === 'front_desk') return /front desk|receptionist/.test(text)
  return /\bstudent\b/.test(text)
}

export function workConnectNotice(office: string, place: string, path: WorkPath): { title: string; body: string } {
  const where = place ? ` in ${place}` : ''
  return {
    title: 'An office wants to talk',
    body: `${office}${where} would like to talk about ${WORK_PATH_LABELS[path]}. No health details were shared.`,
  }
}
