import 'server-only'

import { isMissingTable } from '@/lib/leads/schema'
import { profileDb } from './db.ts'

export async function enqueueProfileBuild(input: {
  doctorId: string
  applicationId: string
  websiteUrl: string
}): Promise<void> {
  if (!input.doctorId) return
  try {
    const admin = profileDb()
    const open = await admin
      .from('profile_build_jobs')
      .select('id')
      .eq('doctor_id', input.doctorId)
      .in('status', ['pending', 'processing'])
      .limit(1)
    if (open.error) {
      if (isMissingTable(open.error)) {
        console.error('[profile-build] profile_build_jobs is missing. Apply the migration before research can run.')
        return
      }
      console.error('[profile-build] enqueue lookup failed')
      return
    }
    if (Array.isArray(open.data) && open.data.length > 0) return
    const inserted = await admin.from('profile_build_jobs').insert({
      doctor_id: input.doctorId,
      application_id: input.applicationId || null,
      website_url: input.websiteUrl || null,
      status: 'pending',
    })
    if (inserted.error && inserted.error.code !== '23505' && !isMissingTable(inserted.error)) {
      console.error('[profile-build] enqueue failed')
    }
  } catch (error) {
    console.error('[profile-build] enqueue failed', error instanceof Error ? error.name : 'error')
  }
}
