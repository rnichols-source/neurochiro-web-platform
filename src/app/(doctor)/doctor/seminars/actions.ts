"use server";

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { stripe } from '@/lib/stripe'


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

export async function getSeminarAnalytics() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Get Gross Revenue (YTD) - Real calculation from registrations
  const currentYear = new Date().getFullYear()
  const startOfYear = `${currentYear}-01-01T00:00:00Z`
  
  const { data: registrations, error: regError } = await supabase
    .from('seminar_registrations')
    .select('amount_paid, seminar_id, seminar:seminars(host_id)')
    .eq('payment_status', 'paid')
    .gte('created_at', startOfYear)

  const userRegistrations = (registrations || []).filter((r: any) => r.seminar?.host_id === user.id)
  const grossRevenue = userRegistrations.reduce((sum: number, r: any) => sum + (Number(r.amount_paid) || 0), 0)

  // 2. Get Clinical Authority Index
  // Formula: (Num Published Seminars * 25) + (Avg Rating * 50) + (Total Attendees * 10)
  const { data: seminars, error: semError } = await supabase
    .from('seminars')
    .select('id')
    .eq('host_id', user.id)
    .eq('is_approved', true)

  const { data: doctor, error: docError } = await supabase
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

export async function updateSeminarAction(seminarId: string, formData: FormData) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const dates = formData.get('dates') as string
  const price = formData.get('price') as string
  const max_capacity = formData.get('max_capacity') as string
  const registration_link = formData.get('registration_link') as string

  const { data, error } = await supabase
    .from('seminars')
    .update({
      title,
      description,
      location,
      dates,
      registration_link,
      price: Number(price) || 0,
      max_capacity: Number(max_capacity) || 0
    })
    .eq('id', seminarId)
    .eq('host_id', user.id)
    .select()

  if (error) {
    console.error("Error updating seminar:", error)
    throw new Error("Failed to update seminar")
  }

  // Trigger geocoding on update
  try {
    await supabase.from('automation_queue').insert({
      event_type: 'geocode_seminar',
      payload: { seminarId, location }
    })
  } catch (e) {
    console.warn("Geocoding update trigger failed:", e)
  }

  revalidatePath('/doctor/seminars')
  return { success: true, seminar: data }
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
  const price = Number(formData.get('price')) || 0
  const max_capacity = Number(formData.get('max_capacity')) || null
  const tier = formData.get('tier') as string || 'basic'

  // New Fields
  const target_audience = formData.getAll('target_audience') as string[]
  const tags_input = formData.get('tags') as string
  const tags = tags_input ? tags_input.split(',').map(t => t.trim()) : []

  // 2. Determine Pricing (Check if they are a Verified Doctor)
  const { data: doctor } = await supabase
    .from('doctors')
    .select('verification_status')
    .eq('user_id', user.id)
    .single()

  const isVerified = (doctor as any)?.verification_status === 'verified';

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
      price,
      max_capacity,
      listing_tier: tier,
      target_audience: target_audience.length > 0 ? target_audience : ['Doctors', 'Students'],
      tags,
      payment_status: 'paid',
      is_approved: true, // Members auto-approved
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

  // 5. Trigger geocoding so it shows up on the map
  try {
    await supabase.from('automation_queue').insert({
      event_type: 'geocode_seminar',
      payload: { seminarId: data.id, location }
    })
  } catch (e) {
    console.warn("Geocoding queue trigger failed (non-critical):", e)
  }

  // 6. Send confirmation email to doctor
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    if (profile?.email) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY || '');
      await resend.emails.send({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: [profile.email],
        subject: `Your seminar "${title}" is live on NeuroChiro!`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1a2744;padding:28px;text-align:center;">
              <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro Seminars</h1>
              <p style="color:#e97325;font-size:16px;font-weight:bold;margin:8px 0 0;">Seminar Published!</p>
            </div>
            <div style="padding:28px;background:white;">
              <p style="font-size:15px;color:#1a2744;">Hey Dr. ${profile.full_name?.split(' ')[0] || 'there'},</p>
              <p style="color:#666;line-height:1.6;">Your seminar is now live and visible to the NeuroChiro community.</p>
              <div style="background:#f8f9fa;border-radius:10px;padding:16px;margin:20px 0;">
                <p style="margin:0;font-weight:bold;color:#1a2744;">${title}</p>
                <p style="margin:4px 0 0;color:#666;font-size:14px;">${location} &middot; ${dates}</p>
              </div>
              <div style="text-align:center;margin:24px 0;">
                <a href="https://neurochiro.co/doctor/seminars" style="display:inline-block;background:#e97325;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;">Manage Your Seminars</a>
              </div>
              <p style="color:#999;font-size:13px;">You'll be notified when people register.</p>
            </div>
          </div>
        `,
      });
    }
  } catch (emailErr) {
    console.error('Seminar confirmation email failed:', emailErr);
  }

  // 7. Discord notification
  try {
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordUrl) {
      await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `📢 **NEW SEMINAR CREATED**\n\n**Title:** ${title}\n**Host:** Dr. ${user.email?.split('@')[0] || 'Unknown'}\n**Location:** ${location}\n**Date:** ${dates}\n**Status:** Auto-approved (verified member)`,
        }),
      }).catch(() => {});
    }
  } catch {
    // Don't break flow for Discord errors
  }

  revalidatePath('/doctor/seminars')

  return {
    success: true,
    seminar: data
  }
}

export async function createSeminarCampaignAction(seminarId: string, options: { topOfFeed: boolean, studentRadar: boolean, globalPush: boolean }) {
  return { error: "Seminar promotion campaigns are coming soon. Your seminar is live in the directory." };
}

export async function getSeminarAttendees(seminarId: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Verify ownership
  const { data: seminar } = await supabase
    .from('seminars')
    .select('id')
    .eq('id', seminarId)
    .eq('host_id', user.id)
    .single()

  if (!seminar) throw new Error("Unauthorized")

  const { data, error } = await supabase
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

export async function deleteSeminarAction(seminarId: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('seminars')
    .delete()
    .eq('id', seminarId)
    .eq('host_id', user.id)

  if (error) {
    console.error("Error deleting seminar:", error)
    throw new Error("Failed to delete seminar")
  }

  revalidatePath('/doctor/seminars')
  return { success: true }
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


// Alias for the page component
export async function getSeminarRegistrants(seminarId: string) {
  const attendees = await getSeminarAttendees(seminarId);
  return attendees.map((a: any) => ({
    id: a.id,
    name: a.profile?.full_name || 'Registrant',
    email: a.profile?.email || '',
    registeredAt: a.created_at,
  }))
}
