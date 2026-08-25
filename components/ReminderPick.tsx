import { OptionalDateTime, resolveOptionalAt } from '@/components/OptionalDateTime'
import { dateAndTimeFromIso } from '@/lib/format'
import {
  REMINDER_COUNTS,
  REMINDER_INTERVALS,
  REMINDER_MODES,
  REMINDER_SOUNDS,
  type ReminderConfig,
} from '@/lib/reminder'
import { colors, fonts } from '@/lib/theme'
import type { ReactNode } from 'react'
import { Pressable, Switch } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function ReminderPick({
  value,
  onChange,
  variant = 'full',
  emptyStart = 'À la date de l’élément',
}: {
  value: ReminderConfig
  onChange: (value: ReminderConfig) => void
  variant?: 'full' | 'push'
  emptyStart?: string
}) {
  const start = dateAndTimeFromIso(value.start_at)
  const pushOnly = variant === 'push'
  const showSound = !pushOnly && value.mode !== 'push'

  return (
    <YStack gap={10}>
      <XStack
        backgroundColor={colors.card}
        borderRadius={16}
        paddingHorizontal={16}
        paddingVertical={12}
        alignItems="center"
        justifyContent="space-between"
      >
        <YStack flex={1} paddingRight={12}>
          <Text style={{ ...fonts.semibold, color: colors.black }}>Rappel</Text>
          <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>
            {pushOnly
              ? 'Notification push, une ou plusieurs fois.'
              : 'Alerte réveil, notification, ou les deux.'}
          </Text>
        </YStack>
        <Switch
          value={value.enabled}
          onValueChange={(enabled) => onChange({ ...value, enabled })}
          trackColor={{ true: colors.emerald }}
        />
      </XStack>

      {value.enabled ? (
        <>
          {pushOnly ? null : (
            <ChipGroup label="TYPE">
              {REMINDER_MODES.map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  hint={item.hint}
                  active={value.mode === item.value}
                  onPress={() => onChange({ ...value, mode: item.value })}
                />
              ))}
            </ChipGroup>
          )}
          {showSound ? (
            <ChipGroup label="SONNERIE">
              {REMINDER_SOUNDS.map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  active={value.sound === item.value}
                  onPress={() => onChange({ ...value, sound: item.value })}
                />
              ))}
            </ChipGroup>
          ) : null}
          <OptionalDateTime
            date={start.date}
            time={start.time}
            onDate={(date) =>
              onChange({ ...value, start_at: resolveOptionalAt(date, start.time)?.toISOString() ?? null })
            }
            onTime={(time) =>
              onChange({ ...value, start_at: resolveOptionalAt(start.date, time)?.toISOString() ?? null })
            }
            dateLabel="PREMIER RAPPEL"
            timeLabel="HEURE DU RAPPEL"
            emptyDate={emptyStart}
            emptyTime="Heure de l’élément"
          />
          <ChipGroup label="INTERVALLE">
            {REMINDER_INTERVALS.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                active={value.interval_minutes === item.value}
                onPress={() =>
                  onChange({
                    ...value,
                    interval_minutes: item.value,
                    count: item.value === 0 ? 1 : value.count,
                  })
                }
              />
            ))}
          </ChipGroup>
          {value.interval_minutes > 0 ? (
            <ChipGroup label="NOMBRE DE FOIS">
              {REMINDER_COUNTS.map((count) => (
                <Chip
                  key={count}
                  label={String(count)}
                  active={value.count === count}
                  onPress={() => onChange({ ...value, count })}
                />
              ))}
            </ChipGroup>
          ) : null}
        </>
      ) : null}
    </YStack>
  )
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <YStack gap={8}>
      <Text
        style={{
          ...fonts.bold,
          fontSize: 10,
          color: colors.emerald,
          letterSpacing: 1.4,
          marginLeft: 4,
        }}
      >
        {label}
      </Text>
      <XStack flexWrap="wrap" gap={8}>
        {children}
      </XStack>
    </YStack>
  )
}

function Chip({
  label,
  hint,
  active,
  onPress,
}: {
  label: string
  hint?: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress}>
      <YStack
        backgroundColor={active ? colors.emerald : colors.card}
        borderRadius={16}
        paddingHorizontal={12}
        paddingVertical={8}
      >
        <Text style={{ ...fonts.semibold, fontSize: 12, color: active ? colors.white : colors.black }}>
          {label}
        </Text>
        {hint ? (
          <Text
            style={{
              ...fonts.medium,
              fontSize: 10,
              color: active ? 'rgba(255,255,255,0.8)' : colors.muted,
              marginTop: 2,
            }}
          >
            {hint}
          </Text>
        ) : null}
      </YStack>
    </Pressable>
  )
}
