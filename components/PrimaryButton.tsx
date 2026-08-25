import { colors, fonts } from '@/lib/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { ActivityIndicator, Pressable } from 'react-native'
import { Text } from 'tamagui'

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={{ opacity: disabled || loading ? 0.45 : 1 }}>
      <LinearGradient
        colors={[colors.emerald, colors.darkEmerald]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={{ ...fonts.bold, color: colors.white, fontSize: 15, letterSpacing: 0.6 }}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  )
}
