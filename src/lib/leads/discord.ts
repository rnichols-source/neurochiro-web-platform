/** Discord ping for Dr. Ray. Awaited, with a hard timeout so a slow webhook cannot drop the lead. */
export async function postDiscord(content: string, timeoutMs = 3000): Promise<{ ok: boolean; error?: string }> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return { ok: false, error: 'DISCORD_WEBHOOK_URL missing' }

  const testInbox = process.env.LEADS_TEST_REDIRECT_EMAIL?.trim()
  const body = testInbox ? `[TEST]\n${content}` : content
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: body.slice(0, 1900) }),
      signal: controller.signal,
    })
    if (!res.ok) return { ok: false, error: `Discord HTTP ${res.status}` }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Discord request failed'
    console.error('[LEADS] Discord ping failed:', message)
    return { ok: false, error: message }
  } finally {
    clearTimeout(timer)
  }
}
