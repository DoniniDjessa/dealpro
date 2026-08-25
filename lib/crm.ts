import { tables } from '@/lib/db'
import { normalizePhone, phonesMatch } from '@/lib/analyze'
import { reliabilityFor, scorePair } from '@/lib/match'
import { supabase } from '@/lib/supabase'
import type { Contact, DirectoryPerson, Offer } from '@/lib/types'

export async function upsertContact(userId: string, person: DirectoryPerson, notes?: string | null) {
  if (person.fromApp) {
    const { data } = await supabase.from(tables.contacts).select('*').eq('id', person.id).maybeSingle()
    if (data) return data as Contact
  }

  const phone = person.phone?.trim() || null
  const deviceId = person.fromApp ? null : person.id || null

  if (deviceId) {
    const { data } = await supabase
      .from(tables.contacts)
      .select('*')
      .eq('user_id', userId)
      .eq('device_contact_id', deviceId)
      .maybeSingle()
    if (data) return data as Contact
  }

  if (phone) {
    const { data: existing } = await supabase.from(tables.contacts).select('*').eq('user_id', userId)
    const found = ((existing as Contact[]) || []).find((item) => {
      const list = [item.phone, ...(item.phones || [])].filter(Boolean) as string[]
      return list.some((known) => phonesMatch(phone, known))
    })
    if (found) {
      const phones = [...new Set([...(found.phones || []), found.phone, phone].filter(Boolean) as string[])]
      await supabase
        .from(tables.contacts)
        .update({
          name: person.name || found.name,
          phone: found.phone || phone,
          phones,
          device_contact_id: deviceId || found.device_contact_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', found.id)
      return {
        ...found,
        name: person.name || found.name,
        phone: found.phone || phone,
        phones,
        device_contact_id: deviceId || found.device_contact_id,
      }
    }
  }

  const { data, error } = await supabase
    .from(tables.contacts)
    .insert({
      user_id: userId,
      name: person.name,
      phone,
      phones: phone ? [phone] : [],
      device_contact_id: deviceId,
      notes: notes ?? null,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Contact
}

export async function markClient(contactId: string) {
  await supabase
    .from(tables.contacts)
    .update({ kind: 'client', updated_at: new Date().toISOString() })
    .eq('id', contactId)
}

export async function createNamedContacts(userId: string, groups: { name: string; phones: string[] }[]) {
  const created: Contact[] = []
  for (const group of groups) {
    const name = group.name.trim()
    const phones = [...new Set(group.phones.map(normalizePhone).filter(Boolean))]
    if (!name || !phones.length) continue
    const contact = await upsertContact(userId, {
      id: '',
      name,
      phone: phones[0],
    })
    const merged = [...new Set([...(contact.phones || []), contact.phone, ...phones].filter(Boolean) as string[])]
    await supabase
      .from(tables.contacts)
      .update({ name, phone: merged[0], phones: merged, updated_at: new Date().toISOString() })
      .eq('id', contact.id)
    created.push({ ...contact, name, phone: merged[0], phones: merged })
  }
  return created
}

export async function recomputeMatches(userId: string) {
  const [{ data: offers, error: offerError }, { data: demands, error: demandError }] = await Promise.all([
    supabase.from(tables.offers).select('*').eq('user_id', userId),
    supabase.from(tables.demands).select('*').eq('user_id', userId).eq('status', 'open'),
  ])
  if (offerError) throw new Error(offerError.message)
  if (demandError) throw new Error(demandError.message)

  await supabase.from(tables.matches).delete().eq('user_id', userId)

  const rows = []
  for (const offer of (offers as Offer[]) || []) {
    for (const demand of demands || []) {
      const { score, reasons } = scorePair(offer, demand as never)
      if (score >= 40) {
        rows.push({
          user_id: userId,
          offer_id: offer.id,
          demand_id: (demand as { id: string }).id,
          score,
          reasons,
        })
      }
    }
  }
  if (rows.length) {
    const { error } = await supabase.from(tables.matches).insert(rows)
    if (error) throw new Error(error.message)
  }
}

export async function deleteOffer(userId: string, id: string) {
  const { error } = await supabase.from(tables.offers).delete().eq('id', id)
  if (error) throw new Error(error.message)
  await recomputeMatches(userId)
}

export async function deleteDemand(userId: string, id: string) {
  const { error } = await supabase.from(tables.demands).delete().eq('id', id)
  if (error) throw new Error(error.message)
  await recomputeMatches(userId)
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from(tables.contacts).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase.from(tables.appointments).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteCashEntry(id: string) {
  const { error } = await supabase.from(tables.cashEntries).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function touchOfferReliability(offer: Offer) {
  const reliability = reliabilityFor(offer)
  if (reliability === offer.reliability) return
  await supabase.from(tables.offers).update({ reliability }).eq('id', offer.id)
}
