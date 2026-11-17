import { NextResponse } from 'next/server';

export const maxDuration = 300;

/**
 * PROFILE NUDGER — disabled.
 * The daily incomplete-profile email (missing photo, bio, or specialties)
 * is turned off. This route stays so a stale cron or a manual trigger
 * returns success and sends nothing.
 */
export async function GET() {
  return NextResponse.json({ disabled: true });
}
