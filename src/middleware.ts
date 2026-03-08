import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const routePermissions: Record<string, string[]> = {
  '/admin': ['admin', 'regional_admin'],
  '/doctor': ['doctor_pro', 'doctor_growth', 'doctor_member', 'doctor_non_member', 'admin'],
  '/student': ['student_paid', 'student_free', 'admin'],
  '/portal': ['patient', 'admin'],
  '/marketplace/dashboard': ['vendor', 'admin'],
};
// 🛡️ Rate Limiting Config
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_GENERAL_REQUESTS = 100;
const MAX_AUTH_REQUESTS = 10; // Strict for login/signup
const ipCache = new Map<string, { count: number, start: number }>();

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const now = Date.now();
  const { pathname } = request.nextUrl;
  
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.includes('/auth');
  const limit = isAuthRoute ? MAX_AUTH_REQUESTS : MAX_GENERAL_REQUESTS;

  const entry = ipCache.get(ip);

  // Simple IP-based rate limiting (In-memory, for production use Redis/Upstash)
  if (entry) {
    if (now - entry.start > RATE_LIMIT_WINDOW) {
      ipCache.set(ip, { count: 1, start: now });
    } else if (entry.count >= limit) {
      return new NextResponse('Too Many Requests', { status: 429 });
    } else {
      entry.count++;
    }
  } else {
    ipCache.set(ip, { count: 1, start: now });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 🛡️ Safety Bypass: If keys are missing, allow all traffic to prevent crashes during dev/audit
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[MIDDLEWARE] Supabase keys missing. Bypassing security checks.");
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const matchedBase = Object.keys(routePermissions).find(path => pathname.startsWith(path))

  if (matchedBase) {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_status')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'public'
    const allowedRoles = routePermissions[matchedBase]

    if (!allowedRoles.includes(userRole) && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    const isPaidRoute = ['doctor_pro', 'doctor_growth', 'student_paid'].includes(userRole)
    if (isPaidRoute && profile?.subscription_status !== 'active') {
      return NextResponse.redirect(new URL('/pricing', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/doctor/:path*',
    '/student/:path*',
    '/portal/:path*',
    '/marketplace/dashboard/:path*',
    '/login',
    '/register',
    '/api/:path*',
  ],
}
