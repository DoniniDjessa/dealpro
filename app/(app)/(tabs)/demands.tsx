import { useMemo, useState } from 'react'
import { ScreenShell } from '@/components/ScreenShell'
import { DemandCard } from '@/components/DealCard'
import { SearchBar } from '@/components/SearchBar'
import { useFormDrawer } from '@/components/FormDrawer'
import { useAuth } from '@/lib/auth'
import { deleteDemand } from '@/lib/crm'
import { useDemands } from '@/lib/hooks'
import { EMPTY_SEARCH, matchDemandSearch, searchIsActive, type SearchQuery } from '@/lib/search'
import { colors, fonts } from '@/lib/theme'
import { Pressable } from 'react-native'
import { Text, YStack } from 'tamagui'

export default function DemandsScreen() {
  const { user } = useAuth()
  const { items, loading, error } = useDemands()
  const { openForm, notifyChange } = useFormDrawer()
  const [query, setQuery] = useState<SearchQuery>(EMPTY_SEARCH)

  const filtered = useMemo(() => items.filter((item) => matchDemandSearch(item, query)), [items, query])

  const remove = async (id: string) => {
    if (!user?.id) return
    await deleteDemand(user.id, id)
    notifyChange()
  }

  return (
    <ScreenShell title="Demandes" loading={loading} error={error}>
      <SearchBar value={query} onChange={setQuery} features={['budget', 'rooms']} />
      {filtered.length === 0 ? (
        <YStack alignItems="center" paddingVertical={48} gap={12}>
          <Text style={{ ...fonts.semibold, color: colors.muted, textAlign: 'center' }}>
            {searchIsActive(query)
              ? 'Aucune demande pour cette recherche.'
              : 'Enregistre un acheteur pour activer le matching.'}
          </Text>
          {!searchIsActive(query) ? (
            <Pressable onPress={() => openForm('demand')}>
              <Text style={{ ...fonts.bold, color: colors.indigo }}>Nouvelle demande</Text>
            </Pressable>
          ) : null}
        </YStack>
      ) : (
        filtered.map((item) => (
          <DemandCard
            key={item.id}
            item={item}
            onPress={() => openForm('demand', item)}
            onEdit={() => openForm('demand', item)}
            onDelete={() => void remove(item.id)}
          />
        ))
      )}
    </ScreenShell>
  )
}
