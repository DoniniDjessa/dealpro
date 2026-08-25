import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { Star } from 'lucide-react-native'
import { colors, fonts } from '@/lib/theme'
import { formatFcfa } from '@/lib/format'
import { categoryMeta, VERIFICATION_META } from '@/lib/taxonomy'
import type { Demand, Offer } from '@/lib/types'
import { SummaryBalloon } from '@/components/SummaryBalloon'
import { CardActions } from '@/components/CardActions'

export function OfferCard({
  item,
  onPress,
  onEdit,
  onDelete,
}: {
  item: Offer
  onPress: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const cat = categoryMeta(item.category)
  const verif = VERIFICATION_META[item.verification]
  return (
    <Pressable onPress={onPress}>
      <YStack
        backgroundColor={colors.card}
        borderRadius={24}
        padding={16}
        marginBottom={12}
        overflow="hidden"
        borderWidth={1}
        borderColor={item.important ? colors.orange : colors.border}
      >
        <SummaryBalloon id={`offer-${item.id}`} size={140} color={colors.indigo} opacity={0.1} style={{ right: -40, top: -50 }} />
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1} paddingRight={12}>
            <XStack alignItems="center" gap={6}>
              <Text style={{ ...fonts.medium, fontSize: 11, color: colors.indigo }}>
                {cat.emoji} {cat.label}
              </Text>
              {item.important ? <Star size={12} color={colors.orange} fill={colors.orange} /> : null}
            </XStack>
            <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black, marginTop: 4 }}>{item.title}</Text>
            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {[item.location, item.rooms ? `${item.rooms} pièce${item.rooms > 1 ? 's' : ''}` : null]
                .filter(Boolean)
                .join(' · ') || 'Lieu non renseigné'}
            </Text>
          </YStack>
          <YStack alignItems="flex-end">
            <Text style={{ ...fonts.extra, fontSize: 16, color: colors.black }}>{formatFcfa(item.price)}</Text>
          </YStack>
        </XStack>
        <XStack marginTop={12} gap={8} alignItems="center" justifyContent="space-between">
          <XStack gap={8} flex={1} flexWrap="wrap">
            <YStack backgroundColor={colors.violetSoft} borderRadius={12} paddingHorizontal={10} paddingVertical={4}>
              <Text style={{ ...fonts.semibold, fontSize: 11, color: verif.color }}>{verif.label}</Text>
            </YStack>
            <YStack backgroundColor={colors.bg} borderRadius={12} paddingHorizontal={10} paddingVertical={4}>
              <Text style={{ ...fonts.medium, fontSize: 11, color: colors.muted }}>Fiabilité {item.reliability}/100</Text>
            </YStack>
          </XStack>
          {onEdit && onDelete ? <CardActions onEdit={onEdit} onDelete={onDelete} /> : null}
        </XStack>
        {(item.tags || []).length ? (
          <XStack flexWrap="wrap" gap={6} marginTop={10}>
            {(item.tags || []).slice(0, 4).map((tag) => (
              <YStack key={tag} backgroundColor={colors.emeraldSoft} borderRadius={10} paddingHorizontal={8} paddingVertical={3}>
                <Text style={{ ...fonts.medium, fontSize: 10, color: colors.emerald }}>{tag}</Text>
              </YStack>
            ))}
          </XStack>
        ) : null}
      </YStack>
    </Pressable>
  )
}

export function DemandCard({
  item,
  onPress,
  onEdit,
  onDelete,
}: {
  item: Demand
  onPress: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const cat = categoryMeta(item.category)
  const budget =
    item.budget_min || item.budget_max
      ? `${formatFcfa(item.budget_min || 0)} – ${formatFcfa(item.budget_max || 0)}`
      : 'Budget libre'
  return (
    <Pressable onPress={onPress}>
      <YStack backgroundColor={colors.card} borderRadius={24} padding={16} marginBottom={12} borderWidth={1} borderColor={colors.border}>
        <XStack justifyContent="space-between" alignItems="flex-start" gap={8}>
          <YStack flex={1}>
            <Text style={{ ...fonts.medium, fontSize: 11, color: colors.indigo }}>
              {cat.emoji} {cat.label}
            </Text>
            <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black, marginTop: 4 }}>{item.title}</Text>
            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {item.location || 'Zone libre'} · {budget}
            </Text>
            {item.contact?.name ? (
              <Text style={{ ...fonts.semibold, fontSize: 12, color: colors.orange, marginTop: 6 }}>
                Client · {item.contact.name}
              </Text>
            ) : null}
          </YStack>
          {onEdit && onDelete ? <CardActions onEdit={onEdit} onDelete={onDelete} /> : null}
        </XStack>
      </YStack>
    </Pressable>
  )
}
