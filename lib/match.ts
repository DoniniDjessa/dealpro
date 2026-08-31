import type { Demand, MatchReason, Offer } from '@/lib/types'
import { locationPathMatches, parseLocationPath } from '@/lib/location-path'
import { OPEN_PIPELINES, normalizeCategory } from '@/lib/taxonomy'

function locationOverlap(offer: Offer, demand: Demand) {
  const offerPath = offer.location_path?.length ? offer.location_path : parseLocationPath(offer.location)
  const demandPath = demand.location_path?.length ? demand.location_path : parseLocationPath(demand.location)
  if (offerPath.length && demandPath.length) {
    return locationPathMatches(offerPath, demandPath.join(', ')) || locationPathMatches(demandPath, offerPath.join(', '))
  }
  const left = (offer.location || '').toLowerCase()
  const right = (demand.location || '').toLowerCase()
  if (!left || !right) return false
  return left.includes(right) || right.includes(left)
}

function priceFit(offer: Offer, demand: Demand): { points: number; label: string } | null {
  const price = Number(offer.price || 0)
  if (!price) return null
  const min = demand.budget_min == null ? null : Number(demand.budget_min)
  const max = demand.budget_max == null ? null : Number(demand.budget_max)
  if (min == null && max == null) return null
  const inMin = min == null || price >= min
  const inMax = max == null || price <= max
  if (inMin && inMax) return { points: 25, label: 'Prix dans le budget' }
  const bound = !inMax && max != null ? max : min
  if (bound && Math.abs(price - bound) / bound <= 0.15) {
    return { points: 12, label: 'Prix proche du budget (±15 %)' }
  }
  return null
}

export function scorePair(offer: Offer, demand: Demand) {
  const reasons: MatchReason[] = []
  if (normalizeCategory(offer.category) && normalizeCategory(offer.category) === normalizeCategory(demand.category)) {
    reasons.push({ code: 'category', label: 'Même catégorie', points: 40 })
  }
  if (locationOverlap(offer, demand)) {
    reasons.push({ code: 'location', label: 'Zone compatible', points: 25 })
  }
  const price = priceFit(offer, demand)
  if (price) reasons.push({ code: 'price', label: price.label, points: price.points })
  if (demand.size_min && offer.size_value && offer.size_value >= demand.size_min) {
    reasons.push({ code: 'size', label: 'Superficie suffisante', points: 10 })
  }
  const score = Math.min(100, reasons.reduce((sum, item) => sum + item.points, 0))
  return { score, reasons }
}

export function reliabilityFor(offer: Offer) {
  let score = 20
  if (offer.phone || (offer.phones && offer.phones.length)) score += 20
  if (offer.contact_id) score += 15
  if (offer.verification === 'phone_ok' || offer.verification === 'verified' || offer.verification === 'exclusive') {
    score += 20
  }
  if (offer.verification === 'verified' || offer.verification === 'exclusive') score += 15
  if (offer.verification === 'exclusive') score += 10
  const days = (Date.now() - new Date(offer.last_touched_at || offer.updated_at).getTime()) / 86_400_000
  if (days > 14 && OPEN_PIPELINES.includes(offer.pipeline)) score -= 15
  return Math.max(0, Math.min(100, score))
}

export function isOpenOffer(offer: Offer) {
  return OPEN_PIPELINES.includes(offer.pipeline)
}
