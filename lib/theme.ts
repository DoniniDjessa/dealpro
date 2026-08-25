export const colors = {
  emerald: '#059669',
  darkEmerald: '#064E3B',
  orange: '#F97316',
  orangeSoft: '#FFF4E8',
  emeraldSoft: '#E8F8F1',

  black: '#111111',
  text: '#111111',
  muted: '#8C8C94',
  gray: '#EDEDF2',
  bg: '#F5F5F8',
  card: '#FFFFFF',
  white: '#FFFFFF',
  border: '#EDEDF2',
  shadow: '#111111',

  tabBar: '#111111',
  tabIcon: '#FFFFFF',
  tabActive: '#059669',
  dark: '#064E3B',
  darkSoft: '#0B3D30',

  danger: '#DC2626',
  success: '#059669',
  warning: '#F97316',

  /** @deprecated use emerald */
  indigo: '#059669',
  /** @deprecated use darkEmerald */
  indigoDeep: '#064E3B',
  /** @deprecated use orange */
  violet: '#F97316',
  /** @deprecated use orange */
  violetLight: '#FB923C',
  /** @deprecated use emeraldSoft */
  violetSoft: '#E8F8F1',
}

export const fonts = {
  regular: { fontFamily: 'PlusJakartaSans_400Regular' as const },
  medium: { fontFamily: 'PlusJakartaSans_500Medium' as const },
  semibold: { fontFamily: 'PlusJakartaSans_600SemiBold' as const },
  bold: { fontFamily: 'PlusJakartaSans_700Bold' as const },
  extra: { fontFamily: 'PlusJakartaSans_800ExtraBold' as const },
}

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
}
