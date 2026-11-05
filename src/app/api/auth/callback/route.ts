import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase-server'
import { safeReturnPath } from '@/lib/auth/safe-return-path'
import { shouldAttemptDoctorClaim } from '@/lib/doctors/claim-existing'
import { claimUnclaimedDoctor } from '@/lib/doctors/claim-existing-run'
import { isFounderEmail } from '@/lib/founder'
import { NextResponse } from 'next/server'

function redirectClearingReturn(url: string) {
  const response = NextResponse.redirect(url)
  response.cookies.set('nc_return_path', '', { path: '/', maxAge: 0 })
  return response
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const jar = await cookies()
  const next = safeReturnPath(searchParams.get('next')) || safeReturnPath(jar.get('nc_return_path')?.value) || '/'
  const type = searchParams.get('type') // Supabase passes type=recovery for password resets

  if (code) {
    const supabase = createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If this is a password recovery flow, redirect to reset-password page
      if (type === 'recovery' || next.includes('reset-password')) {
        console.log(`[AUTH_CALLBACK] Recovery flow. Redirecting to /reset-password`);
        return redirectClearingReturn(`${origin}/reset-password`)
      }

      // Google sign-in does not create a doctor row. Link an admin-built profile by email.
      const { data: { user } } = await supabase.auth.getUser()
      let destination = next
      if (user?.email && !isFounderEmail(user.email)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .maybeSingle()
        const storedRole = (profile as { role?: string | null } | null)?.role
        if (shouldAttemptDoctorClaim(storedRole)) {
          const claim = await claimUnclaimedDoctor({
            userId: user.id,
            email: user.email,
            source: 'login',
            displayName: (profile as { full_name?: string | null } | null)?.full_name || '',
          })
          if (claim.status === 'claimed' && (next === '/' || next === '')) {
            destination = '/doctor/dashboard'
          }
        }
      }

      console.log(`[AUTH_CALLBACK] Successfully exchanged code. Redirecting to: ${destination}`);
      return redirectClearingReturn(`${origin}${destination}`)
    } else {
      console.error("[AUTH_CALLBACK] Exchange error:", error.message);
    }
  }

  console.error("[AUTH_CALLBACK] No code found or exchange failed. Redirecting to error.");
  return redirectClearingReturn(`${origin}/login?error=auth_failed`)
}
