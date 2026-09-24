import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { rateLimit, getIP } from '@/lib/rate-limit';
import { zipToState } from '@/lib/zip-to-state';
import { getMarketingResend, getMarketingFrom, wrapMarketingEmail } from '@/lib/marketing-email';
import crypto from 'crypto';

const limiter = rateLimit('subscribe', { maxRequests: 5, windowMs: 3600_000 });

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = getIP(req);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: true, message: 'Check your inbox for a confirmation link.' },
      { status: 200 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const { email, zip, consent, source: rawSource, _hp, _ts } = body;
  const VALID_SOURCES = ['website', 'homepage', 'directory_empty', 'profile_footer', 'site_footer', 'og_share', 'city_page'];
  const source = VALID_SOURCES.includes(rawSource) ? rawSource : 'website';

  // Honeypot check
  if (_hp) {
    return NextResponse.json({ ok: true, message: 'Check your inbox for a confirmation link.' });
  }

  // Timing check: form must take at least 2 seconds to fill
  if (_ts && Date.now() - Number(_ts) < 2000) {
    return NextResponse.json({ ok: true, message: 'Check your inbox for a confirmation link.' });
  }

  // Validate email
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }

  // Validate ZIP
  if (!zip || typeof zip !== 'string' || !/^\d{5}$/.test(zip.trim())) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid 5-digit ZIP code.' }, { status: 400 });
  }

  // Validate consent
  if (consent !== true) {
    return NextResponse.json({ ok: false, error: 'You must agree to receive emails.' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedZip = zip.trim();
  const state = zipToState(normalizedZip);
  const userAgent = req.headers.get('user-agent') || '';

  const supabase = createAdminClient();

  // Check for existing subscriber
  const { data: existing } = await (supabase as any)
    .from('subscribers')
    .select('id, status, token_expires_at, updated_at')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'confirmed') {
      // Already confirmed. Return same generic success (no enumeration leak).
      return NextResponse.json({ ok: true, message: 'Check your inbox for a confirmation link.' });
    }

    if (existing.status === 'unsubscribed') {
      // Previously unsubscribed. Allow re-subscribe by resetting to pending.
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await (supabase as any)
        .from('subscribers')
        .update({
          status: 'pending',
          zip: normalizedZip,
          state,
          token_hash: tokenHash,
          token_expires_at: expiresAt,
          unsubscribed_at: null,
          ip,
          user_agent: userAgent,
        } as any)
        .eq('id', existing.id);

      await sendConfirmationEmail(normalizedEmail, token);
      return NextResponse.json({ ok: true, message: 'Check your inbox for a confirmation link.' });
    }

    // Status is pending. Resend confirmation at most once per 15 minutes.
    const lastUpdated = new Date(existing.updated_at).getTime();
    if (Date.now() - lastUpdated < 15 * 60 * 1000) {
      return NextResponse.json({ ok: true, message: 'Check your inbox for a confirmation link.' });
    }

    // Generate new token and resend
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await (supabase as any)
      .from('subscribers')
      .update({
        zip: normalizedZip,
        state,
        token_hash: tokenHash,
        token_expires_at: expiresAt,
        ip,
        user_agent: userAgent,
      } as any)
      .eq('id', existing.id);

    await sendConfirmationEmail(normalizedEmail, token);
    return NextResponse.json({ ok: true, message: 'Check your inbox for a confirmation link.' });
  }

  // New subscriber: insert as pending
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await (supabase as any)
    .from('subscribers')
    .insert({
      email: normalizedEmail,
      zip: normalizedZip,
      state,
      status: 'pending',
      token_hash: tokenHash,
      token_expires_at: expiresAt,
      source,
      ip,
      user_agent: userAgent,
    } as any);

  if (insertError) {
    // Unique constraint violation means race condition. Return generic success.
    if (insertError.code === '23505') {
      return NextResponse.json({ ok: true, message: 'Check your inbox for a confirmation link.' });
    }
    console.error('[SUBSCRIBE] Insert error:', insertError);
    return NextResponse.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  await sendConfirmationEmail(normalizedEmail, token);
  return NextResponse.json({ ok: true, message: 'Check your inbox for a confirmation link.' });
}

async function sendConfirmationEmail(email: string, token: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://neurochiro.co';
  const confirmUrl = `${siteUrl}/api/confirm?token=${token}`;

  const resend = getMarketingResend();
  const from = getMarketingFrom();

  await resend.emails.send({
    from,
    to: [email],
    subject: 'Confirm your NeuroChiro subscription',
    html: wrapMarketingEmail(`
      <p style="font-size:15px;color:#333;line-height:1.6;">Thanks for signing up for the NeuroChiro patient list.</p>
      <p style="font-size:15px;color:#333;line-height:1.6;">Click the button below to confirm your email address. This link expires in 24 hours.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${confirmUrl}" style="display:inline-block;background:#D66829;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Confirm My Email</a>
      </div>
      <p style="font-size:13px;color:#999;">If you didn't sign up, you can ignore this email.</p>
    `),
  });
}
