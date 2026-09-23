import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getMarketingResend, getAudienceId } from '@/lib/marketing-email';
import crypto from 'crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://neurochiro.co';

  if (!token || token.length < 32) {
    return NextResponse.redirect(`${siteUrl}/list?error=invalid`);
  }

  const tokenHash = hashToken(token);
  const supabase = createAdminClient();

  // Look up subscriber by token hash
  const { data: subscriber, error } = await (supabase as any)
    .from('subscribers')
    .select('id, email, zip, state, status, token_expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !subscriber) {
    return NextResponse.redirect(`${siteUrl}/list?error=invalid`);
  }

  // Already confirmed
  if (subscriber.status === 'confirmed') {
    return NextResponse.redirect(`${siteUrl}/list/confirmed`);
  }

  // Check expiry
  if (new Date(subscriber.token_expires_at) < new Date()) {
    return NextResponse.redirect(`${siteUrl}/list?error=expired`);
  }

  // Mark as confirmed, clear token
  const { error: updateError } = await (supabase as any)
    .from('subscribers')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      token_hash: null,
      token_expires_at: null,
    } as any)
    .eq('id', subscriber.id);

  if (updateError) {
    console.error('[CONFIRM] Update error:', updateError);
    return NextResponse.redirect(`${siteUrl}/list?error=server`);
  }

  // Create contact in Resend Audience
  // Uses the main Resend key (not marketing send-only key) since Audience API requires full access
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY || '');
    const audienceId = getAudienceId();

    const { data: contact } = await resend.contacts.create({
      audienceId,
      email: subscriber.email,
      firstName: '',
      lastName: '',
      unsubscribed: false,
    });

    // Store Resend contact ID for future reference
    if (contact?.id) {
      await (supabase as any)
        .from('subscribers')
        .update({ resend_contact_id: contact.id } as any)
        .eq('id', subscriber.id);
    }
  } catch (audienceErr) {
    // Non-blocking: subscriber is confirmed even if Audience create fails
    console.error('[CONFIRM] Resend Audience error:', audienceErr);
  }

  return NextResponse.redirect(`${siteUrl}/list/confirmed`);
}
