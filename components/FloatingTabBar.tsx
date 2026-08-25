import { FlatIcon, type FlatIconName } from '@/components/FlatIcon'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts } from '@/lib/theme'

const items: { name: string; icon: FlatIconName; label: string }[] = [
  { name: 'index', icon: 'wallet', label: 'Chasse' },
  { name: 'offers', icon: 'tag', label: 'Offres' },
  { name: 'demands', icon: 'todo', label: 'Demandes' },
  { name: 'contacts', icon: 'users', label: 'Contacts' },
]

type TabBarProps = {
  state: { index: number; routes: { name: string }[] }
  navigation: {
    navigate: (name: string) => void
    getParent?: () => { openDrawer?: () => void } | undefined
  }
}

export function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets()
  const current = state.routes[state.index]?.name

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {items.map((item) => {
          const focused = current === item.name
          return (
            <Pressable key={item.name} onPress={() => navigation.navigate(item.name)} style={styles.item} hitSlop={8}>
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <FlatIcon name={item.icon} size={22} color={focused ? colors.dark : 'rgba(255,255,255,0.72)'} />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 18,
    zIndex: 100,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.tabBar,
    borderRadius: 32,
    paddingHorizontal: 10,
    height: 68,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 36,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: colors.tabActive,
    width: 40,
    borderRadius: 12,
  },
  label: {
    ...fonts.regular,
    fontSize: 9,
    color: 'rgba(255,255,255,0.38)',
  },
  labelActive: {
    ...fonts.bold,
    color: colors.tabActive,
  },
})
