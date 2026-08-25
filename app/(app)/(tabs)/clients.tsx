import { ScreenShell } from '@/components/ScreenShell'
import { CardActions } from '@/components/CardActions'
import { SimpleSearch } from '@/components/SimpleSearch'
import { useFormDrawer } from '@/components/FormDrawer'
import { useContacts, useDemands } from '@/lib/hooks'
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

async function openUrl(url: string) {
  try {
    await Linking.openURL(url)
  } catch {
    /* ignore */
  }
}

export default function ClientsScreen() {
  const { items, loading, error } = useContacts()
  const demands = useDemands()
  const { openForm, notifyChange } = useFormDrawer()
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const clients = useMemo(() => {
    const demandIds = new Set(demands.items.map((item) => item.contact_id).filter(Boolean) as string[])
    return items.filter((item) => item.kind === 'client' || demandIds.has(item.id))
  }, [items, demands.items])

  const filtered = useMemo(
    () => clients.filter((item) => matchContactSearch(item, query)),
    [clients, query]
  )

  const remove = async (id: string) => {
    await deleteContact(id)
    if (openId === id) setOpenId(null)
    notifyChange()
  }

  return (
    <ScreenShell title="Clients" loading={loading || demands.loading} error={error}>
      <SimpleSearch value={query} onChange={setQuery} placeholder="Rechercher un client…" />
      {filtered.length === 0 ? (
        <YStack alignItems="center" paddingVertical={48} gap={12}>
          <Text style={{ ...fonts.semibold, color: colors.muted, textAlign: 'center' }}>
            {query.trim()
              ? 'Aucun client trouvé pour cette recherche'
              : 'Enregistre un acheteur et rattache-le à une demande.'}
          </Text>
          {!query.trim() ? (
            <Pressable onPress={() => openForm('client')}>
              <Text style={{ ...fonts.bold, color: colors.emerald }}>Nouveau client</Text>
            </Pressable>
          ) : null}
        </YStack>
      ) : (
        filtered.map((item) => {
          const open = openId === item.id
          const phones = contactPhones(item)
          const linkedDemands = demands.items.filter((demand) => demand.contact_id === item.id)

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
                  <YStack flex={1}>
                    <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ ...fonts.medium, fontSize: 12, color: colors.orange }}>
                      {linkedDemands.length} demande(s)
                    </Text>
                  </YStack>
                  <ChevronDown size={18} color={open ? colors.emerald : colors.muted} />
                </XStack>
              </Pressable>

              {open ? (
                <YStack marginTop={12} gap={10}>
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

                  {linkedDemands.length ? (
                    <YStack gap={6}>
                      {linkedDemands.map((demand) => (
                        <Pressable key={demand.id} onPress={() => openForm('demand', demand)}>
                          <YStack backgroundColor={colors.orangeSoft} borderRadius={12} paddingHorizontal={10} paddingVertical={8}>
                            <Text style={{ ...fonts.semibold, fontSize: 12, color: colors.orange }}>{demand.title}</Text>
                          </YStack>
                        </Pressable>
                      ))}
                    </YStack>
                  ) : null}

                  <Pressable
                    onPress={() =>
                      openForm('demand', null, {
                        contact: { id: item.id, name: item.name, phone: item.phone, fromApp: true },
                      })
                    }
                  >
                    <YStack height={44} borderRadius={14} backgroundColor={colors.emeraldSoft} alignItems="center" justifyContent="center">
                      <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.emerald }}>Rattacher une demande</Text>
                    </YStack>
                  </Pressable>

                  <XStack justifyContent="flex-end">
                    <CardActions onEdit={() => openForm('client', item)} onDelete={() => void remove(item.id)} />
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
