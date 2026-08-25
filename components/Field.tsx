import { colors, fonts } from '@/lib/theme'
import type { ComponentType, ReactNode } from 'react'
import { View } from 'react-native'
import { Input, Text, XStack, YStack, type InputProps } from 'tamagui'

export function Field({
  label,
  icon: Icon,
  right,
  ...inputProps
}: InputProps & {
  label?: string
  icon?: ComponentType<{ size?: number; color?: string }>
  right?: ReactNode
}) {
  return (
    <YStack gap={8}>
      {label ? (
        <Text
          style={{
            ...fonts.bold,
            fontSize: 10,
            color: colors.indigo,
            letterSpacing: 1.4,
            marginLeft: 4,
          }}
        >
          {label}
        </Text>
      ) : null}
      <XStack alignItems="center" backgroundColor={colors.card} borderRadius={16} paddingHorizontal={4} borderWidth={1} borderColor={colors.border}>
        {Icon ? (
          <View style={{ paddingLeft: 12 }}>
            <Icon size={18} color={colors.muted} />
          </View>
        ) : null}
        <Input
          flex={1}
          borderWidth={0}
          backgroundColor="transparent"
          color={colors.text}
          height={56}
          placeholderTextColor="rgba(17,17,17,0.28)"
          paddingLeft={Icon ? 10 : 16}
          paddingRight={right ? 4 : 16}
          style={fonts.regular}
          {...inputProps}
        />
        {right}
      </XStack>
    </YStack>
  )
}
