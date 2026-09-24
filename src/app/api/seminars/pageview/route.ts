import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const BOT_PATTERNS = /bot|crawl|spider|slurp|facebookexternalhit|bingpreview|googlebot|yandex|baidu|duckduck|archive|wget|curl|python|httpx|axios|node-fetch|postman/i

// Simple per-IP throttle: max 1 increment per seminar per IP per 10 seconds
const recentViews = new Map<string, number>()
const THROTTLE_MS = 10_000

function isThrottled(key: string): boolean {
  const now = Date.now()
  const last = recentViews.get(key)
  if (last && now - last < THROTTLE_MS) return true
  recentViews.set(key, now)
  // Cleanup old entries every 1000 entries
  if (recentViews.size > 1000) {
    for (const [k, v] of recentViews) {
      if (now - v > THROTTLE_MS) recentViews.delete(k)
    }
  }
  return false
}

export async function POST(req: NextRequest) {
  // Always return 204 — never leak whether a seminar ID exists
  const noContent = () => new NextResponse(null, { status: 204 })

  try {
    const ua = req.headers.get('user-agent') || ''
    if (BOT_PATTERNS.test(ua)) return noContent()

    const body = await req.json().catch(() => null)
    if (!body?.seminar_id || typeof body.seminar_id !== 'string') return noContent()
    if (!UUID_REGEX.test(body.seminar_id)) return noContent()

    // Per-IP throttle
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const throttleKey = `${ip}:${body.seminar_id}`
    if (isThrottled(throttleKey)) return noContent()

    const supabase = createAdminClient()
    await supabase.rpc('increment_seminar_page_view', {
      p_seminar_id: body.seminar_id,
    })
  } catch {
    // Swallow all errors
  }

  return noContent()
}
