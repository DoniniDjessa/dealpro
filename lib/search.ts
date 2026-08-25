export type SearchQuery = {
  text: string
  priceMin: number | null
  priceMax: number | null
  roomsMin: number | null
  roomsMax: number | null
  tags: string[]
}

export type SearchFeature = 'price' | 'budget' | 'rooms' | 'tags'

export const EMPTY_SEARCH: SearchQuery = {
  text: '',
  priceMin: null,
  priceMax: null,
  roomsMin: null,
  roomsMax: null,
  tags: [],
}

export const POPULAR_TAGS = ['titré', 'moderne', 'neuf', 'villa', 'duplex', 'urgent', 'négociable', 'sécurisé']

export const PRICE_PRESETS: { label: string; min: number | null; max: number | null }[] = [
  { label: '0–1M', min: 0, max: 1_000_000 },
  { label: '1–5M', min: 1_000_000, max: 5_000_000 },
  { label: '5–10M', min: 5_000_000, max: 10_000_000 },
  { label: '10–20M', min: 10_000_000, max: 20_000_000 },
  { label: '20–50M', min: 20_000_000, max: 50_000_000 },
  { label: '50M+', min: 50_000_000, max: null },
]

export function splitSearchTerms(text: string) {
  return text
    .split(',')
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean)
}

export function blobMatches(blob: string, terms: string[]) {
  if (!terms.length) return true
  const hay = blob.toLowerCase()
  return terms.every((term) => hay.includes(term))
}

export function searchHasExtras(query: SearchQuery) {
  return (
    query.priceMin != null ||
    query.priceMax != null ||
    query.roomsMin != null ||
    query.roomsMax != null ||
    query.tags.length > 0
  )
}

export function searchIsActive(query: SearchQuery) {
  return Boolean(query.text.trim()) || searchHasExtras(query)
}

function inRange(value: number | null | undefined, min: number | null, max: number | null) {
  if (min == null && max == null) return true
  const n = Number(value || 0)
  if (min != null && n < min) return false
  if (max != null && n > max) return false
  return true
}

export function matchOfferSearch(
  item: {
    title: string
    description: string | null
    raw_text: string | null
    location: string | null
    phones: string[]
    phone: string | null
    tags: string[]
    size_label: string | null
    map_label: string | null
    price: number
    rooms: number | null
  },
  query: SearchQuery
) {
  const blob = [
    item.title,
    item.description,
    item.raw_text,
    item.location,
    item.size_label,
    item.map_label,
    item.phone,
    ...(item.phones || []),
    ...(item.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
  if (!blobMatches(blob, splitSearchTerms(query.text))) return false
  if (!inRange(item.price, query.priceMin, query.priceMax)) return false
  if (query.roomsMin != null || query.roomsMax != null) {
    if (item.rooms == null) return false
    if (!inRange(item.rooms, query.roomsMin, query.roomsMax)) return false
  }
  if (query.tags.length) {
    const tags = (item.tags || []).map((tag) => tag.toLowerCase())
    if (!query.tags.every((tag) => tags.some((entry) => entry.includes(tag.toLowerCase())))) return false
  }
  return true
}

export function matchDemandSearch(
  item: {
    title: string
    notes: string | null
    location: string | null
    category: string
    contact?: { name?: string | null } | null
    budget_min: number | null
    budget_max: number | null
    size_min: number | null
  },
  query: SearchQuery
) {
  const blob = [item.title, item.notes, item.location, item.category, item.contact?.name]
    .filter(Boolean)
    .join(' ')
  if (!blobMatches(blob, splitSearchTerms(query.text))) return false
  const amount = item.budget_max || item.budget_min
  if ((query.priceMin != null || query.priceMax != null) && amount == null) return false
  if (!inRange(amount, query.priceMin, query.priceMax)) return false
  if (query.roomsMin != null || query.roomsMax != null) {
    if (item.size_min == null) return false
    if (!inRange(item.size_min, query.roomsMin, query.roomsMax)) return false
  }
  return true
}

export function matchContactSearch(
  item: {
    name: string
    phone: string | null
    phones: string[]
    localisation: string | null
    secteur: string | null
    specialite: string | null
    notes: string | null
    whatsapp: string | null
    facebook: string | null
    instagram: string | null
    tiktok: string | null
  },
  query: SearchQuery
) {
  const blob = [
    item.name,
    item.secteur,
    item.specialite,
    item.localisation,
    item.notes,
    item.whatsapp,
    item.facebook,
    item.instagram,
    item.tiktok,
    item.phone,
    ...(item.phones || []),
  ]
    .filter(Boolean)
    .join(' ')
  return blobMatches(blob, splitSearchTerms(query.text))
}

export function matchAppointmentSearch(
  item: {
    title: string
    place: string | null
    notes: string | null
    kind: string
    contact?: { name?: string | null } | null
  },
  query: SearchQuery
) {
  const blob = [item.title, item.place, item.notes, item.kind, item.contact?.name].filter(Boolean).join(' ')
  return blobMatches(blob, splitSearchTerms(query.text))
}
