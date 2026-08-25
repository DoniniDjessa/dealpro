import { useAppDialog } from '@/components/AppDialog'
import { useFormDrawer } from '@/components/FormDrawer'
import { FlatIcon } from '@/components/FlatIcon'
import { parseShareDraft } from '@/lib/share'
import { useCategoryFilter } from '@/lib/filter'
import { CATEGORIES, categoryMeta } from '@/lib/taxonomy'
import { colors, fonts } from '@/lib/theme'
import type { Category } from '@/lib/types'
import { useShareIntentContext } from 'expo-share-intent'
import { useEffect, useState } from 'react'
import { Modal, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'

export function ShareCapture() {
  const insets = useSafeAreaInsets()
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext()
  const { openForm } = useFormDrawer()
  const { setCategory } = useCategoryFilter()
  const { show } = useAppDialog()
  const [open, setOpen] = useState(false)
  const [raw, setRaw] = useState('')
  const [link, setLink] = useState('')
  const [network, setNetwork] = useState('Partage')

  useEffect(() => {
    if (!hasShareIntent) {
      setOpen(false)
      return
    }
    const draft = parseShareDraft(shareIntent)
    if (!draft || (!draft.raw && !draft.link)) {
      if (draft?.skippedMedia) {
        show({
          title: 'Média non importé',
          message:
            'DealPro ne reprend que le texte et le lien de l’annonce. Partage la publication en tant que lien ou description, pas le fichier.',
          actions: [{ label: 'Compris', tone: 'primary' }],
        })
      }
      resetShareIntent()
      return
    }
    setRaw(draft.raw)
    setLink(draft.link)
    setNetwork(draft.network)
    setOpen(true)
  }, [hasShareIntent, shareIntent])

  const dismiss = () => {
    setOpen(false)
    resetShareIntent()
  }

  const pick = (category: Category) => {
    setCategory(category)
    openForm('offer', null, { raw, link, category })
    setOpen(false)
    resetShareIntent()
  }

  const preview = [raw, link].filter(Boolean).join('\n').slice(0, 180)

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={dismiss}>
      <Pressable
        onPress={dismiss}
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
              <Text style={{ ...fonts.extra, fontSize: 22, color: colors.black }}>
                Capturer depuis {network}
              </Text>
              <Text style={{ ...fonts.medium, fontSize: 14, color: colors.muted, lineHeight: 20 }}>
                Seuls le texte et le lien sont repris. L’analyse remplira le reste à l’enregistrement.
              </Text>
            </YStack>
            {preview ? (
              <YStack backgroundColor={colors.emeraldSoft} borderRadius={16} padding={14} gap={4}>
                {link ? (
                  <Text style={{ ...fonts.semibold, fontSize: 12, color: colors.emerald }} numberOfLines={1}>
                    {link}
                  </Text>
                ) : null}
                {raw ? (
                  <Text style={{ ...fonts.medium, fontSize: 13, color: colors.darkEmerald }} numberOfLines={3}>
                    {raw}
                  </Text>
                ) : null}
              </YStack>
            ) : null}
            <YStack gap={8}>
              {CATEGORIES.map((cat) => (
                <Pressable key={cat.id} onPress={() => pick(cat.id)}>
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
                      <FlatIcon name={cat.icon} size={18} color={colors.emerald} />
                    </YStack>
                    <Text style={{ ...fonts.semibold, fontSize: 15, color: colors.black, flex: 1 }}>
                      {categoryMeta(cat.id).label}
                    </Text>
                  </XStack>
                </Pressable>
              ))}
            </YStack>
            <Pressable onPress={dismiss}>
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
