export type QuoResult = {
  ok: boolean
  status: number
  code: string | null
  messageId: string | null
  retryable: boolean
  attempts: number
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

function codeOf(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  const direct = record.code ?? record.errorCode
  if (typeof direct === 'string' || typeof direct === 'number') return String(direct)
  const nested = record.error
  if (nested && typeof nested === 'object') {
    const inner = (nested as Record<string, unknown>).code
    if (typeof inner === 'string' || typeof inner === 'number') return String(inner)
  }
  const data = record.data
  if (data && typeof data === 'object') {
    const inner = (data as Record<string, unknown>).code
    if (typeof inner === 'string' || typeof inner === 'number') return String(inner)
  }
  return null
}

function messageIdOf(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const data = (body as Record<string, unknown>).data
  if (!data || typeof data !== 'object') return null
  const id = (data as Record<string, unknown>).id
  return typeof id === 'string' ? id : null
}

async function once(input: {
  url: string
  apiKey: string
  from: string
  to: string
  content: string
  fetchImpl: FetchLike
  timeoutMs: number
}): Promise<QuoResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), input.timeoutMs)
  try {
    const response = await input.fetchImpl(input.url, {
      method: 'POST',
      headers: {
        Authorization: input.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: input.content,
        from: input.from,
        to: [input.to],
      }),
      signal: controller.signal,
    })
    const text = await response.text()
    let body: unknown = null
    if (text) {
      try { body = JSON.parse(text) } catch { body = null }
    }
    if (response.status === 202) {
      return { ok: true, status: 202, code: codeOf(body), messageId: messageIdOf(body), retryable: false, attempts: 1 }
    }
    return {
      ok: false,
      status: response.status,
      code: codeOf(body),
      messageId: null,
      retryable: response.status >= 500 && response.status <= 599,
      attempts: 1,
    }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return { ok: false, status: 0, code: aborted ? 'timeout' : 'network', messageId: null, retryable: false, attempts: 1 }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * One recipient. 5xx is tried once more after about 2 seconds.
 * Other errors, including timeouts, are not retried.
 */
export async function quoSend(input: {
  to: string
  content: string
  apiKey: string
  from: string
  base: string
  fetchImpl?: FetchLike
  sleep?: (ms: number) => Promise<void>
  timeoutMs?: number
}): Promise<QuoResult> {
  if (!input.apiKey || !input.from || !input.to) {
    return { ok: false, status: 0, code: 'not_configured', messageId: null, retryable: false, attempts: 0 }
  }
  const fetchImpl = input.fetchImpl ?? fetch
  const sleep = input.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))
  const timeoutMs = input.timeoutMs ?? 8000
  const url = `${input.base.replace(/\/$/, '')}/v1/messages`
  const content = input.content.slice(0, 1600)
  const result = await once({ url, apiKey: input.apiKey, from: input.from, to: input.to, content, fetchImpl, timeoutMs })
  if (result.ok || !result.retryable) return result
  await sleep(2000)
  const second = await once({ url, apiKey: input.apiKey, from: input.from, to: input.to, content, fetchImpl, timeoutMs })
  return { ...second, attempts: result.attempts + second.attempts }
}
