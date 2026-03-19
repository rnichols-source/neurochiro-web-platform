import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Sanity Webhook Handler to refresh cached doctor profiles
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Verify webhook signature (e.g., using a secret header)
  const signature = req.headers.get('x-sanity-webhook-signature');
  if (signature !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Revalidate the doctor profile page
  const doctorId = body.id;
  revalidatePath(`/doctor/${doctorId}`);

  return NextResponse.json({ message: 'Revalidation successful' });
}
