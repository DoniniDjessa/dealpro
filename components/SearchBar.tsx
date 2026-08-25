import { colors, fonts } from '@/lib/theme'
import {
  EMPTY_SEARCH,
  POPULAR_TAGS,
  PRICE_PRESETS,
  searchHasExtras,
  splitSearchTerms,
  type SearchFeature,
  type SearchQuery,
} from '@/lib/search'
import { Filter, Search, X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'

export function SearchBar({
  value,
  onChange,
  placeholder = 'Rechercher… (séparez par des virgules)',
  features = [],
}: {
  value: SearchQuery
  onChange: (next: SearchQuery) => void
  placeholder?: string
  features?: SearchFeature[]
}) {
  const [open, setOpen] = useState(false)
  const terms = useMemo(() => splitSearchTerms(value.text), [value.text])
  const extras = searchHasExtras(value)
  const showFilters = features.length > 0

  const removeTerm = (term: string) => {
    const next = value.text
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item && item.toLowerCase() !== term)
    onChange({ ...value, text: next.join(', ') })
  }

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
            value={value.text}
            onChangeText={(text) => onChange({ ...value, text })}
            placeholder={placeholder}
            placeholderTextColor="rgba(17,17,17,0.28)"
            style={{ flex: 1, ...fonts.medium, fontSize: 14, color: colors.black }}
          />
          {value.text ? (
            <Pressable onPress={() => onChange({ ...value, text: '' })} hitSlop={8}>
              <X size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </XStack>
        {showFilters ? (
          <Pressable onPress={() => setOpen(true)}>
            <YStack
              width={48}
              height={48}
              borderRadius={16}
              backgroundColor={extras ? colors.emerald : colors.card}
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor={extras ? colors.emerald : colors.border}
            >
              <Filter size={18} color={extras ? colors.white : colors.black} />
            </YStack>
          </Pressable>
        ) : null}
      </XStack>

      {terms.length ? (
        <XStack flexWrap="wrap" gap={6}>
          {terms.map((term) => (
            <Pressable key={term} onPress={() => removeTerm(term)}>
              <XStack
                backgroundColor={colors.emeraldSoft}
                borderRadius={10}
                paddingHorizontal={8}
                paddingVertical={4}
                alignItems="center"
                gap={4}
              >
                <Text style={{ ...fonts.medium, fontSize: 11, color: colors.emerald }}>{term}</Text>
                <X size={10} color={colors.emerald} />
              </XStack>
            </Pressable>
          ))}
        </XStack>
      ) : null}

      {showFilters ? (
        <FilterSheet
          open={open}
          features={features}
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </YStack>
  )
}

function FilterSheet({
  open,
  features,
  value,
  onChange,
  onClose,
}: {
  open: boolean
  features: SearchFeature[]
  value: SearchQuery
  onChange: (next: SearchQuery) => void
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const priceLabel = features.includes('budget') ? 'Budget (FCFA)' : 'Gamme de prix (FCFA)'
  const roomsLabel = features.includes('budget') ? 'Superficie / pièces' : 'Nombre de pièces'

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor={colors.bg} paddingTop={insets.top + 8}>
        <XStack alignItems="center" justifyContent="space-between" paddingHorizontal={20} paddingBottom={12}>
          <Text style={{ ...fonts.extra, fontSize: 22, color: colors.black }}>Filtres</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <YStack
              width={40}
              height={40}
              borderRadius={14}
              backgroundColor={colors.card}
              alignItems="center"
              justifyContent="center"
            >
              <X size={18} color={colors.black} />
            </YStack>
          </Pressable>
        </XStack>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 18 }}>
          {features.includes('price') || features.includes('budget') ? (
            <YStack gap={10}>
              <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.2 }}>
                {priceLabel.toUpperCase()}
              </Text>
              <XStack gap={8}>
                <FilterField
                  label="Min"
                  value={value.priceMin}
                  onChange={(priceMin) => onChange({ ...value, priceMin })}
                />
                <FilterField
                  label="Max"
                  value={value.priceMax}
                  onChange={(priceMax) => onChange({ ...value, priceMax })}
                />
              </XStack>
              <XStack flexWrap="wrap" gap={6}>
                {PRICE_PRESETS.map((preset) => {
                  const active = value.priceMin === preset.min && value.priceMax === preset.max
                  return (
                    <Pressable
                      key={preset.label}
                      onPress={() => onChange({ ...value, priceMin: preset.min, priceMax: preset.max })}
                    >
                      <Chip label={preset.label} active={active} />
                    </Pressable>
                  )
                })}
              </XStack>
            </YStack>
          ) : null}

          {features.includes('rooms') ? (
            <YStack gap={10}>
              <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.2 }}>
                {roomsLabel.toUpperCase()}
              </Text>
              <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>Minimum</Text>
              <XStack flexWrap="wrap" gap={6}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Pressable key={`min-${n}`} onPress={() => onChange({ ...value, roomsMin: value.roomsMin === n ? null : n })}>
                    <Chip label={n === 6 ? '6+' : String(n)} active={value.roomsMin === n} />
                  </Pressable>
                ))}
              </XStack>
              <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>Maximum</Text>
              <XStack flexWrap="wrap" gap={6}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Pressable key={`max-${n}`} onPress={() => onChange({ ...value, roomsMax: value.roomsMax === n ? null : n })}>
                    <Chip label={n === 6 ? '6+' : String(n)} active={value.roomsMax === n} />
                  </Pressable>
                ))}
              </XStack>
            </YStack>
          ) : null}

          {features.includes('tags') ? (
            <YStack gap={10}>
              <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.2 }}>TAGS</Text>
              <XStack flexWrap="wrap" gap={6}>
                {POPULAR_TAGS.map((tag) => {
                  const active = value.tags.includes(tag)
                  return (
                    <Pressable
                      key={tag}
                      onPress={() =>
                        onChange({
                          ...value,
                          tags: active ? value.tags.filter((item) => item !== tag) : [...value.tags, tag],
                        })
                      }
                    >
                      <Chip label={tag} active={active} />
                    </Pressable>
                  )
                })}
              </XStack>
            </YStack>
          ) : null}
        </ScrollView>
        <XStack paddingHorizontal={20} paddingBottom={insets.bottom + 16} gap={10}>
          <Pressable
            onPress={() => onChange({ ...EMPTY_SEARCH, text: value.text })}
            style={{ flex: 1 }}
          >
            <YStack
              height={48}
              borderRadius={16}
              backgroundColor={colors.card}
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor={colors.border}
            >
              <Text style={{ ...fonts.semibold, color: colors.black }}>Effacer</Text>
            </YStack>
          </Pressable>
          <Pressable onPress={onClose} style={{ flex: 1 }}>
            <YStack height={48} borderRadius={16} backgroundColor={colors.emerald} alignItems="center" justifyContent="center">
              <Text style={{ ...fonts.semibold, color: colors.white }}>OK</Text>
            </YStack>
          </Pressable>
        </XStack>
      </YStack>
    </Modal>
  )
}

function Chip({ label, active }: { label: string; active: boolean }) {
  return (
    <YStack
      backgroundColor={active ? colors.emerald : colors.card}
      borderRadius={12}
      paddingHorizontal={10}
      paddingVertical={6}
      borderWidth={1}
      borderColor={active ? colors.emerald : colors.border}
    >
      <Text style={{ ...fonts.semibold, fontSize: 12, color: active ? colors.white : colors.black }}>{label}</Text>
    </YStack>
  )
}

function FilterField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (next: number | null) => void
}) {
  return (
    <YStack flex={1} gap={6}>
      <Text style={{ ...fonts.medium, fontSize: 11, color: colors.muted }}>{label}</Text>
      <XStack
        backgroundColor={colors.card}
        borderRadius={14}
        height={44}
        paddingHorizontal={12}
        alignItems="center"
        borderWidth={1}
        borderColor={colors.border}
      >
        <TextInput
          value={value == null ? '' : String(value)}
          onChangeText={(raw) => {
            const digits = raw.replace(/[^\d]/g, '')
            onChange(digits ? Number(digits) : null)
          }}
          keyboardType="numeric"
          placeholder="Libre"
          placeholderTextColor="rgba(17,17,17,0.28)"
          style={{ flex: 1, ...fonts.medium, fontSize: 14, color: colors.black }}
        />
      </XStack>
    </YStack>
  )
}
