import { tables } from '@/lib/db'
import { formatLocationLabel, parseContactLocation, type ContactPlace } from '@/lib/location-path'
import { supabase } from '@/lib/supabase'

type PlaceRow = {
  id: string
  slug: string
  name: string
  kind: 'ville' | 'commune' | 'quartier'
  parent_id: string | null
}

async function findPlace(slug: string, parentId: string | null) {
  let query = supabase.from(tables.places).select('id, slug, name, kind, parent_id').eq('slug', slug)
  query = parentId ? query.eq('parent_id', parentId) : query.is('parent_id', null)
  const { data } = await query.maybeSingle()
  return (data as PlaceRow | null) || null
}

async function ensurePlace(slug: string, kind: PlaceRow['kind'], parentId: string | null) {
  const existing = await findPlace(slug, parentId)
  if (existing) return existing
  const { data, error } = await supabase
    .from(tables.places)
    .insert({
      slug,
      name: formatLocationLabel(slug),
      kind,
      parent_id: parentId,
    })
    .select('id, slug, name, kind, parent_id')
    .single()
  if (!error && data) return data as PlaceRow
  const raced = await findPlace(slug, parentId)
  if (raced) return raced
  throw new Error(error?.message || 'Lieu non enregistré')
}

export async function fetchCitySlugs() {
  const { data } = await supabase.from(tables.places).select('slug').eq('kind', 'ville')
  return ((data || []) as { slug: string }[]).map((row) => row.slug)
}

export async function syncContactPlaces(place: ContactPlace) {
  const ville = await ensurePlace(place.ville, 'ville', null)
  let parent = ville
  if (place.commune) {
    parent = await ensurePlace(place.commune, 'commune', ville.id)
  }
  for (const quartier of place.quartiers) {
    await ensurePlace(quartier, 'quartier', parent.id)
  }
}

export async function saveContactLocation(raw: string) {
  const cities = await fetchCitySlugs()
  const place = parseContactLocation(raw, cities)
  if (!place) {
    return { localisation: raw.trim() || null, location_path: [] as string[], location_quartiers: [] as string[] }
  }
  await syncContactPlaces(place)
  return {
    localisation: raw.trim() || null,
    location_path: place.commune ? [place.ville, place.commune] : [place.ville],
    location_quartiers: place.quartiers,
  }
}
