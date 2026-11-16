import { NextResponse } from 'next/server';

/**
 * MATCH OUTCOMES — DISABLED 2026-11-15
 * Was sending unnecessary survey emails for old matches.
 * Original code emailed both parties after 14 days.
 */
export async function GET() {
  return NextResponse.json({ skipped: true, reason: 'Match outcomes disabled — too many emails' });
}
