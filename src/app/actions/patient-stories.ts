'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function submitPatientStory(doctorId: string, data: {
  patientFirstName: string;
  conditionBefore: string;
  outcomeAfter: string;
  storyText: string;
}) {
  const supabase = createServerSupabase()

  const { error } = await supabase
    .from('patient_stories')
    .insert({
      doctor_id: doctorId,
      patient_first_name: data.patientFirstName,
      condition_before: data.conditionBefore,
      outcome_after: data.outcomeAfter,
      story_text: data.storyText,
      approved: false
    })

  if (error) {
    console.error("Error submitting patient story:", error)
    return { error: "Failed to submit story. Please try again." }
  }

  return { success: true }
}

export async function getApprovedStories(doctorId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('patient_stories')
    .select('id, patient_first_name, condition_before, outcome_after, story_text, created_at')
    .eq('doctor_id', doctorId)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error("Error fetching patient stories:", error)
    return []
  }

  return data || []
}

export async function getPendingStories() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('patient_stories')
    .select('*')
    .eq('approved', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching pending stories:", error)
    return []
  }

  // Enrich with doctor names
  if (data && data.length > 0) {
    const doctorIds = [...new Set(data.map(s => s.doctor_id))]
    const { data: doctors } = await supabase
      .from('doctors')
      .select('id, first_name, last_name, clinic_name')
      .in('id', doctorIds)

    const doctorMap = new Map((doctors || []).map(d => [d.id, d]))

    return data.map(s => ({
      ...s,
      doctor: doctorMap.get(s.doctor_id) || null
    }))
  }

  return data || []
}

export async function approvePatientStory(storyId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('patient_stories')
    .update({ approved: true })
    .eq('id', storyId)

  if (error) throw new Error("Failed to approve story")

  // Notify the doctor that a story was published on their profile
  const { data: story } = await supabase
    .from('patient_stories')
    .select('doctor_id, patient_first_name')
    .eq('id', storyId)
    .single();

  if (story) {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('user_id, slug')
      .eq('id', story.doctor_id)
      .single();

    if (doctor?.user_id) {
      await supabase.from('notifications').insert({
        user_id: doctor.user_id,
        title: 'New Patient Story Published',
        body: `A transformation story from ${story.patient_first_name} has been approved and is now visible on your profile.`,
        type: 'system',
        priority: 'info',
        link: doctor.slug ? `/directory/${doctor.slug}` : '/doctor/dashboard'
      });
    }
  }

  revalidatePath('/admin/moderation')
  return { success: true }
}

export async function rejectPatientStory(storyId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('patient_stories')
    .delete()
    .eq('id', storyId)

  if (error) throw new Error("Failed to reject story")

  revalidatePath('/admin/moderation')
  return { success: true }
}
