import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'

/** Ten-minute signed URL for a student-resumes/ path. Other URLs are returned unchanged. */
export async function signStudentResume(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  if (!url.startsWith('student-resumes/')) return url
  const objectPath = url.slice('student-resumes/'.length)
  if (!objectPath) return null
  const admin = createAdminClient()
  const signed = await admin.storage.from('student-resumes').createSignedUrl(objectPath, 60 * 10)
  return signed.data?.signedUrl || null
}
