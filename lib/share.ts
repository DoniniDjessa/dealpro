import type { ShareIntent } from 'expo-share-intent'
import type { Category, ContactKind, DirectoryPerson } from '@/lib/types'

export type ShareDraft = {
  raw: string
  link: string
  network: string
  skippedMedia: boolean
}

const URL_RE = /https?:\/\/[^\s<>"']+/gi

export function extractUrls(text: string | null | undefined) {
  return [...(text?.match(URL_RE) ?? [])].map((url) => url.replace(/[),.;!?]+$/g, ''))
}

export function extractUrl(text: string | null | undefined) {
  return extractUrls(text)[0] ?? null
}

export function shareNetworkLabel(url: string | null, text: string) {
  const blob = `${url ?? ''} ${text}`.toLowerCase()
  if (/tiktok\.com|vm\.tiktok|vt\.tiktok/.test(blob)) return 'TikTok'
  if (/facebook\.com|fb\.watch|fb\.com|fb\.me/.test(blob)) return 'Facebook'
  if (/twitter\.com|\bx\.com\b|t\.co\//.test(blob)) return 'X'
  if (/whatsapp\.com|wa\.me|api\.whatsapp/.test(blob)) return 'WhatsApp'
  if (/instagram\.com/.test(blob)) return 'Instagram'
  return 'Partage'
}

function stripUrls(text: string, urls: string[]) {
  return urls.reduce((current, url) => current.replace(url, ' '), text).replace(/\s+/g, ' ').trim()
}

export function parseShareDraft(intent: ShareIntent): ShareDraft | null {
  const files = intent.files ?? []
  const skippedMedia = files.length > 0
  const text = [intent.text, intent.meta?.title].filter(Boolean).join('\n').trim()
  const urls = [...new Set([intent.webUrl, ...extractUrls(text), ...extractUrls(intent.text)].filter(Boolean) as string[])]
  const link = urls[0] || ''
  const network = shareNetworkLabel(link, text)
  const raw = stripUrls(text || intent.text || '', urls)

  if (!raw && !link) {
    return skippedMedia ? { raw: '', link: '', network, skippedMedia: true } : null
  }
  return { raw, link, network, skippedMedia }
}

export type FormDraft = {
  raw?: string
  link?: string
  category?: Category
  contactKind?: ContactKind
  contact?: DirectoryPerson
}

/** @deprecated use FormDraft */
export type OfferDraft = FormDraft
