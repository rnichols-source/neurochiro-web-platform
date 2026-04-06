import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables are missing. Client-side features will not work.");
    // Return a dummy client that won't crash — pages will show empty states
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
    );
  }

  _client = createBrowserClient<Database>(supabaseUrl, supabaseKey);
  return _client;
}
