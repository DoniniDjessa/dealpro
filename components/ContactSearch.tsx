import { colors, fonts } from '@/lib/theme'
import {
  EMPTY_CONTACT_FILTERS,
  contactFiltersActive,
  foldSearch,
  toggleContactFilterValue,
  uniqueContactFieldValues,
  type ContactFilterField,
  type ContactFilters,
} from '@/lib/search'
import { ChevronDown, Filter, Search, X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, TextInput } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

const FIELDS: { id: ContactFilterField; label: string; placeholder: string }[] = [
  { id: 'localisation', label: 'LOCALISATION', placeholder: 'Cocody, Yopougon…' },
  { id: 'secteur', label: 'SECTEUR', placeholder: 'immo, auto…' },
  { id: 'specialite', label: 'SPÉCIALITÉ', placeholder: 'Villa, terrain…' },
]

function FieldMultiSelect({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: {
  label: string
  placeholder: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(false)
  const suggestions = useMemo(() => {
    const q = foldSearch(draft)
    return options.filter((option) => {
      const key = foldSearch(option)
      if (selected.some((item) => foldSearch(item) === key)) return false
      return !q || key.includes(q)
    })
  }, [draft, options, selected])

  const addValue = (value: string) => {
    const next = toggleContactFilterValue(selected, value)
    if (next !== selected) onChange(next)
    setDraft('')
    setOpen(false)
  }

  return (
    <YStack gap={8}>
      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4 }}>{label}</Text>
      {selected.length ? (
        <XStack flexWrap="wrap" gap={6}>
          {selected.map((value) => (
            <Pressable key={value} onPress={() => onChange(toggleContactFilterValue(selected, value))}>
              <YStack backgroundColor={colors.emerald} borderRadius={12} paddingHorizontal={10} paddingVertical={6}>
                <Text style={{ ...fonts.semibold, fontSize: 12, color: colors.white }}>{value} ×</Text>
              </YStack>
            </Pressable>
          ))}
        </XStack>
      ) : null}
      <XStack
        backgroundColor={colors.card}
        borderRadius={14}
        paddingHorizontal={12}
        height={44}
        alignItems="center"
        borderWidth={1}
        borderColor={open ? colors.emerald : colors.border}
      >
        <TextInput
          value={draft}
          onChangeText={(value) => {
            setDraft(value)
            setOpen(true)
          }}
          placeholder={placeholder}
          placeholderTextColor="rgba(17,17,17,0.28)"
          onFocus={() => setOpen(true)}
          onSubmitEditing={() => {
            if (draft.trim()) addValue(draft)
          }}
          style={{ flex: 1, ...fonts.medium, fontSize: 14, color: colors.black }}
        />
        <Pressable onPress={() => setOpen((value) => !value)} hitSlop={8}>
          <ChevronDown size={16} color={colors.muted} />
        </Pressable>
      </XStack>
      {open ? (
        <YStack
          maxHeight={188}
          borderWidth={1}
          borderColor={colors.border}
          borderRadius={14}
          overflow="hidden"
          backgroundColor={colors.card}
        >
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{ maxHeight: 188 }}>
            {suggestions.length ? (
              suggestions.map((option) => (
                <Pressable key={option} onPress={() => addValue(option)}>
                  <YStack paddingHorizontal={12} paddingVertical={10} borderBottomWidth={1} borderBottomColor={colors.gray}>
                    <Text style={{ ...fonts.medium, fontSize: 14, color: colors.black }}>{option}</Text>
                  </YStack>
                </Pressable>
              ))
            ) : draft.trim() ? (
              <Pressable onPress={() => addValue(draft)}>
                <YStack paddingHorizontal={12} paddingVertical={10}>
                  <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.emerald }}>
                    Ajouter « {draft.trim()} »
                  </Text>
                </YStack>
              </Pressable>
            ) : (
              <YStack paddingHorizontal={12} paddingVertical={10}>
                <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>Aucune option</Text>
              </YStack>
            )}
          </ScrollView>
        </YStack>
      ) : null}
    </YStack>
  )
}

export function ContactSearch({
  contacts,
  query,
  onQueryChange,
  filters,
  onFiltersChange,
}: {
  contacts: { localisation?: string | null; secteur?: string | null; specialite?: string | null }[]
  query: string
  onQueryChange: (value: string) => void
  filters: ContactFilters
  onFiltersChange: (next: ContactFilters) => void
}) {
  const [open, setOpen] = useState(false)
  const active = contactFiltersActive(filters)
  const options = useMemo(
    () => ({
      localisation: uniqueContactFieldValues(contacts, 'localisation'),
      secteur: uniqueContactFieldValues(contacts, 'secteur'),
      specialite: uniqueContactFieldValues(contacts, 'specialite'),
    }),
    [contacts]
  )

  return (
    <YStack marginBottom={12} gap={8}>
      <XStack gap={8} alignItems="center">
        <XStack
          flex={1}
          backgroundColor={colors.card}
          borderRadius={16}
          paddingHorizontal={14}
          height={48}
          alignItems="center"
          gap={10}
          borderWidth={1}
          borderColor={colors.border}
        >
          <Search size={16} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Nom ou numéro…"
            placeholderTextColor="rgba(17,17,17,0.28)"
            style={{ flex: 1, ...fonts.medium, fontSize: 14, color: colors.black }}
          />
          {query ? (
            <Pressable onPress={() => onQueryChange('')} hitSlop={8}>
              <X size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </XStack>
        <Pressable onPress={() => setOpen((value) => !value)}>
          <YStack
            width={48}
            height={48}
            borderRadius={16}
            alignItems="center"
            justifyContent="center"
            backgroundColor={active || open ? colors.emeraldSoft : colors.card}
            borderWidth={1}
            borderColor={active || open ? colors.emerald : colors.border}
          >
            <Filter size={18} color={active || open ? colors.emerald : colors.muted} />
          </YStack>
        </Pressable>
      </XStack>
      {open ? (
        <YStack
          backgroundColor={colors.card}
          borderRadius={20}
          padding={14}
          gap={14}
          borderWidth={1}
          borderColor={colors.border}
        >
          {FIELDS.map((field) => (
            <FieldMultiSelect
              key={field.id}
              label={field.label}
              placeholder={field.placeholder}
              options={options[field.id]}
              selected={filters[field.id]}
              onChange={(next) => onFiltersChange({ ...filters, [field.id]: next })}
            />
          ))}
          {active ? (
            <Pressable onPress={() => onFiltersChange(EMPTY_CONTACT_FILTERS)}>
              <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.orange }}>Réinitialiser</Text>
            </Pressable>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  )
}
