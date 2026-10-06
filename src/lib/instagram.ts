/**
 * Shared Instagram handle extraction.
 * Use this everywhere. Do not parse instagram_url inline anywhere else.
 */

export function extractInstagramHandle(instagramUrl: string | null | undefined): string | null {
  if (!instagramUrl || instagramUrl.trim() === '') return null
  const url = instagramUrl.trim()

  // Match instagram.com or instagr.am URLs
  const match = url.match(/(?:instagram\.com|instagr\.am)\/([^/?#]+)/)
  if (!match) return null

  const handle = match[1].replace(/\/$/, '').trim()
  if (!handle || handle === 'p' || handle === 'reel' || handle === 'stories') return null

  return '@' + handle
}
