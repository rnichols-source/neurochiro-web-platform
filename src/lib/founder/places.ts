export type PlaceId = 'pulse' | 'growth' | 'people' | 'money' | 'broadcast'

export type Place = {
  id: PlaceId
  label: string
  href: string
  color: string
  dark: string
  tint: string
  ink: string
}

export const PLACES: Place[] = [
  { id: 'pulse', label: 'Pulse', href: '/admin', color: '#D66829', dark: '#B4501A', tint: '#FCEBDF', ink: '#B4501A' },
  { id: 'growth', label: 'Growth', href: '/admin/growth', color: '#2C6BB4', dark: '#1F4F8C', tint: '#E2ECF8', ink: '#1F4F8C' },
  { id: 'people', label: 'People', href: '/admin/people', color: '#0E857A', dark: '#0A6159', tint: '#DCF1EE', ink: '#0A6159' },
  { id: 'money', label: 'Money', href: '/admin/money', color: '#B7791F', dark: '#8A5A0F', tint: '#FBF1DC', ink: '#8A5A0F' },
  { id: 'broadcast', label: 'Broadcast', href: '/admin/broadcast', color: '#7A4A94', dark: '#5C3473', tint: '#EFE5F5', ink: '#5C3473' },
]

export const MORE = [
  { label: 'Content & IG Live', href: '/admin/content' },
  { label: 'Synapse', href: '/admin/marketplace' },
  { label: 'Seminars & jobs', href: '/admin/work' },
  { label: 'Audit log', href: '/admin/audit' },
  { label: 'System health', href: '/admin/health' },
  { label: 'Settings', href: '/admin/settings' },
] as const

const GROWTH = ['/admin/growth', '/admin/coverage', '/admin/doctor-referrals', '/admin/referrals', '/admin/match', '/admin/stats/recommendations']
const PEOPLE = ['/admin/people', '/admin/members', '/admin/applications', '/admin/leads', '/admin/contact-requests', '/admin/students', '/admin/invisible-doctors', '/admin/list']
const MONEY = ['/admin/money', '/admin/revenue']
const BROADCAST = ['/admin/broadcast', '/admin/outreach', '/admin/announcements', '/admin/notifications', '/admin/inbox']

export function placeForPath(pathname: string): PlaceId | 'more' {
  if (pathname === '/admin') return 'pulse'
  if (GROWTH.some((href) => pathname === href || pathname.startsWith(`${href}/`))) return 'growth'
  if (PEOPLE.some((href) => pathname === href || pathname.startsWith(`${href}/`))) return 'people'
  if (MONEY.some((href) => pathname === href || pathname.startsWith(`${href}/`))) return 'money'
  if (BROADCAST.some((href) => pathname === href || pathname.startsWith(`${href}/`))) return 'broadcast'
  return 'more'
}

export function placeById(id: PlaceId): Place {
  return PLACES.find((place) => place.id === id) || PLACES[0]
}

export const GROWTH_TOOLS = [
  { label: 'Coverage map', href: '/admin/coverage' },
  { label: 'Reply station', href: '/admin/coverage/reply' },
  { label: 'Mentions', href: '/admin/coverage/mentions' },
  { label: 'Templates', href: '/admin/coverage/templates' },
  { label: 'Doctor referrals', href: '/admin/doctor-referrals' },
  { label: 'Member referrals', href: '/admin/referrals' },
  { label: 'Match', href: '/admin/match' },
]

export const PEOPLE_TOOLS = [
  { label: 'Member editor', href: '/admin/members' },
  { label: 'Applications', href: '/admin/applications' },
  { label: 'Leads', href: '/admin/leads' },
  { label: 'Visit requests', href: '/admin/contact-requests' },
  { label: 'Directory list', href: '/admin/list' },
  { label: 'Invisible doctors', href: '/admin/invisible-doctors' },
]

export const MONEY_TOOLS = [
  { label: 'Revenue detail', href: '/admin/revenue' },
]

export const BROADCAST_TOOLS = [
  { label: 'Earlier in-app broadcast', href: '/admin/broadcast/messages' },
  { label: 'Email list', href: '/admin/list/broadcast' },
  { label: 'Outreach', href: '/admin/outreach' },
  { label: 'Announcements', href: '/admin/announcements' },
  { label: 'Notifications', href: '/admin/notifications' },
  { label: 'Inbox', href: '/admin/inbox' },
]

export const CONTENT_TOOLS = [
  { label: 'Content', href: '/admin/content' },
  { label: 'Clips', href: '/admin/clips' },
  { label: 'Spotlight', href: '/admin/spotlight' },
  { label: 'Content tracker', href: '/admin/content-tracker' },
  { label: 'Agents', href: '/admin/agents' },
  { label: 'Message reports', href: '/admin/message-reports' },
  { label: 'Older logs', href: '/admin/logs' },
]
