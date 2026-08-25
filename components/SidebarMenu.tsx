import { usePathname, useRouter } from 'expo-router'
import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer'
import { ChevronRight, LogOut, Settings } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Image } from 'expo-image'
import { Separator, Text, XStack, YStack } from 'tamagui'
import { FlatIcon, type FlatIconName } from '@/components/FlatIcon'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { useFormDrawer } from '@/components/FormDrawer'
import { useCategoryFilter } from '@/lib/filter'
import { useOffers } from '@/lib/hooks'
import { CATEGORIES, categoryMatches } from '@/lib/taxonomy'
import type { Category } from '@/lib/types'

type Item = {
  key: string
  label: string
  flat?: FlatIconName
  lucide?: typeof Settings
  onPress: () => void
  count?: number
  active?: boolean
  danger?: boolean
}

function MenuRow({ item }: { item: Item }) {
  const LucideIcon = item.lucide
  return (
    <Pressable onPress={item.onPress}>
      <XStack
        backgroundColor={item.active ? colors.emeraldSoft : colors.card}
        borderRadius={16}
        paddingHorizontal={16}
        paddingVertical={12}
        alignItems="center"
        justifyContent="space-between"
        marginBottom={8}
        borderWidth={item.active ? 1 : 0}
        borderColor={item.active ? colors.emerald : 'transparent'}
      >
        <XStack alignItems="center" gap={14} flex={1} paddingRight={8}>
          {item.flat ? (
            <FlatIcon name={item.flat} size={22} color={item.danger ? colors.danger : undefined} />
          ) : LucideIcon ? (
            <LucideIcon size={20} color={item.danger ? colors.danger : item.active ? colors.emerald : colors.black} />
          ) : null}
          <Text
            fontSize={15}
            style={{ ...fonts.semibold }}
            color={item.danger ? colors.danger : item.active ? colors.emerald : colors.black}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        </XStack>
        {item.count != null ? (
          <YStack
            minWidth={28}
            height={24}
            paddingHorizontal={8}
            borderRadius={12}
            backgroundColor={item.active ? colors.emerald : colors.gray}
            alignItems="center"
            justifyContent="center"
          >
            <Text style={{ ...fonts.bold, fontSize: 12, color: item.active ? colors.white : colors.black }}>
              {item.count}
            </Text>
          </YStack>
        ) : (
          <ChevronRight size={18} color={colors.muted} />
        )}
      </XStack>
    </Pressable>
  )
}

export function SidebarMenu(props: DrawerContentComponentProps) {
  const { navigation } = props
  const { signOut, profile } = useAuth()
  const { openForm } = useFormDrawer()
  const { category, setCategory } = useCategoryFilter()
  const { items: offers } = useOffers()
  const router = useRouter()
  const pathname = usePathname()
  const onOffers = pathname.includes('offers')
  const onRdv = pathname.includes('rendez-vous')
  const onClients = pathname.includes('client') && !pathname.includes('contact')

  const go = (
    href: '/(app)/(tabs)' | '/(app)/(tabs)/offers' | '/(app)/(tabs)/demands' | '/(app)/(tabs)/contacts' | '/(app)/(tabs)/clients' | '/(app)/(tabs)/rendez-vous'
  ) => {
    navigation.closeDrawer()
    router.push(href)
  }

  const openCategory = (next: Category | null) => {
    setCategory(next)
    go('/(app)/(tabs)/offers')
  }

  const counts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = offers.filter((offer) => categoryMatches(offer.category, cat.id)).length
    return acc
  }, {})

  const top: Item[] = [
    { key: 'hunt', label: 'Chasse', flat: 'wallet', onPress: () => go('/(app)/(tabs)') },
    {
      key: 'all-offers',
      label: 'Toutes les offres',
      flat: 'tag',
      count: offers.length,
      active: onOffers && category === null,
      onPress: () => openCategory(null),
    },
  ]

  const categories: Item[] = CATEGORIES.map((cat) => ({
    key: cat.id,
    label: cat.label,
    flat: cat.icon,
    count: counts[cat.id] ?? 0,
    active: onOffers && category === cat.id,
    onPress: () => openCategory(cat.id),
  }))

  const bottom: Item[] = [
    { key: 'demands', label: 'Demandes', flat: 'todo', onPress: () => go('/(app)/(tabs)/demands') },
    {
      key: 'clients',
      label: 'Clients',
      flat: 'flag',
      active: onClients,
      onPress: () => go('/(app)/(tabs)/clients'),
    },
    { key: 'contacts', label: 'Contacts', flat: 'users', onPress: () => go('/(app)/(tabs)/contacts') },
    {
      key: 'rdv',
      label: 'Rendez-vous',
      flat: 'calendar',
      active: onRdv,
      onPress: () => go('/(app)/(tabs)/rendez-vous'),
    },
    {
      key: 'settings',
      label: 'Paramètres',
      lucide: Settings,
      onPress: () => {
        navigation.closeDrawer()
        openForm('settings')
      },
    },
    {
      key: 'logout',
      label: 'Déconnexion',
      lucide: LogOut,
      danger: true,
      onPress: async () => {
        navigation.closeDrawer()
        await signOut()
      },
    },
  ]

  return (
    <DrawerContentScrollView
      {...props}
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, backgroundColor: colors.bg }}
    >
      <XStack alignItems="center" gap={12} paddingTop={12} paddingBottom={14}>
        <YStack position="relative">
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.black }}
            contentFit="cover"
            cachePolicy="none"
          />
          <YStack
            position="absolute"
            right={-2}
            bottom={-2}
            width={14}
            height={14}
            borderRadius={7}
            backgroundColor={colors.emerald}
            alignItems="center"
            justifyContent="center"
            borderWidth={2}
            borderColor={colors.bg}
          />
        </YStack>
        <YStack flex={1}>
          <XStack alignItems="center" gap={8}>
            <Text style={{ ...fonts.extra, fontSize: 16, color: colors.black, flexShrink: 1 }} numberOfLines={1}>
              {profile?.display_name || profile?.pseudo || 'DealPro'}
            </Text>
            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }} numberOfLines={1}>
              Carnet privé
            </Text>
          </XStack>
        </YStack>
      </XStack>
      <Separator marginBottom={16} borderColor={colors.border} />
      {top.map((item) => (
        <MenuRow key={item.key} item={item} />
      ))}
      <Text
        style={{
          ...fonts.bold,
          fontSize: 10,
          color: colors.muted,
          letterSpacing: 1.4,
          marginTop: 8,
          marginBottom: 10,
          marginLeft: 4,
        }}
      >
        CATÉGORIES
      </Text>
      {categories.map((item) => (
        <MenuRow key={item.key} item={item} />
      ))}
      <Separator marginVertical={12} borderColor={colors.border} />
      {bottom.map((item) => (
        <MenuRow key={item.key} item={item} />
      ))}
      <Text
        style={{
          ...fonts.medium,
          fontSize: 11,
          color: colors.muted,
          textAlign: 'center',
          marginTop: 18,
          marginBottom: 8,
        }}
      >
        Icônes d’écrans par Flaticon.com
      </Text>
    </DrawerContentScrollView>
  )
}
