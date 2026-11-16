/**
 * Server and cron code must read Supabase settings from the live environment.
 * Next inlines NEXT_PUBLIC_* at build time. A cron bundle built without those
 * values keeps the empty string and ignores the runtime variables, which is
 * why scheduled jobs logged "Supabase env is missing" while the keys were set.
 */

type EnvBag = Record<string, string | undefined>

export function readRuntimeEnv(env: EnvBag, name: string): string {
  return String(env[name] ?? '').trim()
}

export function resolveSupabaseAdminEnv(
  env: EnvBag,
  inlinedUrl = '',
): { url: string; key: string } | null {
  const url = readRuntimeEnv(env, 'SUPABASE_URL')
    || readRuntimeEnv(env, 'NEXT_PUBLIC_SUPABASE_URL')
    || inlinedUrl.trim()
  const key = readRuntimeEnv(env, 'SUPABASE_SECRET_KEY')
    || readRuntimeEnv(env, 'SUPABASE_SERVICE_ROLE_KEY')
  if (!url || url.includes('your-project-url') || !key) return null
  return { url, key }
}

export function resolveSupabasePublicEnv(
  env: EnvBag,
  inlinedUrl = '',
  inlinedKey = '',
): { url: string; key: string } | null {
  const url = readRuntimeEnv(env, 'NEXT_PUBLIC_SUPABASE_URL')
    || readRuntimeEnv(env, 'SUPABASE_URL')
    || inlinedUrl.trim()
  const key = readRuntimeEnv(env, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    || readRuntimeEnv(env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
    || inlinedKey.trim()
  if (!url || url.includes('your-project-url') || !key || key.includes('your-anon-key')) return null
  return { url, key }
}
