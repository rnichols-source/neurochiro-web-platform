'use server'

import { createServerSupabase } from "@/lib/supabase-server"

// Get all coaching sessions for the current user
export async function getCoachingSessions() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Note: coaching_sessions table must be created in Supabase before this works.
  // Using `as any` until the generated types are regenerated to include this table.
  const { data } = await (supabase as any)
    .from('coaching_sessions')
    .select('*')
    .eq('doctor_id', user.id)
    .order('session_date', { ascending: false })

  return data || []
}

// Upload audio file to Supabase Storage
export async function uploadCoachingAudio(formData: FormData) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('audio') as File
  const sessionDate = formData.get('sessionDate') as string
  const notes = formData.get('notes') as string
  const transcript = formData.get('transcript') as string
  const actionItems = formData.get('actionItems') as string

  if (!file) return { error: 'No audio file provided' }

  // Upload to Supabase Storage
  const fileName = `${user.id}/${Date.now()}_${file.name}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('coaching-audio')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) return { error: 'Failed to upload audio: ' + uploadError.message }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('coaching-audio')
    .getPublicUrl(fileName)

  // Save session record
  const { error: dbError } = await (supabase as any)
    .from('coaching_sessions')
    .insert({
      doctor_id: user.id,
      session_date: sessionDate || new Date().toISOString().split('T')[0],
      audio_url: urlData.publicUrl,
      audio_filename: file.name,
      notes: notes || '',
      transcript: transcript || '',
      action_items: actionItems || '',
      status: 'complete',
    })

  if (dbError) return { error: 'Failed to save session: ' + dbError.message }

  return { success: true, url: urlData.publicUrl }
}

// Update a coaching session (add transcript, notes, action items)
export async function updateCoachingSession(id: string, updates: Record<string, unknown>) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await (supabase as any)
    .from('coaching_sessions')
    .update(updates)
    .eq('id', id)
    .eq('doctor_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

// Delete a coaching session
export async function deleteCoachingSession(id: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await (supabase as any)
    .from('coaching_sessions')
    .delete()
    .eq('id', id)
    .eq('doctor_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}
