import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

// These are public values (anon key is designed to be exposed in the browser).
// Hardcoded as fallback because NEXT_PUBLIC_ env vars must be present at Vercel
// build time to be baked into the JS bundle. If they're added after the build,
// they won't be available on the client.
const FALLBACK_URL = 'https://gddapefwrmucimpdhjrz.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGFwZWZ3cm11Y2ltcGRoanJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Mjg2MjQsImV4cCI6MjA4ODAwNDYyNH0.NTljcu-z3u2St_0x-337aDBgI71GjRDwdIToS5hnUtc';

export function createClient() {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;

  _client = createBrowserClient<Database>(supabaseUrl, supabaseKey);
  return _client;
}
