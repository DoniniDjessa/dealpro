import { colors, fonts } from '@/lib/theme'
import { dateKey, formatMonthTitle, startOfMonth } from '@/lib/format'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

export type CalendarMark = {
  date: string
  kind?: 'affaire' | 'visite'
}

function monthCells(month: Date) {
  const start = startOfMonth(month)
  const pad = (start.getDay() + 6) % 7
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: pad }, () => null)
  for (let day = 1; day <= last; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function MonthCalendar({
  month,
  selected,
  marked,
  onMonthChange,
  onSelect,
}: {
  month: Date
  selected?: Date | null
  marked: CalendarMark[]
  onMonthChange: (next: Date) => void
  onSelect: (day: Date) => void
}) {
  const markedMap = new Map(marked.map((item) => [item.date, item.kind || 'affaire']))
  const cells = monthCells(month)
  const selectedKey = selected ? dateKey(selected) : null

  return (
    <YStack backgroundColor={colors.card} borderRadius={20} padding={16} marginBottom={14}>
      <XStack alignItems="center" justifyContent="space-between" marginBottom={14}>
        <Pressable
          onPress={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          hitSlop={10}
        >
          <ChevronLeft size={20} color={colors.black} />
        </Pressable>
        <Text style={{ ...fonts.bold, fontSize: 16, color: colors.black, textTransform: 'capitalize' }}>
          {formatMonthTitle(month)}
        </Text>
        <Pressable
          onPress={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          hitSlop={10}
        >
          <ChevronRight size={20} color={colors.black} />
        </Pressable>
      </XStack>
      <XStack marginBottom={8}>
        {WEEKDAYS.map((label, index) => (
          <YStack key={`${label}-${index}`} flex={1} alignItems="center">
            <Text style={{ ...fonts.semibold, fontSize: 11, color: colors.muted }}>{label}</Text>
          </YStack>
        ))}
      </XStack>
      {Array.from({ length: cells.length / 7 }, (_, week) => (
        <XStack key={week} marginBottom={2}>
          {cells.slice(week * 7, week * 7 + 7).map((day, index) => {
            if (!day) {
              return <YStack key={`empty-${week}-${index}`} flex={1} height={44} />
            }
            const key = dateKey(day)
            const selectedDay = Boolean(selectedKey && key === selectedKey)
            const today = key === dateKey(new Date())
            const mark = markedMap.get(key)
            const ring = mark === 'visite' ? colors.orange : mark ? colors.emerald : undefined
            return (
              <Pressable key={key} onPress={() => onSelect(day)} style={{ flex: 1 }}>
                <YStack height={44} alignItems="center" justifyContent="center">
                  <YStack
                    width={34}
                    height={34}
                    borderRadius={17}
                    alignItems="center"
                    justifyContent="center"
                    backgroundColor={selectedDay ? colors.emerald : 'transparent'}
                    borderWidth={ring && !selectedDay ? 2.5 : 0}
                    borderColor={ring ?? 'transparent'}
                  >
                    <Text
                      style={{
                        ...fonts.semibold,
                        fontSize: 13,
                        color: selectedDay ? colors.white : today ? colors.emerald : colors.black,
                      }}
                    >
                      {day.getDate()}
                    </Text>
                  </YStack>
                </YStack>
              </Pressable>
            )
          })}
        </XStack>
      ))}
    </YStack>
  )
}
