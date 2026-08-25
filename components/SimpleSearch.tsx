import { colors, fonts } from '@/lib/theme'
import { Search, X } from 'lucide-react-native'
import { Pressable, TextInput } from 'react-native'
import { XStack } from 'tamagui'

export function SimpleSearch({
  value,
  onChange,
  placeholder = 'Rechercher…',
}: {
  value: string
  onChange: (text: string) => void
  placeholder?: string
}) {
  return (
    <XStack
      marginBottom={12}
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
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(17,17,17,0.28)"
        style={{ flex: 1, ...fonts.medium, fontSize: 14, color: colors.black }}
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <X size={16} color={colors.muted} />
        </Pressable>
      ) : null}
    </XStack>
  )
}
