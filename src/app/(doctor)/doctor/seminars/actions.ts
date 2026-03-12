'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { onSeminarHostedAction } from '@/app/actions/automations'

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

  // 1. Get the data from the form
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const dates = formData.get('dates') as string
  const registration_link = formData.get('registration_link') as string
  const tier = formData.get('tier') as string || 'basic'

  // New Fields
  const target_audience = formData.getAll('target_audience') as string[]
  const tags_input = formData.get('tags') as string
  const tags = tags_input ? tags_input.split(',').map(t => t.trim()) : []

  // 2. Determine Pricing (Check if they are a Verified Doctor)
  const { data: doctor } = await supabase
    .from('doctors')
    .select('is_verified')
    .eq('id', user.id)
    .single()

  const isVerified = doctor?.is_verified || false

  // Pricing Logic
  let amount = isVerified ? 49 : 99; // Basic
  if (tier === 'featured') amount = isVerified ? 149 : 249;
  if (tier === 'premium') amount = isVerified ? 399 : 599;

  // 3. Extract city/country from simple location input
  const locParts = location.split(',').map(s => s.trim())
  const city = locParts[0] || ''
  const country = locParts[1] || ''

  // 4. Save to Database
  const { data, error } = await supabase
    .from('seminars')
    .insert({
      host_id: user.id,
      title,
      description,
      location,
      city,
      country,
      dates,
      registration_link,
      listing_tier: tier,
      target_audience: target_audience.length > 0 ? target_audience : ['Doctors', 'Students'],
      tags,
      payment_status: 'pending', 
      is_approved: false, // ALWAYS false until Admin reviews
      host_type_at_submission: isVerified ? 'doctor' : 'external',
      latitude: 0,
      longitude: 0
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating seminar:", error)
    throw new Error("Failed to create seminar")
  }

  // Trigger Automation (Notify Admin)
  await onSeminarHostedAction(user.id, {
    title,
    location,
    dates,
    tier,
    amount
  })

  revalidatePath('/doctor/seminars')

  return { 
    success: true, 
    seminar: data,
    amount,
    checkoutUrl: `/payment-success?type=seminar&tier=${tier}` 
  }
}
