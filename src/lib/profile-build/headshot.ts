import 'server-only'

import { createAdminClient } from '@/lib/supabase-admin'
import { fetchImage } from './fetch-site.ts'

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function storeHeadshot(doctorId: string, imageUrl: string): Promise<string | null> {
  const image = await fetchImage(imageUrl)
  if (!image) return null
  const extension = EXTENSIONS[image.contentType] || 'jpg'
  const path = `${doctorId}/headshot.${extension}`
  const admin = createAdminClient()
  const uploaded = await admin.storage.from('clinic-photos').upload(path, Buffer.from(image.bytes), {
    contentType: image.contentType,
    upsert: true,
    cacheControl: '3600',
  })
  if (uploaded.error) throw new Error('Headshot upload failed')
  const { data } = admin.storage.from('clinic-photos').getPublicUrl(path)
  return data?.publicUrl || null
}
