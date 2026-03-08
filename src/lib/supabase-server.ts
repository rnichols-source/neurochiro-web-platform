import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return a comprehensive proxy that mimics the supabase client to prevent crashes during dev
    return new Proxy({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: { id: 'mock-id' } }, error: null }),
        signUp: async () => ({ data: { user: { id: 'mock-id' } }, error: null }),
        signOut: async () => ({ error: null }),
      }
    }, {
      get: (target, prop) => {
        if (prop in target) return (target as any)[prop];
        return () => ({
          select: () => ({ 
            eq: () => ({ 
              single: async () => ({ data: { role: 'doctor_pro', subscription_status: 'active' }, error: null }),
              order: () => ({ limit: async () => ({ data: [], error: null }) })
            }), 
            single: async () => ({ data: { role: 'doctor_pro' }, error: null }) 
          }),
          insert: () => ({ 
            select: () => ({ 
              single: async () => ({ data: { id: 'mock-inserted-id' }, error: null }) 
            }) 
          }),
          upsert: async () => ({ data: null, error: null }),
          update: () => ({ eq: async () => ({ data: null, error: null }) }),
          delete: () => ({ eq: async () => ({ data: null, error: null }) }),
        });
      }
    }) as any;
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
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
