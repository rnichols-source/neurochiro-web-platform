import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from '@/lib/supabase-env'

export function createServerSupabase() {
  const supabaseUrl = SUPABASE_URL;
  const supabaseKey = SUPABASE_PUBLIC_KEY;

  // Check if we have valid production-ready environment variables
  const isInvalidUrl = !supabaseUrl || supabaseUrl.includes('your-project-url');
  const isInvalidKey = !supabaseKey || supabaseKey.includes('your-anon-key');

  if (isInvalidUrl || isInvalidKey) {
    throw new Error("Supabase environment variables are missing or invalid.");
  }

  return createServerClient<Database>(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value, ...options })
          } catch (error) {}
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {}
        },
      },
    }
  )
}
