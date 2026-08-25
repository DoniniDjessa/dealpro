import { ScreenShell } from '@/components/ScreenShell'
import { MonthCalendar } from '@/components/MonthCalendar'
import { CardActions } from '@/components/CardActions'
import { SearchBar } from '@/components/SearchBar'
import { FlatIcon } from '@/components/FlatIcon'
import { useFormDrawer } from '@/components/FormDrawer'
import { colors, fonts } from '@/lib/theme'
import { dateKey, formatDay, formatTime } from '@/lib/format'
import { deleteAppointment } from '@/lib/crm'
import { useAppointments } from '@/lib/hooks'
import { EMPTY_SEARCH, matchAppointmentSearch, type SearchQuery } from '@/lib/search'
import type { Appointment, AppointmentKind } from '@/lib/types'
import { X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

type AgendaTab = 'upcoming' | 'history'
type KindFilter = 'all' | AppointmentKind

const KIND_LABEL: Record<AppointmentKind, string> = {
  affaire: 'Affaires',
  visite: 'Visites',
}

export default function AppointmentsScreen() {
  const { items, loading, error } = useAppointments()
  const { notifyChange } = useFormDrawer()
  const [month, setMonth] = useState(() => new Date())
  const [dayFilter, setDayFilter] = useState<Date | null>(null)
  const [tab, setTab] = useState<AgendaTab>('upcoming')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [query, setQuery] = useState<SearchQuery>(EMPTY_SEARCH)

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (kindFilter === 'all' || item.kind === kindFilter) && matchAppointmentSearch(item, query)
      ),
    [items, kindFilter, query]
  )

  const marked = useMemo(() => {
    const map = new Map<string, AppointmentKind>()
    for (const item of filtered) {
      const key = dateKey(item.starts_at)
      if (!map.has(key) || item.kind === 'visite') map.set(key, item.kind)
    }
    return [...map.entries()].map(([date, kind]) => ({ date, kind }))
  }, [filtered])

  const now = Date.now()

  const list = useMemo(() => {
    if (dayFilter) {
      const key = dateKey(dayFilter)
      return filtered
        .filter((item) => dateKey(item.starts_at) === key)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    }
    if (tab === 'history') {
      return filtered
        .filter((item) => new Date(item.starts_at).getTime() < now)
        .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
    }
    return filtered
      .filter((item) => new Date(item.starts_at).getTime() >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [dayFilter, filtered, now, tab])

  const onSelectDay = (day: Date) => {
    if (dayFilter && dateKey(day) === dateKey(dayFilter)) {
      setDayFilter(null)
      return
    }
    setDayFilter(day)
    if (day.getMonth() !== month.getMonth() || day.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(day.getFullYear(), day.getMonth(), 1))
    }
  }

  return (
    <ScreenShell title="Rendez-vous" loading={loading} error={error}>
      <SearchBar value={query} onChange={setQuery} placeholder="Rechercher un rendez-vous…" />
      <MonthCalendar
        month={month}
        selected={dayFilter}
        marked={marked}
        onMonthChange={setMonth}
        onSelect={onSelectDay}
      />

      <XStack gap={8} marginBottom={14}>
        {(['all', 'affaire', 'visite'] as KindFilter[]).map((key) => {
          const active = kindFilter === key
          const label = key === 'all' ? 'Tous' : KIND_LABEL[key]
          return (
            <Pressable key={key} onPress={() => setKindFilter(key)}>
              <YStack
                height={34}
                paddingHorizontal={14}
                borderRadius={12}
                backgroundColor={active ? colors.emerald : colors.card}
                alignItems="center"
                justifyContent="center"
                borderWidth={1}
                borderColor={active ? colors.emerald : colors.border}
              >
                <Text style={{ ...fonts.semibold, fontSize: 12, color: active ? colors.white : colors.black }}>
                  {label}
                </Text>
              </YStack>
            </Pressable>
          )
        })}
      </XStack>

      {dayFilter ? (
        <XStack
          backgroundColor={colors.card}
          borderRadius={16}
          paddingHorizontal={16}
          paddingVertical={12}
          marginBottom={14}
          alignItems="center"
          justifyContent="space-between"
          gap={12}
        >
          <YStack flex={1}>
            <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.1 }}>
              JOUR SÉLECTIONNÉ
            </Text>
            <Text style={{ ...fonts.semibold, color: colors.black, marginTop: 2, textTransform: 'capitalize' }}>
              {dayFilter.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </YStack>
          <Pressable onPress={() => setDayFilter(null)} hitSlop={8}>
            <XStack
              height={36}
              paddingHorizontal={12}
              borderRadius={12}
              backgroundColor={colors.emeraldSoft}
              alignItems="center"
              gap={6}
            >
              <Text style={{ ...fonts.semibold, fontSize: 12, color: colors.emerald }}>Tout voir</Text>
              <X size={14} color={colors.emerald} />
            </XStack>
          </Pressable>
        </XStack>
      ) : (
        <XStack backgroundColor={colors.card} borderRadius={16} padding={4} marginBottom={14}>
          <TabButton label="À venir" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
          <TabButton label="Historique" active={tab === 'history'} onPress={() => setTab('history')} />
        </XStack>
      )}

      {list.length === 0 ? (
        <Text style={{ ...fonts.regular, color: colors.muted }}>
          {query.text.trim()
            ? 'Aucun rendez-vous pour cette recherche.'
            : dayFilter
              ? 'Aucun rendez-vous ce jour-là.'
              : tab === 'upcoming'
                ? 'Aucun rendez-vous à venir.'
                : 'Aucun rendez-vous passé.'}
        </Text>
      ) : (
        list.map((item) => (
          <AppointmentRow
            key={item.id}
            item={item}
            onDelete={() => {
              void deleteAppointment(item.id).then(() => notifyChange())
            }}
          />
        ))
      )}
    </ScreenShell>
  )
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <YStack
        height={36}
        borderRadius={12}
        alignItems="center"
        justifyContent="center"
        backgroundColor={active ? colors.emerald : 'transparent'}
      >
        <Text style={{ ...fonts.semibold, fontSize: 13, color: active ? colors.white : colors.muted }}>
          {label}
        </Text>
      </YStack>
    </Pressable>
  )
}

function AppointmentRow({ item, onDelete }: { item: Appointment; onDelete: () => void }) {
  const { openForm } = useFormDrawer()
  const visite = item.kind === 'visite'
  return (
    <Pressable onPress={() => openForm('appointment', item)}>
      <XStack backgroundColor={colors.card} borderRadius={16} padding={16} marginBottom={10} gap={12}>
        <YStack width={4} borderRadius={4} backgroundColor={visite ? colors.orange : colors.emerald} />
        <YStack flex={1} gap={4}>
          <XStack justifyContent="space-between" alignItems="flex-start" gap={8}>
            <YStack flex={1}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text style={{ ...fonts.extra, color: colors.black, flex: 1, paddingRight: 8 }}>{item.title}</Text>
                <Text style={{ ...fonts.bold, color: colors.emerald }}>{formatTime(item.starts_at)}</Text>
              </XStack>
              <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 12 }}>
                {visite ? 'Visite' : 'Affaires'} · {formatDay(item.starts_at)}
              </Text>
            </YStack>
            <CardActions onEdit={() => openForm('appointment', item)} onDelete={onDelete} />
          </XStack>
          {item.place ? (
            <XStack alignItems="center" gap={6} marginTop={4}>
              <FlatIcon name="pin" size={14} />
              <Text style={{ ...fonts.regular, color: colors.muted }}>{item.place}</Text>
            </XStack>
          ) : null}
          {item.contact?.name ? (
            <XStack alignItems="center" gap={6}>
              <FlatIcon name="users" size={14} />
              <Text style={{ ...fonts.regular, color: colors.muted }}>{item.contact.name}</Text>
            </XStack>
          ) : null}
        </YStack>
      </XStack>
    </Pressable>
  )
}
