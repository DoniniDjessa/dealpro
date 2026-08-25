function parseCfaAmount(raw: string) {
  const digits = raw.replace(/[^\d]/g, '')
  if (digits.length < 5) return null
  const n = Number.parseInt(digits, 10)
  return Number.isFinite(n) ? n : null
}

export class TextAnalyzer {
  static extractPrice(text: string): { prix?: number; prixTexte?: string } {
    for (const match of text.matchAll(/\bpx\s*[:\-]?\s*(\d[\d.\s,]*)/gi)) {
      const prix = parseCfaAmount(match[1])
      if (prix) return { prix, prixTexte: match[0] }
    }

    let best: { prix: number; prixTexte: string } | null = null
    for (const match of text.matchAll(/(\d[\d.\s,]*)\s*f(?:cfa|rs?|rancs?)?\b/gi)) {
      const start = match.index ?? 0
      const before = text.slice(Math.max(0, start - 28), start)
      if (/\bvisite\b/i.test(before)) continue
      const prix = parseCfaAmount(match[1])
      if (!prix) continue
      if (!best || prix > best.prix) best = { prix, prixTexte: match[0] }
    }
    if (best) return best

    for (const match of text.matchAll(/\bp(?:rix|x)\b\s*[:\-]?\s*(\d[\d.\s,]*)/gi)) {
      const prix = parseCfaAmount(match[1])
      if (prix) return { prix, prixTexte: match[0] }
    }
    return {}
  }

  static extractVisite(text: string): { visite?: number; visiteTexte?: string; visiteTag?: string } {
    const patterns = [
      /(?:FRAIS\s+DE\s+)?VISITE\s*:?\s*(\d+(?:[.,\s]\d{3})*)\s*(?:f|fr|frs|franc|francs|fcfa|franc\s+cfa)\b/gi,
      /visite\s*(\d+)\s*(?:f|fr|frs|franc|francs|fcfa|franc\s+cfa)\b/gi,
      /frais\s+de\s+visite\s*:?\s*(\d+(?:[.,\s]\d{3})*)\s*(?:f|fr|frs|franc|francs|fcfa|franc\s+cfa)\b/gi,
      /visite[^\d]{0,10}(\d{3,6})/gi,
      /(\d{3,6})[^\d]{0,10}visite/gi,
    ]
    for (const pattern of patterns) {
      for (const execMatch of text.matchAll(pattern)) {
        const visite = Number.parseInt(execMatch[1]?.replace(/[,\s]/g, '') || '0', 10)
        if (visite > 0) return { visite, visiteTexte: execMatch[0], visiteTag: `v${visite}` }
      }
    }
    return {}
  }

  static extractPhones(text: string): string[] {
    const found: string[] = []
    const add = (raw: string | undefined) => {
      if (!raw) return
      const compact = raw.replace(/[^\d+]/g, '')
      const digits = compact.replace(/\D/g, '')
      if (digits.length < 8) return
      const normalized = normalizePhone(compact.startsWith('+') ? compact : digits)
      const local = normalized.replace(/\D/g, '').replace(/^225/, '')
      if (local.length < 8 || local.length > 10) return
      if (local.length === 10 && !/^0[0-9]/.test(local)) return
      if (local.length === 8 && /^[1-3]/.test(local)) return
      if (!found.includes(normalized)) found.push(normalized)
    }

    for (const match of text.matchAll(
      /(?:tel|tél|t[eé]l[eé]phone|whatsapp|whtsapp|wapp|\bwa\b|appel(?:er)?|contacter|contact|num[eé]ro|portable|c[eé]l)\.?\s*[:\-–]?\s*(\+?[\d\s./()-]{8,24})/gi
    )) {
      add(match[1])
    }
    for (const match of text.matchAll(/\+225[\s.-]*\d(?:[\s.-]*\d){7,9}/g)) add(match[0])
    for (const match of text.matchAll(/\b0\d(?:[\s.-]\d{2}){4}\b/g)) add(match[0])
    for (const match of text.matchAll(/\b0[0157]\d{8}\b/g)) add(match[0])
    return found
  }

  static extractSocialLinks(text: string): Array<{ url: string; type: string }> {
    const patterns = [
      { pattern: /(?:https?:\/\/)?(?:www\.)?wa\.me\/[\w\d+]+/gi, type: 'whatsapp' },
      { pattern: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[\w\d./]+/gi, type: 'facebook' },
      { pattern: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[\w\d./]+/gi, type: 'instagram' },
      { pattern: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/[\w\d.@/]+/gi, type: 'tiktok' },
      { pattern: /https?:\/\/[^\s]+/gi, type: 'autre' },
    ]
    const links: Array<{ url: string; type: string }> = []
    for (const { pattern, type } of patterns) {
      const matches = text.match(pattern)
      if (!matches) continue
      for (const url of matches) {
        let cleanUrl = url.trim()
        if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`
        if (!links.some((link) => link.url === cleanUrl)) links.push({ url: cleanUrl, type })
      }
    }
    return links
  }

  static extractRooms(text: string): number | undefined {
    const patterns = [
      /(\d+)\s*(?:PIÈCES?|PIECES?|PCS?|P(?:\s|$|,))/gi,
      /(\d+)\s*(?:CHAMBRES?)/gi,
      /(\d+)\s*(?:pcs|pieces?)\b/gi,
      /(\d+)(?:pcs|pieces?)\b/gi,
    ]
    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (!matches) continue
      for (const match of matches) {
        const number = Number.parseInt(match.match(/\d+/)?.[0] || '0', 10)
        if (number > 0 && number <= 20) return number
      }
    }
    return undefined
  }

  static extractLocation(text: string): string | undefined {
    const places = [
      'Bingerville', 'Cocody', 'Yopougon', 'Abobo', 'Marcory', 'Plateau', 'Koumassi',
      'Port-Bouët', 'Port-Bouet', 'Treichville', 'Adjamé', 'Adjame', 'Attécoubé', 'Attecoube',
      'Songon', 'Grand-Bassam', 'Bassam', 'Bouaké', 'Bouake', 'Yamoussoukro', 'San-Pédro',
      'San Pedro', 'Daloa', 'Korhogo', 'Angré', 'Angre', 'Riviera', 'II Plateaux', '2 Plateaux',
      'Zone 4', 'Vridi', 'Anyama', 'Brofodoumé', 'Brofodoume',
    ]
    const lower = text.toLowerCase()
    const found = places.find((place) => lower.includes(place.toLowerCase()))
    return found
  }

  static detectNouveau(text: string): boolean {
    return [
      /nouvelle\s+maison/gi,
      /nouvelle\s+construction/gi,
      /nouveau\s+bien/gi,
      /nouvelle\s+villa/gi,
      /nouvel\s+immeuble/gi,
      /nouveau\s+studio/gi,
    ].some((pattern) => pattern.test(text))
  }

  static generateTags(text: string, type: string, visiteTag?: string): string[] {
    const tags: string[] = []
    const lowerText = text.toLowerCase()
    if (visiteTag) tags.push(visiteTag)
    if (lowerText.includes('titré') || lowerText.includes('titre')) tags.push('terrain-titré')
    if (lowerText.includes('moderne')) tags.push('moderne')
    if (lowerText.includes('neuf') || lowerText.includes('neuve')) tags.push('neuf')
    if (lowerText.includes('villa')) tags.push('villa')
    if (lowerText.includes('duplex')) tags.push('duplex')
    if (lowerText.includes('sécurisé')) tags.push('sécurisé')
    if (lowerText.includes('urgent')) tags.push('urgent')
    if (lowerText.includes('négociable')) tags.push('négociable')
    if (lowerText.includes('essence')) tags.push('essence')
    if (lowerText.includes('diesel')) tags.push('diesel')
    if (type) tags.push(type)
    return [...new Set(tags)]
  }

  static analyzeText(text: string, type: string) {
    const priceAnalysis = this.extractPrice(text)
    const visiteAnalysis = this.extractVisite(text)
    return {
      ...priceAnalysis,
      ...visiteAnalysis,
      telephones: this.extractPhones(text),
      liens: this.extractSocialLinks(text),
      nbPieces: this.extractRooms(text),
      location: this.extractLocation(text) || null,
      isNouveaute: this.detectNouveau(text),
      tags: this.generateTags(text, type, visiteAnalysis.visiteTag),
    }
  }
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('225')) return `+${digits}`
  if (digits.length === 10 && digits.startsWith('0')) return `+225${digits}`
  if (digits.length >= 8 && digits.length <= 9) return `+225${digits}`
  if (!phone.startsWith('+') && digits) return `+225${digits}`
  return phone.replace(/\s/g, '')
}

export function phonesMatch(a: string, b: string) {
  const left = normalizePhone(a).replace(/\D/g, '')
  const right = normalizePhone(b).replace(/\D/g, '')
  if (!left || !right) return false
  return left === right || left.endsWith(right.slice(-8)) || right.endsWith(left.slice(-8))
}

export function titleFromDescription(text: string) {
  const line = text.split(/\n/)[0]?.trim() || text.trim()
  return line.length > 72 ? `${line.slice(0, 72).trim()}…` : line || 'Opportunité'
}

export function waDigits(phone: string) {
  return normalizePhone(phone).replace(/\D/g, '')
}

export function phoneLooksWhatsApp(
  phone: string,
  text: string,
  links: Array<{ url: string; type: string }> = [],
  contactWhatsapp?: string | null
) {
  if (contactWhatsapp && phonesMatch(contactWhatsapp, phone)) return true
  const tail = waDigits(phone).slice(-8)
  if (!tail) return false
  if (links.some((link) => (link.type === 'whatsapp' || /wa\.me/i.test(link.url)) && link.url.replace(/\D/g, '').includes(tail))) {
    return true
  }
  const compact = text.replace(/[^\d+a-zàâéèêëïôùüç\s]/gi, ' ')
  const idx = compact.replace(/\s/g, '').indexOf(tail)
  if (idx >= 0) {
    const around = text.toLowerCase()
    const pos = around.search(new RegExp(tail.split('').join('[\\s.-]*')))
    if (pos >= 0) {
      const window = around.slice(Math.max(0, pos - 48), pos + tail.length + 48)
      if (/whatsapp|\bwa\b|wapp|whtsapp|wa\.me/.test(window)) return true
    }
  }
  if (/whatsapp|\bwa\b|wapp|whtsapp|wa\.me/i.test(text) && links.some((link) => link.type === 'whatsapp')) return true
  return false
}
