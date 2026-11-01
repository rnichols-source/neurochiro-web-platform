'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revealPerkForUser } from '@/lib/synapse/reveal'

export async function revealStudentPerk(perkId: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in as a student.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'student') return { error: 'Student perks are for student members.' }
  return revealPerkForUser(user.id, perkId, 'student')
}
