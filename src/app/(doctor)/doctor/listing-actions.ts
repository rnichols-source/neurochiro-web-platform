'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase-server'
import {
  SELECTED_DOCTOR_COOKIE,
  selectionCookieValue,
} from '@/lib/portal/listings'
import { loadDoctorsForUser } from '@/lib/portal/selected-doctor'

export async function switchDoctorListing(doctorId: string): Promise<{ ok: boolean }> {
  const requested = doctorId.trim()
  if (!requested) return { ok: false }
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  const listings = await loadDoctorsForUser(user.id)
  if (!listings.some((row) => row.id === requested)) return { ok: false }
  const jar = await cookies()
  jar.set({
    name: SELECTED_DOCTOR_COOKIE,
    value: selectionCookieValue(user.id, requested),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 400,
  })
  revalidatePath('/doctor', 'layout')
  return { ok: true }
}
