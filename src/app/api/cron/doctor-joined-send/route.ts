import { NextResponse } from 'next/server'

/**
 * DOCTOR-JOINED-SEND — DISABLED 2026-11-15
 * Was sending too many drip emails to patient subscribers.
 * Original code sent 2-email drip per new doctor listing.
 */
export async function GET() {
  return NextResponse.json({ skipped: true, reason: 'Doctor-joined-send disabled — too many emails' })
}
