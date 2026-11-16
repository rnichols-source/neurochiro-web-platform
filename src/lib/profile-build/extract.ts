import type { ExtractedProfile, FaqEntry, PageDocument } from './types.ts'
import { isBookingHost, resolveHref } from './urls.ts'
import { sanitizeVoice } from './voice.ts'

const TECHNIQUES: [string, RegExp][] = [
  ['NUCCA', /\bNUCCA\b/],
  ['TOR', /\bTOR\b/],
  ['Webster', /\bWebster\b/],
  ['Network Spinal', /\bNetwork Spinal\b|\bNSA\b/],
  ['Atlas Orthogonal', /\bAtlas Orthogonal\b/i],
  ['QSM3', /\bQSM3\b|Quantum Spinal Mechanics/i],
  ['Toggle', /\bToggle Recoil\b|\bToggle\b/],
  ['Gonstead', /\bGonstead\b/i],
  ['Activator', /\bActivator\b/i],
  ['SOT', /\bSOT\b|Sacro[- ]Occipital/i],
  ['CBP', /\bCBP\b|Chiropractic BioPhysics/i],
  ['Blair', /\bBlair\b/],
  ['Knee Chest', /\bKnee Chest\b/i],
  ['Upper Cervical', /\bUpper Cervical\b/i],
]

const DAY_NAMES: Record<string, string> = {
  mo: 'Monday', monday: 'Monday',
  tu: 'Tuesday', tue: 'Tuesday', tuesday: 'Tuesday',
  we: 'Wednesday', wed: 'Wednesday', wednesday: 'Wednesday',
  th: 'Thursday', thu: 'Thursday', thursday: 'Thursday',
  fr: 'Friday', fri: 'Friday', friday: 'Friday',
  sa: 'Saturday', sat: 'Saturday', saturday: 'Saturday',
  su: 'Sunday', sun: 'Sunday', sunday: 'Sunday',
}

export function extractProfile(pages: PageDocument[]): ExtractedProfile {
  const docs = pages.filter((page) => page.html.trim())
  const nodes = docs.flatMap((page) => jsonLdNodes(page.html))
  const text = docs.map((page) => visibleText(page.html)).join('\n')
  const address = readAddress(nodes) || readAddressText(text)
  const hours = readHours(nodes) || readHoursText(text)
  const flags = hourFlags(hours)
  const payment = readPayment(text)
  const firstVisit = readFirstVisitFromPages(docs)
  const profile: ExtractedProfile = {
    clinicName: readClinicName(docs, nodes),
    headshotUrl: readHeadshot(docs),
    hours,
    bookingUrl: readBooking(docs),
    instagramUrl: readSocial(docs, 'instagram'),
    facebookUrl: readSocial(docs, 'facebook'),
    tiktokUrl: readSocial(docs, 'tiktok'),
    certifications: readCertifications(text),
    techniques: readTechniques(text),
    firstVisitInfo: sanitizeVoice(firstVisit.info),
    firstVisitPrice: firstVisit.price,
    acceptedPayment: payment.methods,
    insuranceNetworks: payment.networks,
    paymentModel: payment.model,
    filesInsurance: payment.filesInsurance,
    paymentPlans: payment.plans,
    hasEveningHours: flags.evening ? true : null,
    hasWeekendHours: flags.weekend ? true : null,
    address: address.street,
    city: address.city,
    state: address.state,
    zipCode: address.zip,
    country: address.country,
    faqs: readFaqs(docs).slice(0, 8),
    dossier: buildDossier(docs),
    practicePhone: readPracticePhone(docs, nodes),
    galleryUrls: readGallery(docs),
  }
  if (/alignlife/i.test(profile.clinicName)) profile.clinicName = ''
  return profile
}

export function buildDossier(pages: PageDocument[]): string {
  return pages
    .map((page) => `PAGE ${page.kind} ${page.url}\n${visibleText(page.html).slice(0, 3500)}`)
    .join('\n\n')
    .slice(0, 12000)
}

function readClinicName(pages: PageDocument[], nodes: JsonNode[]): string {
  const home = pages.find((page) => page.kind === 'home') || pages[0]
  const site = home ? meta(home.html, 'og:site_name') : ''
  const named = site || stringValue(nodes.find((node) => typeof node.name === 'string')?.name)
  const title = home ? tagText(home.html, 'title').split(/\s[|–—-]\s/)[0] : ''
  const choice = cleanName(named) || cleanName(title)
  return choice.slice(0, 160)
}

function cleanName(value: string): string {
  const name = value.replace(/\s+/g, ' ').trim()
  if (!name || /^(home|welcome|chiropractor|chiropractic)$/i.test(name)) return ''
  return name
}

function readHeadshot(pages: PageDocument[]): string {
  for (const page of pages) {
    const image = meta(page.html, 'og:image') || meta(page.html, 'twitter:image')
    const resolved = image ? resolveHref(page.url, image) : null
    if (resolved && !looksLikeLogo(resolved)) return resolved
  }
  let best = ''
  let bestScore = 0
  for (const page of pages) {
    if (page.kind !== 'about' && page.kind !== 'home') continue
    for (const image of images(page.html)) {
      const resolved = resolveHref(page.url, image.src)
      if (!resolved) continue
      const score = portraitScore(image, page.kind)
      if (score > bestScore) {
        best = resolved
        bestScore = score
      }
    }
  }
  return best
}

function looksLikeLogo(value: string): boolean {
  return /logo|icon|favicon|sprite|badge|pixel|emoji/i.test(value)
}

function portraitScore(image: { src: string; alt: string; className: string }, kind: string): number {
  const blob = `${image.src} ${image.alt} ${image.className}`
  if (looksLikeLogo(blob) || /banner|hero|svg|wide/i.test(blob)) return 0
  let score = kind === 'about' ? 2 : 0
  if (/portrait|headshot|head-shot|profile/i.test(blob)) score += 5
  if (/\b(doctor|dr\.|team)\b/i.test(blob)) score += 2
  return score
}

function readBooking(pages: PageDocument[]): string {
  let best = ''
  for (const page of pages) {
    const anchors = page.html.match(/<a\b[^>]*>/gi) || []
    for (const anchor of anchors) {
      const href = attr(anchor, 'href')
      if (!href) continue
      let host = ''
      try {
        host = new URL(href, page.url).hostname
      } catch {
        continue
      }
      if (!isBookingHost(host) && page.kind !== 'booking') continue
      const url = resolveHref(page.url, href, true)
      if (!url || !isBookingHost(new URL(url).hostname)) continue
      best = preferBooking(best, url)
    }
  }
  return best.slice(0, 300)
}

function preferBooking(current: string, next: string): string {
  if (!current) return next
  const score = (value: string) => {
    const url = new URL(value)
    return (url.pathname !== '/' ? 2 : 0) + (url.hash ? 3 : 0)
  }
  return score(next) >= score(current) ? next : current
}

function readSocial(pages: PageDocument[], network: 'instagram' | 'facebook' | 'tiktok'): string {
  for (const page of pages) {
    const anchors = page.html.match(/<a\b[^>]*href\s*=\s*["'][^"']+["'][^>]*>/gi) || []
    for (const anchor of anchors) {
      const href = attr(anchor, 'href')
      const url = normalizeSocial(href, network)
      if (url) return url
    }
  }
  return ''
}

function normalizeSocial(href: string, network: 'instagram' | 'facebook' | 'tiktok'): string {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return ''
  }
  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  if (network === 'instagram' && host === 'instagram.com') {
    const handle = url.pathname.split('/').filter(Boolean)[0] || ''
    if (!handle || /^(p|reel|stories|explore)$/i.test(handle)) return ''
    return `https://www.instagram.com/${handle.slice(0, 80)}/`
  }
  if (network === 'facebook' && (host === 'facebook.com' || host === 'fb.com')) {
    if (/sharer|share|dialog/i.test(url.pathname)) return ''
    url.search = ''
    url.hash = ''
    return url.toString().slice(0, 300)
  }
  if (network === 'tiktok' && host === 'tiktok.com') {
    const handle = url.pathname.split('/').filter(Boolean)[0] || ''
    if (!handle.startsWith('@')) return ''
    return `https://www.tiktok.com/${handle.slice(0, 80)}`
  }
  return ''
}

function readCertifications(text: string): string[] {
  const found: string[] = []
  if (/\bwebster\b/i.test(text)) found.push('Webster')
  if (/\bDACNB\b/.test(text)) found.push('DACNB')
  const certified = text.match(/certified in ([^.\n]{3,80})/i)
  if (certified) found.push(`Certified in ${certified[1].trim()}`)
  const diplomate = text.match(/diplomate[^.\n]{0,100}/i)
  if (diplomate) found.push(diplomate[0].replace(/\s+/g, ' ').trim())
  return unique(found).slice(0, 12).map((item) => item.slice(0, 120))
}

function readTechniques(text: string): string[] {
  const found = TECHNIQUES.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
  return unique(found).slice(0, 12)
}

function readFirstVisitFromPages(pages: PageDocument[]): { info: string; price: string } {
  let info = ''
  let price = ''
  for (const page of pages) {
    const section = firstVisitSection(stripChrome(page.html))
    if (section && section.length > info.length) info = section
    const found = section.match(/\$\s?\d{2,4}(?:\s?[-–]\s?\$?\s?\d{2,4})?/)
    if (found && !price) price = found[0].replace(/\s+/g, '')
  }
  if (!info) {
    const blob = pages.map((page) => visibleText(stripChrome(page.html))).join('\n')
    const match = blob.match(/((?:first visit|new patient visit|what to expect)[\s\S]{0,500})/i)
    info = (match?.[1] || '').replace(/\s+/g, ' ').trim()
  }
  if (!price) {
    const blob = `${info}\n${pages.map((page) => visibleText(stripChrome(page.html))).join('\n')}`
    const found = blob.match(/(?:first visit|new patient|consultation)[^$\n]{0,80}(\$\s?\d{2,4}(?:\s?[-–]\s?\$?\s?\d{2,4})?)/i)
      || info.match(/\$\s?\d{2,4}(?:\s?[-–]\s?\$?\s?\d{2,4})?/)
    price = found ? (found[1] || found[0]).replace(/\s+/g, '') : ''
  }
  return { info: info.replace(/\s+/g, ' ').trim().slice(0, 800), price }
}

function firstVisitSection(html: string): string {
  const pattern = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>([\s\S]*?)(?=<h[1-3]\b|$)/gi
  let best = ''
  for (const match of html.matchAll(pattern)) {
    const heading = visibleText(match[1] || '')
    if (!/first visit|new patient|what to expect/i.test(heading)) continue
    const body = visibleText(match[2] || '')
    const section = `${heading}. ${body}`.replace(/\s+/g, ' ').trim()
    if (section.length > best.length) best = section
  }
  return best.slice(0, 800)
}

function readPayment(text: string): {
  methods: string[]
  networks: string[]
  model: '' | 'cash' | 'insurance' | 'both'
  filesInsurance: boolean | null
  plans: boolean | null
} {
  const methods: string[] = []
  if (/\bcash\b/i.test(text)) methods.push('Cash')
  if (/\b(credit|debit|card)\b/i.test(text)) methods.push('Card')
  if (/\bHSA\b/.test(text)) methods.push('HSA')
  if (/\bFSA\b/.test(text)) methods.push('FSA')
  if (/care\s*credit/i.test(text)) methods.push('CareCredit')
  const declines = /do not (?:bill|accept|take) insurance|don't (?:bill|accept|take) insurance|does not (?:bill|accept|take) insurance|out of network|cash-based/i.test(text)
  const accepts = /we (?:file|bill|accept) insurance|insurance accepted|in-network/i.test(text)
  let model: '' | 'cash' | 'insurance' | 'both' = ''
  let filesInsurance: boolean | null = null
  if (declines && accepts) {
    model = 'both'
    filesInsurance = true
  } else if (declines) {
    model = 'cash'
    filesInsurance = false
  } else if (accepts) {
    model = 'insurance'
    filesInsurance = true
  }
  const networks = filesInsurance ? readNetworks(text) : []
  return {
    methods,
    networks,
    model,
    filesInsurance,
    plans: /payment plans?/i.test(text) ? true : null,
  }
}

function readNetworks(text: string): string[] {
  const known = ['Blue Cross', 'Blue Shield', 'Aetna', 'United', 'Cigna', 'Medicare', 'Medicaid', 'Humana']
  return known.filter((name) => new RegExp(name, 'i').test(text)).slice(0, 12)
}

const FAQ_CHROME = /^(home|about|about us|services|our services|contact|contact us|menu|navigation|book|book now|book online|blog|shop|faq|faqs|login|log in|sign in|privacy|privacy policy|terms|cart|search|quick links|follow us|new patients)$/i

function readFaqs(pages: PageDocument[]): FaqEntry[] {
  const faqs: FaqEntry[] = []
  for (const page of pages) {
    const clean = stripChrome(page.html)
    for (const node of jsonLdNodes(clean)) {
      const entities = Array.isArray(node.mainEntity) ? node.mainEntity : []
      for (const entity of entities) {
        if (!entity || typeof entity !== 'object') continue
        const record = entity as JsonNode
        const question = stringValue(record.name)
        const answerNode = record.acceptedAnswer
        const answer = answerNode && typeof answerNode === 'object'
          ? stringValue((answerNode as JsonNode).text)
          : ''
        pushFaq(faqs, question, answer)
      }
    }
    const pairs = clean.matchAll(/<h[23][^>]*>((?:(?!<h[1-6]\b)[\s\S])*?)<\/h[23]>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)
    for (const pair of pairs) pushFaq(faqs, visibleText(pair[1]), visibleText(pair[2]))
  }
  return faqs
}

function stripChrome(html: string): string {
  return html
    .replace(/<(nav|header|footer|menu)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+(?:id|class)\s*=\s*["'][^"']*(?:\bnav\b|\bmenu\b|\bfooter\b|\bheader\b|cookie|breadcrumb)[^"']*["'][^>]*>[\s\S]*?<\/(?:div|ul|ol|section|aside)>/gi, ' ')
}

function readPracticePhone(pages: PageDocument[], nodes: JsonNode[]): string {
  for (const node of nodes) {
    const telephone = stringValue(node.telephone)
    if (looksLikePhone(telephone)) return telephone.slice(0, 40)
  }
  for (const page of pages) {
    if (page.kind !== 'contact' && page.kind !== 'home' && page.kind !== 'booking') continue
    const links = page.html.match(/<a\b[^>]*href\s*=\s*["']tel:[^"']+["'][^>]*>/gi) || []
    for (const link of links) {
      const href = attr(link, 'href').replace(/^tel:/i, '')
      if (looksLikePhone(href)) return href.slice(0, 40)
    }
  }
  const text = pages
    .filter((page) => page.kind === 'contact' || page.kind === 'home' || page.kind === 'booking')
    .map((page) => visibleText(stripChrome(page.html)))
    .join('\n')
  const labeled = text.match(/(?:call|phone|office)\s*(?:the office\s*)?(?:at|:)?\s*(\+?1?[\s.(]*\d{3}[\s.)-]*\d{3}[\s.-]*\d{4})/i)
  if (labeled && looksLikePhone(labeled[1])) return labeled[1].replace(/\s+/g, ' ').trim().slice(0, 40)
  return ''
}

function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

function readGallery(pages: PageDocument[]): string[] {
  const urls: string[] = []
  for (const page of pages) {
    if (page.kind !== 'about' && page.kind !== 'home') continue
    for (const image of images(page.html)) {
      const resolved = resolveHref(page.url, image.src)
      if (!resolved || looksLikeLogo(`${resolved} ${image.alt} ${image.className}`)) continue
      if (urls.includes(resolved)) continue
      urls.push(resolved)
      if (urls.length === 6) return urls
    }
  }
  return urls
}

function pushFaq(faqs: FaqEntry[], question: string, answer: string) {
  const q = question.replace(/\s+/g, ' ').trim()
  const a = answer.replace(/\s+/g, ' ').trim()
  if (q.length < 8 || a.length < 12) return
  if (FAQ_CHROME.test(q)) return
  if (!/[?]/.test(q) && q.split(' ').length < 4) return
  const key = q.toLowerCase().replace(/[^a-z0-9]+/g, '')
  if (faqs.some((item) => item.question.toLowerCase().replace(/[^a-z0-9]+/g, '') === key)) return
  faqs.push({ question: q.slice(0, 180), answer: a.slice(0, 600) })
}

type Postal = { street: string; city: string; state: string; zip: string; country: string }

function readAddress(nodes: JsonNode[]): Postal | null {
  for (const node of nodes) {
    const address = node.address
    if (!address || typeof address !== 'object') continue
    const record = address as JsonNode
    const street = stringValue(record.streetAddress)
    const city = stringValue(record.addressLocality)
    const state = stringValue(record.addressRegion)
    const zip = stringValue(record.postalCode)
    const country = countryCode(stringValue(record.addressCountry))
    if (street || city) return { street: street.slice(0, 300), city: city.slice(0, 80), state, zip: zip.slice(0, 20), country }
  }
  return null
}

function readAddressText(text: string): Postal {
  const match = text.match(/(\d{1,6}\s+[A-Za-z0-9.'’\- ]{3,60}),\s*([A-Za-z .'-]{2,40}),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?/)
  if (!match) return { street: '', city: '', state: '', zip: '', country: '' }
  return {
    street: match[1].replace(/\s+/g, ' ').trim().slice(0, 300),
    city: match[2].trim().slice(0, 80),
    state: match[3],
    zip: match[4],
    country: 'US',
  }
}

function readHours(nodes: JsonNode[]): string {
  const lines: string[] = []
  for (const node of nodes) {
    const spec = node.openingHoursSpecification
    if (Array.isArray(spec)) {
      for (const row of spec) {
        if (!row || typeof row !== 'object') continue
        const record = row as JsonNode
        const days = formatDays(record.dayOfWeek)
        const opens = formatClock(stringValue(record.opens))
        const closes = formatClock(stringValue(record.closes))
        if (days && opens && closes) lines.push(`${days} ${opens}–${closes}`)
      }
    }
    const compact = node.openingHours
    const list = Array.isArray(compact) ? compact.map(stringValue) : [stringValue(compact)]
    for (const row of list) {
      const formatted = formatCompactHours(row)
      if (formatted) lines.push(formatted)
    }
  }
  return unique(lines).join('; ').slice(0, 1000)
}

function readHoursText(text: string): string {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  const picked = lines.filter((line) => /monday|tuesday|wednesday|thursday|friday|saturday|sunday|\bmon\b|\btue\b|\bwed\b|\bthu\b|\bfri\b|\bsat\b|\bsun\b/i.test(line) && /\d/.test(line))
  return unique(picked).join('; ').slice(0, 1000)
}

function formatCompactHours(value: string): string {
  const match = value.trim().match(/^([A-Za-z]{2,9})(?:\s*[-–]\s*([A-Za-z]{2,9}))?\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/)
  if (!match) return ''
  const start = DAY_NAMES[match[1].toLowerCase()]
  const end = match[2] ? DAY_NAMES[match[2].toLowerCase()] : ''
  const opens = formatClock(match[3])
  const closes = formatClock(match[4])
  if (!start || !opens || !closes) return ''
  const days = end ? `${start}–${end}` : start
  return `${days} ${opens}–${closes}`
}

function formatDays(value: unknown): string {
  const list = Array.isArray(value) ? value : [value]
  const names = list.map((item) => {
    const raw = stringValue(item).split('/').pop() || ''
    return DAY_NAMES[raw.toLowerCase()] || ''
  }).filter(Boolean)
  if (!names.length) return ''
  if (names.length === 1) return names[0]
  return `${names[0]}–${names[names.length - 1]}`
}

function formatClock(value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return ''
  const hour = Number(match[1])
  const minute = match[2]
  if (hour > 23) return ''
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const twelve = hour % 12 || 12
  return `${twelve}:${minute} ${suffix}`
}

function hourFlags(hours: string): { evening: boolean; weekend: boolean } {
  return {
    evening: /\b([6-9]|1[0-1])(?::[0-5]\d)?\s*pm\b/i.test(hours) || /\b(?:18|19|2[0-3]):/.test(hours),
    weekend: /\b(saturday|sunday|sat|sun)\b/i.test(hours),
  }
}

function countryCode(value: string): string {
  const key = value.trim().toLowerCase()
  if (!key) return ''
  if (key === 'us' || key === 'usa' || key === 'united states' || key === 'united states of america') return 'US'
  if (key === 'ca' || key === 'canada') return 'CA'
  if (key === 'gb' || key === 'uk' || key === 'united kingdom') return 'GB'
  if (key === 'au' || key === 'australia') return 'AU'
  if (/^[a-z]{2}$/i.test(value.trim())) return value.trim().toUpperCase()
  return ''
}

type JsonNode = Record<string, unknown>

function jsonLdNodes(html: string): JsonNode[] {
  const blocks = html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  const nodes: JsonNode[] = []
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1].trim()) as unknown
      nodes.push(...flattenLd(parsed))
    } catch {
      continue
    }
  }
  return nodes
}

function flattenLd(value: unknown): JsonNode[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap((item) => flattenLd(item))
  const record = value as JsonNode
  const graph = Array.isArray(record['@graph']) ? record['@graph'].flatMap((item) => flattenLd(item)) : []
  return [record, ...graph]
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function meta(html: string, key: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) || []
  for (const tag of tags) {
    const name = (attr(tag, 'property') || attr(tag, 'name')).toLowerCase()
    if (name === key.toLowerCase()) return attr(tag, 'content')
  }
  return ''
}

function images(html: string): { src: string; alt: string; className: string }[] {
  return (html.match(/<img\b[^>]*>/gi) || []).map((tag) => ({
    src: attr(tag, 'src'),
    alt: attr(tag, 'alt'),
    className: attr(tag, 'class'),
  })).filter((image) => image.src)
}

function attr(tag: string, name: string): string {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, 'i'))
  return decode(match?.[1] || match?.[2] || match?.[3] || '')
}

function tagText(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? visibleText(match[1]) : ''
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

export function visibleText(html: string): string {
  return decode(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h1|h2|h3|tr|address|section)>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const items: string[] = []
  for (const value of values) {
    const key = value.toLowerCase()
    if (!value || seen.has(key)) continue
    seen.add(key)
    items.push(value)
  }
  return items
}
