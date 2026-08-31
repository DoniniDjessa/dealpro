import { getGeminiKey } from '@/lib/env'
import { normalizeCategory } from '@/lib/taxonomy'
import type { Category } from '@/lib/types'

export type ExtractedOffer = {
  title: string
  category: Category
  price: number | null
  currency: string
  location: string | null
  size_label: string | null
  size_value: number | null
  phone: string | null
  seller_name: string | null
  description: string | null
  source_url: string | null
}

function asCategory(value: unknown): Category {
  return normalizeCategory(value as string)
}

export async function extractOfferFromText(text: string): Promise<ExtractedOffer> {
  const key = getGeminiKey()
  if (!key) {
    throw new Error('Clé Gemini manquante. Ajoute-la dans .env.local.')
  }

  const prompt = `Tu extraies une opportunité commerciale en JSON strict, sans markdown.
Champs: title (court), category (immobilier|residences|terrains|auto|opportunite),
price (nombre FCFA : 40 millions / 40 m / 40m = 40000000, 500 milles / 15 mille = 500000 / 15000), currency (XOF si FCFA), location, size_label, size_value (nombre),
phone, seller_name, description, source_url (si un lien est dans le texte).
Null si inconnu. Texte:
${text}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  )

  if (!res.ok) {
    throw new Error('Extraction IA indisponible. Saisis à la main.')
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('L’IA n’a rien pu extraire. Saisis à la main.')
  const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>

  return {
    title: String(parsed.title || '').trim() || 'Opportunité',
    category: asCategory(parsed.category),
    price: parsed.price == null ? null : Number(parsed.price) || null,
    currency: String(parsed.currency || 'XOF'),
    location: parsed.location ? String(parsed.location) : null,
    size_label: parsed.size_label ? String(parsed.size_label) : null,
    size_value: parsed.size_value == null ? null : Number(parsed.size_value) || null,
    phone: parsed.phone ? String(parsed.phone) : null,
    seller_name: parsed.seller_name ? String(parsed.seller_name) : null,
    description: parsed.description ? String(parsed.description) : null,
    source_url: parsed.source_url ? String(parsed.source_url) : null,
  }
}
