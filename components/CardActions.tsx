import { useAppDialog } from '@/components/AppDialog'
import { colors } from '@/lib/theme'
import { Pencil, Trash2 } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { XStack, YStack } from 'tamagui'

export function CardActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  const { confirm } = useAppDialog()

  const confirmDelete = async () => {
    const ok = await confirm({
      title: 'Supprimer ?',
      message: 'Cette action est définitive. Tu ne pourras pas la récupérer.',
      confirmLabel: 'Supprimer',
      destructive: true,
    })
    if (ok) onDelete()
  }

  return (
    <XStack gap={8}>
      <Pressable
        onPress={(event) => {
          event.stopPropagation?.()
          onEdit()
        }}
        hitSlop={6}
      >
        <YStack
          width={36}
          height={36}
          borderRadius={12}
          backgroundColor={colors.emeraldSoft}
          alignItems="center"
          justifyContent="center"
        >
          <Pencil size={15} color={colors.emerald} />
        </YStack>
      </Pressable>
      <Pressable
        onPress={(event) => {
          event.stopPropagation?.()
          void confirmDelete()
        }}
        hitSlop={6}
      >
        <YStack
          width={36}
          height={36}
          borderRadius={12}
          backgroundColor="#FEE2E2"
          alignItems="center"
          justifyContent="center"
        >
          <Trash2 size={15} color={colors.danger} />
        </YStack>
      </Pressable>
    </XStack>
  )
}
