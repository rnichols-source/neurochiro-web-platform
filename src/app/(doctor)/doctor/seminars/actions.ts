'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getDoctorSeminars() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('seminars')
    .select(`
      *,
      registrations:seminar_registrations(count)
    `)
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching doctor seminars:", error)
    return []
  }

  return data
}

export async function createSeminarAction(formData: FormData) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const dates = formData.get('dates') as string
  const price = parseFloat(formData.get('price') as string || '0')
  const categories = formData.get('categories')?.toString().split(',').map((c: string) => c.trim()) || []

  const { data, error } = await supabase
    .from('seminars')
    .insert({
      host_id: user.id,
      title,
      description,
      location,
      dates,
      price,
      categories,
      is_approved: false, // Default to false for admin review
      tier: 'Standard'
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating seminar:", error)
    throw new Error("Failed to create seminar")
  }

  revalidatePath('/doctor/seminars')
  revalidatePath('/seminars')
  return { success: true, seminar: data }
}
