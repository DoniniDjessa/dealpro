import { useEffect, useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import * as Location from 'expo-location'
import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { useAppDialog } from '@/components/AppDialog'
import { ContactTypeahead } from '@/components/ContactTypeahead'
import { QuickContactSave } from '@/components/QuickContactSave'
import { useAuth } from '@/lib/auth'
import { tables } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { createNamedContacts, recomputeMatches, upsertContact } from '@/lib/crm'
import { TextAnalyzer, normalizePhone, phonesMatch, titleFromDescription } from '@/lib/analyze'
import { parseAmount } from '@/lib/format'
import { locationPathHint, locationPathLabels, parseLocationPath } from '@/lib/location-path'
import { reliabilityFor } from '@/lib/match'
import { fetchUserOffersForDuplicate, findOfferDuplicate, isListingLink } from '@/lib/offer-duplicate'
import { useCategoryFilter } from '@/lib/filter'
import { useContacts } from '@/lib/hooks'
import { CATEGORIES, FUEL_OPTIONS, PIPELINE_META, VERIFICATION_META, categoryMeta, normalizeCategory, offerExtras, offerFormSpec } from '@/lib/taxonomy'
import { openMaps } from '@/lib/openLink'
import type { OfferDraft } from '@/lib/share'
import type { Category, DirectoryPerson, Offer, Pipeline, Source, Verification } from '@/lib/types'
import { colors, fonts } from '@/lib/theme'

function splitPhones(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizePhone)
}

export function OpportunityForm({
  item,
  draft,
  onClose,
  onSaved,
}: {
  item: Offer | null
  draft?: OfferDraft | null
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const { show, confirm } = useAppDialog()
  const { items: appContacts, reload: reloadContacts } = useContacts()
  const { category: filterCategory } = useCategoryFilter()
  const [raw, setRaw] = useState(item?.raw_text || item?.description || draft?.raw || '')
  const [link, setLink] = useState(item?.source_url || item?.links?.[0]?.url || draft?.link || '')
  const [title, setTitle] = useState(item?.title || '')
  const [category, setCategory] = useState<Category>(
    normalizeCategory(item?.category || draft?.category || filterCategory || 'immobilier')
  )
  const [price, setPrice] = useState(item?.price ? String(item.price) : '')
  const [location, setLocation] = useState(item?.location || '')
  const [rooms, setRooms] = useState(item?.rooms ? String(item.rooms) : '')
  const [sizeLabel, setSizeLabel] = useState(item?.size_label || '')
  const [visite, setVisite] = useState(item?.visite ? String(item.visite) : '')
  const [phone, setPhone] = useState(item?.phones?.length ? item.phones.join(', ') : item?.phone || '')
  const [important, setImportant] = useState(Boolean(item?.important))
  const [verification, setVerification] = useState<Verification>(item?.verification || 'unverified')
  const [pipeline, setPipeline] = useState<Pipeline>(item?.pipeline || 'captured')
  const [person, setPerson] = useState<DirectoryPerson | null>(null)
  const [phonesTouched, setPhonesTouched] = useState(Boolean(item?.phone || item?.phones?.length))
  const [personTouched, setPersonTouched] = useState(Boolean(item?.contact_id))
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickBusy, setQuickBusy] = useState(false)
  const [map, setMap] = useState({
    lat: item?.map_lat ?? null,
    lng: item?.map_lng ?? null,
    label: item?.map_label || '',
  })
  const extras = offerExtras(item?.extracted)
  const [year, setYear] = useState(extras.year ? String(extras.year) : '')
  const [mileage, setMileage] = useState(extras.mileage ? String(extras.mileage) : '')
  const [fuel, setFuel] = useState(extras.fuel || '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const spec = offerFormSpec(category)
  const locationPath = useMemo(() => parseLocationPath(location), [location])

  const listedPhones = useMemo(() => splitPhones(phone), [phone])
  const unmatchedPhones = useMemo(
    () =>
      listedPhones.filter(
        (numero) =>
          !appContacts.some((contact) =>
            [contact.phone, ...(contact.phones || [])].filter(Boolean).some((known) => phonesMatch(numero, String(known)))
          )
      ),
    [listedPhones, appContacts]
  )

  useEffect(() => {
    if (!item?.contact_id) return
    const linked = appContacts.find((contact) => contact.id === item.contact_id)
    if (!linked) return
    setPerson((current) => {
      if (current && current.id !== linked.id && personTouched) return current
      return { id: linked.id, name: linked.name, phone: linked.phone, fromApp: true }
    })
  }, [appContacts, item?.contact_id, personTouched])

  useEffect(() => {
    if (draft?.raw || draft?.link) return
    const blob = `${raw} ${link}`.trim()
    if (!blob) return
    const timer = setTimeout(() => {
      const analysis = TextAnalyzer.analyzeText(blob, category)
      if (!phonesTouched && analysis.telephones.length) {
        setPhone(analysis.telephones.join(', '))
      }
      if (!item && !price && analysis.prix) setPrice(String(analysis.prix))
      if (!item && spec.rooms && !rooms && analysis.nbPieces) setRooms(String(analysis.nbPieces))
      if (!item && spec.size && !sizeLabel && analysis.sizeLabel) setSizeLabel(analysis.sizeLabel)
      if (!item && !location && analysis.location) setLocation(analysis.location)
      if (!item && spec.visite && !visite && analysis.visite) setVisite(String(analysis.visite))
      if (!item && spec.vehicle) {
        if (!year && analysis.year) setYear(String(analysis.year))
        if (!mileage && analysis.mileage) setMileage(String(analysis.mileage))
        if (!fuel && analysis.fuel) setFuel(analysis.fuel)
      }

      const pool = phonesTouched ? splitPhones(phone) : analysis.telephones
      if (personTouched) return
      const matched = appContacts.find((contact) => {
        const list = [contact.phone, ...(contact.phones || [])].filter(Boolean) as string[]
        return pool.some((numero) => list.some((known) => phonesMatch(numero, known)))
      })
      setPerson(matched ? { id: matched.id, name: matched.name, phone: matched.phone, fromApp: true } : null)
    }, 350)
    return () => clearTimeout(timer)
  }, [raw, link, category, phonesTouched, personTouched, appContacts, phone])

  const applyAnalysis = (force: boolean) => {
    const blob = `${raw} ${link}`.trim()
    if (!blob) return
    const analysis = TextAnalyzer.analyzeText(blob, category)
    if (force || !title.trim()) setTitle(titleFromDescription(raw))
    if (force || !price) {
      if (analysis.prix) setPrice(String(analysis.prix))
    }
    if (spec.rooms && (force || !rooms) && analysis.nbPieces) setRooms(String(analysis.nbPieces))
    if (spec.size && (force || !sizeLabel) && analysis.sizeLabel) setSizeLabel(analysis.sizeLabel)
    if (force || !location) {
      if (analysis.location) setLocation(analysis.location)
    }
    if (spec.visite && (force || !visite) && analysis.visite) setVisite(String(analysis.visite))
    if (spec.vehicle) {
      if ((force || !year) && analysis.year) setYear(String(analysis.year))
      if ((force || !mileage) && analysis.mileage) setMileage(String(analysis.mileage))
      if ((force || !fuel) && analysis.fuel) setFuel(analysis.fuel)
    }
    if (force || !phonesTouched) {
      if (analysis.telephones.length) {
        setPhone(analysis.telephones.join(', '))
        setPhonesTouched(true)
      }
    }
    if (!personTouched) {
      const pool = analysis.telephones.length ? analysis.telephones : listedPhones
      const matched = appContacts.find((contact) => {
        const list = [contact.phone, ...(contact.phones || [])].filter(Boolean) as string[]
        return pool.some((numero) => list.some((known) => phonesMatch(numero, known)))
      })
      setPerson(matched ? { id: matched.id, name: matched.name, phone: matched.phone, fromApp: true } : person)
    }
  }

  const grabGps = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setError('Autorise la localisation pour taguer le bien.')
      return
    }
    const pos = await Location.getCurrentPositionAsync({})
    setMap((current) => ({
      ...current,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      label: current.label || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
    }))
  }

  const applyPerson = (next: DirectoryPerson | null) => {
    setPersonTouched(true)
    setPerson(next ? { ...next, fromApp: Boolean(next.fromApp) } : null)
    if (next?.phone && !phonesTouched) {
      setPhone(next.phone)
      setPhonesTouched(true)
    }
  }

  const saveQuickContacts = async (groups: { name: string; phones: string[] }[]) => {
    if (!user?.id) return
    setQuickBusy(true)
    setError(null)
    try {
      const created = await createNamedContacts(user.id, groups)
      await reloadContacts()
      const first = created[0]
      if (first) {
        setPerson({ id: first.id, name: first.name, phone: first.phone, fromApp: true })
        setPersonTouched(true)
      }
      setQuickOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Contacts non enregistrés')
    } finally {
      setQuickBusy(false)
    }
  }

  const resetCreateForm = () => {
    setRaw('')
    setLink('')
    setTitle('')
    setCategory(normalizeCategory(filterCategory || 'immobilier'))
    setPrice('')
    setLocation('')
    setRooms('')
    setSizeLabel('')
    setVisite('')
    setPhone('')
    setImportant(false)
    setVerification('unverified')
    setPipeline('captured')
    setPerson(null)
    setPhonesTouched(false)
    setPersonTouched(false)
    setMap({ lat: null, lng: null, label: '' })
    setYear('')
    setMileage('')
    setFuel('')
    setQuickOpen(false)
  }

  const save = async () => {
    if (!user?.id) return
    if (!raw.trim()) {
      setError('La description est requise.')
      return
    }
    setError(null)
    const analysis = TextAnalyzer.analyzeText(`${raw} ${link}`.trim(), category)
    const incomingLinks = [link.trim(), ...analysis.liens.map((entry) => entry.url)].filter(isListingLink)
    const existing = await fetchUserOffersForDuplicate(user.id)
    const dup = findOfferDuplicate(existing, {
      description: raw,
      links: incomingLinks,
      excludeId: item?.id,
    })
    if (dup?.kind === 'link') {
      const message = item
        ? `Ce lien est déjà enregistré (« ${dup.offer.title} »). Rien n’a été enregistré.`
        : `Ce lien est déjà enregistré (« ${dup.offer.title} »). Rien n’a été enregistré. Les champs sont vidés pour le prochain bien.`
      show({
        title: 'Lien déjà enregistré',
        message,
        actions: [{ label: 'OK', tone: 'primary' }],
      })
      setError(message)
      if (!item) resetCreateForm()
      return
    }
    if (dup?.kind === 'description') {
      const ok = await confirm({
        title: 'Description déjà enregistrée',
        message: `« ${dup.offer.title} » a la même description. Enregistrer quand même ?`,
        confirmLabel: 'Enregistrer quand même',
      })
      if (!ok) return
    }
    setBusy(true)
    try {
      const amount = parseAmount(price) || analysis.prix || 0
      const phones = listedPhones.length ? listedPhones : analysis.telephones
      const primaryPhone = phones[0] || null

      let contactId: string | null = null
      if (person?.fromApp) contactId = person.id
      else if (person) {
        const contact = await upsertContact(user.id, person)
        contactId = contact.id
      }

      const links = analysis.liens.length
        ? analysis.liens
        : link.trim()
          ? [{ url: link.trim(), type: 'autre' }]
          : item?.links || []
      const loc = location.trim() || analysis.location || null
      const locationPathSaved = parseLocationPath(loc)
      const source: Source = link.trim() ? 'link' : 'paste'
      const payload = {
        user_id: user.id,
        title: title.trim() || titleFromDescription(raw),
        category,
        price: amount,
        currency: 'XOF',
        commission_rate: item?.commission_rate ?? 0.03,
        location: loc,
        location_path: locationPathSaved,
        size_label: spec.size ? sizeLabel.trim() || analysis.sizeLabel || null : sizeLabel.trim() || null,
        size_value: spec.size ? parseAmount(sizeLabel) || null : null,
        rooms: spec.rooms ? (rooms ? Number(rooms) || analysis.nbPieces || null : analysis.nbPieces || null) : null,
        visite: spec.visite ? (visite ? parseAmount(visite) : analysis.visite || null) : null,
        visite_text: spec.visite ? analysis.visiteTexte || null : null,
        phones,
        links,
        tags: analysis.tags.length ? analysis.tags : item?.tags || [],
        is_new: analysis.isNouveaute || item?.is_new || false,
        description: raw.trim(),
        raw_text: raw.trim(),
        source_url: link.trim() || links[0]?.url || null,
        source,
        phone: primaryPhone,
        contact_id: contactId,
        verification,
        pipeline,
        map_lat: map.lat,
        map_lng: map.lng,
        map_label: map.label.trim() || location.trim() || null,
        last_touched_at: new Date().toISOString(),
        important,
        updated_at: new Date().toISOString(),
        extracted: {
          ...analysis,
          location_path: locationPathSaved,
          year: spec.vehicle ? Number(year) || analysis.year || null : null,
          mileage: spec.vehicle ? Number(mileage.replace(/[^\d]/g, '')) || analysis.mileage || null : null,
          fuel: spec.vehicle ? fuel || analysis.fuel || null : null,
        },
      }
      const reliability = reliabilityFor({ ...(item as Offer), ...payload } as Offer)
      const { error: err } = item
        ? await supabase.from(tables.offers).update({ ...payload, reliability }).eq('id', item.id)
        : await supabase.from(tables.offers).insert({ ...payload, reliability })
      if (err) throw new Error(err.message)
      await recomputeMatches(user.id)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!item || !user?.id) return
    await supabase.from(tables.offers).delete().eq('id', item.id)
    await recomputeMatches(user.id)
    onSaved()
  }

  return (
    <FormPanel
      title={item ? 'Modifier l’offre' : 'Capturer une opportunité'}
      onClose={onClose}
      onSave={() => void save()}
      onDelete={item ? () => void remove() : undefined}
      confirmDelete={false}
      busy={busy}
      saveLabel={item ? 'Enregistrer' : 'Analyser et ajouter'}
    >
      {draft?.raw || draft?.link ? (
        <YStack backgroundColor={colors.emeraldSoft} borderRadius={16} padding={14} gap={4}>
          <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.emerald }}>
            Reçu par partage
          </Text>
          <Text style={{ ...fonts.medium, fontSize: 12, color: colors.darkEmerald }}>
            Lien et texte uniquement. L’analyse remplira prix, contacts et le reste à l’enregistrement.
          </Text>
        </YStack>
      ) : null}
      <Field
        label="DESCRIPTION *"
        placeholder="Colle ici l’annonce complète : prix (40 millions, 40 m, 500 milles), contacts…"
        value={raw}
        onChangeText={setRaw}
        multiline
        height={120}
      />
      {item ? (
        <Pressable onPress={() => applyAnalysis(true)}>
          <YStack height={44} borderRadius={14} backgroundColor={colors.emeraldSoft} alignItems="center" justifyContent="center">
            <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.emerald }}>Réanalyser le texte</Text>
          </YStack>
        </Pressable>
      ) : null}
      <Field
        label="LIEN"
        placeholder="https://facebook.com/posts/…  (optionnel)"
        autoCapitalize="none"
        value={link}
        onChangeText={setLink}
      />
      <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>
        Les téléphones remplissent ce champ. Un numéro déjà dans le carnet apparaît dans Contact. Rien n’est créé tout seul.
      </Text>

      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4, marginLeft: 4 }}>
        CATÉGORIE
      </Text>
      {item ? (
        <XStack flexWrap="wrap" gap={8}>
          {CATEGORIES.map((cat) => (
            <Pressable key={cat.id} onPress={() => setCategory(cat.id)}>
              <YStack
                backgroundColor={category === cat.id ? colors.emerald : colors.card}
                borderRadius={14}
                paddingHorizontal={12}
                paddingVertical={8}
              >
                <Text style={{ ...fonts.semibold, fontSize: 12, color: category === cat.id ? colors.white : colors.black }}>
                  {cat.emoji} {cat.label}
                </Text>
              </YStack>
            </Pressable>
          ))}
        </XStack>
      ) : (
        <YStack
          alignSelf="flex-start"
          backgroundColor={colors.emeraldSoft}
          borderRadius={14}
          paddingHorizontal={12}
          paddingVertical={8}
        >
          <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.emerald }}>
            {categoryMeta(category).emoji} {categoryMeta(category).label}
          </Text>
        </YStack>
      )}
      <Field
        label={spec.title}
        placeholder={spec.titlePlaceholder}
        value={title}
        onChangeText={setTitle}
      />
      <Field
        label="PRIX (FCFA)"
        placeholder={spec.pricePlaceholder}
        value={price}
        onChangeText={setPrice}
      />
      {spec.vehicle ? (
        <>
          <XStack gap={8}>
            <YStack flex={1}>
              <Field label="ANNÉE" placeholder="2018" keyboardType="numeric" value={year} onChangeText={setYear} />
            </YStack>
            <YStack flex={1}>
              <Field
                label="KILOMÉTRAGE"
                placeholder="85000"
                keyboardType="numeric"
                value={mileage}
                onChangeText={setMileage}
              />
            </YStack>
          </XStack>
          <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4, marginLeft: 4 }}>
            CARBURANT
          </Text>
          <XStack flexWrap="wrap" gap={8}>
            {FUEL_OPTIONS.map((option) => (
              <Pressable key={option.id} onPress={() => setFuel(fuel === option.id ? '' : option.id)}>
                <YStack
                  backgroundColor={fuel === option.id ? colors.emerald : colors.card}
                  borderRadius={14}
                  paddingHorizontal={12}
                  paddingVertical={8}
                >
                  <Text
                    style={{
                      ...fonts.semibold,
                      fontSize: 12,
                      color: fuel === option.id ? colors.white : colors.black,
                    }}
                  >
                    {option.label}
                  </Text>
                </YStack>
              </Pressable>
            ))}
          </XStack>
        </>
      ) : null}
      {spec.rooms ? (
        <Field
          label={spec.roomsLabel || 'NB PIÈCES'}
          placeholder="3"
          keyboardType="numeric"
          value={rooms}
          onChangeText={setRooms}
        />
      ) : null}
      <Field
        label="LOCALISATION"
        placeholder={spec.locationPlaceholder}
        value={location}
        onChangeText={setLocation}
      />
      <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginLeft: 4 }}>
        Virgule = parent puis quartier. Ex. Cocody, Saint-Jean
      </Text>
      {locationPath.length > 1 ? (
        <YStack gap={6} paddingHorizontal={4}>
          <XStack flexWrap="wrap" gap={6} alignItems="center">
            {locationPathLabels(locationPath).map((label, index) => (
              <XStack key={`${label}-${index}`} alignItems="center" gap={6}>
                {index > 0 ? (
                  <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>→</Text>
                ) : null}
                <YStack backgroundColor={colors.emeraldSoft} borderRadius={10} paddingHorizontal={8} paddingVertical={4}>
                  <Text style={{ ...fonts.semibold, fontSize: 12, color: colors.emerald }}>{label}</Text>
                </YStack>
              </XStack>
            ))}
          </XStack>
          {locationPathHint(locationPath) ? (
            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.emerald }}>{locationPathHint(locationPath)}</Text>
          ) : null}
        </YStack>
      ) : null}
      <Field
        label="MAP / ADRESSE"
        placeholder="Libellé du point GPS"
        value={map.label}
        onChangeText={(value) => setMap((current) => ({ ...current, label: value }))}
      />
      <Pressable onPress={() => void grabGps()}>
        <YStack height={44} borderRadius={14} backgroundColor={colors.emeraldSoft} alignItems="center" justifyContent="center">
          <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.emerald }}>
            {map.lat ? 'Position GPS enregistrée · reprendre' : 'Prendre la position GPS'}
          </Text>
        </YStack>
      </Pressable>
      {map.lat != null && map.lng != null ? (
        <Pressable onPress={() => void openMaps(map.lat as number, map.lng as number, map.label || location)}>
          <YStack height={44} borderRadius={14} backgroundColor={colors.orangeSoft} alignItems="center" justifyContent="center">
            <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.orange }}>Ouvrir Google Maps · y aller</Text>
          </YStack>
        </Pressable>
      ) : null}
      {spec.size ? (
        <Field
          label={spec.sizeLabel || 'SUPERFICIE'}
          placeholder={spec.sizePlaceholder || '1500 m²'}
          value={sizeLabel}
          onChangeText={setSizeLabel}
        />
      ) : null}
      {spec.visite ? (
        <Field label="FRAIS DE VISITE" placeholder="5 milles" value={visite} onChangeText={setVisite} />
      ) : null}
      <Pressable onPress={() => setImportant((value) => !value)}>
        <XStack
          height={48}
          borderRadius={14}
          paddingHorizontal={14}
          alignItems="center"
          justifyContent="space-between"
          backgroundColor={important ? colors.orangeSoft : colors.card}
          borderWidth={1}
          borderColor={important ? colors.orange : colors.border}
        >
          <Text style={{ ...fonts.semibold, fontSize: 14, color: important ? colors.orange : colors.black }}>
            Opportunité importante
          </Text>
          <Text style={{ ...fonts.bold, fontSize: 12, color: important ? colors.orange : colors.muted }}>
            {important ? 'Oui' : 'Non'}
          </Text>
        </XStack>
      </Pressable>
      <Field
        label="TÉLÉPHONES"
        placeholder="extraits de la description"
        value={phone}
        onChangeText={(value) => {
          setPhonesTouched(true)
          setPhone(value)
        }}
      />
      {unmatchedPhones.length ? (
        <Pressable onPress={() => setQuickOpen(true)}>
          <YStack height={44} borderRadius={14} backgroundColor={colors.orangeSoft} alignItems="center" justifyContent="center">
            <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.orange }}>
              Enregistrer {unmatchedPhones.length} numéro{unmatchedPhones.length > 1 ? 's' : ''} dans le carnet
            </Text>
          </YStack>
        </Pressable>
      ) : null}
      <ContactTypeahead contacts={appContacts} person={person} onChange={applyPerson} />
      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4, marginLeft: 4 }}>
        VÉRIFICATION
      </Text>
      <XStack flexWrap="wrap" gap={8}>
        {(Object.keys(VERIFICATION_META) as Verification[]).map((key) => (
          <Pressable key={key} onPress={() => setVerification(key)}>
            <YStack
              backgroundColor={verification === key ? colors.emerald : colors.card}
              borderRadius={14}
              paddingHorizontal={10}
              paddingVertical={8}
            >
              <Text style={{ ...fonts.semibold, fontSize: 12, color: verification === key ? colors.white : colors.black }}>
                {VERIFICATION_META[key].label}
              </Text>
            </YStack>
          </Pressable>
        ))}
      </XStack>
      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.emerald, letterSpacing: 1.4, marginLeft: 4 }}>
        PIPELINE
      </Text>
      <XStack flexWrap="wrap" gap={8}>
        {(Object.keys(PIPELINE_META) as Pipeline[]).map((key) => (
          <Pressable key={key} onPress={() => setPipeline(key)}>
            <YStack
              backgroundColor={pipeline === key ? colors.emerald : colors.card}
              borderRadius={14}
              paddingHorizontal={10}
              paddingVertical={8}
            >
              <Text style={{ ...fonts.semibold, fontSize: 12, color: pipeline === key ? colors.white : colors.black }}>
                {PIPELINE_META[key].label}
              </Text>
            </YStack>
          </Pressable>
        ))}
      </XStack>
      {error ? <Text style={{ ...fonts.medium, color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
      <QuickContactSave
        visible={quickOpen}
        phones={unmatchedPhones}
        busy={quickBusy}
        onClose={() => setQuickOpen(false)}
        onSave={(groups) => void saveQuickContacts(groups)}
      />
    </FormPanel>
  )
}
