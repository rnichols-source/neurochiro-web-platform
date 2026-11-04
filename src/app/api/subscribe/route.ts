import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIP } from '@/lib/rate-limit';
import { subscribeEmail } from '@/lib/subscribers/subscribe';
import { getCountryByIso2 } from '@/config/countries';
import { isPostalOptional, normalizeCountryHint, validatePostalFormat } from '@/lib/detect-postal';
import { toInternationalE164 } from '@/lib/calling-codes';
import { WAITLIST_SMS_CONSENT_V1, WAITLIST_SMS_CONSENT_VERSION } from '@/lib/sms/consent';

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
    phone?: unknown
    smsConsent?: unknown
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const { email, zip, consent, source: rawSource, _hp, _ts, country: rawCountry, phone, smsConsent } = body;
  const PUBLIC_SOURCES = ['website', 'homepage', 'directory_empty', 'profile_footer', 'site_footer', 'og_share', 'city_page', 'contact_request'];
  const source = typeof rawSource === 'string' && PUBLIC_SOURCES.includes(rawSource) ? rawSource : 'website';
  const requestedCountry = normalizeCountryHint(typeof rawCountry === 'string' ? rawCountry : 'US');
  const subscriberCountry = getCountryByIso2(requestedCountry) ? requestedCountry : 'US';

  if (_hp) {
    return NextResponse.json({ ok: true, message: 'Check your inbox for a confirmation link.' });
  }

  if (_ts && Date.now() - Number(_ts) < 2000) {
    return NextResponse.json({ ok: true, message: 'Check your inbox for a confirmation link.' });
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const postalInput = typeof zip === 'string' ? zip : '';
  const postalError = validatePostalFormat(postalInput, subscriberCountry);
  if (postalError) {
    return NextResponse.json({ ok: false, error: postalError }, { status: 400 });
  }
  const wantsSms = smsConsent === true;
  let smsPhone: string | null = null;
  if (wantsSms) {
    smsPhone = toInternationalE164(typeof phone === 'string' ? phone : '', subscriberCountry);
    if (!smsPhone) {
      return NextResponse.json({ ok: false, error: 'Enter a mobile number we can text, or leave the text box unchecked.' }, { status: 400 });
    }
  }

  if (consent !== true) {
    return NextResponse.json({ ok: false, error: 'You must agree to receive emails.' }, { status: 400 });
  }

  const result = await subscribeEmail({
    email: email.trim().toLowerCase(),
    zip: postalInput.trim(),
    country: subscriberCountry,
    source,
    ip,
    userAgent: req.headers.get('user-agent') || '',
    skipCoverageCheck: false,
    smsPhone: wantsSms ? smsPhone : null,
    smsConsent: wantsSms,
    smsConsentVersion: wantsSms ? WAITLIST_SMS_CONSENT_VERSION : null,
    smsConsentText: wantsSms ? WAITLIST_SMS_CONSENT_V1 : null,
    allowEmptyPostal: isPostalOptional(subscriberCountry),
  });
  return NextResponse.json(result.body, { status: result.status });
}
