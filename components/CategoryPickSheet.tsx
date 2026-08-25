import { FlatIcon, type FlatIconName } from '@/components/FlatIcon'
import { CATEGORIES, categoryMeta } from '@/lib/taxonomy'
import { colors, fonts } from '@/lib/theme'
import type { Category } from '@/lib/types'
import { Modal, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'

export function CategoryPickSheet({
  open,
  counts,
  onClose,
  onPick,
}: {
  open: boolean
  counts?: Partial<Record<Category | 'all', number>>
  onClose: () => void
  onPick: (category: Category | null) => void
}) {
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(6, 78, 59, 0.42)', justifyContent: 'flex-end' }}
      >
        <Pressable onPress={() => undefined}>
          <YStack
            backgroundColor={colors.card}
            borderTopLeftRadius={28}
            borderTopRightRadius={28}
            padding={22}
            paddingBottom={insets.bottom + 18}
            gap={14}
          >
            <YStack
              alignSelf="center"
              width={40}
              height={4}
              borderRadius={99}
              backgroundColor={colors.gray}
            />
            <YStack gap={4}>
              <Text style={{ ...fonts.extra, fontSize: 22, color: colors.black }}>Quelle catégorie ?</Text>
              <Text style={{ ...fonts.medium, fontSize: 14, color: colors.muted, lineHeight: 20 }}>
                Choisis le type de biens à ouvrir.
              </Text>
            </YStack>
            <YStack gap={8}>
              <Row
                icon="tag"
                label="Toutes les offres"
                count={counts?.all}
                onPress={() => onPick(null)}
              />
              {CATEGORIES.map((cat) => (
                <Row
                  key={cat.id}
                  icon={cat.icon}
                  label={categoryMeta(cat.id).label}
                  count={counts?.[cat.id]}
                  onPress={() => onPick(cat.id)}
                />
              ))}
            </YStack>
            <Pressable onPress={onClose}>
              <YStack height={48} alignItems="center" justifyContent="center">
                <Text style={{ ...fonts.semibold, color: colors.muted }}>Annuler</Text>
              </YStack>
            </Pressable>
          </YStack>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Row({
  icon,
  label,
  count,
  onPress,
}: {
  icon: FlatIconName
  label: string
  count?: number
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress}>
      <XStack
        height={52}
        borderRadius={16}
        paddingHorizontal={14}
        alignItems="center"
        gap={12}
        backgroundColor={colors.bg}
      >
        <YStack
          width={36}
          height={36}
          borderRadius={12}
          backgroundColor={colors.emeraldSoft}
          alignItems="center"
          justifyContent="center"
        >
          <FlatIcon name={icon} size={18} color={colors.emerald} />
        </YStack>
        <Text style={{ ...fonts.semibold, fontSize: 15, color: colors.black, flex: 1 }}>{label}</Text>
        {count != null ? (
          <YStack
            minWidth={28}
            height={24}
            paddingHorizontal={8}
            borderRadius={12}
            backgroundColor={colors.gray}
            alignItems="center"
            justifyContent="center"
          >
            <Text style={{ ...fonts.bold, fontSize: 12, color: colors.black }}>{count}</Text>
          </YStack>
        ) : null}
      </XStack>
    </Pressable>
  )
}
