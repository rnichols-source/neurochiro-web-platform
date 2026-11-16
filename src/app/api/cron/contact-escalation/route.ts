import { NextResponse } from 'next/server'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * CONTACT ESCALATION — DISABLED 2026-11-15
 * Was overwhelming doctors with escalation reminder emails.
 * Original code sent up to 3 follow-ups per lead.
 */
export async function GET() {
  return NextResponse.json({ skipped: true, reason: 'Contact escalation disabled — too many emails' })
}
