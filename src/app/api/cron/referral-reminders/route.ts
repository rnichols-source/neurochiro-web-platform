import { NextResponse } from 'next/server';

export const maxDuration = 120;

/**
 * REFERRAL REMINDERS — DISABLED 2026-11-15
 * Was overwhelming doctors with referral reminder emails.
 * Original code sent multiple reminder emails per referral.
 */
export async function GET() {
  return NextResponse.json({ skipped: true, reason: 'Referral reminders disabled — too many emails' });
}
