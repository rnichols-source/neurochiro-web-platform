export const DOCTOR_PLACES = {
  today: { id: 'today', href: '/doctor', label: 'Today', color: '#D66829', ink: '#B4501A', dark: '#B4501A', tint: '#FCEBDF' },
  people: { id: 'people', href: '/doctor/people', label: 'People', color: '#2C6BB4', ink: '#1F4F8C', dark: '#1F4F8C', tint: '#E2ECF8' },
  care: { id: 'care', href: '/doctor/care-sets', label: 'Care sets', color: '#0E857A', ink: '#0A6159', dark: '#0A6159', tint: '#DCF1EE' },
  network: { id: 'network', href: '/doctor/network', label: 'Network', color: '#7A4A94', ink: '#5C3473', dark: '#5C3473', tint: '#EFE5F5' },
  practice: { id: 'practice', href: '/doctor/practice', label: 'Practice', color: '#1E2D3B', ink: '#1E2D3B', dark: '#15202B', tint: '#E5E9EE' },
} as const

export type DoctorPlaceId = keyof typeof DOCTOR_PLACES
export type DoctorNavId = DoctorPlaceId | 'messages' | 'soon'

export const DOCTOR_PLACE_LIST = [
  DOCTOR_PLACES.today,
  DOCTOR_PLACES.people,
  DOCTOR_PLACES.care,
  DOCTOR_PLACES.network,
  DOCTOR_PLACES.practice,
] as const

const NETWORK_PREFIXES = [
  '/doctor/network',
  '/doctor/referrals',
  '/doctor/students',
  '/doctor/jobs',
  '/doctor/match',
  '/doctor/chiromatch',
  '/doctor/seminars',
  '/doctor/marketplace',
  '/doctor/lives',
  '/doctor/introductions',
  '/doctor/referral-network',
  '/doctor/community',
]

function pathOnly(pathname: string): string {
  const clean = pathname.split('?')[0] || '/'
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1)
  return clean
}

function under(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`)
}

export function doctorNavId(pathname: string): DoctorNavId {
  const path = pathOnly(pathname)
  if (path === '/doctor' || path === '/doctor/dashboard') return 'today'
  if (under(path, '/doctor/messages')) return 'messages'
  if (under(path, '/doctor/coming-soon') || under(path, '/doctor/community-interest')) return 'soon'
  if (under(path, '/doctor/people') || under(path, '/doctor/leads') || under(path, '/doctor/visit-requests')) return 'people'
  if (under(path, '/doctor/care-sets')) return 'care'
  if (NETWORK_PREFIXES.some((prefix) => under(path, prefix))) return 'network'
  return 'practice'
}

export function usesOwnChrome(pathname: string): boolean {
  const path = pathOnly(pathname)
  if (path === '/doctor' || path === '/doctor/dashboard') return true
  return (
    under(path, '/doctor/people') ||
    under(path, '/doctor/care-sets') ||
    under(path, '/doctor/network') ||
    under(path, '/doctor/practice') ||
    under(path, '/doctor/messages') ||
    under(path, '/doctor/profile') ||
    under(path, '/doctor/coming-soon')
  )
}

const LEGACY_TITLES: [string, string][] = [
  ['/doctor/leads', 'Directory requests'],
  ['/doctor/visit-requests', 'Visit requests'],
  ['/doctor/analytics', 'Analytics'],
  ['/doctor/billing', 'Membership and billing'],
  ['/doctor/settings', 'Settings'],
  ['/doctor/help', 'Help'],
  ['/doctor/notifications', 'Notifications'],
  ['/doctor/tools', 'Practice tools'],
  ['/doctor/care-plan-closer', 'Care Plan Closer'],
  ['/doctor/care-plan', 'Care plan'],
  ['/doctor/scan-report', 'Scan reports'],
  ['/doctor/kpi', 'KPI tracker'],
  ['/doctor/pl-analyzer', 'P&L analyzer'],
  ['/doctor/ce-tracker', 'CE tracker'],
  ['/doctor/billing-guide', 'Billing guide'],
  ['/doctor/report', 'This month'],
  ['/doctor/purchases', 'My purchases'],
  ['/doctor/badges', 'Achievements'],
  ['/doctor/neuros', 'Neuros program'],
  ['/doctor/seminars', 'Seminars'],
  ['/doctor/jobs', 'Hiring'],
  ['/doctor/students', 'Students'],
  ['/doctor/match', 'ChiroMatch'],
  ['/doctor/chiromatch', 'ChiroMatch'],
  ['/doctor/marketplace', 'Synapse'],
  ['/doctor/lives', 'The Weekly Adjustment'],
  ['/doctor/referrals', 'Referrals'],
  ['/doctor/referral-network', 'Referral network'],
  ['/doctor/introductions', 'Introductions'],
  ['/doctor/community', 'The Network feed'],
  ['/doctor/content-library', 'Content library'],
  ['/doctor/workshops', 'Workshops'],
  ['/doctor/screenings', 'Screenings'],
  ['/doctor/contracts', 'Contracts'],
]

export function legacyTitle(pathname: string): string {
  const path = pathOnly(pathname)
  const hit = LEGACY_TITLES.find(([prefix]) => under(path, prefix))
  return hit ? hit[1] : 'Doctor portal'
}

export function doctorGreetingName(fullName: string | null | undefined): string {
  const parts = (fullName || '').replace(/^dr\.?\s+/i, '').trim().split(/\s+/).filter(Boolean)
  const last = parts[parts.length - 1]
  if (!last) return 'Doctor'
  return `Dr. ${last}`
}

export function sentenceCount(text: string): number {
  return text.split(/[.!?]+/).map((part) => part.trim()).filter((part) => part.length > 0).length
}

export type ProfileCheckInput = {
  photoUrl: string | null
  bio: string | null
  shortIntro: string | null
  listingFormat: string | null
  coOwnerCount: number
  city: string | null
  address: string | null
  techniques: number
  hours: string | null
}

export type ProfileStep = { key: string; label: string; done: boolean; hint: string }

export type ProfileChecklist = {
  steps: ProfileStep[]
  percent: number
  remaining: string[]
  complete: boolean
}

export function profileChecklist(input: ProfileCheckInput): ProfileChecklist {
  const prose = (input.bio || '').trim().length >= (input.shortIntro || '').trim().length
    ? (input.bio || '')
    : (input.shortIntro || '')
  const bioDone = prose.trim().length >= 40 && sentenceCount(prose) >= 2
  const practice = input.listingFormat === 'practice'
  const ownersDone = practice ? input.coOwnerCount >= 1 : true
  const steps: ProfileStep[] = [
    { key: 'photo', label: 'Photo', done: Boolean(input.photoUrl), hint: input.photoUrl ? 'Done' : 'Add a photo' },
    { key: 'bio', label: 'Bio', done: bioDone, hint: bioDone ? 'Done' : 'Add 2–3 sentences' },
    { key: 'co_owners', label: 'Co-owners', done: ownersDone, hint: ownersDone ? (practice ? `${input.coOwnerCount} co-owner${input.coOwnerCount === 1 ? '' : 's'}` : 'Lead listing') : 'Add at least one' },
    { key: 'location', label: 'Locations', done: Boolean((input.city || '').trim() || (input.address || '').trim()), hint: (input.city || '').trim() ? input.city || 'Done' : 'Add a location' },
    { key: 'techniques', label: 'Techniques', done: input.techniques > 0, hint: input.techniques > 0 ? `${input.techniques} listed` : 'Add at least one' },
    { key: 'hours', label: 'Hours', done: Boolean((input.hours || '').trim()), hint: (input.hours || '').trim() ? 'Done' : 'Add your hours' },
  ]
  const done = steps.filter((step) => step.done).length
  const remaining = steps.filter((step) => !step.done).map((step) => step.label.toLowerCase())
  return {
    steps,
    percent: Math.round((done / steps.length) * 100),
    remaining,
    complete: remaining.length === 0,
  }
}

export type NextStep = {
  id: 'profile' | 'people' | 'referrals' | 'messages' | 'clear'
  title: string
  detail: string
  percent: number | null
  href: string
  button: string
  skip: boolean
}

export function buildNextSteps(input: {
  checklist: ProfileChecklist
  skipProfile: boolean
  waiting: number
  referrals: number
  unread: number
}): NextStep[] {
  const steps: NextStep[] = []
  if (!input.checklist.complete && !input.skipProfile) {
    const left = input.checklist.remaining
    steps.push({
      id: 'profile',
      title: 'Finish your profile',
      detail: left.length ? `${input.checklist.percent}% complete · ${left.join(', ')} left` : 'A few fields are still open',
      percent: input.checklist.percent,
      href: '/doctor/profile',
      button: 'Edit my profile',
      skip: true,
    })
  }
  if (input.waiting > 0) {
    steps.push({
      id: 'people',
      title: input.waiting === 1 ? '1 person is waiting' : `${input.waiting} people are waiting`,
      detail: 'Visit requests from community members',
      percent: null,
      href: '/doctor/people',
      button: 'Open People',
      skip: false,
    })
  }
  if (input.referrals > 0) {
    steps.push({
      id: 'referrals',
      title: input.referrals === 1 ? '1 new referral' : `${input.referrals} new referrals`,
      detail: 'Another doctor sent someone your way',
      percent: null,
      href: '/doctor/network',
      button: 'Review referrals',
      skip: false,
    })
  }
  if (input.unread > 0) {
    steps.push({
      id: 'messages',
      title: input.unread === 1 ? '1 unread message' : `${input.unread} unread messages`,
      detail: 'Community members, doctors, and students share one inbox',
      percent: null,
      href: '/doctor/messages',
      button: 'Open messages',
      skip: false,
    })
  }
  if (!steps.length) {
    steps.push({
      id: 'clear',
      title: 'You are caught up',
      detail: 'People, referrals, and messages are clear.',
      percent: input.checklist.percent,
      href: '/doctor/people',
      button: 'See your people',
      skip: false,
    })
  }
  return steps
}

export function communityMemberCopy(error: string): string {
  return error
    .replace(/Patient consent is required\./g, 'Consent is required.')
    .replace(/the patient's/gi, "the community member's")
    .replace(/this patient/gi, 'this community member')
    .replace(/a patient/gi, 'a community member')
    .replace(/patients/gi, 'community members')
    .replace(/patient/gi, 'community member')
}

export function agoLabel(iso: string, now = Date.now()): string {
  const ms = now - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return ''
  const min = Math.round(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 14) return `${day}d ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

export function initialsFrom(name: string): string {
  const parts = name.replace(/^dr\.?\s+/i, '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'NC'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
