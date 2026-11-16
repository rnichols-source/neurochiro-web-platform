import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveSupabaseAdminEnv } from './supabase-runtime-env.ts'

describe('supabase admin env for cron', () => {
  it('uses the runtime URL when the build inlined an empty public URL', () => {
    const resolved = resolveSupabaseAdminEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://gddapefwrmucimpdhjrz.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    }, '')
    assert.equal(resolved?.url, 'https://gddapefwrmucimpdhjrz.supabase.co')
    assert.equal(resolved?.key, 'service-role-key')
  })

  it('prefers a server URL and the secret key name', () => {
    const resolved = resolveSupabaseAdminEnv({
      SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_URL: 'https://other.supabase.co',
      SUPABASE_SECRET_KEY: 'secret',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
    })
    assert.equal(resolved?.url, 'https://example.supabase.co')
    assert.equal(resolved?.key, 'secret')
  })

  it('stays unconfigured when the key is missing', () => {
    assert.equal(resolveSupabaseAdminEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    }, ''), null)
  })
})
