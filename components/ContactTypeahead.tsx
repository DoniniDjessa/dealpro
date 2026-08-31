import { colors, fonts } from '@/lib/theme'
import { foldSearch } from '@/lib/search'
import type { Contact, DirectoryPerson } from '@/lib/types'
import { X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, TextInput } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function ContactTypeahead({
  contacts,
  person,
  onChange,
  label = 'CONTACT DU CARNET',
  hint = 'Tape au moins 2 lettres pour proposer un contact',
}: {
  contacts: Contact[]
  person: DirectoryPerson | null
  onChange: (person: DirectoryPerson | null) => void
  label?: string
  hint?: string
}) {
  const [query, setQuery] = useState('')
  const suggestions = useMemo(() => {
    const q = foldSearch(query)
    if (q.length < 2) return []
    return contacts
      .filter((item) => {
        const blob = foldSearch([item.name, item.phone, ...(item.phones || [])].filter(Boolean).join(' '))
        return blob.includes(q)
      })
      .slice(0, 8)
  }, [contacts, query])

  if (person) {
    return (
      <YStack gap={8}>
        <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4, marginLeft: 4 }}>
          {label}
        </Text>
        <XStack
          backgroundColor={colors.emeraldSoft}
          borderRadius={16}
          paddingHorizontal={16}
          paddingVertical={14}
          alignItems="center"
          justifyContent="space-between"
          borderWidth={1}
          borderColor={colors.emerald}
        >
          <YStack flex={1} paddingRight={12}>
            <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black }}>{person.name}</Text>
            {person.phone ? (
              <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginTop: 2 }}>{person.phone}</Text>
            ) : null}
          </YStack>
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <XStack
              width={36}
              height={36}
              borderRadius={12}
              backgroundColor={colors.card}
              alignItems="center"
              justifyContent="center"
            >
              <X size={16} color={colors.orange} />
            </XStack>
          </Pressable>
        </XStack>
      </YStack>
    )
  }

  return (
    <YStack gap={8}>
      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4, marginLeft: 4 }}>
        {label}
      </Text>
      <XStack
        backgroundColor={colors.card}
        borderRadius={16}
        paddingHorizontal={16}
        height={56}
        alignItems="center"
        borderWidth={1}
        borderColor={colors.border}
      >
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tape un nom (2 lettres min.)"
          placeholderTextColor="rgba(17,17,17,0.28)"
          autoCorrect={false}
          autoCapitalize="words"
          style={{ flex: 1, ...fonts.regular, fontSize: 16, color: colors.black }}
        />
      </XStack>
      <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginLeft: 4 }}>{hint}</Text>
      {suggestions.length ? (
        <YStack gap={6}>
          {suggestions.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                onChange({ id: item.id, name: item.name, phone: item.phone, fromApp: true })
                setQuery('')
              }}
            >
              <XStack
                backgroundColor={colors.card}
                borderRadius={14}
                paddingHorizontal={14}
                paddingVertical={12}
                borderWidth={1}
                borderColor={colors.border}
                justifyContent="space-between"
                alignItems="center"
              >
                <Text style={{ ...fonts.semibold, fontSize: 15, color: colors.black }}>{item.name}</Text>
                {item.phone ? (
                  <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>{item.phone}</Text>
                ) : null}
              </XStack>
            </Pressable>
          ))}
        </YStack>
      ) : query.trim().length >= 2 ? (
        <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginLeft: 4 }}>
          Aucun contact pour « {query.trim()} »
        </Text>
      ) : null}
    </YStack>
  )
}
