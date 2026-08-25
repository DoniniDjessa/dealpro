import { colors, fonts } from '@/lib/theme'
import DateTimePicker from '@react-native-community/datetimepicker'
import { FlatIcon, type FlatIconName } from '@/components/FlatIcon'
import { useState } from 'react'
import { Platform, Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: FlatIconName
  label: string
  value: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress}>
      <XStack
        backgroundColor={colors.card}
        borderRadius={16}
        paddingHorizontal={16}
        paddingVertical={14}
        alignItems="center"
        gap={14}
      >
        <FlatIcon name={icon} size={22} />
        <YStack flex={1}>
          <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.2 }}>
            {label}
          </Text>
          <Text style={{ ...fonts.semibold, fontSize: 15, color: colors.black, marginTop: 2 }}>{value}</Text>
        </YStack>
      </XStack>
    </Pressable>
  )
}

export function OptionalDateTime({
  date,
  time,
  onDate,
  onTime,
  dateLabel = 'DATE',
  timeLabel = 'HEURE',
  emptyDate = 'Aujourd’hui',
  emptyTime = 'Maintenant',
}: {
  date: Date | null
  time: Date | null
  onDate: (value: Date | null) => void
  onTime: (value: Date | null) => void
  dateLabel?: string
  timeLabel?: string
  emptyDate?: string
  emptyTime?: string
}) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null)

  return (
    <YStack gap={10}>
      <Row
        icon="calendar"
        label={dateLabel}
        value={date ? date.toLocaleDateString('fr-FR') : emptyDate}
        onPress={() => setMode((current) => (current === 'date' ? null : 'date'))}
      />
      <Row
        icon="clock"
        label={timeLabel}
        value={
          time
            ? time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : emptyTime
        }
        onPress={() => setMode((current) => (current === 'time' ? null : 'time'))}
      />
      {mode ? (
        <DateTimePicker
          value={mode === 'date' ? date ?? new Date() : time ?? new Date()}
          mode={mode}
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            if (Platform.OS !== 'ios') setMode(null)
            if (!selected) return
            if (mode === 'date') onDate(selected)
            else onTime(selected)
          }}
        />
      ) : null}
    </YStack>
  )
}

export function resolveStartsAt(date: Date | null, time: Date | null) {
  const next = date ? new Date(date) : new Date()
  if (time) {
    next.setHours(time.getHours(), time.getMinutes(), 0, 0)
  }
  return next
}
