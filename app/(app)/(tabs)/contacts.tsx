import { ScreenShell } from '@/components/ScreenShell'
import { CardActions } from '@/components/CardActions'
import { SimpleSearch } from '@/components/SimpleSearch'
import { useFormDrawer } from '@/components/FormDrawer'
import { useContacts, useDemands, useOffers } from '@/lib/hooks'
import { deleteContact } from '@/lib/crm'
import { matchContactSearch } from '@/lib/search'
import { colors, fonts } from '@/lib/theme'
import type { Contact } from '@/lib/types'
import { ChevronDown, MapPin, MessageCircle, Phone } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Linking, Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

function contactPhones(item: Contact) {
  const list = item.phones?.length ? item.phones : item.phone ? [item.phone] : []
  return [...new Set(list.filter(Boolean))]
}

function hrefFrom(value: string) {
  if (/^https?:\/\//i.test(value)) return value
  if (value.includes('.')) return `https://${value}`
  return `https://wa.me/${value.replace(/\D/g, '')}`
}

async function openUrl(url: string) {
  try {
    await Linking.openURL(url)
  } catch {
    /* ignore */
  }
}

export default function ContactsScreen() {
  const { items, loading, error } = useContacts()
  const offers = useOffers()
  const demands = useDemands()
  const { openForm, notifyChange } = useFormDrawer()
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => items.filter((item) => matchContactSearch(item, query)), [items, query])

  const remove = async (id: string) => {
    await deleteContact(id)
    if (openId === id) setOpenId(null)
    notifyChange()
  }

  return (
    <ScreenShell title="Contacts" loading={loading} error={error}>
      <SimpleSearch value={query} onChange={setQuery} placeholder="Rechercher un contact…" />
      {filtered.length === 0 ? (
        <YStack alignItems="center" paddingVertical={48} gap={12}>
          <Text style={{ ...fonts.semibold, color: colors.muted, textAlign: 'center' }}>
            {query.trim()
              ? 'Aucun contact trouvé pour cette recherche'
              : 'Relie un contact du répertoire à une offre, ou crée-le ici.'}
          </Text>
          {!query.trim() ? (
            <Pressable onPress={() => openForm('contact')}>
              <Text style={{ ...fonts.bold, color: colors.emerald }}>Nouveau contact</Text>
            </Pressable>
          ) : null}
        </YStack>
      ) : (
        filtered.map((item) => {
          const open = openId === item.id
          const phones = contactPhones(item)
          const linkedOffers = offers.items.filter((offer) => offer.contact_id === item.id)
          const linkedDemands = demands.items.filter((demand) => demand.contact_id === item.id)
          const socials = [
            item.whatsapp ? { key: 'WhatsApp', color: '#16A34A', url: hrefFrom(item.whatsapp) } : null,
            item.facebook ? { key: 'Facebook', color: '#2563EB', url: hrefFrom(item.facebook) } : null,
            item.instagram ? { key: 'Instagram', color: '#DB2777', url: hrefFrom(item.instagram) } : null,
            item.tiktok ? { key: 'TikTok', color: colors.black, url: hrefFrom(item.tiktok) } : null,
          ].filter(Boolean) as { key: string; color: string; url: string }[]

          return (
            <YStack
              key={item.id}
              backgroundColor={colors.card}
              borderRadius={20}
              paddingHorizontal={16}
              paddingVertical={12}
              marginBottom={10}
              borderWidth={1}
              borderColor={colors.border}
            >
              <Pressable onPress={() => setOpenId(open ? null : item.id)}>
                <XStack alignItems="center" justifyContent="space-between" gap={10}>
                  <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black, flex: 1 }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <ChevronDown size={18} color={open ? colors.emerald : colors.muted} />
                </XStack>
              </Pressable>

              {open ? (
                <YStack marginTop={12} gap={10}>
                  {item.specialite ? (
                    <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>{item.specialite}</Text>
                  ) : null}
                  {item.secteur ? (
                    <YStack alignSelf="flex-start" backgroundColor={colors.emeraldSoft} borderRadius={10} paddingHorizontal={8} paddingVertical={4}>
                      <Text style={{ ...fonts.semibold, fontSize: 11, color: colors.emerald }}>{item.secteur}</Text>
                    </YStack>
                  ) : null}

                  {phones.length ? (
                    <YStack gap={6}>
                      {phones.map((tel) => (
                        <XStack key={tel} alignItems="center" gap={8}>
                          <YStack backgroundColor={colors.gray} borderRadius={10} paddingHorizontal={8} paddingVertical={4} flex={1}>
                            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.black }}>{tel}</Text>
                          </YStack>
                          <Pressable onPress={() => void openUrl(`https://wa.me/${tel.replace(/\D/g, '')}`)}>
                            <YStack
                              width={32}
                              height={32}
                              borderRadius={10}
                              backgroundColor={colors.emeraldSoft}
                              alignItems="center"
                              justifyContent="center"
                            >
                              <MessageCircle size={14} color={colors.emerald} />
                            </YStack>
                          </Pressable>
                          <Pressable onPress={() => void openUrl(`tel:${tel}`)}>
                            <YStack
                              width={32}
                              height={32}
                              borderRadius={10}
                              backgroundColor={colors.gray}
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Phone size={14} color={colors.black} />
                            </YStack>
                          </Pressable>
                        </XStack>
                      ))}
                    </YStack>
                  ) : (
                    <Text style={{ ...fonts.medium, fontSize: 13, color: colors.muted }}>Pas de téléphone</Text>
                  )}

                  {item.localisation ? (
                    <XStack alignItems="center" gap={6}>
                      <MapPin size={14} color={colors.muted} />
                      <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>{item.localisation}</Text>
                    </XStack>
                  ) : null}

                  {item.notes ? (
                    <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }} numberOfLines={3}>
                      {item.notes}
                    </Text>
                  ) : null}

                  {socials.length ? (
                    <XStack flexWrap="wrap" gap={6}>
                      {socials.map((social) => (
                        <Pressable key={social.key} onPress={() => void openUrl(social.url)}>
                          <YStack borderWidth={1} borderColor={colors.border} borderRadius={10} paddingHorizontal={8} paddingVertical={4}>
                            <Text style={{ ...fonts.semibold, fontSize: 11, color: social.color }}>{social.key}</Text>
                          </YStack>
                        </Pressable>
                      ))}
                    </XStack>
                  ) : null}

                  <XStack alignItems="center" justifyContent="space-between" gap={8}>
                    <XStack gap={8} flex={1}>
                      <Text style={{ ...fonts.medium, fontSize: 12, color: colors.emerald }}>
                        {linkedOffers.length} offre(s)
                      </Text>
                      <Text style={{ ...fonts.medium, fontSize: 12, color: colors.orange }}>
                        {linkedDemands.length} demande(s)
                      </Text>
                    </XStack>
                    <CardActions onEdit={() => openForm('contact', item)} onDelete={() => void remove(item.id)} />
                  </XStack>
                </YStack>
              ) : null}
            </YStack>
          )
        })
      )}
    </ScreenShell>
  )
}
