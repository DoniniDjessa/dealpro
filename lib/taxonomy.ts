import type { Category, Pipeline, Verification } from '@/lib/types'
import type { FlatIconName } from '@/components/FlatIcon'

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
