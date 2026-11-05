import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { loginPathWithReturn } from '@/lib/auth/safe-return-path';
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from '@/lib/supabase-env';

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', req.nextUrl.pathname);
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
  const schoolVerify = path === '/student/verify'
  if (!session && !schoolVerify && (
    path.startsWith('/portal') ||
    path.startsWith('/doctor') ||
    path.startsWith('/student') ||
    path.startsWith('/admin')
  )) {
    const applying = path === '/doctor/apply' || path.startsWith('/doctor/apply/');
    const dest = applying ? loginPathWithReturn(`${path}${req.nextUrl.search}`) : '/login';
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
  matcher: ['/portal/:path*', '/doctor/:path*', '/student/:path*', '/admin/:path*'],
};
