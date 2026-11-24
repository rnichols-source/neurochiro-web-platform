/**
 * Profile photos are posted through Next.js server actions.
 * Those requests are rejected at 1 MB before the action runs
 * (`experimental.serverActions.bodySizeLimit` is unset, so the framework
 * default applies). A multi-megabyte phone headshot never reaches
 * Supabase, and the team editor used to ignore that failure.
 * Shrink the file in the browser first.
 */

export const PROFILE_IMAGE_MAX_EDGE = 1200
export const PROFILE_IMAGE_MAX_BYTES = 500 * 1024
/** Undecodable files (HEIC in most browsers) must fit under the 1 MB action limit, including multipart overhead. */
export const SERVER_ACTION_PASSTHROUGH_MAX_BYTES = 800 * 1024
export const PROFILE_IMAGE_EDGE_STEPS = [1200, 960, 800, 640] as const
export const PROFILE_IMAGE_QUALITIES = [0.82, 0.7, 0.55, 0.4] as const
export const PROFILE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'

const PASSTHROUGH_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type EncodingAttempt = { width: number; height: number; quality: number }

export function fitLongEdge(width: number, height: number, maxEdge: number): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Invalid image dimensions')
  }
  const longEdge = Math.max(width, height)
  if (longEdge <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) }
  }
  const scale = maxEdge / longEdge
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export function encodingAttempts(sourceWidth: number, sourceHeight: number): EncodingAttempt[] {
  const attempts: EncodingAttempt[] = []
  const seen = new Set<string>()
  for (const edge of PROFILE_IMAGE_EDGE_STEPS) {
    const size = fitLongEdge(sourceWidth, sourceHeight, edge)
    const key = `${size.width}x${size.height}`
    if (seen.has(key)) continue
    seen.add(key)
    for (const quality of PROFILE_IMAGE_QUALITIES) {
      attempts.push({ width: size.width, height: size.height, quality })
    }
  }
  return attempts
}

export function isHeicFile(file: { type?: string; name?: string }): boolean {
  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  return type === 'image/heic' || type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif')
}

export function canSkipReencode(
  file: { type?: string; size: number },
  width: number,
  height: number,
): boolean {
  const type = (file.type || '').toLowerCase()
  return PASSTHROUGH_TYPES.has(type)
    && file.size > 0
    && file.size <= PROFILE_IMAGE_MAX_BYTES
    && Math.max(width, height) <= PROFILE_IMAGE_MAX_EDGE
}

export function profileUploadErrorMessage(error: unknown): string {
  const raw = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : ''
  if (/body exceeded|request entity too large|\b413\b/i.test(raw)) {
    return 'This photo is too large to upload. It was not saved. Choose a smaller image and try again.'
  }
  const cleaned = raw.replace(/^System Error:\s*/i, '').trim()
  if (cleaned && cleaned.length <= 180 && !/unexpected response was received/i.test(cleaned)) {
    return cleaned
  }
  return 'Photo upload failed. The picture was not saved. Please try again.'
}

type DecodedImage = {
  source: CanvasImageSource
  width: number
  height: number
  close: () => void
}

function outputName(original: string, mime: 'image/webp' | 'image/jpeg'): string {
  const ext = mime === 'image/webp' ? 'webp' : 'jpg'
  const base = original.replace(/\.[^.]+$/, '').trim() || 'photo'
  return `${base}.${ext}`
}

function blobFrom(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality)
  })
}

async function outputMime(): Promise<'image/webp' | 'image/jpeg'> {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const blob = await blobFrom(canvas, 'image/webp', 0.8)
  return blob?.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
}

function render(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare this photo in this browser.')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0, width, height)
  return canvas
}

async function decodeFile(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not read this photo.'))
      img.src = url
    })
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

export async function prepareProfileImage(file: File): Promise<File> {
  if (typeof document === 'undefined') {
    throw new Error('Photo preparation has to run in the browser.')
  }
  if (!file || file.size <= 0) {
    throw new Error('Please choose a photo to upload.')
  }

  let decoded: DecodedImage
  try {
    decoded = await decodeFile(file)
  } catch {
    if (isHeicFile(file) && file.size <= SERVER_ACTION_PASSTHROUGH_MAX_BYTES) return file
    if (isHeicFile(file)) {
      throw new Error('This HEIC photo is too large to upload. Export it as a JPEG and try again.')
    }
    throw new Error("Couldn't read this photo. Try a JPEG or PNG.")
  }

  try {
    if (decoded.width <= 0 || decoded.height <= 0) {
      throw new Error("Couldn't read this photo. Try a JPEG or PNG.")
    }
    if (canSkipReencode(file, decoded.width, decoded.height)) return file

    const mime = await outputMime()
    const attempts = encodingAttempts(decoded.width, decoded.height)
    let canvas: HTMLCanvasElement | null = null
    let canvasKey = ''
    for (const attempt of attempts) {
      const key = `${attempt.width}x${attempt.height}`
      if (key !== canvasKey) {
        canvas = render(decoded.source, attempt.width, attempt.height)
        canvasKey = key
      }
      const blob = await blobFrom(canvas!, mime, attempt.quality)
      if (blob && blob.size > 0 && blob.size <= PROFILE_IMAGE_MAX_BYTES) {
        return new File([blob], outputName(file.name, mime), { type: mime })
      }
    }
    throw new Error('This photo is still too large after compression. Try a different image.')
  } finally {
    decoded.close()
  }
}

type PhotoUploadResult = { success?: boolean; publicUrl?: string; error?: string }

export async function uploadPreparedProfileImage(
  file: File,
  upload: (formData: FormData) => Promise<PhotoUploadResult>,
): Promise<string> {
  let prepared: File
  try {
    prepared = await prepareProfileImage(file)
  } catch (error) {
    throw new Error(profileUploadErrorMessage(error))
  }

  const formData = new FormData()
  formData.append('file', prepared)

  let result: PhotoUploadResult
  try {
    result = await upload(formData)
  } catch (error) {
    throw new Error(profileUploadErrorMessage(error))
  }

  if (result?.success && result.publicUrl) return result.publicUrl
  throw new Error(profileUploadErrorMessage(result?.error || 'Photo upload failed.'))
}
