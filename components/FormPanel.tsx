import { colors, fonts } from '@/lib/theme'
import { PrimaryButton } from '@/components/PrimaryButton'
import { X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native'
import { useAppDialog } from '@/components/AppDialog'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Separator, Text, XStack, YStack } from 'tamagui'

export function FormPanel({
  title,
  children,
  onSave,
  onClose,
  onDelete,
  busy,
  disabled,
  saveLabel = 'Enregistrer',
}: {
  title: string
  children: ReactNode
  onSave: () => void
  onClose: () => void
  onDelete?: () => void
  busy?: boolean
  disabled?: boolean
  saveLabel?: string
}) {
  const insets = useSafeAreaInsets()
  const { confirm } = useAppDialog()

  const confirmDelete = async () => {
    const ok = await confirm({
      title: 'Supprimer ?',
      message: 'Cette action est définitive. Tu ne pourras pas la récupérer.',
      confirmLabel: 'Supprimer',
      destructive: true,
    })
    if (ok) onDelete?.()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal={20}
          paddingTop={insets.top + 28}
          paddingBottom={16}
        >
          <Text style={{ ...fonts.extra, fontSize: 22, color: colors.black, flex: 1, paddingRight: 12 }}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <XStack
              width={40}
              height={40}
              borderRadius={16}
              backgroundColor={colors.card}
              alignItems="center"
              justifyContent="center"
            >
              <X size={18} color={colors.black} />
            </XStack>
          </Pressable>
        </XStack>
        <Separator borderColor={colors.border} />
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 12, gap: 12, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        <YStack padding={20} paddingTop={8} gap={10}>
          <PrimaryButton label={saveLabel} onPress={onSave} loading={busy} disabled={busy || disabled} />
          {onDelete ? (
            <Pressable onPress={() => void confirmDelete()} disabled={busy}>
              <YStack height={48} alignItems="center" justifyContent="center">
                <Text style={{ ...fonts.semibold, color: colors.danger }}>Supprimer</Text>
              </YStack>
            </Pressable>
          ) : null}
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
