import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
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
