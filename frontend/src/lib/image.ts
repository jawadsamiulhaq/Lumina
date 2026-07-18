const UNSPLASH_HOST = 'images.unsplash.com'

/**
 * Requests an appropriately-sized, compressed render from Unsplash's CDN instead of downloading
 * the full-resolution source photo. Non-Unsplash URLs (fallback placeholder, admin-uploaded images)
 * pass through unchanged.
 */
export function optimizeImageUrl(url: string, width: number): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }
  if (parsed.hostname !== UNSPLASH_HOST) return url

  parsed.searchParams.set('w', String(width))
  parsed.searchParams.set('q', '80')
  parsed.searchParams.set('auto', 'format')
  parsed.searchParams.set('fit', 'crop')
  return parsed.toString()
}

/** 1x/2x srcSet for a given display width. Returns undefined for non-Unsplash URLs (nothing to resize). */
export function optimizedSrcSet(url: string, width: number): string | undefined {
  if (!url.includes(UNSPLASH_HOST)) return undefined
  return `${optimizeImageUrl(url, width)} 1x, ${optimizeImageUrl(url, width * 2)} 2x`
}
