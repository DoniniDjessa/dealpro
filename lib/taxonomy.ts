import type { Category, Pipeline, Verification } from '@/lib/types'
import type { FlatIconName } from '@/components/FlatIcon'
import { formatLocationDisplay } from '@/lib/location-path'

export const CATEGORIES: { id: Category; label: string; emoji: string; icon: FlatIconName }[] = [
  { id: 'immobilier', label: 'Immobilier', emoji: '🏠', icon: 'house' },
  { id: 'residences', label: 'Résidences', emoji: '🏢', icon: 'building' },
  { id: 'terrains', label: 'Terrains', emoji: '🌿', icon: 'land' },
  { id: 'auto', label: 'Auto', emoji: '🚗', icon: 'car' },
  { id: 'opportunite', label: 'Opportunités', emoji: '💎', icon: 'tag' },
]

const ALIASES: Record<string, Category> = {
  automobile: 'auto',
  agriculture: 'opportunite',
  btp: 'opportunite',
  industrie: 'opportunite',
  commerce: 'opportunite',
  b2b: 'opportunite',
}

export function normalizeCategory(id: Category | string | null | undefined): Category {
  const raw = String(id || '').toLowerCase()
  if (CATEGORIES.some((item) => item.id === raw)) return raw as Category
  return ALIASES[raw] ?? 'immobilier'
}

export function categoryMeta(id: Category | string | null | undefined) {
  const canon = normalizeCategory(id)
  return CATEGORIES.find((item) => item.id === canon) ?? CATEGORIES[0]
}

export function categoryMatches(itemCategory: string | null | undefined, filter: Category | null) {
  if (!filter) return true
  return normalizeCategory(itemCategory) === filter
}

export const VERIFICATION_META: Record<Verification, { label: string; color: string }> = {
  unverified: { label: 'Non vérifiée', color: '#DC2626' },
  phone_ok: { label: 'À vérifier', color: '#F97316' },
  verified: { label: 'Vérifiée', color: '#16A34A' },
  exclusive: { label: 'Exclusive', color: '#064E3B' },
}

export const PIPELINE_META: Record<Pipeline, { label: string }> = {
  captured: { label: 'Capturée' },
  contacting: { label: 'Contact en cours' },
  visit: { label: 'Visite' },
  negotiation: { label: 'Négociation' },
  closing: { label: 'Closing' },
  won: { label: 'Conclue' },
  lost: { label: 'Perdue' },
}

export const OPEN_PIPELINES: Pipeline[] = [
  'captured',
  'contacting',
  'visit',
  'negotiation',
  'closing',
]

export const FUEL_OPTIONS = [
  { id: 'essence', label: 'Essence' },
  { id: 'diesel', label: 'Diesel' },
  { id: 'hybride', label: 'Hybride' },
  { id: 'electrique', label: 'Électrique' },
] as const

export function offerFormSpec(category: Category | string | null | undefined) {
  const id = normalizeCategory(category)
  const base = {
    rooms: false,
    size: false,
    visite: false,
    vehicle: false,
    title: 'TITRE',
    titlePlaceholder: 'Généré depuis la description si vide',
    pricePlaceholder: '40 millions, 40 m, 500 milles…',
    locationPlaceholder: 'Cocody, Saint-Jean',
    sizeLabel: 'SUPERFICIE',
    sizePlaceholder: '1500 m²',
    roomsLabel: 'NB PIÈCES',
    demandSize: 'Pièces min' as string | null,
    demandSizePlaceholder: '3',
  }
  if (id === 'auto') {
    return {
      ...base,
      vehicle: true,
      title: 'MARQUE / MODÈLE',
      titlePlaceholder: 'Toyota Corolla…',
      pricePlaceholder: '8 millions, 8 m, 3500 milles…',
      locationPlaceholder: 'Cocody, Plateau…',
      demandSize: 'Année min',
      demandSizePlaceholder: '2018',
    }
  }
  if (id === 'terrains') {
    return {
      ...base,
      size: true,
      visite: true,
      titlePlaceholder: 'Terrain Bingerville 1500 m²',
      pricePlaceholder: '40 millions, 40 m…',
      locationPlaceholder: 'Bingerville, Songon…',
      demandSize: 'Superficie min (m²)',
      demandSizePlaceholder: '1000',
    }
  }
  if (id === 'opportunite') {
    return {
      ...base,
      titlePlaceholder: 'Opportunité commerce, stock…',
      pricePlaceholder: '5 millions, 5 m…',
      locationPlaceholder: 'Zone, ville…',
      demandSize: null,
      demandSizePlaceholder: '',
    }
  }
  if (id === 'residences') {
    return {
      ...base,
      rooms: true,
      size: true,
      visite: true,
      titlePlaceholder: 'Appartement 3 pièces Angré',
      pricePlaceholder: '25 millions, 25 m…',
      locationPlaceholder: 'Angré, Riviera…',
      sizePlaceholder: '90 m²',
    }
  }
  return {
    ...base,
    rooms: true,
    size: true,
    visite: true,
    titlePlaceholder: 'Villa 4 pièces Cocody',
  }
}

export function offerExtras(extracted: Record<string, unknown> | null | undefined) {
  const e = extracted || {}
  const year = Number(e.year)
  const mileage = Number(e.mileage)
  return {
    year: Number.isFinite(year) && year >= 1990 ? year : null,
    mileage: Number.isFinite(mileage) && mileage > 0 ? mileage : null,
    fuel: typeof e.fuel === 'string' && e.fuel ? e.fuel : null,
  }
}

export function offerSubtitle(item: {
  category?: string | null
  location: string | null
  location_path?: string[] | null
  rooms: number | null
  size_label: string | null
  extracted?: Record<string, unknown> | null
}) {
  const cat = normalizeCategory(item.category)
  const extras = offerExtras(item.extracted)
  const loc = formatLocationDisplay(item.location_path, item.location)
  if (cat === 'auto') {
    return (
      [
        loc,
        extras.year,
        extras.mileage ? `${extras.mileage.toLocaleString('fr-FR')} km` : null,
        extras.fuel,
      ]
        .filter(Boolean)
        .join(' · ') || 'Véhicule'
    )
  }
  if (cat === 'terrains') {
    return [loc, item.size_label].filter(Boolean).join(' · ') || 'Lieu non renseigné'
  }
  if (cat === 'opportunite') {
    return loc || 'Lieu non renseigné'
  }
  return (
    [loc, item.rooms ? `${item.rooms} pièce${item.rooms > 1 ? 's' : ''}` : null]
      .filter(Boolean)
      .join(' · ') || 'Lieu non renseigné'
  )
}

export function offerCardExcerpt(item: {
  description?: string | null
  raw_text?: string | null
  title?: string | null
}) {
  const text = [item.description, item.raw_text, item.title].find((value) => value?.trim()) || ''
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) =>
      line
        .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
        .replace(/[\u00a0\u202f]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim()
    )
    .filter(Boolean)
    .join('\n')
}
