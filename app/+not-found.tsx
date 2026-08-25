import { Link, Stack } from 'expo-router'
import { Text, YStack } from 'tamagui'
import { colors } from '@/lib/theme'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Introuvable' }} />
      <YStack flex={1} alignItems="center" justifyContent="center" padding={24} backgroundColor={colors.bg} gap={12}>
        <Text fontSize={20} fontWeight="800">
          Cette page n'existe pas.
        </Text>
        <Link href="/(app)/(tabs)">
          <Text color={colors.indigo} fontWeight="700">
            Retour à la chasse
          </Text>
        </Link>
      </YStack>
    </>
  )
}
