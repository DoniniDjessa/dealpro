import { colors, fonts } from '@/lib/theme'
import { loadContacts } from '@/lib/contacts'
import type { DirectoryPerson } from '@/lib/types'
import { FlatIcon } from '@/components/FlatIcon'
import { LogoLoader } from '@/components/Logo'
import { PrimaryButton } from '@/components/PrimaryButton'
import { Search, X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'

const AVATARS = ['#059669', '#064E3B', '#F97316', '#0B3D30', '#FB923C']

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function avatarColor(id: string) {
  let sum = 0
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i)
  return AVATARS[sum % AVATARS.length]
}

export function ContactAttach({
  person,
  onChange,
  carnet = [],
  label = 'Relier un contact',
  hint = 'Depuis le répertoire — créé dans Contacts s’il n’existe pas',
}: {
  person: DirectoryPerson | null
  onChange: (person: DirectoryPerson | null) => void
  carnet?: DirectoryPerson[]
  label?: string
  hint?: string
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'carnet' | 'directory'>(carnet.length ? 'carnet' : 'directory')
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<DirectoryPerson[]>([])
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const loadDirectory = async () => {
    setLoading(true)
    setError(null)
    if (Platform.OS === 'web') {
      setLoading(false)
      setError('Le répertoire est disponible sur iOS et Android.')
      return
    }
    const { granted, people } = await loadContacts()
    setLoading(false)
    if (!granted) {
      setError('Autorise l’accès au répertoire pour relier un contact.')
      return
    }
    if (people.length === 0) {
      setError('Aucun contact trouvé dans le répertoire.')
      return
    }
    setContacts(people)
  }

  const openPicker = async () => {
    setOpen(true)
    setQuery('')
    setError(null)
    const startTab = carnet.length ? 'carnet' : 'directory'
    setTab(startTab)
    if (startTab === 'directory') await loadDirectory()
  }

  const switchTab = async (next: 'carnet' | 'directory') => {
    setTab(next)
    setQuery('')
    setError(null)
    if (next === 'directory' && contacts.length === 0) await loadDirectory()
  }

  const source = tab === 'carnet' ? carnet : contacts

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? source.filter((item) => item.name.toLowerCase().includes(q) || (item.phone || '').includes(q)) : source
  }, [source, query])

  const grouped = useMemo(() => {
    const map = new Map<string, DirectoryPerson[]>()
    for (const item of filtered) {
      const raw = item.name.trim().charAt(0).toUpperCase()
      const letter = /[A-ZÀ-Ÿ]/.test(raw) ? raw.normalize('NFD')[0] : '#'
      const list = map.get(letter) ?? []
      list.push(item)
      map.set(letter, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr'))
  }, [filtered])

  return (
    <YStack gap={10}>
      <Pressable onPress={() => void openPicker()}>
        <XStack backgroundColor={colors.card} borderRadius={16} paddingHorizontal={16} paddingVertical={14} alignItems="center" gap={14}>
          <FlatIcon name="users" size={22} />
          <YStack flex={1}>
            <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black }}>
              {person ? person.name : label}
            </Text>
            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {person?.fromApp
                ? `${person.phone || 'Carnet DealPro'} · reconnu`
                : person?.phone || hint}
            </Text>
          </YStack>
        </XStack>
      </Pressable>
      {person ? (
        <Pressable onPress={() => onChange(null)}>
          <Text style={{ ...fonts.medium, fontSize: 12, color: colors.indigo }}>
            {person.fromApp ? 'Retirer le client' : 'Retirer le contact'}
          </Text>
        </Pressable>
      ) : null}
      <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setOpen(false)}>
        <DirectoryBody
          loading={loading}
          error={error}
          query={query}
          onQuery={setQuery}
          grouped={grouped}
          pickedId={person?.id}
          showCarnet={carnet.length > 0}
          tab={tab}
          onTab={(next) => void switchTab(next)}
          onToggle={(next) => {
            onChange(tab === 'carnet' ? { ...next, fromApp: true } : next)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </YStack>
  )
}

function DirectoryBody({
  loading,
  error,
  query,
  onQuery,
  grouped,
  pickedId,
  showCarnet,
  tab,
  onTab,
  onToggle,
  onClose,
}: {
  loading: boolean
  error: string | null
  query: string
  onQuery: (value: string) => void
  grouped: [string, DirectoryPerson[]][]
  pickedId?: string
  showCarnet?: boolean
  tab: 'carnet' | 'directory'
  onTab: (tab: 'carnet' | 'directory') => void
  onToggle: (person: DirectoryPerson) => void
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <YStack flex={1} backgroundColor={colors.bg} paddingTop={insets.top}>
      <XStack alignItems="center" justifyContent="space-between" paddingHorizontal={20} paddingVertical={12}>
        <YStack>
          <Text style={{ ...fonts.extra, fontSize: 24, color: colors.black }}>
            {tab === 'carnet' ? 'Carnet' : 'Répertoire'}
          </Text>
          <Text style={{ ...fonts.medium, fontSize: 13, color: colors.muted }}>
            {tab === 'carnet' ? 'Clients et contacts DealPro' : 'Un contact par offre ou demande'}
          </Text>
        </YStack>
        <Pressable onPress={onClose} hitSlop={10}>
          <XStack width={40} height={40} borderRadius={14} backgroundColor={colors.card} alignItems="center" justifyContent="center">
            <X size={18} color={colors.black} />
          </XStack>
        </Pressable>
      </XStack>
      {showCarnet ? (
        <XStack gap={8} paddingHorizontal={20} marginBottom={12}>
          {(['carnet', 'directory'] as const).map((item) => {
            const active = tab === item
            return (
              <Pressable key={item} onPress={() => onTab(item)}>
                <YStack
                  height={36}
                  paddingHorizontal={14}
                  borderRadius={12}
                  backgroundColor={active ? colors.emerald : colors.card}
                  justifyContent="center"
                >
                  <Text style={{ ...fonts.semibold, fontSize: 13, color: active ? colors.white : colors.black }}>
                    {item === 'carnet' ? 'Carnet' : 'Répertoire'}
                  </Text>
                </YStack>
              </Pressable>
            )
          })}
        </XStack>
      ) : null}
      <XStack
        backgroundColor={colors.card}
        borderRadius={16}
        marginHorizontal={20}
        marginBottom={12}
        paddingHorizontal={14}
        height={48}
        alignItems="center"
        gap={10}
      >
        <Search size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={onQuery}
          placeholder="Rechercher un nom"
          placeholderTextColor="rgba(17,17,17,0.28)"
          style={{ flex: 1, ...fonts.medium, fontSize: 15, color: colors.black }}
        />
      </XStack>
      {loading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <LogoLoader size={56} label="Répertoire…" />
        </YStack>
      ) : error ? (
        <YStack flex={1} padding={20} gap={16}>
          <Text style={{ ...fonts.medium, color: colors.danger }}>{error}</Text>
          <PrimaryButton label="Fermer" onPress={onClose} />
        </YStack>
      ) : grouped.length === 0 ? (
        <YStack flex={1} padding={20}>
          <Text style={{ ...fonts.medium, color: colors.muted, textAlign: 'center' }}>
            {tab === 'carnet' ? 'Aucun client dans le carnet pour l’instant.' : 'Aucun contact trouvé.'}
          </Text>
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          {grouped.map(([letter, list]) => (
            <YStack key={letter} marginBottom={16}>
              <Text style={{ ...fonts.bold, fontSize: 12, color: colors.indigo, letterSpacing: 1.4, marginBottom: 8 }}>
                {letter}
              </Text>
              {list.map((item) => {
                const selected = pickedId === item.id
                return (
                  <Pressable key={item.id} onPress={() => onToggle(item)}>
                    <XStack
                      backgroundColor={selected ? colors.violetSoft : colors.card}
                      borderRadius={16}
                      padding={12}
                      marginBottom={8}
                      alignItems="center"
                      gap={12}
                    >
                      <YStack
                        width={44}
                        height={44}
                        borderRadius={22}
                        backgroundColor={avatarColor(item.id)}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text style={{ ...fonts.bold, color: colors.white, fontSize: 14 }}>{initials(item.name)}</Text>
                      </YStack>
                      <YStack flex={1}>
                        <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black }}>{item.name}</Text>
                        {item.phone ? (
                          <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>{item.phone}</Text>
                        ) : null}
                      </YStack>
                    </XStack>
                  </Pressable>
                )
              })}
            </YStack>
          ))}
        </ScrollView>
      )}
    </YStack>
  )
}
