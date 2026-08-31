import { tables } from '@/lib/db'
import { supabase } from '@/lib/supabase'

export type OfferDupRow = {
  id: string
  title: string
  description: string | null
  raw_text: string | null
  source_url: string | null
  links?: { url?: string }[] | null
}

export function foldDescription(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function normalizeOfferLink(url: string) {
  const raw = url.trim()
  if (!raw) return ''
  try {
    const href = raw.includes('://') ? raw : `https://${raw}`
    const parsed = new URL(href)
    parsed.hash = ''
    parsed.hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase()
    ;['fbclid', 'mibextid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
      parsed.searchParams.delete(key)
    })
    const path = parsed.pathname.replace(/\/+$/, '')
    const search = parsed.searchParams.toString()
    return `${parsed.protocol}//${parsed.hostname}${path}${search ? `?${search}` : ''}`
  } catch {
    return raw.toLowerCase().replace(/\/+$/, '')
  }
}

export function isListingLink(url: string) {
  const normalized = normalizeOfferLink(url)
  if (!normalized) return false
  return !/wa\.me|whatsapp\.com|api\.whatsapp/.test(normalized)
}

export function collectListingLinks(item: OfferDupRow, extra: string[] = []) {
  const urls = [...extra]
  if (item.source_url) urls.push(item.source_url)
  for (const entry of item.links || []) {
    if (entry?.url) urls.push(entry.url)
  }
  return [...new Set(urls.filter(isListingLink).map(normalizeOfferLink))]
}

export function findOfferDuplicate(
  existing: OfferDupRow[],
  input: { description: string; links: string[]; excludeId?: string | null }
): { kind: 'link' | 'description'; offer: OfferDupRow } | null {
  const others = existing.filter((row) => row.id !== input.excludeId)
  const incoming = [...new Set(input.links.filter(isListingLink).map(normalizeOfferLink))]
  if (incoming.length) {
    const hit = others.find((row) => collectListingLinks(row).some((url) => incoming.includes(url)))
    if (hit) return { kind: 'link', offer: hit }
  }
  const description = foldDescription(input.description)
  if (!description) return null
  const sameText = others.find((row) => {
    const raw = foldDescription(row.raw_text || '')
    const desc = foldDescription(row.description || '')
    return raw === description || desc === description
  })
  return sameText ? { kind: 'description', offer: sameText } : null
}

export async function fetchUserOffersForDuplicate(userId: string) {
  const { data, error } = await supabase
    .from(tables.offers)
    .select('id, title, description, raw_text, source_url, links')
    .eq('user_id', userId)
  if (error) return []
  return (data as OfferDupRow[]) || []
}
