import { NextResponse } from 'next/server';

export const maxDuration = 300;

/**
 * PROFILE NUDGER — DISABLED 2026-11-15
 * Was overwhelming members with repeated nudge emails.
 * Original code sent daily nudges for missing profile fields.
 */
export async function GET() {
  return NextResponse.json({ skipped: true, reason: 'Profile nudger disabled — too many emails' });
}
