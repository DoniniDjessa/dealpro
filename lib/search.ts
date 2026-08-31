import { locationPathLabels } from '@/lib/location-path'

export type SearchQuery = {
  text: string
  apart: boolean
  priceMin: number | null
  priceMax: number | null
  roomsMin: number | null
  roomsMax: number | null
  tags: string[]
}

export type SearchFeature = 'price' | 'budget' | 'rooms' | 'tags'

export const EMPTY_SEARCH: SearchQuery = {
  text: '',
  apart: false,
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

export function foldSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/['’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function splitSearchTerms(text: string) {
  return text
    .split(',')
    .map((term) => foldSearch(term))
    .filter(Boolean)
}

export function parseSearchGroups(text: string, apart: boolean) {
  const raw = text.trim()
  if (!raw) return [] as string[][]
  if (!apart) return [splitSearchTerms(raw.replace(/[()]/g, ' '))]
  const chunks = raw
    .split(/;|(?:\)\s*,\s*\()/)
    .map((chunk) => splitSearchTerms(chunk.replace(/[()]/g, ' ')))
    .filter((group) => group.length > 0)
  return chunks.length ? chunks : [splitSearchTerms(raw.replace(/[()]/g, ' '))]
}

export function blobMatches(blob: string, terms: string[]) {
  if (!terms.length) return true
  const hay = foldSearch(blob)
  return terms.every((term) => hay.includes(term))
}

export function textMatches(blob: string, query: Pick<SearchQuery, 'text' | 'apart'>) {
  const groups = parseSearchGroups(query.text, query.apart)
  if (!groups.length) return true
  if (query.apart) return groups.some((terms) => blobMatches(blob, terms))
  return blobMatches(blob, groups[0] ?? [])
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
  if (value == null || Number.isNaN(Number(value))) return false
  const n = Number(value)
  if (min != null && n < min) return false
  if (max != null && n > max) return false
  return true
}

function roomsBlob(rooms: number | null | undefined) {
  if (rooms == null) return ''
  return `${rooms} pieces ${rooms} piece ${rooms} pcs ${rooms}p`
}

export function matchOfferSearch(
  item: {
    title: string
    description: string | null
    raw_text: string | null
    location: string | null
    location_path?: string[] | null
    phones: string[]
    phone: string | null
    tags: string[]
    size_label: string | null
    map_label: string | null
    price: number
    rooms: number | null
    category?: string | null
    visite_text?: string | null
    extracted?: Record<string, unknown> | null
  },
  query: SearchQuery
) {
  const extras = item.extracted || {}
  const blob = [
    item.title,
    item.description,
    item.raw_text,
    item.location,
    ...(item.location_path || []),
    ...locationPathLabels(item.location_path || []),
    item.size_label,
    item.map_label,
    item.category,
    item.visite_text,
    item.phone,
    item.price ? String(item.price) : '',
    roomsBlob(item.rooms),
    extras.year != null ? String(extras.year) : '',
    extras.mileage != null ? `${extras.mileage} km` : '',
    extras.fuel != null ? String(extras.fuel) : '',
    ...(item.phones || []),
    ...(item.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
  if (!textMatches(blob, query)) return false
  if (!inRange(item.price, query.priceMin, query.priceMax)) return false
  if (query.roomsMin != null || query.roomsMax != null) {
    if (item.rooms == null) return false
    if (!inRange(item.rooms, query.roomsMin, query.roomsMax)) return false
  }
  if (query.tags.length) {
    const tags = (item.tags || []).map((tag) => foldSearch(tag))
    if (!query.tags.every((tag) => tags.some((entry) => entry.includes(foldSearch(tag))))) return false
  }
  return true
}

export function matchDemandSearch(
  item: {
    title: string
    notes: string | null
    location: string | null
    location_path?: string[] | null
    category: string
    contact?: { name?: string | null } | null
    budget_min: number | null
    budget_max: number | null
    size_min: number | null
  },
  query: SearchQuery
) {
  const blob = [
    item.title,
    item.notes,
    item.location,
    ...(item.location_path || []),
    ...locationPathLabels(item.location_path || []),
    item.category,
    item.contact?.name,
    item.budget_min != null ? String(item.budget_min) : '',
    item.budget_max != null ? String(item.budget_max) : '',
    item.size_min != null ? `${item.size_min} m ${item.size_min} pieces` : '',
  ]
    .filter(Boolean)
    .join(' ')
  if (!textMatches(blob, query)) return false
  const amountMin = item.budget_min
  const amountMax = item.budget_max
  if (query.priceMin != null || query.priceMax != null) {
    const lo = amountMin ?? amountMax
    const hi = amountMax ?? amountMin
    if (lo == null && hi == null) return false
    if (query.priceMax != null && lo != null && lo > query.priceMax) return false
    if (query.priceMin != null && hi != null && hi < query.priceMin) return false
  }
  if (query.roomsMin != null || query.roomsMax != null) {
    if (item.size_min == null) return false
    if (!inRange(item.size_min, query.roomsMin, query.roomsMax)) return false
  }
  return true
}

export type ContactFilterField = 'localisation' | 'secteur' | 'specialite'

export type ContactFilters = {
  localisation: string[]
  secteur: string[]
  specialite: string[]
}

export const EMPTY_CONTACT_FILTERS: ContactFilters = {
  localisation: [],
  secteur: [],
  specialite: [],
}

export function contactFiltersActive(filters: ContactFilters) {
  return Boolean(filters.localisation.length || filters.secteur.length || filters.specialite.length)
}

export function uniqueContactFieldValues(
  contacts: {
    localisation?: string | null
    location_path?: string[] | null
    location_quartiers?: string[] | null
    secteur?: string | null
    specialite?: string | null
  }[],
  field: ContactFilterField
) {
  const seen = new Set<string>()
  const values: string[] = []
  const add = (raw: string | null | undefined) => {
    if (!raw?.trim()) return
    for (const part of raw.split(/[,;/|]+/)) {
      const value = part.trim()
      const key = foldSearch(value)
      if (!key || seen.has(key)) continue
      seen.add(key)
      values.push(value)
    }
  }
  for (const contact of contacts) {
    if (field === 'localisation') {
      add(contact.localisation)
      locationPathLabels(contact.location_path || []).forEach(add)
      locationPathLabels(contact.location_quartiers || []).forEach(add)
    } else {
      add(contact[field])
    }
  }
  return values.sort((a, b) => a.localeCompare(b, 'fr'))
}

export function toggleContactFilterValue(selected: string[], value: string) {
  const key = foldSearch(value)
  if (!key) return selected
  if (selected.some((item) => foldSearch(item) === key)) {
    return selected.filter((item) => foldSearch(item) !== key)
  }
  return [...selected, value.trim()]
}

export function matchContactIdentity(
  item: { name: string; phone: string | null; phones?: string[] | null; tags?: string[] | null },
  text: string
) {
  const terms = foldSearch(text).split(/[\s,;]+/).filter(Boolean)
  if (!terms.length) return true
  const phones = [item.phone, ...(item.phones || [])].filter(Boolean).join(' ')
  const blob = foldSearch(`${item.name} ${phones} ${phones.replace(/\D/g, '')} ${(item.tags || []).join(' ')}`)
  return terms.every((term) => blob.includes(term) || blob.replace(/\s/g, '').includes(term.replace(/\s/g, '')))
}

export function matchContactFieldFilter(value: string | null | undefined, selected: string[]) {
  if (!selected.length) return true
  if (!value?.trim()) return false
  const hay = foldSearch(value)
  return selected.some((item) => {
    const query = foldSearch(item)
    return Boolean(query && (hay.includes(query) || query.includes(hay)))
  })
}

export function matchContactFilters(
  item: {
    localisation?: string | null
    location_path?: string[] | null
    location_quartiers?: string[] | null
    secteur?: string | null
    specialite?: string | null
  },
  filters: ContactFilters
) {
  const localisation = [
    item.localisation,
    ...(item.location_path || []),
    ...(item.location_quartiers || []),
    ...locationPathLabels(item.location_path || []),
    ...locationPathLabels(item.location_quartiers || []),
  ]
    .filter(Boolean)
    .join(' ')
  return (
    matchContactFieldFilter(localisation, filters.localisation) &&
    matchContactFieldFilter(item.secteur, filters.secteur) &&
    matchContactFieldFilter(item.specialite, filters.specialite)
  )
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
    tags?: string[] | null
  },
  text: string
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
    ...(item.tags || []),
    item.phone,
    ...(item.phones || []),
  ]
    .filter(Boolean)
    .join(' ')
  const terms = foldSearch(text).split(/[\s,;]+/).filter(Boolean)
  return blobMatches(blob, terms)
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
  return textMatches(blob, query)
}
