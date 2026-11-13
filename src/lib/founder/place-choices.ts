export type PlaceHit = {
  label: string
  query: string
  country: string
  importance: number
  lat?: number
  lng?: number
  city?: string
  state?: string
}

/**
 * A bare city name that hits a small US place and a major city abroad
 * (Sydney, London, Toronto) should be a pick list, not a silent US match.
 */
export function ambiguousPlaceChoices(hits: PlaceHit[]): PlaceHit[] | null {
  const best = new Map<string, PlaceHit>()
  for (const hit of hits) {
    const country = (hit.country || '').toUpperCase() || 'US'
    const next = { ...hit, country }
    const prior = best.get(country)
    if (!prior || next.importance > prior.importance) best.set(country, next)
  }
  const list = [...best.values()]
  const us = list.filter((hit) => hit.country === 'US')
  const abroad = list.filter((hit) => hit.country !== 'US' && hit.importance >= 0.5)
  if (!us.length || !abroad.length) return null
  return [...abroad, ...us].sort((a, b) => b.importance - a.importance || a.label.localeCompare(b.label)).slice(0, 4)
}
