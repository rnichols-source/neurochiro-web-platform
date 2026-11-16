import { NextResponse } from 'next/server';

export const maxDuration = 300;

/**
 * SPOTLIGHT PROMOTER — DISABLED 2026-11-15
 * Was blasting entire member base with no opt-out.
 * Original code emailed all doctors + students per new episode.
 */
export async function GET() {
  return NextResponse.json({ skipped: true, reason: 'Spotlight promoter disabled — too many emails' });
}
