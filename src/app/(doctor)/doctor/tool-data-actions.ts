'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function saveToolData(tool: string, data: any) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('doctor_tool_data' as any)
    .upsert({
      user_id: user.id,
      tool,
      data,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,tool' })

  if (error) {
    console.error(`[TOOL DATA] Save failed for ${tool}:`, error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function loadToolData(tool: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: row, error } = await supabase
    .from('doctor_tool_data' as any)
    .select('data')
    .eq('user_id', user.id)
    .eq('tool', tool)
    .maybeSingle()

  if (error) {
    console.error(`[TOOL DATA] Load failed for ${tool}:`, error)
    return null
  }
  return (row as any)?.data || null
}
