import 'server-only'
import { last4, toE164 } from './phone.ts'
import { readSmsConfig } from './config.ts'
import { quoSend } from './quo.ts'
import { waitlistDoctorJoinedText } from './templates.ts'

export { waitlistDoctorJoinedText }

export type WaitlistTextResult = 'sent' | 'skipped' | 'failed'

/**
 * Text a consented waitlist mobile. Follows SMS_ENABLED and SMS_TEST_PHONE.
 * Numbers the US/Canada sender cannot accept are skipped, not sent abroad.
 */
export async function sendWaitlistDoctorJoinedText(phone: string, body: string): Promise<WaitlistTextResult> {
  const runtime = readSmsConfig()
  if (!runtime.enabled) return 'skipped'
  const real = toE164(phone)
  if (!real) return 'skipped'

  let to = real
  let content = body
  if (runtime.testRedirect) {
    if (!runtime.testPhone) return 'skipped'
    to = runtime.testPhone
    content = `[TEST for ...${last4(real)}] ${body}`
  }

  const result = await quoSend({ to, content })
  return result.ok ? 'sent' : 'failed'
}
