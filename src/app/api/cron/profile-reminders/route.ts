import { NextRequest, NextResponse } from "next/server";

// DISABLED: Merged with profile-nudger to reduce email volume.
// profile-nudger handles incomplete profile notifications (one per missing item, 7-day cooldown).

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'disabled', reason: 'Merged with profile-nudger' });
}
