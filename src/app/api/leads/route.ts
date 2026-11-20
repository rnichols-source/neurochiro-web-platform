import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

// Simple in-memory rate limiter: max 5 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 5;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { email, source, role, location, first_name, doctor_id, _hp } = body;

    // Honeypot — bots fill hidden fields, real users don't
    if (_hp) {
      return NextResponse.json({ success: true }); // Silent reject
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Block obvious fake/test/disposable domains
    const domain = email.split('@')[1]?.toLowerCase();
    const blockedDomains = ['demo.com', 'test.com', 'example.com', 'fake.com', 'mailinator.com', 'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'sharklasers.com', 'grr.la', 'guerrillamailblock.com', 'yopmail.com', 'trashmail.com', 'dispostable.com', 'maildrop.cc', 'mailnesia.com', 'tempinbox.com', 'fakeinbox.com', 'emailondeck.com', 'mintemail.com'];
    if (domain && blockedDomains.includes(domain)) {
      return NextResponse.json({ success: true }); // Silent reject
    }

    // Block spam pattern emails (e.g. m.arys.te.wart.c4.o.o.q@gmail.com, o.z.ufuwa.547@gmail.com)
    const localPart = email.split('@')[0]?.toLowerCase() || '';
    const dotSegments = localPart.split('.');
    // Reject if local part has 4+ dot-separated segments (real emails rarely do this)
    if (dotSegments.length >= 4) {
      return NextResponse.json({ success: true }); // Silent reject
    }
    // Reject local parts that are mostly single characters separated by dots
    const singleCharSegments = dotSegments.filter((s: string) => s.length <= 2).length;
    if (dotSegments.length >= 3 && singleCharSegments >= dotSegments.length - 1) {
      return NextResponse.json({ success: true }); // Silent reject
    }

    const supabase = createAdminClient();

    // Upsert to avoid duplicates
    const { error } = await supabase
      .from('leads')
      .upsert({
        email,
        source: source || 'website',
        role: role || 'patient',
        location: location || null,
        first_name: first_name || null,
        doctor_id: doctor_id || null,
        status: 'new',
        metadata: {
          timestamp: new Date().toISOString(),
        }
      }, { onConflict: 'email' });

    if (error) {
      // If upsert fails due to no unique constraint, just insert
      await supabase.from('leads').insert({
        email,
        source: source || 'website',
        role: role || 'patient',
        location: location || null,
        first_name: first_name || null,
        doctor_id: doctor_id || null,
        status: 'new',
        metadata: { timestamp: new Date().toISOString() }
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
