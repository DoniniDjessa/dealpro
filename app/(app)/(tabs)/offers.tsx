import { useMemo, useState } from 'react'
import { ScreenShell } from '@/components/ScreenShell'
import { OfferCard } from '@/components/DealCard'
import { SearchBar } from '@/components/SearchBar'
import { useFormDrawer } from '@/components/FormDrawer'
import { useAuth } from '@/lib/auth'
import { deleteOffer } from '@/lib/crm'
import { useOffers } from '@/lib/hooks'
import { useCategoryFilter } from '@/lib/filter'
import { EMPTY_SEARCH, matchOfferSearch, searchIsActive, type SearchQuery } from '@/lib/search'
import { categoryMeta, categoryMatches } from '@/lib/taxonomy'
import { colors, fonts } from '@/lib/theme'
import { Pressable } from 'react-native'
import { Text, YStack } from 'tamagui'

export default function OffersScreen() {
  const { user } = useAuth()
  const { items, loading, error } = useOffers()
  const { openForm, notifyChange } = useFormDrawer()
  const { category, setCategory } = useCategoryFilter()
  const [query, setQuery] = useState<SearchQuery>(EMPTY_SEARCH)
  const meta = category ? categoryMeta(category) : null

  const filtered = useMemo(
    () =>
      items.filter((item) => categoryMatches(item.category, category) && matchOfferSearch(item, query)),
    [items, category, query]
  )

  const remove = async (id: string) => {
    if (!user?.id) return
    await deleteOffer(user.id, id)
    notifyChange()
  }

  return (
    <ScreenShell title={meta ? meta.label : 'Offres'} loading={loading} error={error}>
      <SearchBar value={query} onChange={setQuery} features={['price', 'rooms', 'tags']} />
      {category ? (
        <Pressable onPress={() => setCategory(null)}>
          <Text style={{ ...fonts.medium, fontSize: 12, color: colors.emerald, marginBottom: 12 }}>
            Voir toutes les offres
          </Text>
        </Pressable>
      ) : null}
      {filtered.length === 0 ? (
        <YStack alignItems="center" paddingVertical={48} gap={12}>
          <Text style={{ ...fonts.semibold, color: colors.muted, textAlign: 'center' }}>
            {searchIsActive(query)
              ? 'Aucune offre pour cette recherche.'
              : category
                ? `Aucune offre ${meta?.label?.toLowerCase() ?? ''} pour l’instant.`
                : 'Aucune opportunité encore. Colle une annonce.'}
          </Text>
          {!searchIsActive(query) ? (
            <Pressable onPress={() => openForm('offer')}>
              <Text style={{ ...fonts.bold, color: colors.emerald }}>Capturer une opportunité</Text>
            </Pressable>
          ) : null}
        </YStack>
      ) : (
        filtered.map((item) => (
          <OfferCard
            key={item.id}
            item={item}
            onPress={() => openForm('offer', item)}
            onEdit={() => openForm('offer-edit', item)}
            onDelete={() => void remove(item.id)}
          />
        ))
      )}
    </ScreenShell>
  )
}
