/**
 * Profile photos go straight from the browser to Supabase Storage with a
 * signed upload URL. Only the storage path goes through a server action, so
 * a big phone photo can never hit the 1 MB server action body limit again.
 */

export type ProfileImageKind = 'avatar' | 'banner' | 'gallery' | 'team'

export const PROFILE_IMAGE_KINDS: readonly ProfileImageKind[] = ['avatar', 'banner', 'gallery', 'team']

/** Largest file we accept after the browser has shrunk it. */
export const PROFILE_IMAGE_MAX_BYTES = 8 * 1024 * 1024

/** Larger originals are still accepted because the browser shrinks them first. */
export const PROFILE_IMAGE_MAX_ORIGINAL_BYTES = 40 * 1024 * 1024

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

export function isProfileImageKind(value: unknown): value is ProfileImageKind {
  return typeof value === 'string' && (PROFILE_IMAGE_KINDS as readonly string[]).includes(value)
}

export function isHeicName(name: string, type: string): boolean {
  const lower = (name || '').toLowerCase()
  return type === 'image/heic' || type === 'image/heif' || lower.endsWith('.heic') || lower.endsWith('.heif')
}

/** File extension for an accepted image, or null when the type is not allowed. */
export function profileImageExt(name: string, type: string): string | null {
  const byType = EXT_BY_TYPE[(type || '').toLowerCase()]
  if (byType) return byType
  if (isHeicName(name, type)) return (name || '').toLowerCase().endsWith('.heif') ? 'heif' : 'heic'
  const ext = (name || '').split('.').pop()?.toLowerCase() || ''
  if (ext === 'jpeg' || ext === 'jpg') return 'jpg'
  if (ext === 'png' || ext === 'webp') return ext
  return null
}

export function contentTypeForExt(ext: string): string {
  if (ext === 'jpg') return 'image/jpeg'
  if (ext === 'heic' || ext === 'heif') return `image/${ext}`
  return `image/${ext}`
}

/** Same folders the old upload actions used, so existing URLs keep their shape. */
export function profileImagePath(input: { userId: string; kind: ProfileImageKind; ext: string; now: number; nonce: string }): string {
  const name = `${input.now}-${input.nonce}.${input.ext}`
  return input.kind === 'avatar' ? `${input.userId}/${name}` : `${input.userId}/${input.kind}/${name}`
}

/** A finish call may only touch a file inside the signed-in doctor's own folder for that kind. */
export function pathBelongsTo(path: string, userId: string, kind: ProfileImageKind): boolean {
  if (!path || !userId || path.includes('..') || path.includes('//')) return false
  const parts = path.split('/')
  if (parts[0] !== userId) return false
  if (kind === 'avatar') return parts.length === 2 && /^[\w.-]+$/.test(parts[1])
  return parts.length === 3 && parts[1] === kind && /^[\w.-]+$/.test(parts[2])
}

export function megabytes(bytes: number): string {
  return `${Math.max(0.1, Math.round((bytes / (1024 * 1024)) * 10) / 10)} MB`
}

export function tooLargeMessage(bytes: number): string {
  return `That photo is too large to upload (${megabytes(bytes)}). Please choose a photo under ${megabytes(PROFILE_IMAGE_MAX_BYTES)}, or take a screenshot of it and upload that.`
}

/** Plain words for a failed upload or save, including the 413 a too-big request gets. */
export function friendlyUploadError(err: unknown, fallback: string): string {
  const text = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  if (/body exceeded|413|payload too large|entity too large/i.test(text)) {
    return 'That was too large to send. Please use a smaller photo and try again.'
  }
  if (/failed to fetch|network|load failed/i.test(text)) {
    return 'We could not reach NeuroChiro. Check your connection and try again.'
  }
  return fallback
}
