import { ScreenShell } from '@/components/ScreenShell'
import { SummaryBalloon } from '@/components/SummaryBalloon'
import { OfferCard } from '@/components/DealCard'
import { FlatIcon, type FlatIconName } from '@/components/FlatIcon'
import { CashEntryModal } from '@/components/CashEntryModal'
import { useFormDrawer } from '@/components/FormDrawer'
import {
  formatFcfa,
  inPeriod,
  periodLabel,
  shiftPeriodAnchor,
  type CashPeriod,
} from '@/lib/format'
import { deleteCashEntry, deleteOffer } from '@/lib/crm'
import { useAuth } from '@/lib/auth'
import { useAppointments, useCashEntries, useContacts, useDemands, useOffers } from '@/lib/hooks'
import { colors, fonts } from '@/lib/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react-native'
import { useMemo, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

const PERIODS: { id: CashPeriod; label: string }[] = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
]

export default function HomeScreen() {
  const { openForm, notifyChange } = useFormDrawer()
  const { user } = useAuth()
  const router = useRouter()
  const offers = useOffers()
  const cash = useCashEntries()
  const demands = useDemands()
  const contacts = useContacts()
  const appointments = useAppointments()
  const [period, setPeriod] = useState<CashPeriod>('month')
  const [anchor, setAnchor] = useState(() => new Date())
  const [entryOpen, setEntryOpen] = useState(false)

  const error = offers.error || cash.error || demands.error || contacts.error || appointments.error
  const loading =
    (offers.loading && offers.items.length === 0) || (cash.loading && cash.items.length === 0)

  const important = offers.items.filter((item) => item.important)
  const clientCount = useMemo(() => {
    const ids = new Set([
      ...contacts.items.filter((item) => item.kind === 'client').map((item) => item.id),
      ...demands.items.map((item) => item.contact_id).filter(Boolean) as string[],
    ])
    return ids.size
  }, [contacts.items, demands.items])
  const upcomingRdv = useMemo(
    () => appointments.items.filter((item) => new Date(item.starts_at).getTime() > Date.now()).length,
    [appointments.items]
  )
  const entries = useMemo(
    () => cash.items.filter((item) => inPeriod(item.occurred_at, period, anchor)),
    [cash.items, period, anchor]
  )
  const totals = useMemo(
    () =>
      entries.reduce(
        (acc, item) => ({
          sale: acc.sale + Number(item.sale_amount || 0),
          received: acc.received + Number(item.received_amount || 0),
          commission: acc.commission + Number(item.commission || 0),
        }),
        { sale: 0, received: 0, commission: 0 }
      ),
    [entries]
  )

  const onPeriod = (next: CashPeriod) => {
    setPeriod(next)
    setAnchor(new Date())
  }

  const removeEntry = async (id: string) => {
    await deleteCashEntry(id)
    notifyChange()
  }

  return (
    <ScreenShell loading={loading} error={error}>
      <View style={{ borderRadius: 28, overflow: 'hidden', marginBottom: 16 }}>
        <LinearGradient colors={[colors.dark, colors.darkSoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18, overflow: 'hidden' }}>
          <SummaryBalloon id="home-balloon-a" size={260} color={colors.emerald} opacity={0.35} style={{ right: -80, top: -90 }} />
          <SummaryBalloon id="home-balloon-b" size={180} color={colors.orange} opacity={0.28} style={{ left: -56, bottom: -70 }} />
          <XStack alignItems="center" justifyContent="space-between">
            <Text style={{ ...fonts.medium, fontSize: 11, color: colors.tabActive, letterSpacing: 1.4, textTransform: 'uppercase' }}>
              DealPro · Chasse
            </Text>
            <Pressable onPress={() => setEntryOpen(true)} hitSlop={8}>
              <XStack
                width={36}
                height={36}
                borderRadius={12}
                backgroundColor={colors.emerald}
                alignItems="center"
                justifyContent="center"
              >
                <Plus size={18} color={colors.white} />
              </XStack>
            </Pressable>
          </XStack>

          <XStack gap={8} marginTop={14}>
            {PERIODS.map((item) => {
              const active = period === item.id
              return (
                <Pressable key={item.id} onPress={() => onPeriod(item.id)}>
                  <YStack
                    height={30}
                    paddingHorizontal={12}
                    borderRadius={10}
                    backgroundColor={active ? colors.emerald : 'rgba(255,255,255,0.08)'}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text style={{ ...fonts.semibold, fontSize: 12, color: active ? colors.white : 'rgba(255,255,255,0.7)' }}>
                      {item.label}
                    </Text>
                  </YStack>
                </Pressable>
              )
            })}
          </XStack>

          <XStack alignItems="center" justifyContent="space-between" marginTop={12}>
            <Pressable onPress={() => setAnchor((current) => shiftPeriodAnchor(current, period, -1))} hitSlop={8}>
              <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
            <Text style={{ ...fonts.semibold, fontSize: 13, color: 'rgba(255,255,255,0.75)', textTransform: 'capitalize' }}>
              {periodLabel(period, anchor)}
            </Text>
            <Pressable onPress={() => setAnchor((current) => shiftPeriodAnchor(current, period, 1))} hitSlop={8}>
              <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </XStack>

          <XStack gap={8} marginTop={16}>
            <StatBox label="Vente" value={formatFcfa(totals.sale)} />
            <StatBox label="Reçu" value={formatFcfa(totals.received)} />
            <StatBox label="Commission" value={formatFcfa(totals.commission)} accent />
          </XStack>

          {entries.length ? (
            <YStack marginTop={14} gap={6}>
              {entries.slice(0, 4).map((item) => (
                <XStack key={item.id} alignItems="center" justifyContent="space-between" gap={8}>
                  <YStack flex={1}>
                    <Text style={{ ...fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                      {formatFcfa(item.sale_amount)} · reçu {formatFcfa(item.received_amount)}
                    </Text>
                    <Text style={{ ...fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                      Comm. {formatFcfa(item.commission)}
                      {item.note ? ` · ${item.note}` : ''}
                    </Text>
                  </YStack>
                  <Pressable onPress={() => void removeEntry(item.id)} hitSlop={8}>
                    <Trash2 size={14} color="rgba(255,255,255,0.45)" />
                  </Pressable>
                </XStack>
              ))}
            </YStack>
          ) : (
            <Text style={{ ...fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 14 }}>
              Ajoute une entrée pour suivre tes encaissements.
            </Text>
          )}
        </LinearGradient>
      </View>

      <YStack marginBottom={16}>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={118}
          contentContainerStyle={{ gap: 10, paddingRight: 8 }}
        >
          <SummaryCard
            icon="todo"
            label="Demandes"
            count={demands.items.length}
            onPress={() => router.push('/(app)/(tabs)/demands')}
          />
          <SummaryCard
            icon="tag"
            label="Biens"
            count={offers.items.length}
            onPress={() => router.push('/(app)/(tabs)/offers')}
          />
          <SummaryCard
            icon="flag"
            label="Clients"
            count={clientCount}
            onPress={() => router.push('/(app)/(tabs)/clients')}
          />
          <SummaryCard
            icon="users"
            label="Contacts"
            count={contacts.items.length}
            onPress={() => router.push('/(app)/(tabs)/contacts')}
          />
          <SummaryCard
            icon="calendar"
            label="Rendez-vous"
            count={upcomingRdv}
            onPress={() => router.push('/(app)/(tabs)/rendez-vous')}
          />
        </ScrollView>
      </YStack>

      <HomeCard
        title="Importantes"
        subtitle={important.length ? `${important.length} opportunité(s)` : 'Rien de marqué pour l’instant'}
      >
        {important.length === 0 ? (
          <Text style={{ ...fonts.regular, color: colors.muted }}>
            Marque une opportunité comme importante pour la retrouver ici.
          </Text>
        ) : (
          important.map((item) => (
            <OfferCard
              key={item.id}
              item={item}
              onPress={() => openForm('offer', item)}
              onEdit={() => openForm('offer-edit', item)}
              onDelete={() => {
                if (!user?.id) return
                void deleteOffer(user.id, item.id).then(() => notifyChange())
              }}
            />
          ))
        )}
      </HomeCard>

      <CashEntryModal
        visible={entryOpen}
        userId={user?.id}
        onClose={() => setEntryOpen(false)}
        onSaved={() => {
          setEntryOpen(false)
          notifyChange()
        }}
      />
    </ScreenShell>
  )
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <YStack
      flex={1}
      backgroundColor="rgba(255,255,255,0.06)"
      borderRadius={16}
      padding={10}
      borderWidth={1}
      borderColor="rgba(255,255,255,0.08)"
    >
      <Text style={{ ...fonts.medium, fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
        {label}
      </Text>
      <Text style={{ ...fonts.bold, fontSize: 13, color: accent ? colors.tabActive : colors.white, marginTop: 4 }}>
        {value}
      </Text>
    </YStack>
  )
}

function SummaryCard({
  icon,
  label,
  count,
  onPress,
}: {
  icon: FlatIconName
  label: string
  count: number
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress}>
      <YStack
        width={108}
        backgroundColor={colors.card}
        borderRadius={20}
        padding={14}
        paddingTop={18}
        borderWidth={1}
        borderColor={colors.border}
        alignItems="center"
        gap={10}
        position="relative"
      >
        <YStack
          position="absolute"
          top={8}
          right={8}
          minWidth={22}
          height={22}
          paddingHorizontal={6}
          borderRadius={11}
          backgroundColor={colors.orange}
          alignItems="center"
          justifyContent="center"
        >
          <Text style={{ ...fonts.bold, fontSize: 11, color: colors.white }}>{count > 99 ? '99+' : count}</Text>
        </YStack>
        <XStack
          width={36}
          height={36}
          borderRadius={12}
          backgroundColor={colors.emeraldSoft}
          alignItems="center"
          justifyContent="center"
        >
          <FlatIcon name={icon} size={18} />
        </XStack>
        <Text style={{ ...fonts.semibold, fontSize: 12, color: colors.black }}>{label}</Text>
      </YStack>
    </Pressable>
  )
}

function HomeCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <YStack backgroundColor={colors.card} borderRadius={24} padding={16} marginBottom={14} overflow="hidden" borderWidth={1} borderColor={colors.border}>
      <Text style={{ ...fonts.extra, fontSize: 18, color: colors.black }}>{title}</Text>
      <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginBottom: 12 }}>{subtitle}</Text>
      {children}
    </YStack>
  )
}
