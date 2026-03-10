import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const routePermissions: Record<string, string[]> = {
  '/admin': ['admin', 'regional_admin', 'founder', 'super_admin'],
  '/doctor': ['doctor', 'doctor_pro', 'doctor_growth', 'doctor_starter', 'doctor_member', 'doctor_non_member', 'admin', 'founder', 'super_admin'],
  '/student': ['student', 'student_paid', 'student_free', 'admin', 'founder', 'super_admin'],
  '/portal': ['patient', 'admin', 'founder', 'super_admin'],
  '/marketplace/dashboard': ['vendor', 'admin', 'founder', 'super_admin'],
};
// 🛡️ Rate Limiting Config
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_GENERAL_REQUESTS = 1000; // Increased from 100
const MAX_AUTH_REQUESTS = 100; // Increased from 10
const ipCache = new Map<string, { count: number, start: number }>();

export default async function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const now = Date.now();
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 🛡️ Skip rate limiting for static assets and system paths
  const isStatic = pathname.startsWith('/_next') || 
                   pathname.includes('/favicon.ico') || 
                   pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|css|js)$/);
  
  if (isStatic) {
    return NextResponse.next();
  }

  // 🌐 MULTI-DOMAIN ROUTING
  // If the user visits neurochiromastermind.com, rewrite them to the /mastermind route internally
  if (hostname.includes('neurochiromastermind.com')) {
    // Prevent infinite loops if they already are on a /mastermind path
    if (!pathname.startsWith('/mastermind') && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
      const url = request.nextUrl.clone();
      url.pathname = `/mastermind${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
  }
  
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

    const userRole = profile?.role || 'doctor' // Default to doctor if missing to allow dashboard access
    const allowedRoles = routePermissions[matchedBase]

    // 🛡️ Safe Perspective Mode logic
    // Admins are allowed everywhere.
    if (userRole === 'admin' || userRole === 'regional_admin' || userRole === 'founder' || userRole === 'super_admin') {
      return response;
    }

    if (!allowedRoles.includes(userRole)) {
      // Determine logical redirect based on role
      let targetPath = '/';
      if (userRole === 'admin' || userRole === 'regional_admin' || userRole === 'founder' || userRole === 'super_admin') targetPath = '/admin/dashboard';
      else if (userRole.startsWith('doctor') || userRole === 'doctor') targetPath = '/doctor/dashboard';
      else if (userRole === 'vendor') targetPath = '/marketplace/dashboard';
      else if (userRole === 'patient') targetPath = '/portal/dashboard';

      // 🛡️ Loop Protection: If they are already ON the target path and it failed permission check, 
      // do NOT redirect them back to it. Send them to home.
      if (pathname.startsWith(targetPath)) {
        console.warn(`[MIDDLEWARE] Redirect loop prevented for ${userRole} on ${pathname}`);
        return NextResponse.redirect(new URL('/', request.url));
      }

      return NextResponse.redirect(new URL(targetPath, request.url))
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
    '/',
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
