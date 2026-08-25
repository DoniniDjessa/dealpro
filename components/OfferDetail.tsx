import { useState } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import Ionicons from '@expo/vector-icons/Ionicons'
import { FormPanel } from '@/components/FormPanel'
import { useFormDrawer } from '@/components/FormDrawer'
import { useContacts } from '@/lib/hooks'
import { tables } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { formatFcfa } from '@/lib/format'
import { categoryMeta, PIPELINE_META, VERIFICATION_META } from '@/lib/taxonomy'
import { phoneLooksWhatsApp, phonesMatch, waDigits } from '@/lib/analyze'
import { openableNetwork, openExternal, type OpenableNetwork } from '@/lib/openLink'
import type { Offer, SocialLink } from '@/lib/types'
import { colors, fonts } from '@/lib/theme'
import { MessageCircle, Phone, Star } from 'lucide-react-native'

function offerPhones(item: Offer) {
  const list = item.phones?.length ? item.phones : item.phone ? [item.phone] : []
  return [...new Set(list.filter(Boolean))]
}

async function openUrl(url: string) {
  await openExternal(url)
}

function offerLinks(item: Offer): { network: OpenableNetwork; url: string }[] {
  const list: SocialLink[] = [...(item.links || [])]
  if (item.source_url && !list.some((entry) => entry.url === item.source_url)) {
    list.unshift({ url: item.source_url, type: 'source' })
  }
  const byNetwork = new Map<OpenableNetwork, string>()
  for (const entry of list) {
    if (!entry.url) continue
    const network = openableNetwork(entry.url)
    if (!network || byNetwork.has(network)) continue
    byNetwork.set(network, entry.url)
  }
  return [...byNetwork.entries()].map(([network, url]) => ({ network, url }))
}

const NETWORK_BUTTON: Record<
  OpenableNetwork,
  { icon: 'logo-facebook' | 'logo-instagram' | 'logo-tiktok' | 'logo-twitter' | 'globe-outline'; bg: string; label: string }
> = {
  facebook: { icon: 'logo-facebook', bg: '#1877F2', label: 'Facebook' },
  instagram: { icon: 'logo-instagram', bg: '#E1306C', label: 'Instagram' },
  tiktok: { icon: 'logo-tiktok', bg: '#111111', label: 'TikTok' },
  twitter: { icon: 'logo-twitter', bg: '#1D9BF0', label: 'Twitter' },
  web: { icon: 'globe-outline', bg: colors.emerald, label: 'Web' },
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <YStack gap={4}>
      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4 }}>{label}</Text>
      <Text style={{ ...fonts.medium, fontSize: 15, color: colors.black }}>{value}</Text>
    </YStack>
  )
}

export function OfferDetail({ item, onClose }: { item: Offer; onClose: () => void }) {
  const { openForm, notifyChange } = useFormDrawer()
  const { items: contacts } = useContacts()
  const [important, setImportant] = useState(Boolean(item.important))
  const contact = contacts.find((entry) => entry.id === item.contact_id) || item.contact || null
  const cat = categoryMeta(item.category)
  const phones = offerPhones(item)
  const contactPhones = [
    ...phones,
    ...(contact?.phones || []),
    contact?.phone,
  ].filter(Boolean) as string[]
  const uniquePhones = [...new Set(contactPhones.filter((phone, index, all) => all.findIndex((other) => phonesMatch(phone, other)) === index))]
  const blob = `${item.raw_text || ''} ${item.description || ''}`
  const links = offerLinks(item)

  const toggleImportant = async () => {
    const next = !important
    setImportant(next)
    const { error } = await supabase
      .from(tables.offers)
      .update({ important: next, updated_at: new Date().toISOString() })
      .eq('id', item.id)
    if (error) setImportant(!next)
    else notifyChange()
  }

  return (
    <FormPanel title="Offre" onClose={onClose} onSave={() => openForm('offer-edit', { ...item, important })} saveLabel="Modifier">
      <YStack backgroundColor={colors.card} borderRadius={18} padding={16} borderWidth={1} borderColor={colors.border} gap={6}>
        <XStack justifyContent="space-between" alignItems="flex-start" gap={12}>
          <YStack flex={1} gap={6}>
            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.emerald }}>
              {cat.emoji} {cat.label}
            </Text>
            <Text style={{ ...fonts.extra, fontSize: 22, color: colors.black }}>{item.title}</Text>
            <Text style={{ ...fonts.extra, fontSize: 20, color: colors.black, marginTop: 4 }}>{formatFcfa(item.price)}</Text>
          </YStack>
          <Pressable onPress={() => void toggleImportant()} hitSlop={8}>
            <YStack
              width={44}
              height={44}
              borderRadius={14}
              backgroundColor={important ? colors.orangeSoft : colors.gray}
              alignItems="center"
              justifyContent="center"
            >
              <Star size={20} color={important ? colors.orange : colors.muted} fill={important ? colors.orange : 'transparent'} />
            </YStack>
          </Pressable>
        </XStack>
      </YStack>

      <Row label="LOCALISATION" value={item.location} />
      <Row label="PIÈCES" value={item.rooms ? `${item.rooms}` : null} />
      <Row label="SUPERFICIE" value={item.size_label} />
      <Row label="MAP" value={item.map_label} />
      <Row label="VISITE" value={item.visite ? formatFcfa(item.visite) : item.visite_text} />
      <Row label="VÉRIFICATION" value={VERIFICATION_META[item.verification].label} />
      <Row label="PIPELINE" value={PIPELINE_META[item.pipeline].label} />
      <Row label="DESCRIPTION" value={item.description || item.raw_text} />
      {links.length ? (
        <YStack gap={8}>
          <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4 }}>OUVRIR</Text>
          <XStack gap={10} flexWrap="wrap">
            {links.map((entry) => {
              const meta = NETWORK_BUTTON[entry.network]
              return (
                <Pressable key={entry.network} onPress={() => void openUrl(entry.url)} hitSlop={4}>
                  <YStack alignItems="center" gap={6} width={64}>
                    <YStack
                      width={48}
                      height={48}
                      borderRadius={16}
                      backgroundColor={meta.bg}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Ionicons name={meta.icon} size={24} color={colors.white} />
                    </YStack>
                    <Text style={{ ...fonts.semibold, fontSize: 11, color: colors.muted }}>{meta.label}</Text>
                  </YStack>
                </Pressable>
              )
            })}
          </XStack>
        </YStack>
      ) : null}

      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4 }}>CONTACTS</Text>
      {contact ? (
        <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black }}>{contact.name}</Text>
      ) : null}
      {uniquePhones.length === 0 ? (
        <Text style={{ ...fonts.medium, fontSize: 13, color: colors.muted }}>Aucun numéro</Text>
      ) : (
        uniquePhones.map((tel) => {
          const whatsapp =
            Boolean(contact?.whatsapp) ||
            (uniquePhones.length === 1 && /whatsapp|\bwa\b|wapp|wa\.me/i.test(blob)) ||
            phoneLooksWhatsApp(tel, blob, item.links || [], contact?.whatsapp)
          return (
            <XStack key={tel} alignItems="center" gap={8}>
              <YStack flex={1} backgroundColor={colors.card} borderRadius={14} padding={12} borderWidth={1} borderColor={colors.border}>
                <Text style={{ ...fonts.medium, fontSize: 14, color: colors.black }}>{tel}</Text>
              </YStack>
              <Pressable onPress={() => void openUrl(`tel:${tel}`)}>
                <YStack
                  width={42}
                  height={42}
                  borderRadius={14}
                  backgroundColor={colors.gray}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Phone size={18} color={colors.black} />
                </YStack>
              </Pressable>
              {whatsapp ? (
                <Pressable onPress={() => void openUrl(`https://wa.me/${waDigits(tel)}`)}>
                  <YStack
                    width={42}
                    height={42}
                    borderRadius={14}
                    backgroundColor={colors.emeraldSoft}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <MessageCircle size={18} color={colors.emerald} />
                  </YStack>
                </Pressable>
              ) : null}
            </XStack>
          )
        })
      )}

      {(item.tags || []).length ? (
        <XStack flexWrap="wrap" gap={6}>
          {item.tags.map((tag) => (
            <YStack key={tag} backgroundColor={colors.emeraldSoft} borderRadius={10} paddingHorizontal={8} paddingVertical={4}>
              <Text style={{ ...fonts.medium, fontSize: 11, color: colors.emerald }}>{tag}</Text>
            </YStack>
          ))}
        </XStack>
      ) : null}
    </FormPanel>
  )
}
