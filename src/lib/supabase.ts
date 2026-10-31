import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from '@/lib/supabase-env'

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (_client) return _client;

  const supabaseUrl = SUPABASE_URL;
  const supabaseKey = SUPABASE_PUBLIC_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or a public Supabase key');
  }

  _client = createBrowserClient<Database>(supabaseUrl, supabaseKey);
  return _client;
}
