'use server'

import { createServerSupabase } from '@/lib/supabase-server'

/**
 * Shared tool data persistence for doctor and student portals.
 * Stores tool state in Supabase for cross-device sync.
 * Uses doctor_tool_data table (works for all roles via RLS).
 */

type DbError = { message: string } | null

type ToolTable = {
  upsert: (row: Record<string, unknown>, options: { onConflict: string }) => Promise<{ error: DbError }>
  delete: () => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: DbError }>
    }
  }
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: { data: unknown } | null; error: DbError }>
      }
    }
  }
}

function toolTable(supabase: ReturnType<typeof createServerSupabase>): ToolTable {
  const client = supabase as unknown as { from: (table: string) => ToolTable }
  return client.from('doctor_tool_data')
}

export async function saveToolData(tool: string, data: unknown) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (typeof tool !== 'string' || tool.length < 1 || tool.length > 80) {
    return { success: false, error: 'Invalid tool' }
  }

  if (data == null) {
    const { error } = await toolTable(supabase).delete().eq('user_id', user.id).eq('tool', tool)
    if (error) {
      console.error(`[TOOL DATA] Delete failed for ${tool}:`, error)
      return { success: false, error: error.message }
    }
    return { success: true }
  }

  const { error } = await toolTable(supabase).upsert({
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

  const { data: row, error } = await toolTable(supabase)
    .select('data')
    .eq('user_id', user.id)
    .eq('tool', tool)
    .maybeSingle()

  if (error) {
    console.error(`[TOOL DATA] Load failed for ${tool}:`, error)
    return null
  }
  return row?.data || null
}
