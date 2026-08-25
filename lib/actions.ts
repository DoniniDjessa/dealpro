import { daysSince, potentialCommission } from '@/lib/format'
import { isOpenOffer } from '@/lib/match'
import type { Demand, HuntAction, MatchRow, Offer } from '@/lib/types'

export function huntActions(offers: Offer[], demands: Demand[], matches: MatchRow[]): HuntAction[] {
  const actions: HuntAction[] = []
  const offerById = new Map(offers.map((item) => [item.id, item]))
  const demandById = new Map(demands.map((item) => [item.id, item]))

  for (const match of matches.filter((item) => item.score >= 70)) {
    const offer = offerById.get(match.offer_id)
    const demand = demandById.get(match.demand_id)
    if (!offer || !demand || !isOpenOffer(offer) || demand.status !== 'open') continue
    if (offer.pipeline === 'captured') {
      actions.push({
        id: `match-${match.id}`,
        kind: 'match',
        title: `Présenter ${offer.title} au client`,
        reason: `Match ${match.score} % · ${demand.title}`,
        offerId: offer.id,
        demandId: demand.id,
      })
    }
  }

  for (const offer of offers.filter(isOpenOffer)) {
    if (daysSince(offer.last_touched_at) >= 5) {
      actions.push({
        id: `relance-${offer.id}`,
        kind: 'relance',
        title: `Relancer ${offer.title}`,
        reason: `Pas de touche depuis ${daysSince(offer.last_touched_at)} jours`,
        offerId: offer.id,
      })
    }
    if (offer.verification === 'unverified' && Number(offer.price) >= 10_000_000) {
      actions.push({
        id: `verify-${offer.id}`,
        kind: 'verify',
        title: `Vérifier ${offer.title}`,
        reason: `${potentialCommission(offer.price, offer.commission_rate).toLocaleString('fr-FR')} FCFA en jeu, encore non vérifiée`,
        offerId: offer.id,
      })
    }
    if (!offer.contact_id && !offer.phone) {
      actions.push({
        id: `contact-${offer.id}`,
        kind: 'contact',
        title: `Ajouter un contact à ${offer.title}`,
        reason: 'Offre sans personne joignable',
        offerId: offer.id,
      })
    }
  }

  for (const demand of demands.filter((item) => item.status === 'open')) {
    const best = matches.filter((item) => item.demand_id === demand.id).sort((a, b) => b.score - a.score)[0]
    if (!best || best.score < 70) {
      actions.push({
        id: `demand-${demand.id}`,
        kind: 'demand',
        title: `Trouver une offre pour ${demand.title}`,
        reason: best ? `Meilleur match actuel ${best.score} %` : 'Aucune offre compatible',
        demandId: demand.id,
      })
    }
  }

  const seen = new Set<string>()
  return actions.filter((action) => {
    if (seen.has(action.id)) return false
    seen.add(action.id)
    return true
  }).slice(0, 7)
}
