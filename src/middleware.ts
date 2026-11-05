import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { loginPathWithReturn } from '@/lib/auth/safe-return-path';
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from '@/lib/supabase-env';
import { LOCALE_COOKIE, LOCALE_HEADER, splitLocalePrefix } from '@/i18n/config';

export async function middleware(req: NextRequest) {
  const { locale, pathname } = splitLocalePrefix(req.nextUrl.pathname);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);
  requestHeaders.set(LOCALE_HEADER, locale);

  const url = req.nextUrl.clone();
  url.pathname = pathname;

  const res = locale === 'en'
    ? NextResponse.next({ request: { headers: requestHeaders } })
    : NextResponse.rewrite(url, { request: { headers: requestHeaders } });

  if (locale === 'fr') {
    res.cookies.set(LOCALE_COOKIE, 'fr', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  const schoolVerify = pathname === '/student/verify';
  const protectedPath = pathname.startsWith('/portal') ||
    pathname.startsWith('/doctor') ||
    pathname.startsWith('/student') ||
    pathname.startsWith('/admin');

  if (!protectedPath) return res;

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

  if (!session && !schoolVerify) {
    const applying = pathname === '/doctor/apply' || pathname.startsWith('/doctor/apply/');
    const dest = applying ? loginPathWithReturn(`${pathname}${req.nextUrl.search}`) : '/login';
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Role-based access control: only enforce authentication in middleware.
  // The authoritative role lives in the `profiles` table, not user_metadata.
  // Checking user_metadata here caused redirect loops for doctors whose
  // metadata was out of sync (claimed profiles, seeded data, role changes).
  // Actual role verification is handled by server actions and page components.

  return res;
}

export const config = {
  matcher: [
    '/((?!api/|_next/|monitoring|.*\\..*).*)',
  ],
};
