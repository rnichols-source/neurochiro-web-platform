import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase-server'
import { safeReturnPath } from '@/lib/auth/safe-return-path'
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

      // Check if this is a student without an active subscription
      // Prevents OAuth from bypassing the paywall
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, tier, stripe_customer_id')
          .eq('id', user.id)
          .single()

        // Free tier — no subscription redirects needed
        // All doctors and students can access their portals
        // Features are gated inside via sidebar locks and UpgradeGate components
      }

      console.log(`[AUTH_CALLBACK] Successfully exchanged code. Redirecting to: ${next}`);
      return redirectClearingReturn(`${origin}${next}`)
    } else {
      console.error("[AUTH_CALLBACK] Exchange error:", error.message);
    }
  }

  console.error("[AUTH_CALLBACK] No code found or exchange failed. Redirecting to error.");
  return redirectClearingReturn(`${origin}/login?error=auth_failed`)
}
