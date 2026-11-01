/** Quiz copy, option ids, and legacy maps. Safe to import from unit tests. */

export const CONCERN_IDS = ['pain', 'wellness', 'pediatric', 'prenatal', 'stress', 'sports'] as const
export type ConcernId = (typeof CONCERN_IDS)[number]

export const EXPERIENCE_IDS = ['regular', 'traditional', 'first_time'] as const
export type ExperienceId = (typeof EXPERIENCE_IDS)[number]

export const PRIORITY_IDS = ['closest', 'specialty', 'new_patients', 'walk_in'] as const
export type PriorityId = (typeof PRIORITY_IDS)[number]

export const QUIZ_COUNTRIES = ['US', 'CA', 'UK', 'AU', 'NZ'] as const
export type QuizCountry = (typeof QUIZ_COUNTRIES)[number]

export const ENTRY_SOURCES = [
  'homepage', 'hero', 'navbar', 'footer', 'directory', 'profile', 'instagram', 'email', 'qr', 'direct',
] as const
export type EntrySource = (typeof ENTRY_SOURCES)[number]

export const QUIZ_EVENTS = [
  'start', 'step_view', 'step_answer', 'complete', 'results_shown', 'no_local',
  'request_open', 'request_sent', 'email_sent', 'alerts_opt_in', 'error',
] as const
export type QuizEventName = (typeof QUIZ_EVENTS)[number]

export const QUIZ_STEPS = ['concern', 'location', 'experience', 'priority', 'results'] as const
export type QuizStep = (typeof QUIZ_STEPS)[number]

export const QUESTION_STEPS = ['concern', 'location', 'experience', 'priority'] as const

/** Old nervous_system meant a traditional chiropractor, not a nervous-system one. */
export const LEGACY_EXPERIENCE: Record<string, ExperienceId> = {
  yes: 'regular',
  nervous_system: 'traditional',
  no: 'first_time',
}

export const LEGACY_PRIORITY: Record<string, PriorityId> = {
  close: 'closest',
  specialty: 'specialty',
  reviews: 'closest',
  insurance: 'closest',
}

export const CONCERN_SPECIALTIES: Record<ConcernId, readonly string[]> = {
  pain: ['sciatica', 'migraine', 'headache', 'back', 'neck', 'spinal', 'disc'],
  wellness: ['wellness', 'family', 'prevent', 'nervous system'],
  pediatric: ['pediatric', 'kids', 'children', 'family', 'infant'],
  prenatal: ['prenatal', 'pregnan', 'webster', 'perinatal'],
  stress: ['nervous system', 'network', 'torque release', 'neuro', 'stress', 'anxiety'],
  sports: ['sport', 'athlet', 'performance', 'rehab'],
}

/** Directory filter vocabulary only. Terms that are not in FiltersSheet are omitted. */
export const DIRECTORY_SPECIALTIES: Record<ConcernId, readonly string[]> = {
  pain: ['Sciatica', 'Migraines'],
  wellness: [],
  pediatric: ['Pediatric'],
  prenatal: ['Prenatal'],
  stress: ['Torque Release'],
  sports: ['Sports'],
}

export const CONCERNS: readonly {
  id: ConcernId
  label: string
  description: string
  icon: 'Activity' | 'Sprout' | 'Baby' | 'HeartHandshake' | 'Brain' | 'Dumbbell'
}[] = [
  { id: 'pain', label: 'Back, neck or headaches', description: 'Back, neck, headaches, sciatica', icon: 'Activity' },
  { id: 'wellness', label: 'Wellness and prevention', description: 'Optimize health, prevent problems', icon: 'Sprout' },
  { id: 'pediatric', label: 'Kids and family', description: 'Care for kids and families', icon: 'Baby' },
  { id: 'prenatal', label: 'Pregnancy', description: 'Support during pregnancy', icon: 'HeartHandshake' },
  { id: 'stress', label: 'Stress and nervous system', description: 'Nervous system regulation', icon: 'Brain' },
  { id: 'sports', label: 'Sports and performance', description: 'Athletic recovery and performance', icon: 'Dumbbell' },
]

export const EXPERIENCES: readonly { id: ExperienceId; label: string; description: string }[] = [
  { id: 'regular', label: 'Yes, I see one now or have before', description: 'I have been to a chiropractor before' },
  { id: 'traditional', label: 'Yes, but not a nervous system chiropractor', description: 'I have seen a traditional chiropractor' },
  { id: 'first_time', label: 'No, this would be my first time', description: 'I am new to chiropractic care' },
]

export const PRIORITIES: readonly { id: PriorityId; label: string; description: string }[] = [
  { id: 'closest', label: 'Closest to me', description: 'The shortest trip comes first' },
  { id: 'specialty', label: 'Experience with my concern', description: 'Doctors who list this kind of care come first' },
  { id: 'new_patients', label: 'Taking new patients now', description: 'Offices taking new patients come first' },
  { id: 'walk_in', label: 'Walk-ins welcome', description: 'Offices that welcome walk-ins come first' },
]

export const COUNTRY_NAMES: Record<QuizCountry, string> = {
  US: 'the United States',
  CA: 'Canada',
  UK: 'the United Kingdom',
  AU: 'Australia',
  NZ: 'New Zealand',
}

export const QUIZ_REQUEST_CONSENT_V1 =
  'I agree that NeuroChiro can share my name and contact details with this office so they can contact me about an appointment, and that NeuroChiro can follow up to make sure they reached me. [Privacy](/privacy) · [Terms](/terms)'

export const QUIZ_EMAIL_CONSENT_V1 =
  "Email me these results. NeuroChiro won't share my email with any office. [Privacy](/privacy) · [Terms](/terms)"

export function alertsConsentText(postal: string): string {
  return `Also email me when a new NeuroChiro doctor joins near ${postal}. I'll confirm by email first, and I can unsubscribe anytime.`
}

export const QUIZ_ALERTS_CONSENT_V1 = alertsConsentText('{postal}')

export function plainConsent(markdown: string): string {
  return markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

export const QUIZ_REQUEST_CONSENT_STORED = `${plainConsent(QUIZ_REQUEST_CONSENT_V1)} (quiz v1)`

export const US_STATES: readonly { code: string; name: string }[] = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
]

export const CA_PROVINCES: readonly { code: string; name: string }[] = [
  { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' }, { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' }, { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' }, { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' }, { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' }, { code: 'YT', name: 'Yukon' },
]

export function postalHint(country: QuizCountry): string {
  return country === 'UK' ? 'GB' : country
}

export function countriesMatch(detected: string, selected: QuizCountry): boolean {
  const code = detected.toUpperCase()
  if (selected === 'UK') return code === 'GB' || code === 'UK'
  return code === selected
}

export function normalizeSource(value: string | null | undefined): EntrySource {
  if (value && (ENTRY_SOURCES as readonly string[]).includes(value)) return value as EntrySource
  return 'direct'
}

export function quizCountryFromRegion(code: string | null | undefined): QuizCountry {
  if (code === 'CA' || code === 'UK' || code === 'AU' || code === 'NZ') return code
  return 'US'
}

export function postalField(country: QuizCountry): { label: string; placeholder: string } {
  switch (country) {
    case 'US': return { label: 'ZIP code', placeholder: 'e.g. 29601' }
    case 'CA': return { label: 'Postal code', placeholder: 'e.g. M5V 2T6' }
    case 'UK': return { label: 'Postcode', placeholder: 'e.g. SW1A 1AA' }
    case 'AU': return { label: 'Postcode', placeholder: 'e.g. 2000' }
    case 'NZ': return { label: 'Postcode', placeholder: 'e.g. 6011' }
  }
}

export function regionChoices(country: QuizCountry): readonly { code: string; name: string }[] | null {
  if (country === 'US') return US_STATES
  if (country === 'CA') return CA_PROVINCES
  return null
}

export function regionFieldLabel(country: QuizCountry): string {
  if (country === 'US') return 'State'
  if (country === 'CA') return 'Province'
  return 'State or province'
}

export const SESSION_KEY = 'nc_quiz_v2'

export const RATE_LIMIT_MESSAGE = 'Too many tries in a short time. Wait a minute and try again.'
export const UNKNOWN_PLACE_MESSAGE = "We couldn't find that ZIP code. Check it, or use your city and state instead."
export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'
export const INVALID_MESSAGE = 'Check your answers and try again.'
export const DOCTOR_UNAVAILABLE_MESSAGE = "This office isn't taking requests online right now. Try another match."
export const EMAIL_SUCCESS_MESSAGE = 'Sent. Check your inbox for your matches.'
export const ALERTS_SUCCESS_MESSAGE = 'We also sent a link to confirm new-doctor alerts.'
export const EMAIL_FAIL_MESSAGE = "We couldn't send that email. Please try again."
export const ALREADY_SENT_MESSAGE = 'We already emailed these results. Check your inbox.'
