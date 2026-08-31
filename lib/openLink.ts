import { Linking, Platform } from 'react-native'

function withHttps(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed
  return `https://${trimmed.replace(/^\/\//, '')}`
}

export type OpenableNetwork = 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'web'

export function linkNetwork(url: string) {
  const blob = url.toLowerCase()
  if (/tiktok\.com|vm\.tiktok|vt\.tiktok|snssdk/.test(blob)) return 'TikTok'
  if (/facebook\.com|fb\.watch|fb\.com|fb\.me/.test(blob)) return 'Facebook'
  if (/instagram\.com/.test(blob)) return 'Instagram'
  if (/whatsapp\.com|wa\.me|api\.whatsapp/.test(blob)) return 'WhatsApp'
  if (/twitter\.com|\bx\.com\b|t\.co\//.test(blob)) return 'X'
  return 'Lien'
}

export function openableNetwork(url: string): OpenableNetwork | null {
  const network = linkNetwork(url)
  if (network === 'WhatsApp') return null
  if (network === 'Facebook') return 'facebook'
  if (network === 'Instagram') return 'instagram'
  if (network === 'TikTok') return 'tiktok'
  if (network === 'X') return 'twitter'
  return 'web'
}

function facebookNative(httpsUrl: string) {
  return `fb://facewebmodal/f?href=${encodeURIComponent(httpsUrl)}`
}

function instagramNative(httpsUrl: string) {
  const media = httpsUrl.match(/instagram\.com\/(?:p|reel|reels)\/([^/?#]+)/i)?.[1]
  if (media) return `instagram://media?id=${media}`
  const user = httpsUrl.match(/instagram\.com\/([^/?#]+)/i)?.[1]
  if (user && !['p', 'reel', 'reels', 'stories', 'share'].includes(user.toLowerCase())) {
    return `instagram://user?username=${user}`
  }
  return null
}

function twitterNative(httpsUrl: string) {
  const status = httpsUrl.match(/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/i)?.[1]
  if (status) return `twitter://status?id=${status}`
  return null
}

function whatsappNative(httpsUrl: string) {
  const phone = httpsUrl.match(/(?:wa\.me|whatsapp\.com\/send\?phone=)\/?(\+?\d+)/i)?.[1]
  if (phone) return `whatsapp://send?phone=${phone.replace(/\D/g, '')}`
  return null
}

function tiktokNative(httpsUrl: string) {
  const video = httpsUrl.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i)?.[1]
  if (video) return `snssdk1233://aweme/detail/${video}`
  return `snssdk1233://webview?url=${encodeURIComponent(httpsUrl)}`
}

export function nativeOpenUrl(httpsUrl: string) {
  const network = linkNetwork(httpsUrl)
  if (network === 'Facebook') return facebookNative(httpsUrl)
  if (network === 'Instagram') return instagramNative(httpsUrl)
  if (network === 'X') return twitterNative(httpsUrl)
  if (network === 'WhatsApp') return whatsappNative(httpsUrl)
  if (network === 'TikTok') return tiktokNative(httpsUrl)
  return null
}

async function tryOpen(url: string) {
  try {
    const allowed = await Linking.canOpenURL(url)
    if (allowed === false && Platform.OS === 'ios') return false
    await Linking.openURL(url)
    return true
  } catch {
    return false
  }
}

export async function openExternal(url: string) {
  const httpsUrl = withHttps(url)
  if (!httpsUrl) return
  const native = nativeOpenUrl(httpsUrl)
  if (native && (await tryOpen(native))) return
  await tryOpen(httpsUrl)
}

export async function openMaps(lat: number, lng: number, label?: string | null) {
  const dest = `${lat},${lng}`
  const named = encodeURIComponent(label?.trim() || dest)
  const web = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
  if (Platform.OS === 'android') {
    if (await tryOpen(`google.navigation:q=${dest}`)) return
    if (await tryOpen(`geo:${dest}?q=${dest}(${named})`)) return
  } else {
    if (await tryOpen(`comgooglemaps://?daddr=${dest}&directionsmode=driving`)) return
    if (await tryOpen(`maps://?daddr=${dest}&dirflg=d`)) return
  }
  await tryOpen(web)
}
