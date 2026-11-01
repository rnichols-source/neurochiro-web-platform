const NEXT_IMAGE_HOSTS = new Set([
  'vpxuzoqsnshvgtukvsqy.supabase.co',
  'gddapefwrmucimpdhjrz.supabase.co',
  'images.unsplash.com',
  'lh3.googleusercontent.com',
  'img.youtube.com',
  'cdn.shopify.com',
])

/** True when next.config.ts allows this URL through next/image. */
export function canUseNextImage(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || !NEXT_IMAGE_HOSTS.has(parsed.hostname)) return false
    if (parsed.hostname.endsWith('.supabase.co')) {
      return parsed.pathname.startsWith('/storage/v1/object/public/')
    }
    return true
  } catch {
    return false
  }
}
