import { NextResponse } from 'next/server';

// DISABLED: Weekly digest killed in favor of monthly growth report only.
// Members reported too-frequent view count emails as noise.

export async function GET() {
  return NextResponse.json({ status: 'disabled', reason: 'Replaced by monthly growth report' });
}
