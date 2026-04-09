import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type') // Supabase passes type=recovery for password resets

  if (code) {
    const supabase = createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If this is a password recovery flow, redirect to reset-password page
      if (type === 'recovery' || next.includes('reset-password')) {
        console.log(`[AUTH_CALLBACK] Recovery flow. Redirecting to /reset-password`);
        return NextResponse.redirect(`${origin}/reset-password`)
      }

      console.log(`[AUTH_CALLBACK] Successfully exchanged code. Redirecting to: ${next}`);
      // Small delay to ensure database triggers (profiles/doctors) have finished
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error("[AUTH_CALLBACK] Exchange error:", error.message);
    }
  }

  console.error("[AUTH_CALLBACK] No code found or exchange failed. Redirecting to error.");
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
