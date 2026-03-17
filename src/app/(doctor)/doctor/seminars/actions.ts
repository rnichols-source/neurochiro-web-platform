"use server";

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { onSeminarHostedAction } from '@/app/actions/automations'
import { stripe, PLANS } from '@/lib/stripe'

export async function getDoctorSeminars() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await (supabase as any)
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

export async function getSeminarAnalytics() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Get Gross Revenue (YTD) - Real calculation from registrations
  const currentYear = new Date().getFullYear()
  const startOfYear = `${currentYear}-01-01T00:00:00Z`
  
  const { data: registrations, error: regError } = await (supabase as any)
    .from('seminar_registrations')
    .select('amount_paid, seminar_id, seminar:seminars(host_id)')
    .eq('payment_status', 'paid')
    .gte('created_at', startOfYear)

  const userRegistrations = (registrations || []).filter((r: any) => r.seminar?.host_id === user.id)
  const grossRevenue = userRegistrations.reduce((sum: number, r: any) => sum + (Number(r.amount_paid) || 0), 0)

  // 2. Get Clinical Authority Index
  // Formula: (Num Published Seminars * 25) + (Avg Rating * 50) + (Total Attendees * 10)
  const { data: seminars, error: semError } = await (supabase as any)
    .from('seminars')
    .select('id')
    .eq('host_id', user.id)
    .eq('is_approved', true)

  const { data: doctor, error: docError } = await (supabase as any)
    .from('doctors')
    .select('rating')
    .eq('user_id', user.id)
    .single()

  const numSeminars = seminars?.length || 0
  const avgRating = doctor?.rating || 5.0
  const totalAttendees = userRegistrations.length
  
  const authorityIndex = Math.round((numSeminars * 25) + (avgRating * 50) + (totalAttendees * 10))

  return {
    grossRevenue,
    authorityIndex,
    avgRating,
    totalAttendees
  }
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
  const { data: doctor } = await (supabase as any)
    .from('doctors')
    .select('is_verified')
    .eq('user_id', user.id)
    .single()

  const isVerified = (doctor as any)?.is_verified || false

  // 3. Extract city/country from simple location input
  const locParts = location.split(',').map(s => s.trim())
  const city = locParts[0] || ''
  const country = locParts[1] || ''

  // 4. Save to Database
  const { data, error } = await (supabase as any)
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

  revalidatePath('/doctor/seminars')

  return { 
    success: true, 
    seminar: data
  }
}

export async function createSeminarCampaignAction(seminarId: string, options: { topOfFeed: boolean, studentRadar: boolean, globalPush: boolean }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'
  
  // Calculate pricing based on selected options
  const lineItems: any[] = []

  if (options.topOfFeed) {
    lineItems.push({
      price: PLANS.SEMINAR_PROMO_TOP.id,
      quantity: 1
    })
  }

  if (options.studentRadar) {
    // Mocking price if not in PLANS yet, in production these would be real product IDs
    lineItems.push({
      price: 'price_seminar_student_radar',
      quantity: 1
    })
  }

  if (options.globalPush) {
    lineItems.push({
      price: 'price_seminar_global_push',
      quantity: 1
    })
  }

  if (lineItems.length === 0) throw new Error("No promotion options selected")

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${siteUrl}/doctor/seminars?payment_success=true&seminar_id=${seminarId}`,
    cancel_url: `${siteUrl}/doctor/seminars?payment_cancelled=true`,
    metadata: {
      userId: user.id,
      seminarId: seminarId,
      type: 'seminar_boost',
      options: JSON.stringify(options)
    }
  })

  return { sessionId: session.id, url: session.url }
}

export async function getSeminarAttendees(seminarId: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Verify ownership
  const { data: seminar } = await (supabase as any)
    .from('seminars')
    .select('id')
    .eq('id', seminarId)
    .eq('host_id', user.id)
    .single()

  if (!seminar) throw new Error("Unauthorized")

  const { data, error } = await (supabase as any)
    .from('seminar_registrations')
    .select(`
      id,
      amount_paid,
      created_at,
      profile:profiles(full_name, email, role)
    `)
    .eq('seminar_id', seminarId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching attendees:", error)
    return []
  }

  return data
}

export async function exportAttendeesToCSV(seminarId: string) {
  const attendees = await getSeminarAttendees(seminarId)
  if (attendees.length === 0) return ""

  const header = "Name,Email,Role,Paid,Date\n"
  const rows = attendees.map((a: any) => 
    `"${a.profile?.full_name}","${a.profile?.email}","${a.profile?.role}",$${a.amount_paid},"${new Date(a.created_at).toLocaleDateString()}"`
  ).join("\n")

  return header + rows
}
