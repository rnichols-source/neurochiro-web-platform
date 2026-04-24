import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  if (!session && (
    req.nextUrl.pathname.startsWith('/portal') ||
    req.nextUrl.pathname.startsWith('/doctor') ||
    req.nextUrl.pathname.startsWith('/student') ||
    req.nextUrl.pathname.startsWith('/admin')
  )) {
    return NextResponse.redirect(new URL('/login', req.url));
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
