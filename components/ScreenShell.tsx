import { colors, fonts } from '@/lib/theme'
import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, YStack } from 'tamagui'
import { ScreenHeader } from '@/components/ScreenHeader'
import { LogoLoader } from '@/components/Logo'

export function ScreenShell({
  title,
  children,
  loading,
  error,
}: {
  title?: string
  children: ReactNode
  loading?: boolean
  error?: string | null
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <YStack flex={1} backgroundColor={colors.bg}>
        <ScreenHeader title={title} />
        {error ? (
          <YStack paddingHorizontal={20} paddingBottom={8}>
            <Text style={{ ...fonts.medium, color: colors.danger, fontSize: 13 }}>{error}</Text>
          </YStack>
        ) : null}
        {loading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <LogoLoader />
          </YStack>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        )}
      </YStack>
    </SafeAreaView>
  )
}
