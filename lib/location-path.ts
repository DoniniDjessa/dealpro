/** Cocody, Saint-Jean → parent puis enfants. Yopougon, Toit-Rouge, Camp militaire → grand-parent → enfant. */

export function foldPlace(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, ' ')
    .replace(/\bst[.\s-]+/g, 'saint ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseLocationPath(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  const seen = new Set<string>()
  const path: string[] = []
  for (const part of raw.split(',')) {
    const folded = foldPlace(part)
    if (!folded || seen.has(folded)) continue
    seen.add(folded)
    path.push(folded)
  }
  return path
}

export function formatLocationLabel(part: string) {
  return part
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function locationPathLabels(path: string[]) {
  return path.map(formatLocationLabel)
}

export function formatLocationDisplay(path?: string[] | null, fallback?: string | null) {
  if (path?.length) return locationPathLabels(path).join(' → ')
  return fallback?.trim() || null
}

export function locationPathHint(path: string[]) {
  if (path.length < 2) return null
  const labels = locationPathLabels(path)
  const child = labels[labels.length - 1]
  const parent = labels[labels.length - 2]
  if (path.length === 2) return `${child} est dans ${parent}`
  return `${labels.join(' → ')} (du plus large au plus précis)`
}

export const DEFAULT_CITY_SLUGS = [
  'abidjan',
  'yamoussoukro',
  'bouake',
  'san pedro',
  'korhogo',
  'daloa',
  'man',
  'gagnoa',
  'abengourou',
  'grand bassam',
]

export type ContactPlace = {
  ville: string
  commune: string | null
  quartiers: string[]
}

export function parseContactLocation(
  raw: string | null | undefined,
  citySlugs: string[] = DEFAULT_CITY_SLUGS
): ContactPlace | null {
  const parts = parseLocationPath(raw)
  if (!parts.length) return null
  const cities = new Set([...DEFAULT_CITY_SLUGS, ...citySlugs].map(foldPlace).filter(Boolean))
  const path = cities.has(parts[0]) ? parts : ['abidjan', ...parts]
  return {
    ville: path[0],
    commune: path[1] || null,
    quartiers: path.slice(2),
  }
}

export function formatContactPlace(place: ContactPlace | null, fallback?: string | null) {
  if (!place) return fallback?.trim() || null
  const hideCity = foldPlace(place.ville) === 'abidjan'
  const bits = [
    hideCity ? null : formatLocationLabel(place.ville),
    place.commune ? formatLocationLabel(place.commune) : null,
    place.quartiers.length ? place.quartiers.map(formatLocationLabel).join(' · ') : null,
  ].filter(Boolean)
  return bits.join(' - ') || (hideCity ? null : fallback?.trim() || null)
}

export function contactPlaceFromItem(item: {
  location_path?: string[] | null
  location_quartiers?: string[] | null
  localisation?: string | null
}) {
  if (item.location_path?.length) {
    return {
      ville: item.location_path[0],
      commune: item.location_path[1] || null,
      quartiers: item.location_quartiers?.length ? item.location_quartiers : item.location_path.slice(2),
    }
  }
  return parseContactLocation(item.localisation)
}

export function locationPathMatches(path: string[] | null | undefined, query: string | null | undefined) {
  const hay = path?.length ? path : parseLocationPath(query || '')
  const qPath = parseLocationPath(query || '')
  if (!qPath.length) return true
  if (!hay.length) return false
  let i = 0
  for (const part of hay) {
    if (i >= qPath.length) break
    const q = qPath[i]
    if (part.includes(q) || q.includes(part)) i += 1
  }
  if (i === qPath.length) return true
  return qPath.every((q) => hay.some((part) => part.includes(q) || q.includes(part)))
}
