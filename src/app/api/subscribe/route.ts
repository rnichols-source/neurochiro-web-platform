import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIP } from '@/lib/rate-limit';
import { subscribeEmail } from '@/lib/subscribers/subscribe';

const limiter = rateLimit('subscribe', { maxRequests: 5, windowMs: 3600_000 });

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: true, message: 'Check your inbox for a confirmation link.' },
      { status: 200 }
    );
  }

  let body: {
    email?: unknown
    zip?: unknown
    consent?: unknown
    source?: unknown
    _hp?: unknown
    _ts?: unknown
    country?: unknown
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const { email, zip, consent, source: rawSource, _hp, _ts, country: rawCountry } = body;
  const PUBLIC_SOURCES = ['website', 'homepage', 'directory_empty', 'profile_footer', 'site_footer', 'og_share', 'city_page', 'contact_request'];
  const source = typeof rawSource === 'string' && PUBLIC_SOURCES.includes(rawSource) ? rawSource : 'website';
  const VALID_COUNTRIES = ['US', 'CA', 'GB', 'NZ', 'AU'];
  const subscriberCountry = typeof rawCountry === 'string' && VALID_COUNTRIES.includes(rawCountry) ? rawCountry : 'US';

  if (_hp) {
    return NextResponse.json({ ok: true, message: 'Check your inbox for a confirmation link.' });
  }

  if (_ts && Date.now() - Number(_ts) < 2000) {
    return NextResponse.json({ ok: true, message: 'Check your inbox for a confirmation link.' });
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!zip || typeof zip !== 'string' || !zip.trim()) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid postal code.' }, { status: 400 });
  }
  const { detectPostalCode } = await import('@/lib/detect-postal');
  const postalDetection = detectPostalCode(zip.trim(), subscriberCountry);
  if (!postalDetection) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid postal code for your country.' }, { status: 400 });
  }

  if (consent !== true) {
    return NextResponse.json({ ok: false, error: 'You must agree to receive emails.' }, { status: 400 });
  }

  const result = await subscribeEmail({
    email: email.trim().toLowerCase(),
    zip: postalDetection.code,
    country: postalDetection.country,
    source,
    ip,
    userAgent: req.headers.get('user-agent') || '',
    skipCoverageCheck: false,
  });
  return NextResponse.json(result.body, { status: result.status });
}
