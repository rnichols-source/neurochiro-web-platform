import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { loginPathWithReturn } from '@/lib/auth/safe-return-path';
import { MEMBER_REF_COOKIE, normalizeRefSlug } from '@/lib/member-referrals/logic';
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from '@/lib/supabase-env';

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', req.nextUrl.pathname);
  requestHeaders.set('x-search', req.nextUrl.search);
  const res = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname
  const referralSlug = normalizeRefSlug(req.nextUrl.searchParams.get('ref'));
  const remembersReferral = path === '/get-started' || path === '/doctor/apply' || path.startsWith('/doctor/apply/');
  const referralCookie = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
    secure: process.env.NODE_ENV === 'production',
  };
  const schoolVerify = path === '/student/verify'
  if (!session && !schoolVerify && (
    path.startsWith('/portal') ||
    path.startsWith('/doctor') ||
    path.startsWith('/student') ||
    path.startsWith('/admin')
  )) {
    const applying = path === '/doctor/apply' || path.startsWith('/doctor/apply/');
    const careInvite = path === '/portal/care/from-doctor' || path.startsWith('/portal/care/from-doctor/');
    const dest = applying || careInvite ? loginPathWithReturn(`${path}${req.nextUrl.search}`) : '/login';
    const redirect = NextResponse.redirect(new URL(dest, req.url));
    if (referralSlug && remembersReferral) redirect.cookies.set(MEMBER_REF_COOKIE, referralSlug, referralCookie);
    return redirect;
  }

  if (referralSlug && remembersReferral) {
    res.cookies.set(MEMBER_REF_COOKIE, referralSlug, referralCookie);
  }

  // Role-based access control: only enforce authentication in middleware.
  // The authoritative role lives in the `profiles` table, not user_metadata.
  // Checking user_metadata here caused redirect loops for doctors whose
  // metadata was out of sync (claimed profiles, seeded data, role changes).
  // Actual role verification is handled by server actions and page components.

  return res;
}

export const config = {
  matcher: ['/portal/:path*', '/doctor/:path*', '/student/:path*', '/admin/:path*', '/get-started'],
};
