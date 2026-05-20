import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  _client = createBrowserClient<Database>(supabaseUrl, supabaseKey);
  return _client;
}
