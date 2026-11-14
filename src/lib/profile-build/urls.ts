import { isIP } from 'node:net'
import type { PageKind, ResearchTargets } from './types.ts'

const BOOKING_HOSTS = [
  'janeapp.com',
  'chirotouch.com',
  'chirofusiononline.com',
  'mindbodyonline.com',
  'mindbody.io',
  'acuityscheduling.com',
  'calendly.com',
  'vagaro.com',
  'squareup.com',
  'square.site',
  'genbook.com',
  'setmore.com',
  'zocdoc.com',
  'noterro.com',
  'cliniko.com',
  'practicebetter.io',
  'pabau.com',
  'massagebook.com',
  'schedulicity.com',
  'fullslate.com',
  'gethealthie.com',
  'practiceq.com',
  'intakeq.com',
]

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.google.com',
  'instance-data',
])

export function isBookingHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./, '').toLowerCase().replace(/\.$/, '')
  return BOOKING_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

export function isPublicIp(address: string): boolean {
  const ip = address.trim().toLowerCase()
  if (!ip) return false
  if (ip.includes(':')) {
    if (ip === '::1' || ip === '::') return false
    if (ip.startsWith('fe80') || ip.startsWith('fc') || ip.startsWith('fd')) return false
    return true
  }
  const parts = ip.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  const [a, b] = parts
  if (a === 0 || a === 10 || a === 127) return false
  if (a === 169 && b === 254) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false
  if (a === 100 && b >= 64 && b <= 127) return false
  return true
}

export function isPublicHttpUrl(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  if (url.username || url.password) return false
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase().replace(/\.$/, '')
  if (!host || BLOCKED_HOSTS.has(host) || host.endsWith('.local') || host.endsWith('.internal')) return false
  if (/^\d+$/.test(host)) return false
  if (isIP(host) && !isPublicIp(host)) return false
  return true
}

export function resolveHref(base: string, href: string, keepHash = false): string | null {
  const raw = href.trim()
  if (!raw || raw.startsWith('#') || /^(mailto|tel|sms|javascript):/i.test(raw)) return null
  try {
    const url = new URL(raw, base)
    if (!isPublicHttpUrl(url.toString())) return null
    if (!keepHash) url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

export function sameSite(left: string, right: string): boolean {
  try {
    const a = new URL(left).hostname.replace(/^www\./, '').toLowerCase()
    const b = new URL(right).hostname.replace(/^www\./, '').toLowerCase()
    return a === b
  } catch {
    return false
  }
}

export function classifyLink(url: string, label: string): PageKind {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return 'other'
  }
  if (isBookingHost(parsed.hostname)) return 'booking'
  const path = `${parsed.pathname} ${label}`.toLowerCase()
  if (/\b(book|schedule|appointment)\b/.test(label) && /book|schedul|appoint/.test(parsed.pathname)) return 'booking'
  if (/\/(about|our-story|our-team|meet|team)\b|^about\b/.test(path)) return 'about'
  if (/faq|frequently-asked|questions/.test(path)) return 'faq'
  if (/\/(services|techniques|what-we-do|treatments)\b|^services\b/.test(path)) return 'services'
  if (/\/(contact|location|visit-us|hours)\b|^contact\b/.test(path)) return 'contact'
  return 'other'
}

function take(target: ResearchTargets, kind: PageKind, url: string) {
  if (kind === 'about' && !target.about) target.about = url
  if (kind === 'faq' && !target.faq) target.faq = url
  if (kind === 'services' && !target.services) target.services = url
  if (kind === 'contact' && !target.contact) target.contact = url
  if (kind === 'booking') target.booking = preferBooking(target.booking, url)
}

function preferBooking(current: string, next: string): string {
  if (!current) return next
  const score = (value: string) => {
    try {
      const url = new URL(value)
      return (url.pathname !== '/' ? 2 : 0) + (url.hash ? 2 : 0) + url.pathname.length / 100
    } catch {
      return 0
    }
  }
  return score(next) > score(current) ? next : current
}

export function discoverTargets(homeUrl: string, html: string): ResearchTargets {
  const targets: ResearchTargets = { about: '', faq: '', services: '', contact: '', booking: '' }
  const anchors = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || []
  for (const anchor of anchors) {
    const href = attr(anchor, 'href')
    if (!href) continue
    const label = visibleText(anchor).slice(0, 80)
    const booking = isBookingHref(href, homeUrl)
    const url = resolveHref(homeUrl, href, booking)
    if (!url) continue
    const kind = classifyLink(url, label)
    if (kind === 'other') continue
    if (kind !== 'booking' && !sameSite(homeUrl, url)) continue
    take(targets, kind, url)
  }
  return targets
}

function isBookingHref(href: string, base: string): boolean {
  try {
    return isBookingHost(new URL(href, base).hostname)
  } catch {
    return false
  }
}

export function guessedPages(homeUrl: string, found: ResearchTargets): { url: string; kind: PageKind }[] {
  const guesses: { kind: PageKind; paths: string[] }[] = [
    { kind: 'about', paths: ['/about', '/about-us', '/our-story'] },
    { kind: 'faq', paths: ['/faq', '/faqs'] },
    { kind: 'services', paths: ['/services', '/our-services'] },
    { kind: 'contact', paths: ['/contact', '/contact-us'] },
  ]
  const pages: { url: string; kind: PageKind }[] = []
  for (const guess of guesses) {
    if (found[guess.kind as keyof ResearchTargets]) continue
    for (const path of guess.paths) {
      const url = resolveHref(homeUrl, path)
      if (url) pages.push({ url, kind: guess.kind })
    }
  }
  return pages
}

function attr(tag: string, name: string): string {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, 'i'))
  return decode(match?.[1] || match?.[2] || match?.[3] || '')
}

function decode(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim()
}

function visibleText(html: string): string {
  return decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}
