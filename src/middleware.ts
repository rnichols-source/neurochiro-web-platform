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

  // Role-based access control
  const userRole = session?.user?.user_metadata?.role || '';
  const path = req.nextUrl.pathname;

  if (path.startsWith('/doctor') && !['doctor', 'admin', 'founder', 'super_admin'].includes(userRole)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  if (path.startsWith('/student') && !['student', 'admin', 'founder', 'super_admin'].includes(userRole)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  if (path.startsWith('/admin') && !['admin', 'founder', 'super_admin', 'regional_admin'].includes(userRole)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/portal/:path*', '/doctor/:path*', '/student/:path*', '/admin/:path*'],
};
