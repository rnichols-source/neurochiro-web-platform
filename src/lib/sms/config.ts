import 'server-only'
import { toE164 } from './phone.ts'
import type { SmsRuntime } from './types.ts'

/** Reads names only. Never log the returned values. */
export function readSmsConfig(): SmsRuntime {
  const enabled = process.env.SMS_ENABLED === 'true'
  const apiKey = process.env.QUO_API_KEY?.trim() || ''
  const from = process.env.QUO_FROM_NUMBER?.trim() || ''
  const base = (process.env.QUO_API_BASE?.trim() || 'https://api.quo.com').replace(/\/$/, '')
  const testRaw = process.env.SMS_TEST_PHONE?.trim() || ''
  const testPhone = testRaw ? toE164(testRaw) : null
  return {
    enabled,
    apiKey,
    from,
    base,
    testPhone,
    testRedirect: Boolean(testRaw),
  }
}
