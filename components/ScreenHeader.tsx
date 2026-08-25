import { colors, fonts } from '@/lib/theme'
import { LogoLockup } from '@/components/Logo'
import { useFormDrawer } from '@/components/FormDrawer'
import { useNavigation, usePathname } from 'expo-router'
import { Menu, Plus } from 'lucide-react-native'
import type { FormKind } from '@/lib/types'
import type { ReactNode } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack } from 'tamagui'

function addKindFromPath(path: string): FormKind {
  if (path.includes('rendez-vous') || path.includes('rendez')) return 'appointment'
  if (path.includes('demand')) return 'demand'
  if (path.includes('client')) return 'client'
  if (path.includes('contact')) return 'contact'
  return 'offer'
}

function HeaderIcon({
  onPress,
  children,
  accent,
}: {
  onPress: () => void
  children: ReactNode
  accent?: boolean
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <XStack
        width={40}
        height={40}
        borderRadius={14}
        backgroundColor={accent ? colors.indigo : colors.card}
        alignItems="center"
        justifyContent="center"
        borderWidth={accent ? 0 : 1}
        borderColor={colors.border}
      >
        {children}
      </XStack>
    </Pressable>
  )
}

export function ScreenHeader({ title, onMenu }: { title?: string; onMenu?: () => void }) {
  const navigation = useNavigation()
  const pathname = usePathname()
  const { openForm } = useFormDrawer()

  const openMenu = () => {
    if (onMenu) {
      onMenu()
      return
    }
    const parent = navigation.getParent() as { openDrawer?: () => void } | undefined
    parent?.openDrawer?.()
  }

  return (
    <XStack alignItems="center" paddingHorizontal={20} paddingTop={8} paddingBottom={12} gap={12}>
      <HeaderIcon onPress={openMenu}>
        <Menu size={20} color={colors.black} />
      </HeaderIcon>
      {title ? (
        <Text
          style={{ ...fonts.extra, fontSize: 28, color: colors.black, letterSpacing: -0.4, flex: 1 }}
          numberOfLines={1}
        >
          {title}
        </Text>
      ) : (
        <XStack flex={1}>
          <LogoLockup />
        </XStack>
      )}
      <HeaderIcon accent onPress={() => openForm(addKindFromPath(pathname))}>
        <Plus size={20} color={colors.white} />
      </HeaderIcon>
    </XStack>
  )
}
