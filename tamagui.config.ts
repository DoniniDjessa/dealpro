import { defaultConfig } from '@tamagui/config/v5'
import { createFont, createTamagui } from 'tamagui'

const jakarta = createFont({
  family: 'PlusJakartaSans_400Regular',
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 16,
    6: 18,
    7: 20,
    8: 24,
    9: 32,
    10: 40,
    true: 16,
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 20,
    4: 22,
    5: 24,
    6: 26,
    7: 28,
    8: 32,
    9: 40,
    10: 48,
    true: 24,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
    8: '800',
    true: '400',
  },
  letterSpacing: {
    4: 0,
    true: 0,
  },
  face: {
    400: { normal: 'PlusJakartaSans_400Regular' },
    500: { normal: 'PlusJakartaSans_500Medium' },
    600: { normal: 'PlusJakartaSans_600SemiBold' },
    700: { normal: 'PlusJakartaSans_700Bold' },
    800: { normal: 'PlusJakartaSans_800ExtraBold' },
  },
})

const tamaguiConfig = createTamagui({
  ...defaultConfig,
  fonts: {
    ...defaultConfig.fonts,
    heading: jakarta,
    body: jakarta,
  },
})

export default tamaguiConfig

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
