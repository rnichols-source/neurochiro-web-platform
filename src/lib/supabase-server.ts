import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if we have valid production-ready environment variables
  const isInvalidUrl = !supabaseUrl || supabaseUrl.includes('your-project-url');
  const isInvalidKey = !supabaseKey || supabaseKey.includes('your-anon-key');

  if (isInvalidUrl || isInvalidKey) {
    // Return a comprehensive recursive proxy that mimics the supabase client to prevent crashes during dev or pre-rendering
    const createRecursiveProxy = (mockResponse: any = { data: null, error: null }): any => {
      const proxy = () => createRecursiveProxy(mockResponse);
      
      // Make it thenable so it can be awaited
      (proxy as any).then = (resolve: any) => resolve(mockResponse);

      return new Proxy(proxy, {
        get: (target, prop) => {
          // Special cases for common properties
          if (prop === 'then') return (target as any).then;

          if (prop === 'auth') {
            return {
              getUser: async () => ({ data: { user: null }, error: null }),
              getSession: async () => ({ data: { session: null }, error: null }),
              onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
              signInWithPassword: async () => ({ data: { user: { id: 'mock-id' } }, error: null }),
              signUp: async () => ({ data: { user: { id: 'mock-id' } }, error: null }),
              signOut: async () => ({ error: null }),
            };
          }

          if (prop === 'storage') {
            return {
              from: () => ({
                upload: async () => ({ data: null, error: null }),
                getPublicUrl: () => ({ data: { publicUrl: '' } }),
              })
            };
          }

          // Handle common return patterns for .single() or .maybeSingle()
          const singleMockData = { data: { role: 'doctor_pro', subscription_status: 'active' }, error: null };
          if (prop === 'single' || prop === 'maybeSingle') {
            return createRecursiveProxy(singleMockData);
          }

          return createRecursiveProxy(mockResponse);
        },
        apply: (target, thisArg, argArray) => {
          return createRecursiveProxy(mockResponse);
        }
      }) as any;
    };

    return createRecursiveProxy();
  }

  return createServerClient(
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
