import 'server-only'

import { lookup } from 'node:dns/promises'
import type { PageDocument, PageKind } from './types.ts'
import { discoverTargets, guessedPages, isPublicHttpUrl, isPublicIp, resolveHref, sameSite } from './urls.ts'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const MAX_HTML = 500_000

export async function collectSitePages(website: string, bookingUrl: string): Promise<PageDocument[]> {
  const home = website ? resolveHref('https://neurochiro.co', website) : null
  const booking = bookingUrl ? resolveHref('https://neurochiro.co', bookingUrl, true) : null
  const pages: PageDocument[] = []
  if (home && isPublicHttpUrl(home)) {
    const html = await fetchHtml(home)
    if (html) {
      pages.push({ url: home, html, kind: 'home' })
      const targets = discoverTargets(home, html)
      const linked = (
        [
          { url: targets.about, kind: 'about' },
          { url: targets.faq, kind: 'faq' },
          { url: targets.services, kind: 'services' },
          { url: targets.contact, kind: 'contact' },
        ] as { url: string; kind: PageKind }[]
      ).filter((item) => item.url)
      const guesses = guessedPages(home, targets)
      await fillKinds(pages, linked, guesses)
      const bookingLink = targets.booking || (booking && !sameSite(home, booking) ? booking : '')
      if (bookingLink && !pages.some((page) => page.url === bookingLink)) {
        const bookingHtml = await fetchHtml(bookingLink)
        if (bookingHtml) pages.push({ url: bookingLink, html: bookingHtml, kind: 'booking' })
      }
    }
  }
  if (!pages.length && booking && isPublicHttpUrl(booking)) {
    const html = await fetchHtml(booking)
    if (html) pages.push({ url: booking, html, kind: 'booking' })
  }
  if (!pages.length) throw new Error('No public website or booking page could be read.')
  return pages
}

async function fillKinds(
  pages: PageDocument[],
  linked: { url: string; kind: PageKind }[],
  guesses: { url: string; kind: PageKind }[],
) {
  const found = new Set(pages.map((page) => page.kind))
  const first = linked.filter((item) => !found.has(item.kind))
  const loaded = await Promise.all(first.map(async (item) => ({ ...item, html: await fetchHtml(item.url) })))
  for (const item of loaded) {
    if (!item.html || found.has(item.kind)) continue
    pages.push({ url: item.url, html: item.html, kind: item.kind })
    found.add(item.kind)
  }
  const remaining = guesses.filter((item) => !found.has(item.kind))
  for (const item of remaining) {
    if (found.has(item.kind)) continue
    const html = await fetchHtml(item.url)
    if (!html) continue
    pages.push({ url: item.url, html, kind: item.kind })
    found.add(item.kind)
  }
}

export async function fetchHtml(url: string): Promise<string | null> {
  const response = await fetchPublic(url, 'text/html,application/xhtml+xml')
  if (!response) return null
  const type = response.headers.get('content-type') || ''
  if (type && !/text\/html|application\/xhtml\+xml|text\/plain/i.test(type)) return null
  const html = (await response.text()).slice(0, MAX_HTML)
  return html.trim() ? html : null
}

export async function fetchImage(url: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const response = await fetchPublic(url, 'image/avif,image/webp,image/png,image/jpeg,image/*')
  if (!response) return null
  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(contentType)) return null
  const length = Number(response.headers.get('content-length') || 0)
  if (length > 4_000_000) return null
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength < 32 || bytes.byteLength > 4_000_000) return null
  return { bytes, contentType }
}

async function fetchPublic(url: string, accept: string): Promise<Response | null> {
  let current = url
  for (let hop = 0; hop < 3; hop += 1) {
    if (!isPublicHttpUrl(current)) return null
    await assertPublicDns(current)
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
      headers: { accept, 'user-agent': USER_AGENT },
    })
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) return null
      current = new URL(location, current).toString()
      continue
    }
    if (!response.ok) return null
    return response
  }
  return null
}

async function assertPublicDns(value: string): Promise<void> {
  const hostname = new URL(value).hostname.replace(/^\[|\]$/g, '')
  if (isPublicIp(hostname)) return
  const records = await lookup(hostname, { all: true })
  if (!records.length || records.some((record) => !isPublicIp(record.address))) {
    throw new Error('That website address cannot be fetched.')
  }
}
